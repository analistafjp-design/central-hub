# Central Hub

**Sua operação em um único lugar.**

O Central Hub é uma plataforma de gestão desenvolvida para centralizar
informações operacionais, comerciais e financeiras de múltiplos servidores em
um único painel.

A solução permite acompanhar clientes, assinaturas, vencimentos, créditos,
receitas e indicadores estratégicos através de dashboards inteligentes e
relatórios detalhados.

O objetivo é substituir controles manuais, planilhas dispersas e múltiplos
sistemas por uma plataforma moderna, organizada e escalável.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Status da implementação](#status-da-implementação)
3. [Arquitetura](#arquitetura)
4. [Banco de dados](#banco-de-dados)
5. [Estrutura de pastas](#estrutura-de-pastas)
6. [Instalação](#instalação)
7. [Configuração](#configuração)
8. [Deploy](#deploy)
9. [Tecnologias utilizadas](#tecnologias-utilizadas)
10. [Roadmap](#roadmap)

---

## Funcionalidades

### Dashboard Executivo
- Total de clientes, clientes ativos, vencidos e vencendo
- Receita mensal e receita total
- Créditos disponíveis
- Novos clientes no mês
- Taxa de renovação e taxa de retenção
- Gráficos: receita por servidor, clientes por status, novos clientes por mês
- Lista de próximos vencimentos

### Gestão de Servidores
Suporte para WPLAY, UNITV, TVS, P2BRAZ (ou plataforma customizada "Outro").
Cada servidor possui dashboard próprio, controle de clientes, receita
individual e controle de créditos.

### Gestão de Clientes
Cadastro manual de clientes com nome, usuário, senha, telefone, plano, valor
mensal, servidor, observações, data de cadastro, data de expiração e status
(Ativo / Vencido / Cancelado). Busca e filtros por servidor e status.

### Importação de Dados
Botão **Importar planilha** (na tela de Clientes e no dashboard de cada
servidor) para subir arquivos `.xlsx` ou `.csv` exportados de painéis como
WPlay, UniTV ou TVS/P2P. Fluxo em 3 passos: upload → mapeamento de colunas
(com detecção automática por nomes comuns de coluna) → pré-visualização com
validação linha a linha e detecção de duplicidade (por usuário/nome já
cadastrado no servidor). Linhas com erro ou duplicadas são ignoradas e
reportadas; o cadastro manual continua disponível normalmente.

### Alertas automáticos
A função `atualizar_status_clientes()` (banco de dados) marca clientes
vencidos e gera alertas 30/15/7/3/1 dias antes do vencimento, no dia e após
o vencimento. Schema e função já implementados — tela de central de alertas
é a próxima etapa do roadmap.

### Módulos com schema pronto (telas em etapas futuras)
- **Gestão Financeira** (receita por servidor/cliente, ticket médio,
  projeções — tabela `pagamentos` já modelada)
- **Controle de Créditos** (compras/usos por servidor — tabela `creditos`
  já modelada e já contabilizada nos dashboards)
- **Alertas Inteligentes / Integração com WhatsApp** (tabela `alertas` já
  modelada e populada automaticamente pela função de status)
- **Insights Inteligentes** e **Radar de Crescimento**

## Status da implementação

Este repositório está na fase de **scaffold funcional**: a base técnica
(build, Supabase, autenticação, layout, navegação) e os módulos de
**Dashboard**, **Servidores**, **Clientes** e **Importação de Dados** estão
implementados de ponta a ponta (UI + hooks + services + banco de dados +
RLS). Os demais módulos do escopo do produto já têm o schema de banco pronto
(ver [supabase/README.md](./supabase/README.md)) e entram como próximas
etapas.

---

## Arquitetura

Aplicação SPA (Vite + React + TypeScript) consumindo o Supabase diretamente
do client (PostgREST + Auth), sem backend próprio. Row Level Security (RLS)
no Postgres garante que apenas usuários autenticados e ativos acessem os
dados.

## Banco de dados

Ver [supabase/README.md](./supabase/README.md) para a estrutura completa das
tabelas, RLS, views e função de atualização automática de status/alertas.

Tabelas: `profiles`, `servidores`, `clientes`, `creditos`, `pagamentos`,
`alertas`. Views: `vw_dashboard_resumo`, `vw_servidores_resumo`.

---

## Estrutura de pastas

```bash
src/
├── components/
│   ├── ui/           # Primitivos shadcn/ui (button, dialog, table, ...)
│   ├── layout/        # Sidebar, Topbar, MobileNav
│   ├── shared/         # PageHeader, StatCard, EmptyState, ConfirmDialog, StatusBadge
│   ├── dashboard/      # Gráficos e widgets do dashboard executivo
│   ├── servidores/     # ServidorForm, ServidorCard
│   └── clientes/       # ClienteForm, ClienteTable, ClienteFilters
├── pages/
│   ├── auth/           # Login, cadastro, recuperação/redefinição de senha
│   ├── DashboardPage.tsx
│   ├── ServidoresPage.tsx
│   ├── ServidorDetailPage.tsx
│   ├── ClientesPage.tsx
│   └── ProfilePage.tsx
├── hooks/               # useServidores, useClientes, useDashboard, ...
├── services/            # Chamadas ao Supabase (servidoresService, clientesService, ...)
├── integrations/
│   └── supabase/        # client.ts e types.ts (schema do banco)
├── contexts/            # AuthContext
├── layouts/              # AppLayout, AuthLayout
├── routes/               # ProtectedRoute / PublicOnlyRoute
├── types/                # Tipos de domínio derivados do schema
├── lib/                  # utils (cn), constants, validations (zod), masks
├── assets/
└── utils/                # formatters (moeda, data), status (dias até vencimento)
```

---

## Instalação

```bash
git clone https://github.com/analistafjp-design/central-hub.git
cd central-hub
npm install
cp .env.example .env
```

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Em **Project Settings → API**, copie a **Project URL** e a chave
   **anon public** para o arquivo `.env` (`VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`).
3. Provisione o banco seguindo [supabase/README.md](./supabase/README.md)
   (opção mais simples: colar `supabase/setup_completo.sql` no SQL Editor).
4. Rode o projeto:

```bash
npm run dev
```

O primeiro usuário que se cadastrar em `/cadastro` vira automaticamente
**administrador**.

## Deploy

- **Vercel**: importe o repositório, defina `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente. `vercel.json` já
  cuida do rewrite de SPA.
- **GitHub Pages**: o workflow `.github/workflows/deploy-pages.yml` builda
  e publica automaticamente a cada push em `main`. Configure os secrets
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em
  **Settings → Secrets and variables → Actions** do repositório.

---

## Tecnologias utilizadas

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI)
- React Router, React Hook Form + Zod
- Recharts
- ExcelJS (leitura de planilhas .xlsx na importação, carregado sob demanda)

### Backend
- Supabase (PostgreSQL, Authentication, Row Level Security, Storage, Edge
  Functions)

### Aplicação
- PWA, mobile first (Android/iOS instalável)

---

## Roadmap

- [x] Base técnica (Vite, Tailwind, shadcn/ui, PWA, Supabase, Auth, RLS)
- [x] Dashboard executivo
- [x] Gestão de Servidores
- [x] Gestão de Clientes
- [x] Importação de dados (Excel/CSV)
- [ ] Gestão financeira detalhada (histórico de pagamentos)
- [ ] Controle de créditos (tela dedicada)
- [ ] Central de alertas + integração com WhatsApp
- [ ] Insights inteligentes
- [ ] Radar de crescimento
