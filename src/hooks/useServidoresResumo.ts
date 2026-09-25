import { useCallback, useEffect, useState } from "react";
import * as servidoresService from "@/services/servidoresService";
import type { ServidorResumo } from "@/types";

export function useServidoresResumo() {
  const [resumos, setResumos] = useState<ServidorResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await servidoresService.listarServidoresResumo();
      setResumos(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar resumo dos servidores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { resumos, loading, erro, recarregar: carregar };
}

export function useServidorResumo(id: string | undefined) {
  const [resumo, setResumo] = useState<ServidorResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await servidoresService.buscarServidorResumo(id);
      setResumo(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar resumo do servidor.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { resumo, loading, erro, recarregar: carregar };
}
