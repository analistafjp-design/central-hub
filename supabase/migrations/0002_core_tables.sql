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
