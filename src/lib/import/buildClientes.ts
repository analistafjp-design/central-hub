import type { ColumnMapping } from "./fields";
import { parseCellDate, parseCellNumber } from "./dateParse";
import type { ClienteInsert, ClienteStatus } from "@/types";

export interface ImportRowResult {
  linha: number;
  situacao: "ok" | "duplicado" | "erro";
  motivo?: string;
  cliente?: ClienteInsert;
  preview: {
    nome: string;
    usuario: string;
    telefone: string;
    plano: string;
    dataExpiracao: string;
    status: ClienteStatus | "";
  };
}

function getValue(row: Record<string, unknown>, mapping: ColumnMapping, field: keyof ColumnMapping): string {
  const column = mapping[field];
  if (!column) return "";
  const value = row[column];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function inferStatus(rawStatus: string, dataExpiracao: string | null): ClienteStatus {
  const normalizado = rawStatus
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalizado.includes("cancel")) return "Cancelado";

  if (dataExpiracao) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (dataExpiracao < hoje) return "Vencido";
  }

  return "Ativo";
}

export function buildClientesFromRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
  servidorId: string,
  usuariosExistentes: Set<string>,
  createdBy: string | undefined,
): ImportRowResult[] {
  const usuariosNoLote = new Set<string>();

  return rows.map((row, index) => {
    const nome = getValue(row, mapping, "nome");
    const usuario = getValue(row, mapping, "usuario");
    const senha = getValue(row, mapping, "senha");
    const telefone = getValue(row, mapping, "telefone");
    const plano = getValue(row, mapping, "plano");
    const observacoes = getValue(row, mapping, "observacoes");
    const rawStatus = getValue(row, mapping, "status");

    const nomeFinal = nome || usuario;
    const chaveDuplicidade = (usuario || nome).toLowerCase();

    const dataExpiracaoRaw = mapping.data_expiracao ? row[mapping.data_expiracao] : undefined;
    const dataExpiracao = parseCellDate(dataExpiracaoRaw);

    const dataCadastroRaw = mapping.data_cadastro ? row[mapping.data_cadastro] : undefined;
    const dataCadastro = parseCellDate(dataCadastroRaw);

    const valorRaw = mapping.valor_mensal ? row[mapping.valor_mensal] : undefined;
    const valorMensal = parseCellNumber(valorRaw) ?? 0;

    const status = inferStatus(rawStatus, dataExpiracao);

    const preview = {
      nome: nomeFinal || "(sem nome)",
      usuario,
      telefone,
      plano,
      dataExpiracao: dataExpiracao ?? "",
      status: dataExpiracao ? status : ("" as const),
    };

    if (!nomeFinal) {
      return { linha: index + 2, situacao: "erro", motivo: "Nome e usuário estão vazios.", preview };
    }

    if (!dataExpiracao) {
      return {
        linha: index + 2,
        situacao: "erro",
        motivo: "Data de expiração ausente ou em formato não reconhecido.",
        preview,
      };
    }

    if (chaveDuplicidade && (usuariosExistentes.has(chaveDuplicidade) || usuariosNoLote.has(chaveDuplicidade))) {
      return { linha: index + 2, situacao: "duplicado", motivo: "Já existe um cliente com este usuário/nome.", preview };
    }

    if (chaveDuplicidade) usuariosNoLote.add(chaveDuplicidade);

    const cliente: ClienteInsert = {
      nome: nomeFinal,
      usuario: usuario || null,
      senha: senha || null,
      telefone: telefone || null,
      plano: plano || null,
      valor_mensal: valorMensal,
      servidor_id: servidorId,
      observacoes: observacoes || null,
      data_cadastro: dataCadastro ?? new Date().toISOString().slice(0, 10),
      data_expiracao: dataExpiracao,
      status,
      created_by: createdBy,
    };

    return { linha: index + 2, situacao: "ok", cliente, preview };
  });
}
