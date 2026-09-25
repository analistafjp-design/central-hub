import { useEffect, useState } from "react";
import * as dashboardService from "@/services/dashboardService";
import type { DashboardResumo, ClienteComServidor } from "@/types";
import type {
  ClientePorStatus,
  ReceitaPorServidor,
  NovosClientesPorMes,
} from "@/services/dashboardService";

interface DashboardData {
  resumo: DashboardResumo | null;
  clientesPorStatus: ClientePorStatus[];
  receitaPorServidor: ReceitaPorServidor[];
  novosClientesPorMes: NovosClientesPorMes[];
  proximosVencimentos: ClienteComServidor[];
}

export function useDashboard() {
  const [dados, setDados] = useState<DashboardData>({
    resumo: null,
    clientesPorStatus: [],
    receitaPorServidor: [],
    novosClientesPorMes: [],
    proximosVencimentos: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      // Promise.allSettled: uma consulta que falhar não deve apagar as
      // demais que já tiverem carregado com sucesso — o dashboard mostra
      // o que conseguiu buscar em vez de ficar todo em branco.
      const [resumo, clientesPorStatus, receitaPorServidor, novosClientesPorMes, proximosVencimentos] =
        await Promise.allSettled([
          dashboardService.buscarResumoDashboard(),
          dashboardService.buscarClientesPorStatus(),
          dashboardService.buscarReceitaPorServidor(),
          dashboardService.buscarNovosClientesPorMes(),
          dashboardService.buscarProximosVencimentos(),
        ]);

      if (!mounted) return;

      const falhas = [
        resumo,
        clientesPorStatus,
        receitaPorServidor,
        novosClientesPorMes,
        proximosVencimentos,
      ].filter((r): r is PromiseRejectedResult => r.status === "rejected");
      if (falhas.length > 0) {
        // eslint-disable-next-line no-console
        console.error("Erro ao carregar parte do dashboard:", falhas.map((f) => f.reason));
        setErro("Alguns dados do dashboard não puderam ser carregados.");
      }

      setDados({
        resumo: resumo.status === "fulfilled" ? resumo.value : null,
        clientesPorStatus: clientesPorStatus.status === "fulfilled" ? clientesPorStatus.value : [],
        receitaPorServidor:
          receitaPorServidor.status === "fulfilled" ? receitaPorServidor.value : [],
        novosClientesPorMes:
          novosClientesPorMes.status === "fulfilled" ? novosClientesPorMes.value : [],
        proximosVencimentos:
          proximosVencimentos.status === "fulfilled" ? proximosVencimentos.value : [],
      });
      setLoading(false);
    }

    carregar();
    return () => {
      mounted = false;
    };
  }, []);

  return { ...dados, loading, erro };
}
