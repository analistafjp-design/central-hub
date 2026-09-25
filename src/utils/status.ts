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
