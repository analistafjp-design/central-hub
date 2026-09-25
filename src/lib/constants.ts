export const APP_NAME = import.meta.env.VITE_APP_NAME || "Central Hub";
export const APP_SLOGAN = "Sua operação em um único lugar.";

export const PLATAFORMAS = ["WPLAY", "UNITV", "TVS", "P2BRAZ", "Outro"] as const;
export type PlataformaConst = (typeof PLATAFORMAS)[number];

export const CLIENTE_STATUS = ["Ativo", "Vencido", "Cancelado"] as const;
export type ClienteStatusConst = (typeof CLIENTE_STATUS)[number];

export const CLIENTE_STATUS_COLORS: Record<ClienteStatusConst, string> = {
  Ativo: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Vencido: "bg-red-100 text-red-800 border-red-300",
  Cancelado: "bg-slate-100 text-slate-700 border-slate-300",
};

export const CREDITO_TIPOS = ["Compra", "Uso"] as const;
export type CreditoTipoConst = (typeof CREDITO_TIPOS)[number];

export const ALERTA_STATUS = ["Pendente", "Enviado", "Resolvido"] as const;
export type AlertaStatusConst = (typeof ALERTA_STATUS)[number];

export const DIAS_VENCENDO_EM_BREVE = 7;
export const DIAS_VENCIMENTO_CRITICO = 3;
