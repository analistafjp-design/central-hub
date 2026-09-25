import { useCallback, useEffect, useState } from "react";
import * as servidoresService from "@/services/servidoresService";
import type { Servidor, ServidorFiltros, ServidorInsert, ServidorUpdate } from "@/types";

export function useServidores(filtros: ServidorFiltros = {}) {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await servidoresService.listarServidores(filtros);
      setServidores(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar servidores.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = async (payload: ServidorInsert) => {
    const novo = await servidoresService.criarServidor(payload);
    await carregar();
    return novo;
  };

  const atualizar = async (id: string, payload: ServidorUpdate) => {
    const atualizado = await servidoresService.atualizarServidor(id, payload);
    await carregar();
    return atualizado;
  };

  const excluir = async (id: string) => {
    await servidoresService.excluirServidor(id);
    await carregar();
  };

  return { servidores, loading, erro, recarregar: carregar, criar, atualizar, excluir };
}
