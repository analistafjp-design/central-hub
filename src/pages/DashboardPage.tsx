import { useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  UserPlus,
  Receipt,
  CalendarRange,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useDashboard } from "@/hooks/useDashboard";
import { usePagamentos, useResumoFinanceiro } from "@/hooks/usePagamentos";
import { useCreditos } from "@/hooks/useCreditos";
import { formatCurrency } from "@/utils/formatters";
import { ClientesPorStatusChart } from "@/components/dashboard/ClientesPorStatusChart";
import { ReceitaPorServidorChart } from "@/components/dashboard/ReceitaPorServidorChart";
import { NovosClientesPorMesChart } from "@/components/dashboard/NovosClientesPorMesChart";
import { ProximosVencimentos } from "@/components/dashboard/ProximosVencimentos";
import { useAuth } from "@/contexts/AuthContext";

function inicioDoAno() {
  return `${new Date().getFullYear()}-01-01`;
}

export default function DashboardPage() {
  const { resumo, clientesPorStatus, receitaPorServidor, novosClientesPorMes, proximosVencimentos, loading } =
    useDashboard();
  const { profile } = useAuth();

  const filtrosPagamentos = useMemo(() => ({ dataInicio: inicioDoAno() }), []);
  const filtrosCreditos = useMemo(() => ({ tipo: "Compra", dataInicio: inicioDoAno() }), []);
  const { pagamentos, loading: loadingPagamentos } = usePagamentos(filtrosPagamentos);
  const { creditos, loading: loadingCreditos } = useCreditos(filtrosCreditos);
  const resumoFinanceiro = useResumoFinanceiro(pagamentos, creditos);
  const loadingFinanceiro = loadingPagamentos || loadingCreditos;

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile?.nome?.split(" ")[0] ?? ""}`}
        description="Acompanhe clientes, receitas e créditos de todos os servidores em tempo real."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de clientes"
          value={String(resumo?.clientes_total ?? 0)}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Clientes ativos"
          value={String(resumo?.clientes_ativos ?? 0)}
          icon={UserCheck}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Clientes vencidos"
          value={String(resumo?.clientes_vencidos ?? 0)}
          icon={UserX}
          tone="danger"
          loading={loading}
        />
        <StatCard
          title="Clientes vencendo"
          value={String(resumo?.clientes_vencendo ?? 0)}
          icon={Clock}
          tone="warning"
          loading={loading}
        />
        <StatCard
          title="Receita mensal"
          value={formatCurrency(resumo?.receita_mensal ?? 0)}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Receita total"
          value={formatCurrency(resumo?.receita_total ?? 0)}
          icon={TrendingUp}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Recebido no mês"
          value={formatCurrency(resumoFinanceiro.receitaMes)}
          icon={Receipt}
          tone="success"
          loading={loadingFinanceiro}
        />
        <StatCard
          title="Recebido no ano"
          value={formatCurrency(resumoFinanceiro.receitaAno)}
          icon={CalendarRange}
          loading={loadingFinanceiro}
        />
        <StatCard
          title="Lucro no mês"
          value={formatCurrency(resumoFinanceiro.lucroMes)}
          icon={resumoFinanceiro.lucroMes >= 0 ? TrendingUp : TrendingDown}
          tone={resumoFinanceiro.lucroMes >= 0 ? "success" : "danger"}
          loading={loadingFinanceiro}
        />
        <StatCard
          title="Créditos disponíveis"
          value={String(resumo?.creditos_disponiveis ?? 0)}
          icon={Coins}
          loading={loading}
        />
        <StatCard
          title="Novos clientes (mês)"
          value={String(resumo?.novos_clientes ?? 0)}
          icon={UserPlus}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReceitaPorServidorChart data={receitaPorServidor} />
        <ClientesPorStatusChart data={clientesPorStatus} />
        <NovosClientesPorMesChart data={novosClientesPorMes} />
        <ProximosVencimentos clientes={proximosVencimentos} />
      </div>
    </div>
  );
}
