import { supabase } from "@/integrations/supabase/client";
import type { PagamentoComRelacoes, PagamentoFiltros, PagamentoInsert, PagamentoUpdate } from "@/types";

export async function listarPagamentos(filtros: PagamentoFiltros = {}): Promise<PagamentoComRelacoes[]> {
  let query = supabase
    .from("pagamentos")
    .select("*, cliente:clientes(id, nome), servidor:servidores(id, nome)")
    .order("data_pagamento", { ascending: false });

  if (filtros.servidorId) query = query.eq("servidor_id", filtros.servidorId);
  if (filtros.clienteId) query = query.eq("cliente_id", filtros.clienteId);
  if (filtros.dataInicio) query = query.gte("data_pagamento", filtros.dataInicio);
  if (filtros.dataFim) query = query.lte("data_pagamento", filtros.dataFim);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as PagamentoComRelacoes[]) ?? [];
}

export async function criarPagamento(payload: PagamentoInsert): Promise<PagamentoComRelacoes> {
  const { data, error } = await supabase
    .from("pagamentos")
    .insert(payload)
    .select("*, cliente:clientes(id, nome), servidor:servidores(id, nome)")
    .single();
  if (error) throw new Error(error.message);
  return data as PagamentoComRelacoes;
}

export async function atualizarPagamento(id: string, payload: PagamentoUpdate): Promise<PagamentoComRelacoes> {
  const { data, error } = await supabase
    .from("pagamentos")
    .update(payload)
    .eq("id", id)
    .select("*, cliente:clientes(id, nome), servidor:servidores(id, nome)")
    .single();
  if (error) throw new Error(error.message);
  return data as PagamentoComRelacoes;
}

export async function excluirPagamento(id: string): Promise<void> {
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
