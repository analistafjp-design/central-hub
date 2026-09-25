import { supabase } from "@/integrations/supabase/client";
import type { CreditoComServidor, CreditoFiltros, CreditoInsert } from "@/types";

export async function listarCreditos(filtros: CreditoFiltros = {}): Promise<CreditoComServidor[]> {
  let query = supabase
    .from("creditos")
    .select("*, servidor:servidores(id, nome)")
    .order("data", { ascending: false });

  if (filtros.servidorId) query = query.eq("servidor_id", filtros.servidorId);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo as CreditoComServidor["tipo"]);
  if (filtros.dataInicio) query = query.gte("data", filtros.dataInicio);
  if (filtros.dataFim) query = query.lte("data", filtros.dataFim);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CreditoComServidor[]) ?? [];
}

export async function criarCredito(payload: CreditoInsert): Promise<CreditoComServidor> {
  const { data, error } = await supabase
    .from("creditos")
    .insert(payload)
    .select("*, servidor:servidores(id, nome)")
    .single();
  if (error) throw new Error(error.message);
  return data as CreditoComServidor;
}

export async function excluirCredito(id: string): Promise<void> {
  const { error } = await supabase.from("creditos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
