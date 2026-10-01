# Central Hub — instruções para a Claude

O Central Hub ("Sua operação em um único lugar") é um painel de gestão de
clientes e assinaturas de **vários servidores** (WPLAY, UNITV, TVS,
P2BRAZ ou "Outro"). Ele reúne:
- dashboard executivo e um dashboard por servidor;
- cadastro de clientes;
- importação de planilhas (`.xlsx`/`.csv`);
- financeiro, com receitas/renovações e gastos;
- controle de créditos;
- alertas de vencimento com aviso por WhatsApp.

O `README.md` tem as funcionalidades e o que está pronto. O
`supabase/README.md` tem as tabelas, a RLS, as views e a função de status e
alertas.

## Como trabalhar com o usuário

- Converse sempre em **português do Brasil**, de forma direta.
- Preserve o que já funciona. Não mude tela, regra ou cálculo além do que foi
  pedido.
- Não invente dados, resultados nem testes. Se algo não foi verificado, diga
  que não foi.
- **Nunca versione segredos** (`VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` ficam no `.env` local e nos secrets).
- Para cada pedido, crie um branch a partir da `main`, abra o PR como
  **draft** e **só mescle quando o usuário disser "Pode mesclar"** (ou
  "Pode").
- Escreva as mensagens de commit e as descrições de PR em português.

## Regras de negócio já combinadas

- **Renovar desconta créditos** do servidor, e há alerta de saldo baixo.
- **Valor sugerido do pagamento** = mensalidade do cliente × meses ativados.
  Se o cliente não tem mensalidade, a referência é R$ 30/mês. Registrar o
  pagamento pode já renovar o cliente, estendendo a expiração pelos meses
  pagos.
- **A mensagem de lembrete no WhatsApp** é assinada com o nome da empresa.
- **Valores em R$ e números nos cards** não podem ser cortados nem quebrar no
  meio (isso já foi corrigido duas vezes).
- **Importação**: upload → mapeamento de colunas (detecção automática) →
  pré-visualização com validação e detecção de duplicidade (por
  usuário/nome no servidor). Linhas com erro ou duplicadas são ignoradas e
  reportadas.
- **O que ainda falta**: os módulos do escopo além dos já prontos (Dashboard,
  Servidores, Clientes, Importação, Financeiro e Alertas) já têm o schema no
  banco e são as próximas etapas.

## Estrutura e publicação

- **Stack**: Vite + React + TypeScript + Tailwind + shadcn/ui, React Router,
  React Hook Form + Zod, Recharts e ExcelJS (carregado sob demanda).
- **Backend**: Supabase direto do cliente (PostgREST + Auth), protegido por
  RLS. Migrações em `supabase/migrations`; script único em
  `supabase/setup_completo.sql`.
- **Publicação**: o GitHub Pages publica a cada push na `main`
  (`.github/workflows/deploy-pages.yml`). A Vercel também é suportada
  (`vercel.json`).
- **Checagens antes do commit**: `npm run typecheck`, `npm run lint` e
  `npm run build`.
