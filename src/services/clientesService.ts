import { supabase } from "@/integrations/supabase/client";
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
