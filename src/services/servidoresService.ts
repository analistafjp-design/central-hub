import { supabase } from "@/integrations/supabase/client";
import type { Servidor, ServidorFiltros, ServidorInsert, ServidorUpdate, ServidorResumo } from "@/types";

export async function listarServidores(filtros: ServidorFiltros = {}): Promise<Servidor[]> {
  let query = supabase.from("servidores").select("*").order("nome", { ascending: true });

  if (filtros.busca) {
    query = query.ilike("nome", `%${filtros.busca.trim()}%`);
  }
  if (filtros.apenasAtivos) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buscarServidor(id: string): Promise<Servidor | null> {
  const { data, error } = await supabase.from("servidores").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function buscarServidorResumo(id: string): Promise<ServidorResumo | null> {
  const { data, error } = await supabase
    .from("vw_servidores_resumo")
    .select("*")
    .eq("servidor_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listarServidoresResumo(): Promise<ServidorResumo[]> {
  const { data, error } = await supabase.from("vw_servidores_resumo").select("*").order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarServidor(payload: ServidorInsert): Promise<Servidor> {
  const { data, error } = await supabase.from("servidores").insert(payload).select().single();
  if (error) throw new Error(traduzirErroServidor(error.message));
  return data;
}

export async function atualizarServidor(id: string, payload: ServidorUpdate): Promise<Servidor> {
  const { data, error } = await supabase
    .from("servidores")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(traduzirErroServidor(error.message));
  return data;
}

export async function excluirServidor(id: string): Promise<void> {
  const { error } = await supabase.from("servidores").delete().eq("id", id);
  if (error) throw new Error(traduzirErroServidor(error.message));
}

function traduzirErroServidor(message: string): string {
  if (message.includes("servidores_nome_key")) {
    return "Já existe um servidor cadastrado com este nome.";
  }
  if (message.includes("clientes_servidor_id_fkey") || message.includes("violates foreign key")) {
    return "Não é possível excluir: existem clientes vinculados a este servidor.";
  }
  return message;
}
