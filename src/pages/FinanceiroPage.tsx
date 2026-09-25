import { useMemo, useState } from "react";
import { Plus, Wallet, Receipt, TrendingUp, CalendarRange } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PagamentoTable } from "@/components/pagamentos/PagamentoTable";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagamentos, useResumoFinanceiro } from "@/hooks/usePagamentos";
import { useClientes } from "@/hooks/useClientes";
import { useServidores } from "@/hooks/useServidores";
import { useRegistrarPagamento } from "@/hooks/useRegistrarPagamento";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import type { PagamentoComRelacoes } from "@/types";
import type { PagamentoFormValues } from "@/lib/validations";

function inicioDoAno() {
  return `${new Date().getFullYear()}-01-01`;
}

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [servidorId, setServidorId] = useState("");

  const filtros = useMemo(
    () => ({ servidorId: servidorId || undefined, dataInicio: inicioDoAno() }),
    [servidorId],
  );

  const { pagamentos, loading, recarregar, excluir } = usePagamentos(filtros);
  const resumo = useResumoFinanceiro(pagamentos);
  const { servidores } = useServidores();
  const { clientes, recarregar: recarregarClientes } = useClientes();
  const { registrar, salvando } = useRegistrarPagamento();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [pagamentoExcluindo, setPagamentoExcluindo] = useState<PagamentoComRelacoes | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const handleSubmit = async (values: PagamentoFormValues) => {
    const cliente = clientes.find((c) => c.id === values.cliente_id);
    if (!cliente) {
      toast.error("Selecione um cliente válido.");
      return;
    }
    try {
      await registrar(values, cliente, user?.id);
      await Promise.all([recarregar(), recarregarClientes()]);
      toast.success("Pagamento registrado com sucesso.");
      setDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    }
  };

  const handleExcluir = async () => {
    if (!pagamentoExcluindo) return;
    setExcluindo(true);
    try {
      await excluir(pagamentoExcluindo.id);
      toast.success("Pagamento excluído com sucesso.");
      setPagamentoExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir pagamento.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Registre pagamentos e acompanhe a receita recebida por renovações."
        actions={
          <Button onClick={() => setDialogAberto(true)} disabled={clientes.length === 0}>
            <Plus className="h-4 w-4" />
            Registrar pagamento
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Receita do mês" value={formatCurrency(resumo.receitaMes)} icon={Wallet} tone="success" />
        <StatCard title="Pagamentos no mês" value={String(resumo.pagamentosMes)} icon={Receipt} />
        <StatCard title="Ticket médio (mês)" value={formatCurrency(resumo.ticketMedioMes)} icon={TrendingUp} />
        <StatCard title="Receita do ano" value={formatCurrency(resumo.receitaAno)} icon={CalendarRange} />
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <Select value={servidorId || "todos"} onValueChange={(v) => setServidorId(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Todos os servidores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os servidores</SelectItem>
              {servidores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PagamentoTable pagamentos={pagamentos} loading={loading} onDelete={setPagamentoExcluindo} />
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <PagamentoForm
            clientes={clientes}
            onSubmit={handleSubmit}
            onCancel={() => setDialogAberto(false)}
            submitting={salvando}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pagamentoExcluindo}
        onOpenChange={(open) => !open && setPagamentoExcluindo(null)}
        title="Excluir pagamento"
        description="Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita e não reverte a renovação do cliente, se houve uma."
        confirmLabel="Excluir"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </div>
  );
}
