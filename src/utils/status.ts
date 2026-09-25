import { DIAS_VENCENDO_EM_BREVE } from "@/lib/constants";

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
