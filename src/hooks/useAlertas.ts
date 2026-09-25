import { useCallback, useEffect, useMemo, useState } from "react";
import * as clientesService from "@/services/clientesService";
import * as servidoresService from "@/services/servidoresService";
import { CREDITOS_ALERTA_MINIMO } from "@/lib/constants";
import { getVencimentoInfo } from "@/utils/status";
import type { ClienteComServidor, ServidorResumo } from "@/types";

export function useAlertas() {
  const [clientes, setClientes] = useState<ClienteComServidor[]>([]);
  const [servidoresResumo, setServidoresResumo] = useState<ServidorResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [dadosClientes, dadosServidores] = await Promise.all([
        clientesService.listarClientesParaAlertas(),
        servidoresService.listarServidoresResumo(),
      ]);
      setClientes(dadosClientes);
      setServidoresResumo(dadosServidores);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const servidoresCreditosBaixos = useMemo(
    () => servidoresResumo.filter((s) => s.ativo && s.creditos_disponiveis < CREDITOS_ALERTA_MINIMO),
    [servidoresResumo],
  );

  const contagem = useMemo(() => {
    let vencidos = 0;
    let criticos = 0;
    let atencao = 0;
    for (const cliente of clientes) {
      const info = getVencimentoInfo(cliente.data_expiracao, cliente.status);
      if (cliente.status === "Vencido" || info?.nivel === "vencido") vencidos += 1;
      else if (info?.nivel === "critico") criticos += 1;
      else if (info?.nivel === "atencao") atencao += 1;
    }
    const creditosBaixos = servidoresCreditosBaixos.length;
    return {
      vencidos,
      criticos,
      atencao,
      total: clientes.length,
      creditosBaixos,
      urgentes: vencidos + criticos + creditosBaixos,
    };
  }, [clientes, servidoresCreditosBaixos]);

  return { clientes, servidoresCreditosBaixos, loading, erro, recarregar: carregar, contagem };
}
