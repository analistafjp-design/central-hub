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

### Financeiro
Tela **Financeiro** com duas abas:
- **Receitas**: registrar pagamentos/renovações (valor, quantos meses foram
  ativados, data, observações), com cards de receita do mês, quantidade de
  pagamentos e ticket médio. O valor sugerido usa a mensalidade cadastrada
  do cliente × meses ativados (ou R$30/mês como referência quando o
  cliente não tem mensalidade definida). Ao registrar, opcionalmente já
  renova o cliente: estende a data de expiração pelos meses pagos e marca
  como Ativo. Também pode ser registrado direto pela linha do cliente, em
  Clientes, em Alertas ou no dashboard de cada servidor ("Registrar
  pagamento"), sem precisar abrir a tela Financeiro.
- **Gastos**: registrar compras de créditos (servidor, quantidade, valor
  pago, data, observações) — usa a tabela `creditos` já modelada no banco.

No topo da tela, cards de **Receita do mês**, **Gastos do mês**, **Lucro do
mês** e **Lucro do ano** — os gastos com créditos são descontados
automaticamente da receita recebida. O Dashboard também mostra "Recebido no
mês/ano" e "Lucro no mês" com os mesmos dados.

### Alertas de vencimento
Tela **Alertas** listando clientes vencidos ou vencendo nos próximos 7 dias,
do mais urgente para o menos urgente, com badge colorido (🔴 vencido, 🟠
vence em até 3 dias, 🟡 vence em até 7 dias) e ação rápida para registrar o
pagamento/renovação direto ali. O mesmo badge aparece na lista de Clientes e
no widget "Próximos vencimentos" do Dashboard. Um sino no topo do app mostra
a contagem de alertas urgentes (vencidos + vencendo em até 3 dias) e leva
direto para a tela. Esse cálculo é feito a partir da data de expiração de
cada cliente — a função `atualizar_status_clientes()` (banco de dados)
também gera registros na tabela `alertas` para uso futuro (ex.: histórico,
envio por WhatsApp), mas não é necessária para os alertas visuais
funcionarem.

### Módulos com schema pronto (telas em etapas futuras)
- **Integração com WhatsApp** para envio dos alertas (tabela `alertas` já
  modelada e populada automaticamente pela função de status)
- **Insights Inteligentes** e **Radar de Crescimento**

## Status da implementação

Este repositório está na fase de **scaffold funcional**: a base técnica
(build, Supabase, autenticação, layout, navegação) e os módulos de
**Dashboard**, **Servidores**, **Clientes**, **Importação de Dados**,
**Financeiro** (receitas e gastos) e **Alertas de vencimento** estão
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
│   ├── clientes/       # ClienteForm, ClienteTable, ClienteFilters, ImportarClientesDialog
│   ├── pagamentos/     # PagamentoForm, PagamentoTable
│   └── creditos/       # CreditoForm, CreditoTable (aba de Gastos)
├── pages/
│   ├── auth/           # Login, cadastro, recuperação/redefinição de senha
│   ├── DashboardPage.tsx
│   ├── ServidoresPage.tsx
│   ├── ServidorDetailPage.tsx
│   ├── ClientesPage.tsx
│   ├── AlertasPage.tsx
│   ├── FinanceiroPage.tsx
│   └── ProfilePage.tsx
├── hooks/               # useServidores, useClientes, useDashboard, usePagamentos, useCreditos, useAlertas, ...
├── services/            # Chamadas ao Supabase (servidoresService, clientesService, pagamentosService, creditosService, ...)
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
- [x] Financeiro (receitas, gastos com créditos e lucro)
- [x] Central de alertas de vencimento
- [ ] Integração com WhatsApp para envio dos alertas
- [ ] Insights inteligentes
- [ ] Radar de crescimento
