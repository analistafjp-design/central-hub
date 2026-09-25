import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { pagamentoSchema, type PagamentoFormValues } from "@/lib/validations";
import { formatCurrency } from "@/utils/formatters";
import { calcularNovaExpiracao } from "@/utils/status";
import type { ClienteComServidor } from "@/types";

interface PagamentoFormProps {
  clientes: ClienteComServidor[];
  clienteFixo?: ClienteComServidor;
  onSubmit: (values: PagamentoFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/** Valor sugerido: mensalidade do cliente x meses ativados; sem mensalidade
 * cadastrada, usa R$30/mês como referência mínima da operação. */
function sugerirValor(cliente: ClienteComServidor | undefined, meses: number): number {
  const base = cliente && cliente.valor_mensal > 0 ? cliente.valor_mensal : 30;
  return Math.round(base * meses * 100) / 100;
}

export function PagamentoForm({ clientes, clienteFixo, onSubmit, onCancel, submitting }: PagamentoFormProps) {
  const [valorEditadoManualmente, setValorEditadoManualmente] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      cliente_id: clienteFixo?.id ?? "",
      valor: sugerirValor(clienteFixo, 1),
      meses: 1,
      data_pagamento: hoje(),
      observacoes: "",
      renovarCliente: true,
    },
  });

  const clienteId = watch("cliente_id");
  const meses = watch("meses");
  const renovarCliente = watch("renovarCliente");

  const clienteSelecionado = clienteFixo ?? clientes.find((c) => c.id === clienteId);

  useEffect(() => {
    if (!valorEditadoManualmente && clienteSelecionado && meses > 0) {
      setValue("valor", sugerirValor(clienteSelecionado, meses));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSelecionado?.id, meses, valorEditadoManualmente]);

  const novaExpiracao =
    clienteSelecionado && meses > 0 ? calcularNovaExpiracao(clienteSelecionado.data_expiracao, meses) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {clienteFixo ? (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{clienteFixo.nome}</p>
          <p className="text-xs text-muted-foreground">{clienteFixo.servidor?.nome ?? "-"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select value={clienteId} onValueChange={(v) => setValue("cliente_id", v)}>
            <SelectTrigger id="cliente_id">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} {c.servidor?.nome ? `— ${c.servidor.nome}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meses">Meses ativados *</Label>
          <Input
            id="meses"
            type="number"
            min="1"
            step="1"
            {...register("meses", { valueAsNumber: true })}
          />
          {errors.meses && <p className="text-sm text-destructive">{errors.meses.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor pago (R$) *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            {...register("valor", {
              valueAsNumber: true,
              onChange: () => setValorEditadoManualmente(true),
            })}
          />
          {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
          {clienteSelecionado && (
            <p className="text-xs text-muted-foreground">
              Sugestão: {formatCurrency(sugerirValor(clienteSelecionado, meses || 1))} ({meses || 1}{" "}
              {meses === 1 ? "mês" : "meses"} × {formatCurrency(clienteSelecionado.valor_mensal || 30)})
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="data_pagamento">Data do pagamento *</Label>
          <Input id="data_pagamento" type="date" {...register("data_pagamento")} />
          {errors.data_pagamento && (
            <p className="text-sm text-destructive">{errors.data_pagamento.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" placeholder="Ex: pagamento via Pix" {...register("observacoes")} />
      </div>

      <div className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5">
        <div>
          <Label htmlFor="renovarCliente" className="cursor-pointer">
            Renovar assinatura do cliente
          </Label>
          <p className="text-xs text-muted-foreground">
            {clienteSelecionado && renovarCliente && novaExpiracao
              ? `Estende a expiração para ${new Date(`${novaExpiracao}T00:00:00`).toLocaleDateString("pt-BR")} e marca como Ativo.`
              : "Atualiza a data de expiração e o status do cliente automaticamente."}
          </p>
        </div>
        <Switch id="renovarCliente" checked={renovarCliente} onCheckedChange={(v) => setValue("renovarCliente", v)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar pagamento
        </Button>
      </DialogFooter>
    </form>
  );
}
