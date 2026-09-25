import { DIAS_VENCENDO_EM_BREVE, DIAS_VENCIMENTO_CRITICO } from "@/lib/constants";

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function isVencendoEmBreve(dataExpiracao: string | null | undefined): boolean {
  const dias = daysUntil(dataExpiracao);
  return dias !== null && dias >= 0 && dias <= DIAS_VENCENDO_EM_BREVE;
}

export type UrgenciaVencimento = "vencido" | "critico" | "atencao";

export interface VencimentoInfo {
  nivel: UrgenciaVencimento;
  dias: number;
  label: string;
}

/**
 * Classifica a urgência do vencimento de um cliente Ativo:
 *   vencido  -> já passou da data (dias < 0)
 *   critico  -> vence hoje ou em até DIAS_VENCIMENTO_CRITICO dias (laranja)
 *   atencao  -> vence entre DIAS_VENCIMENTO_CRITICO e DIAS_VENCENDO_EM_BREVE dias (amarelo)
 * Retorna null quando não há alerta a mostrar (mais de DIAS_VENCENDO_EM_BREVE
 * dias de folga, ou o cliente não está Ativo).
 */
export function getVencimentoInfo(
  dataExpiracao: string | null | undefined,
  status: string | null | undefined,
): VencimentoInfo | null {
  if (status !== "Ativo") return null;
  const dias = daysUntil(dataExpiracao);
  if (dias === null || dias > DIAS_VENCENDO_EM_BREVE) return null;

  if (dias < 0) {
    const diasVencido = Math.abs(dias);
    return {
      nivel: "vencido",
      dias,
      label: diasVencido === 1 ? "Venceu há 1 dia" : `Venceu há ${diasVencido} dias`,
    };
  }

  const label = dias === 0 ? "Vence hoje" : dias === 1 ? "Vence amanhã" : `Vence em ${dias} dias`;

  return {
    nivel: dias <= DIAS_VENCIMENTO_CRITICO ? "critico" : "atencao",
    dias,
    label,
  };
}

/**
 * Soma N meses a uma data-base para calcular a nova expiração de uma
 * renovação. Parte da data atual de expiração quando ela ainda não
 * venceu (renovação antecipada não perde os dias restantes), ou de hoje
 * quando já está vencida.
 */
export function calcularNovaExpiracao(
  dataExpiracaoAtual: string | null | undefined,
  meses: number,
): string {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const atual = dataExpiracaoAtual ? new Date(`${dataExpiracaoAtual}T00:00:00`) : null;
  const base = atual && !Number.isNaN(atual.getTime()) && atual.getTime() > hoje.getTime() ? atual : hoje;

  const resultado = new Date(base);
  resultado.setMonth(resultado.getMonth() + meses);

  const y = resultado.getFullYear();
  const m = String(resultado.getMonth() + 1).padStart(2, "0");
  const d = String(resultado.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
