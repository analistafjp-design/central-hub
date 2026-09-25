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
