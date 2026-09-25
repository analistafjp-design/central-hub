import { useCallback, useEffect, useState } from "react";
import * as creditosService from "@/services/creditosService";
import type { CreditoComServidor, CreditoFiltros, CreditoInsert } from "@/types";

export function useCreditos(filtros: CreditoFiltros = {}) {
  const [creditos, setCreditos] = useState<CreditoComServidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await creditosService.listarCreditos(filtros);
      setCreditos(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar gastos.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = async (payload: CreditoInsert) => {
    const novo = await creditosService.criarCredito(payload);
    await carregar();
    return novo;
  };

  const excluir = async (id: string) => {
    await creditosService.excluirCredito(id);
    await carregar();
  };

  return { creditos, loading, erro, recarregar: carregar, criar, excluir };
}
