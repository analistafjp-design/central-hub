# Supabase - Central Hub

Este diretório contém tudo que é necessário para provisionar o backend do
Central Hub no Supabase.

## Estrutura

```
supabase/
├── config.toml                          # Configuração do projeto (CLI local)
├── setup_completo.sql                   # Migrações 0001-0005 concatenadas em um só arquivo
└── migrations/                          # Os mesmos scripts SQL, separados e aplicados em ordem
    ├── 0001_profiles.sql                # Perfis de usuário + triggers
    ├── 0002_core_tables.sql             # servidores, clientes
    ├── 0003_creditos_alertas_pagamentos.sql  # creditos, pagamentos, alertas
    ├── 0004_rls_policies.sql            # Row Level Security de todas as tabelas
    ├── 0005_status_automatico.sql       # Função de status/alertas + views do dashboard
    └── 0006_seed_opcional.sql           # Dados de exemplo (apenas dev local)
```

## Como aplicar

### Opção A — SQL Editor, tudo de uma vez (mais simples, recomendado)

Abra o **SQL Editor** do Supabase Studio → **New query**, cole todo o
conteúdo de [`setup_completo.sql`](./setup_completo.sql) e clique em
**Run** uma única vez. Ele já contém as migrações 0001 a 0005 na ordem
correta (não inclui a 0006, que é só o seed opcional de exemplo).

### Opção B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push
```

### Opção C — SQL Editor, arquivo por arquivo

Execute os arquivos de `migrations/` **em ordem numérica**, um de cada
vez, colando o conteúdo de cada um em uma nova query. Use essa opção
apenas se preferir revisar/aplicar cada etapa separadamente.

## Agendando a atualização automática de status e alertas

A função `atualizar_status_clientes()` (criada na migration 0005) marca
clientes vencidos e gera os alertas de vencimento. Ela deve rodar 1x por
dia. Duas formas de agendar:

- **pg_cron** (extensão do Supabase): no SQL Editor,
  ```sql
  select cron.schedule(
    'atualizar-status-clientes-diario',
    '0 10 * * *', -- 07:00 no horário de Brasília (Supabase usa UTC)
    $$select public.atualizar_status_clientes();$$
  );
  ```
- **Cron externo** (GitHub Actions, Vercel Cron, etc.): um `POST`
  autenticado para o endpoint REST `rpc/atualizar_status_clientes` do
  seu projeto Supabase.

## Roadmap do backend

As tabelas `creditos`, `pagamentos` e `alertas` já estão modeladas e com
RLS habilitada — sustentam os módulos de **Controle de Créditos**,
**Gestão Financeira** e **Alertas Inteligentes / WhatsApp** que entram em
etapas futuras da aplicação (o schema já está pronto, faltam as telas).
