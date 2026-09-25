import { useCallback, useEffect, useMemo, useState } from "react";
import * as pagamentosService from "@/services/pagamentosService";
import type { PagamentoComRelacoes, PagamentoFiltros, PagamentoInsert, PagamentoUpdate } from "@/types";

export function usePagamentos(filtros: PagamentoFiltros = {}) {
  const [pagamentos, setPagamentos] = useState<PagamentoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await pagamentosService.listarPagamentos(filtros);
      setPagamentos(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar pagamentos.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = async (payload: PagamentoInsert) => {
    const novo = await pagamentosService.criarPagamento(payload);
    await carregar();
    return novo;
  };

  const atualizar = async (id: string, payload: PagamentoUpdate) => {
    const atualizado = await pagamentosService.atualizarPagamento(id, payload);
    await carregar();
    return atualizado;
  };

  const excluir = async (id: string) => {
    await pagamentosService.excluirPagamento(id);
    await carregar();
  };

  return { pagamentos, loading, erro, recarregar: carregar, criar, atualizar, excluir };
}

export interface ResumoFinanceiro {
  receitaMes: number;
  pagamentosMes: number;
  ticketMedioMes: number;
  receitaAno: number;
}

export function useResumoFinanceiro(pagamentos: PagamentoComRelacoes[]): ResumoFinanceiro {
  return useMemo(() => {
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth();

    let receitaMes = 0;
    let pagamentosMes = 0;
    let receitaAno = 0;

    for (const p of pagamentos) {
      const data = new Date(`${p.data_pagamento}T00:00:00`);
      if (data.getFullYear() !== anoAtual) continue;
      receitaAno += Number(p.valor);
      if (data.getMonth() === mesAtual) {
        receitaMes += Number(p.valor);
        pagamentosMes += 1;
      }
    }

    return {
      receitaMes,
      pagamentosMes,
      ticketMedioMes: pagamentosMes > 0 ? receitaMes / pagamentosMes : 0,
      receitaAno,
    };
  }, [pagamentos]);
}
