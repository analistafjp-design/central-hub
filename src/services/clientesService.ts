import { supabase } from "@/integrations/supabase/client";
import { DIAS_VENCENDO_EM_BREVE } from "@/lib/constants";
import type { ClienteComServidor, ClienteFiltros, ClienteInsert, ClienteUpdate } from "@/types";

export async function listarClientes(filtros: ClienteFiltros = {}): Promise<ClienteComServidor[]> {
  let query = supabase
    .from("clientes")
    .select("*, servidor:servidores(id, nome, plataforma)")
    .order("nome", { ascending: true });

  if (filtros.busca) {
    const termo = filtros.busca.trim();
    query = query.or(`nome.ilike.%${termo}%,usuario.ilike.%${termo}%,telefone.ilike.%${termo}%`);
  }
  if (filtros.servidorId) query = query.eq("servidor_id", filtros.servidorId);
  if (filtros.status) query = query.eq("status", filtros.status as ClienteComServidor["status"]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ClienteComServidor[]) ?? [];
}

export async function buscarCliente(id: string): Promise<ClienteComServidor | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*, servidor:servidores(id, nome, plataforma)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ClienteComServidor | null;
}

export async function criarCliente(payload: ClienteInsert): Promise<ClienteComServidor> {
  const { data, error } = await supabase
    .from("clientes")
    .insert(payload)
    .select("*, servidor:servidores(id, nome, plataforma)")
    .single();
  if (error) throw new Error(error.message);
  return data as ClienteComServidor;
}

export async function atualizarCliente(id: string, payload: ClienteUpdate): Promise<ClienteComServidor> {
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select("*, servidor:servidores(id, nome, plataforma)")
    .single();
  if (error) throw new Error(error.message);
  return data as ClienteComServidor;
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Clientes que precisam de atenção: já vencidos (independentemente do
 * status gravado — cobre o caso do status ainda não ter sido
 * re-sincronizado) ou ativos vencendo dentro da janela de alerta.
 */
export async function listarClientesParaAlertas(): Promise<ClienteComServidor[]> {
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_VENCENDO_EM_BREVE);
  const limiteStr = limite.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("clientes")
    .select("*, servidor:servidores(id, nome, plataforma)")
    .or(`status.eq.Vencido,and(status.eq.Ativo,data_expiracao.lte.${limiteStr})`)
    .order("data_expiracao", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ClienteComServidor[]) ?? [];
}

/** Usados na importação para detectar duplicidades: usuário (ou nome, quando não há usuário) em minúsculas. */
export async function buscarChavesExistentes(servidorId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("clientes")
    .select("usuario, nome")
    .eq("servidor_id", servidorId);
  if (error) throw new Error(error.message);

  const chaves = new Set<string>();
  for (const registro of data ?? []) {
    const chave = (registro.usuario || registro.nome || "").toLowerCase();
    if (chave) chaves.add(chave);
  }
  return chaves;
}

const IMPORT_BATCH_SIZE = 200;

export async function importarClientes(clientes: ClienteInsert[]): Promise<number> {
  let inseridos = 0;
  for (let i = 0; i < clientes.length; i += IMPORT_BATCH_SIZE) {
    const lote = clientes.slice(i, i + IMPORT_BATCH_SIZE);
    const { data, error } = await supabase.from("clientes").insert(lote).select("id");
    if (error) throw new Error(error.message);
    inseridos += data?.length ?? 0;
  }
  return inseridos;
}
