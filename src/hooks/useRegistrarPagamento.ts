import { useState } from "react";
import * as pagamentosService from "@/services/pagamentosService";
import * as clientesService from "@/services/clientesService";
import * as creditosService from "@/services/creditosService";
import { calcularNovaExpiracao } from "@/utils/status";
import type { PagamentoFormValues } from "@/lib/validations";
import type { ClienteComServidor } from "@/types";

/** Registra um pagamento e, opcionalmente, estende a expiração do cliente
 * (renovação) — usado tanto na tela Financeiro quanto na ação rápida de
 * "Registrar pagamento" a partir da linha de um cliente. Toda renovação
 * também debita créditos do servidor (1 crédito por mês ativado), já que
 * cada mês de acesso do cliente consome um crédito comprado do provedor. */
export function useRegistrarPagamento() {
  const [salvando, setSalvando] = useState(false);

  const registrar = async (
    values: PagamentoFormValues,
    cliente: ClienteComServidor,
    createdBy: string | undefined,
  ) => {
    setSalvando(true);
    try {
      await pagamentosService.criarPagamento({
        cliente_id: cliente.id,
        servidor_id: cliente.servidor_id,
        valor: values.valor,
        meses: values.meses,
        data_pagamento: values.data_pagamento,
        observacoes: values.observacoes || null,
        created_by: createdBy,
      });

      if (values.renovarCliente) {
        await clientesService.atualizarCliente(cliente.id, {
          data_expiracao: calcularNovaExpiracao(cliente.data_expiracao, values.meses),
          status: "Ativo",
        });

        await creditosService.criarCredito({
          servidor_id: cliente.servidor_id,
          tipo: "Uso",
          quantidade: values.meses,
          cliente_id: cliente.id,
          data: values.data_pagamento,
          observacoes: `Renovação de ${cliente.nome}`,
          created_by: createdBy,
        });
      }
    } finally {
      setSalvando(false);
    }
  };

  return { registrar, salvando };
}
