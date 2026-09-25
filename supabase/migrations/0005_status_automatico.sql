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
