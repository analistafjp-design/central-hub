// ============================================================
// Tipos gerados manualmente a partir do schema Supabase (Central Hub).
// Caso o schema mude, regenere com:
//   npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts
// ============================================================

export type Perfil = "administrador" | "operador";
export type Plataforma = "WPLAY" | "UNITV" | "TVS" | "P2BRAZ" | "Outro";
export type ClienteStatus = "Ativo" | "Vencido" | "Cancelado";
export type CreditoTipo = "Compra" | "Uso";
export type AlertaTipo =
  | "30_dias"
  | "15_dias"
  | "7_dias"
  | "3_dias"
  | "1_dia"
  | "vencimento"
  | "pos_vencimento";
export type AlertaStatus = "Pendente" | "Enviado" | "Resolvido";
export type AlertaCanal = "sistema" | "whatsapp";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          perfil: Perfil;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          nome: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      servidores: {
        Row: {
          id: string;
          nome: string;
          plataforma: Plataforma;
          ativo: boolean;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["servidores"]["Row"]> & {
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["servidores"]["Row"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          usuario: string | null;
          senha: string | null;
          telefone: string | null;
          plano: string | null;
          valor_mensal: number;
          servidor_id: string;
          observacoes: string | null;
          data_cadastro: string;
          data_expiracao: string;
          status: ClienteStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clientes"]["Row"]> & {
          nome: string;
          servidor_id: string;
          data_expiracao: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "clientes_servidor_id_fkey";
            columns: ["servidor_id"];
            isOneToOne: false;
            referencedRelation: "servidores";
            referencedColumns: ["id"];
          },
        ];
      };
      creditos: {
        Row: {
          id: string;
          servidor_id: string;
          tipo: CreditoTipo;
          quantidade: number;
          valor: number | null;
          cliente_id: string | null;
          data: string;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["creditos"]["Row"]> & {
          servidor_id: string;
          tipo: CreditoTipo;
          quantidade: number;
        };
        Update: Partial<Database["public"]["Tables"]["creditos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "creditos_servidor_id_fkey";
            columns: ["servidor_id"];
            isOneToOne: false;
            referencedRelation: "servidores";
            referencedColumns: ["id"];
          },
        ];
      };
      pagamentos: {
        Row: {
          id: string;
          cliente_id: string;
          servidor_id: string;
          valor: number;
          meses: number;
          data_pagamento: string;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pagamentos"]["Row"]> & {
          cliente_id: string;
          servidor_id: string;
          valor: number;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      alertas: {
        Row: {
          id: string;
          cliente_id: string;
          servidor_id: string;
          tipo: AlertaTipo;
          data_alerta: string;
          status: AlertaStatus;
          canal: AlertaCanal;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alertas"]["Row"]> & {
          cliente_id: string;
          servidor_id: string;
          tipo: AlertaTipo;
        };
        Update: Partial<Database["public"]["Tables"]["alertas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "alertas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vw_dashboard_resumo: {
        Row: {
          clientes_total: number;
          clientes_ativos: number;
          clientes_vencidos: number;
          clientes_vencendo: number;
          receita_mensal: number;
          receita_total: number;
          creditos_disponiveis: number;
          novos_clientes: number;
          taxa_renovacao: number;
          taxa_retencao: number;
        };
        Relationships: [];
      };
      vw_servidores_resumo: {
        Row: {
          servidor_id: string;
          nome: string;
          plataforma: Plataforma;
          ativo: boolean;
          clientes_total: number;
          clientes_ativos: number;
          clientes_vencidos: number;
          clientes_vencendo: number;
          receita_mensal: number;
          receita_total: number;
          creditos_disponiveis: number;
          creditos_comprados: number;
          creditos_utilizados: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      atualizar_status_clientes: {
        Args: Record<string, never>;
        Returns: { clientes_marcados_vencidos: number; alertas_gerados: number }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
