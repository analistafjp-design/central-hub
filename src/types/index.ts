import type { Database } from "@/integrations/supabase/types";

export type {
  Perfil,
  Plataforma,
  ClienteStatus,
  CreditoTipo,
  AlertaTipo,
  AlertaStatus,
  AlertaCanal,
} from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Servidor = Database["public"]["Tables"]["servidores"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Credito = Database["public"]["Tables"]["creditos"]["Row"];
export type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];
export type Alerta = Database["public"]["Tables"]["alertas"]["Row"];

export type DashboardResumo = Database["public"]["Views"]["vw_dashboard_resumo"]["Row"];
export type ServidorResumo = Database["public"]["Views"]["vw_servidores_resumo"]["Row"];

export type ServidorInsert = Database["public"]["Tables"]["servidores"]["Insert"];
export type ServidorUpdate = Database["public"]["Tables"]["servidores"]["Update"];
export type ClienteInsert = Database["public"]["Tables"]["clientes"]["Insert"];
export type ClienteUpdate = Database["public"]["Tables"]["clientes"]["Update"];
export type PagamentoInsert = Database["public"]["Tables"]["pagamentos"]["Insert"];
export type PagamentoUpdate = Database["public"]["Tables"]["pagamentos"]["Update"];

export interface ClienteComServidor extends Cliente {
  servidor?: Pick<Servidor, "id" | "nome" | "plataforma"> | null;
}

export interface PagamentoComRelacoes extends Pagamento {
  cliente?: Pick<Cliente, "id" | "nome"> | null;
  servidor?: Pick<Servidor, "id" | "nome"> | null;
}

export interface ClienteFiltros {
  busca?: string;
  servidorId?: string;
  status?: string;
}

export interface ServidorFiltros {
  busca?: string;
  apenasAtivos?: boolean;
}

export interface PagamentoFiltros {
  servidorId?: string;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
}
