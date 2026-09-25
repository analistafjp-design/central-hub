import { useCallback, useEffect, useMemo, useState } from "react";
import * as clientesService from "@/services/clientesService";
import { getVencimentoInfo } from "@/utils/status";
import type { ClienteComServidor } from "@/types";

export function useAlertas() {
  const [clientes, setClientes] = useState<ClienteComServidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await clientesService.listarClientesParaAlertas();
      setClientes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
    return { vencidos, criticos, atencao, total: clientes.length, urgentes: vencidos + criticos };
  }, [clientes]);

  return { clientes, loading, erro, recarregar: carregar, contagem };
}
