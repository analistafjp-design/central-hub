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
