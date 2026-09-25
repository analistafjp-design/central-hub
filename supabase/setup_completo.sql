-- ============================================================
-- Central Hub | Setup completo (migrações 0001 a 0005)
-- Cole este arquivo inteiro no SQL Editor do Supabase Studio
-- e clique em "Run" uma única vez.
-- (Não inclui a 0006, que é apenas o seed opcional de exemplo.)
-- ============================================================

-- ============================================================
-- Central Hub | Migration 0001
-- Perfis de usuário (profiles) vinculados ao auth.users
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  perfil text not null default 'operador' check (perfil in ('administrador', 'operador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfis de usuário do Central Hub (administrador ou operador).';

-- ------------------------------------------------------------
-- Trigger genérica de updated_at
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- Cria automaticamente um profile quando um novo usuário
-- se cadastra via Supabase Auth.
-- O primeiro usuário criado no sistema vira "administrador";
-- os demais entram como "operador" por padrão (ajustável depois
-- por um administrador).
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_profiles integer;
  perfil_inicial text;
begin
  select count(*) into total_profiles from public.profiles;

  if total_profiles = 0 then
    perfil_inicial := 'administrador';
  else
    perfil_inicial := coalesce(new.raw_user_meta_data ->> 'perfil', 'operador');
    if perfil_inicial not in ('administrador', 'operador') then
      perfil_inicial := 'operador';
    end if;
  end if;

  insert into public.profiles (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    perfil_inicial
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Função auxiliar (security definer) para ler o perfil do
-- usuário autenticado sem cair em recursão de RLS.
-- ------------------------------------------------------------
create or replace function public.get_my_perfil()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select perfil from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select perfil from public.profiles where id = auth.uid()) = 'administrador', false);
$$;
-- ============================================================
-- Central Hub | Migration 0002
-- Tabelas principais: servidores, clientes
-- ============================================================

-- pg_trgm precisa estar habilitada ANTES de qualquer índice que use o
-- operator class gin_trgm_ops (usado abaixo para busca textual rápida).
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- Tabela: servidores
-- Cada servidor representa um painel/plataforma de streaming
-- gerenciado (WPLAY, UNITV, TVS, P2BRAZ ou outro), com sua
-- própria carteira de clientes, créditos e receita.
-- ------------------------------------------------------------
create table if not exists public.servidores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plataforma text not null default 'Outro'
    check (plataforma in ('WPLAY', 'UNITV', 'TVS', 'P2BRAZ', 'Outro')),
  ativo boolean not null default true,
  observacoes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.servidores is 'Servidores/plataformas geridos pelo Central Hub, cada um com dashboard, clientes e créditos próprios.';

create unique index if not exists servidores_nome_key on public.servidores (nome);
create index if not exists servidores_plataforma_idx on public.servidores (plataforma);
create index if not exists servidores_ativo_idx on public.servidores (ativo);

drop trigger if exists set_updated_at on public.servidores;
create trigger set_updated_at
  before update on public.servidores
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- Tabela: clientes
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text,
  senha text,
  telefone text,
  plano text,
  valor_mensal numeric(10, 2) not null default 0,
  servidor_id uuid not null references public.servidores (id) on delete restrict,
  observacoes text,
  data_cadastro date not null default current_date,
  data_expiracao date not null,
  status text not null default 'Ativo' check (status in ('Ativo', 'Vencido', 'Cancelado')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clientes is 'Clientes cadastrados manualmente ou importados, vinculados a um servidor.';
comment on column public.clientes.senha is 'Senha de acesso do cliente no painel do servidor (texto simples, como informado pelo operador). Considere criptografar em produção se sensível.';

create index if not exists clientes_nome_idx on public.clientes using gin (nome gin_trgm_ops);
create index if not exists clientes_telefone_idx on public.clientes (telefone);
create index if not exists clientes_servidor_idx on public.clientes (servidor_id);
create index if not exists clientes_status_idx on public.clientes (status);
create index if not exists clientes_expiracao_idx on public.clientes (data_expiracao);

drop trigger if exists set_updated_at on public.clientes;
create trigger set_updated_at
  before update on public.clientes
  for each row execute function public.handle_updated_at();
-- ============================================================
-- Central Hub | Migration 0003
-- Tabelas de apoio: creditos, pagamentos, alertas
--
-- Estas tabelas sustentam os módulos de Controle de Créditos,
-- Gestão Financeira e Alertas Inteligentes descritos no escopo
-- do produto. O schema já sai pronto; as telas desses módulos
-- entram em etapas futuras do roadmap.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: creditos
-- Livro-razão de créditos por servidor: cada linha é uma compra
-- (entrada) ou um uso (saída, normalmente ao ativar/renovar um
-- cliente). O saldo disponível é a soma das compras menos a
-- soma dos usos (ver vw_servidores_resumo na migration 0005).
-- ------------------------------------------------------------
create table if not exists public.creditos (
  id uuid primary key default gen_random_uuid(),
  servidor_id uuid not null references public.servidores (id) on delete cascade,
  tipo text not null check (tipo in ('Compra', 'Uso')),
  quantidade integer not null check (quantidade > 0),
  valor numeric(10, 2),
  cliente_id uuid references public.clientes (id) on delete set null,
  data date not null default current_date,
  observacoes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.creditos is 'Movimentações de créditos por servidor (compras e usos).';

create index if not exists creditos_servidor_idx on public.creditos (servidor_id);
create index if not exists creditos_tipo_idx on public.creditos (tipo);
create index if not exists creditos_data_idx on public.creditos (data);

-- ------------------------------------------------------------
-- Tabela: pagamentos
-- Histórico de recebimentos/renovações, usado para os
-- indicadores de receita (mensal, anual, por servidor, por
-- cliente, ticket médio, projeções).
-- ------------------------------------------------------------
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  servidor_id uuid not null references public.servidores (id) on delete cascade,
  valor numeric(10, 2) not null,
  meses integer not null default 1,
  data_pagamento date not null default current_date,
  observacoes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.pagamentos is 'Histórico de pagamentos/renovações recebidos de clientes.';

create index if not exists pagamentos_cliente_idx on public.pagamentos (cliente_id);
create index if not exists pagamentos_servidor_idx on public.pagamentos (servidor_id);
create index if not exists pagamentos_data_idx on public.pagamentos (data_pagamento);

-- ------------------------------------------------------------
-- Tabela: alertas
-- ------------------------------------------------------------
create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  servidor_id uuid not null references public.servidores (id) on delete cascade,
  tipo text not null check (
    tipo in ('30_dias', '15_dias', '7_dias', '3_dias', '1_dia', 'vencimento', 'pos_vencimento')
  ),
  data_alerta date not null default current_date,
  status text not null default 'Pendente' check (status in ('Pendente', 'Enviado', 'Resolvido')),
  canal text not null default 'sistema' check (canal in ('sistema', 'whatsapp')),
  created_at timestamptz not null default now()
);

comment on table public.alertas is 'Alertas automáticos de vencimento de clientes.';

create index if not exists alertas_cliente_idx on public.alertas (cliente_id);
create index if not exists alertas_servidor_idx on public.alertas (servidor_id);
create index if not exists alertas_status_idx on public.alertas (status);
create unique index if not exists alertas_unicos_por_dia
  on public.alertas (cliente_id, tipo, data_alerta);
-- ============================================================
-- Central Hub | Migration 0004
-- Row Level Security (RLS)
--
-- Regras de negócio:
--   O Central Hub é uma ferramenta interna de uma única
--   operação (não multi-tenant): qualquer usuário autenticado
--   e ativo enxerga e gerencia todos os servidores, clientes,
--   créditos, pagamentos e alertas.
--   A tabela "profiles" (gestão de usuários/perfis) continua
--   restrita: cada usuário só edita a si mesmo, e somente um
--   administrador cria, exclui ou altera o perfil de outros.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.servidores enable row level security;
alter table public.clientes enable row level security;
alter table public.creditos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.alertas enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    id = auth.uid() and (
      public.is_admin()
      or perfil = (select perfil from public.profiles where id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- Helper: usuário autenticado e com profile ativo
-- ------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select ativo from public.profiles where id = auth.uid()), false);
$$;

-- ------------------------------------------------------------
-- SERVIDORES
-- ------------------------------------------------------------
drop policy if exists "servidores_select" on public.servidores;
create policy "servidores_select"
  on public.servidores for select
  to authenticated
  using (public.is_active_user());

drop policy if exists "servidores_insert" on public.servidores;
create policy "servidores_insert"
  on public.servidores for insert
  to authenticated
  with check (public.is_active_user());

drop policy if exists "servidores_update" on public.servidores;
create policy "servidores_update"
  on public.servidores for update
  to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "servidores_delete" on public.servidores;
create policy "servidores_delete"
  on public.servidores for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
drop policy if exists "clientes_select" on public.clientes;
create policy "clientes_select"
  on public.clientes for select
  to authenticated
  using (public.is_active_user());

drop policy if exists "clientes_insert" on public.clientes;
create policy "clientes_insert"
  on public.clientes for insert
  to authenticated
  with check (public.is_active_user());

drop policy if exists "clientes_update" on public.clientes;
create policy "clientes_update"
  on public.clientes for update
  to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "clientes_delete" on public.clientes;
create policy "clientes_delete"
  on public.clientes for delete
  to authenticated
  using (public.is_active_user());

-- ------------------------------------------------------------
-- CREDITOS
-- ------------------------------------------------------------
drop policy if exists "creditos_select" on public.creditos;
create policy "creditos_select"
  on public.creditos for select
  to authenticated
  using (public.is_active_user());

drop policy if exists "creditos_insert" on public.creditos;
create policy "creditos_insert"
  on public.creditos for insert
  to authenticated
  with check (public.is_active_user());

drop policy if exists "creditos_update" on public.creditos;
create policy "creditos_update"
  on public.creditos for update
  to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "creditos_delete" on public.creditos;
create policy "creditos_delete"
  on public.creditos for delete
  to authenticated
  using (public.is_active_user());

-- ------------------------------------------------------------
-- PAGAMENTOS
-- ------------------------------------------------------------
drop policy if exists "pagamentos_select" on public.pagamentos;
create policy "pagamentos_select"
  on public.pagamentos for select
  to authenticated
  using (public.is_active_user());

drop policy if exists "pagamentos_insert" on public.pagamentos;
create policy "pagamentos_insert"
  on public.pagamentos for insert
  to authenticated
  with check (public.is_active_user());

drop policy if exists "pagamentos_update" on public.pagamentos;
create policy "pagamentos_update"
  on public.pagamentos for update
  to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "pagamentos_delete" on public.pagamentos;
create policy "pagamentos_delete"
  on public.pagamentos for delete
  to authenticated
  using (public.is_active_user());

-- ------------------------------------------------------------
-- ALERTAS
-- ------------------------------------------------------------
drop policy if exists "alertas_select" on public.alertas;
create policy "alertas_select"
  on public.alertas for select
  to authenticated
  using (public.is_active_user());

drop policy if exists "alertas_insert" on public.alertas;
create policy "alertas_insert"
  on public.alertas for insert
  to authenticated
  with check (public.is_active_user());

drop policy if exists "alertas_update" on public.alertas;
create policy "alertas_update"
  on public.alertas for update
  to authenticated
  using (public.is_active_user())
  with check (public.is_active_user());

drop policy if exists "alertas_delete" on public.alertas;
create policy "alertas_delete"
  on public.alertas for delete
  to authenticated
  using (public.is_active_user());
-- ============================================================
-- Central Hub | Migration 0005
-- Atualização automática de status + views de dashboard
--
-- public.atualizar_status_clientes():
--   Marca como "Vencido" todo cliente Ativo cuja data de
--   expiração já passou, e gera um registro de alerta
--   (30/15/7/3/1 dias antes, no vencimento e pós-vencimento)
--   para os clientes dentro dessas janelas.
--   Pode ser chamada periodicamente por uma Edge Function
--   agendada (pg_cron / Scheduled Trigger no painel do
--   Supabase) ou por um cron externo (GitHub Actions, Vercel
--   Cron) fazendo um RPC autenticado.
-- ============================================================

create or replace function public.atualizar_status_clientes()
returns table (clientes_marcados_vencidos integer, alertas_gerados integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clientes_vencidos integer := 0;
  v_alertas_gerados integer := 0;
begin
  -- Marca como vencidos os clientes ativos cuja data de expiração passou
  update public.clientes
  set status = 'Vencido'
  where status = 'Ativo'
    and data_expiracao < current_date;

  get diagnostics v_clientes_vencidos = row_count;

  -- Gera alertas para clientes ativos nas janelas de aviso
  -- (30, 15, 7, 3 e 1 dia antes do vencimento, e no próprio dia)
  insert into public.alertas (cliente_id, servidor_id, tipo, data_alerta, status)
  select
    c.id,
    c.servidor_id,
    case (c.data_expiracao - current_date)
      when 30 then '30_dias'
      when 15 then '15_dias'
      when 7 then '7_dias'
      when 3 then '3_dias'
      when 1 then '1_dia'
      when 0 then 'vencimento'
    end,
    current_date,
    'Pendente'
  from public.clientes c
  where c.status in ('Ativo', 'Vencido')
    and (c.data_expiracao - current_date) in (30, 15, 7, 3, 1, 0)
  on conflict (cliente_id, tipo, data_alerta) do nothing;

  -- Alerta pós-vencimento para clientes que já venceram
  insert into public.alertas (cliente_id, servidor_id, tipo, data_alerta, status)
  select c.id, c.servidor_id, 'pos_vencimento', current_date, 'Pendente'
  from public.clientes c
  where c.status = 'Vencido'
    and c.data_expiracao < current_date
  on conflict (cliente_id, tipo, data_alerta) do nothing;

  get diagnostics v_alertas_gerados = row_count;

  return query select v_clientes_vencidos, v_alertas_gerados;
end;
$$;

comment on function public.atualizar_status_clientes() is
  'Marca clientes vencidos e gera alertas de vencimento (30/15/7/3/1 dias, no dia e pós-vencimento).';

-- ------------------------------------------------------------
-- View: resumo geral do dashboard executivo
-- ------------------------------------------------------------
create or replace view public.vw_dashboard_resumo
with (security_invoker = true) as
select
  (select count(*) from public.clientes) as clientes_total,
  (select count(*) from public.clientes where status = 'Ativo') as clientes_ativos,
  (select count(*) from public.clientes where status = 'Vencido') as clientes_vencidos,
  (select count(*) from public.clientes
    where status = 'Ativo'
      and data_expiracao between current_date and current_date + interval '7 days') as clientes_vencendo,
  (select coalesce(sum(valor_mensal), 0) from public.clientes where status = 'Ativo') as receita_mensal,
  (select coalesce(sum(valor_mensal), 0) from public.clientes) as receita_total,
  (select coalesce(sum(case when tipo = 'Compra' then quantidade else -quantidade end), 0)
    from public.creditos) as creditos_disponiveis,
  (select count(*) from public.clientes
    where created_at >= date_trunc('month', now())) as novos_clientes,
  (select round(
      100.0 * count(*) filter (where status = 'Ativo')
        / greatest(count(*) filter (where status in ('Ativo', 'Vencido')), 1),
      1)
    from public.clientes) as taxa_renovacao,
  (select round(
      100.0 * count(*) filter (where status <> 'Cancelado') / greatest(count(*), 1),
      1)
    from public.clientes) as taxa_retencao;

comment on view public.vw_dashboard_resumo is 'Resumo agregado para os cards do dashboard executivo.';

-- ------------------------------------------------------------
-- View: resumo por servidor (dashboard individual de cada
-- servidor: clientes, receita e créditos)
-- ------------------------------------------------------------
create or replace view public.vw_servidores_resumo
with (security_invoker = true) as
select
  s.id as servidor_id,
  s.nome,
  s.plataforma,
  s.ativo,
  count(c.id) as clientes_total,
  count(c.id) filter (where c.status = 'Ativo') as clientes_ativos,
  count(c.id) filter (where c.status = 'Vencido') as clientes_vencidos,
  count(c.id) filter (
    where c.status = 'Ativo'
      and c.data_expiracao between current_date and current_date + interval '7 days'
  ) as clientes_vencendo,
  coalesce(sum(c.valor_mensal) filter (where c.status = 'Ativo'), 0) as receita_mensal,
  coalesce(sum(c.valor_mensal), 0) as receita_total,
  coalesce((
    select sum(case when cr.tipo = 'Compra' then cr.quantidade else -cr.quantidade end)
    from public.creditos cr
    where cr.servidor_id = s.id
  ), 0) as creditos_disponiveis,
  coalesce((
    select sum(cr.quantidade) from public.creditos cr
    where cr.servidor_id = s.id and cr.tipo = 'Compra'
  ), 0) as creditos_comprados,
  coalesce((
    select sum(cr.quantidade) from public.creditos cr
    where cr.servidor_id = s.id and cr.tipo = 'Uso'
  ), 0) as creditos_utilizados
from public.servidores s
left join public.clientes c on c.servidor_id = s.id
group by s.id, s.nome, s.plataforma, s.ativo;

comment on view public.vw_servidores_resumo is 'Resumo agregado por servidor: clientes, receita e créditos.';
