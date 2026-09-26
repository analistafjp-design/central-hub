import { PIX_KEY_PADRAO } from "@/lib/constants";
import { onlyDigits } from "./formatters";
import { daysUntil } from "./status";
import type { ClienteComServidor } from "@/types";

export function primeiroNome(nome: string | null | undefined): string {
  if (!nome) return "";
  return nome.trim().split(/\s+/)[0];
}

export function saudacaoPorHorario(data: Date = new Date()): string {
  const hora = data.getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function fraseVencimento(dataExpiracao: string | null | undefined): string {
  const dias = daysUntil(dataExpiracao);
  if (dias === null) return "está prestes a vencer";
  if (dias < 0) {
    const diasVencido = Math.abs(dias);
    return diasVencido === 1 ? "venceu ontem" : `venceu há ${diasVencido} dias`;
  }
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

/** Monta a mensagem padrão de lembrete de vencimento, com saudação de acordo
 * com o horário, primeiro nome do cliente e a chave Pix para renovação. */
export function montarMensagemLembrete(cliente: ClienteComServidor): string {
  const saudacao = saudacaoPorHorario();
  const nome = primeiroNome(cliente.nome);
  const frase = fraseVencimento(cliente.data_expiracao);
  return `${saudacao}, ${nome}! Tudo bem? Seu plano de IPTV ${frase}. Deseja renovar?\n\n💳 Chave Pix: ${PIX_KEY_PADRAO}`;
}

/** Monta o link wa.me com a mensagem já preenchida. Retorna null quando o
 * cliente não tem telefone cadastrado. Números sem DDI ganham o "55" (Brasil). */
export function montarLinkWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  const digitos = onlyDigits(telefone);
  if (!digitos) return null;
  const numero = digitos.startsWith("55") && digitos.length >= 12 ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
