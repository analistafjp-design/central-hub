import { supabase } from "@/integrations/supabase/client";
import type { DashboardResumo, ClienteComServidor } from "@/types";

export async function buscarResumoDashboard(): Promise<DashboardResumo> {
  const { data, error } = await supabase.from("vw_dashboard_resumo").select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export interface ClientePorStatus {
  status: string;
  quantidade: number;
}

export async function buscarClientesPorStatus(): Promise<ClientePorStatus[]> {
  const { data, error } = await supabase.from("clientes").select("status");
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, number>();
  for (const registro of data ?? []) {
    agrupado.set(registro.status, (agrupado.get(registro.status) ?? 0) + 1);
  }
  return Array.from(agrupado.entries()).map(([status, quantidade]) => ({ status, quantidade }));
}

export interface ReceitaPorServidor {
  servidor: string;
  receita: number;
}

export async function buscarReceitaPorServidor(): Promise<ReceitaPorServidor[]> {
  const { data, error } = await supabase
    .from("vw_servidores_resumo")
    .select("nome, receita_mensal")
    .order("receita_mensal", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ servidor: r.nome, receita: Number(r.receita_mensal) }));
}

export interface NovosClientesPorMes {
  mes: string;
  quantidade: number;
}

export async function buscarNovosClientesPorMes(): Promise<NovosClientesPorMes[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, number>();
  for (const registro of data ?? []) {
    const data_ = new Date(registro.created_at);
    const chave = `${data_.getFullYear()}-${String(data_.getMonth() + 1).padStart(2, "0")}`;
    agrupado.set(chave, (agrupado.get(chave) ?? 0) + 1);
  }

  return Array.from(agrupado.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([chave, quantidade]) => {
      const [ano, mes] = chave.split("-");
      const label = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { mes: label, quantidade };
    });
}

export async function buscarProximosVencimentos(limite = 6): Promise<ClienteComServidor[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*, servidor:servidores(id, nome, plataforma)")
    .eq("status", "Ativo")
    .gte("data_expiracao", new Date().toISOString().slice(0, 10))
    .order("data_expiracao", { ascending: true })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data as ClienteComServidor[]) ?? [];
}
