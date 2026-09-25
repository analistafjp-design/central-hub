export type ImportTargetField =
  | "nome"
  | "usuario"
  | "senha"
  | "telefone"
  | "plano"
  | "valor_mensal"
  | "data_cadastro"
  | "data_expiracao"
  | "status"
  | "observacoes";

interface FieldDef {
  field: ImportTargetField;
  label: string;
  required: boolean;
  /** Nomes de coluna comuns (normalizados) usados para detectar automaticamente o mapeamento. */
  aliases: string[];
}

// Alvos e aliases baseados nos exports reais de painéis (WPlay, UniTV, TVS/P2P)
// além de nomes genéricos em português.
export const IMPORT_FIELDS: FieldDef[] = [
  {
    field: "nome",
    label: "Nome do cliente",
    required: false,
    aliases: ["nome", "nome do comprador", "cliente", "nome cliente", "comprador"],
  },
  {
    field: "usuario",
    label: "Usuário",
    required: false,
    aliases: ["usuario", "usuário", "conta", "login", "user"],
  },
  {
    field: "senha",
    label: "Senha",
    required: false,
    aliases: ["senha", "senha inicial", "password", "pass"],
  },
  {
    field: "telefone",
    label: "Telefone",
    required: false,
    aliases: [
      "telefone",
      "telefone do comprador",
      "whatsapp",
      "celular",
      "fone",
      "numero",
      "número",
    ],
  },
  {
    field: "plano",
    label: "Plano",
    required: false,
    aliases: ["plano", "nome do pacote", "pacote", "telas"],
  },
  {
    field: "valor_mensal",
    label: "Valor mensal",
    required: false,
    aliases: ["valor", "valor mensal", "mensalidade", "preco", "preço"],
  },
  {
    field: "data_cadastro",
    label: "Data de cadastro",
    required: false,
    aliases: [
      "cadastro",
      "data de criacao",
      "data de criação",
      "criacao",
      "criação",
      "data cadastro",
      "data de cadastro",
    ],
  },
  {
    field: "data_expiracao",
    label: "Data de expiração",
    required: true,
    aliases: [
      "expiracao",
      "expiração",
      "vencimento",
      "data de validade da conta",
      "data de vencimento",
      "data de expiracao",
      "data de expiração",
    ],
  },
  {
    field: "status",
    label: "Status (origem)",
    required: false,
    aliases: ["status", "expirado", "situacao", "situação", "em uso"],
  },
  {
    field: "observacoes",
    label: "Observações",
    required: false,
    aliases: ["observacoes", "observações", "notas", "obs"],
  },
];

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export type ColumnMapping = Partial<Record<ImportTargetField, string>>;

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usados = new Set<string>();
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));

  for (const def of IMPORT_FIELDS) {
    // Percorre os aliases em ordem de prioridade (não a ordem das colunas na
    // planilha), para que um alias mais específico só perca para um mais
    // genérico do mesmo campo — nunca para um alias de outro campo que
    // apareça antes na planilha.
    for (const alias of def.aliases) {
      const match = normalizedHeaders.find((h) => h.normalized === alias && !usados.has(h.original));
      if (match) {
        mapping[def.field] = match.original;
        usados.add(match.original);
        break;
      }
    }
  }

  return mapping;
}
