import { useMemo, useState } from "react";
import { Plus, Wallet, Receipt, TrendingUp, TrendingDown, ShoppingCart, PiggyBank } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagamentoTable } from "@/components/pagamentos/PagamentoTable";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { CreditoTable } from "@/components/creditos/CreditoTable";
import { CreditoForm } from "@/components/creditos/CreditoForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagamentos, useResumoFinanceiro } from "@/hooks/usePagamentos";
import { useCreditos } from "@/hooks/useCreditos";
import { useClientes } from "@/hooks/useClientes";
import { useServidores } from "@/hooks/useServidores";
import { useRegistrarPagamento } from "@/hooks/useRegistrarPagamento";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import type { PagamentoComRelacoes, CreditoComServidor } from "@/types";
import type { PagamentoFormValues, CreditoFormValues } from "@/lib/validations";

function inicioDoAno() {
  return `${new Date().getFullYear()}-01-01`;
}

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [servidorId, setServidorId] = useState("");

  const filtrosPagamentos = useMemo(
    () => ({ servidorId: servidorId || undefined, dataInicio: inicioDoAno() }),
    [servidorId],
  );
  const filtrosCreditos = useMemo(
    () => ({ servidorId: servidorId || undefined, tipo: "Compra", dataInicio: inicioDoAno() }),
    [servidorId],
  );

  const { pagamentos, loading: loadingPagamentos, recarregar: recarregarPagamentos, excluir: excluirPagamento } =
    usePagamentos(filtrosPagamentos);
  const { creditos, loading: loadingCreditos, criar: criarCredito, excluir: excluirCredito } =
    useCreditos(filtrosCreditos);
  const resumo = useResumoFinanceiro(pagamentos, creditos);
  const { servidores } = useServidores();
  const { clientes, recarregar: recarregarClientes } = useClientes();
  const { registrar, salvando } = useRegistrarPagamento();

  const [dialogPagamentoAberto, setDialogPagamentoAberto] = useState(false);
  const [dialogGastoAberto, setDialogGastoAberto] = useState(false);
  const [pagamentoExcluindo, setPagamentoExcluindo] = useState<PagamentoComRelacoes | null>(null);
  const [gastoExcluindo, setGastoExcluindo] = useState<CreditoComServidor | null>(null);
  const [excluindoPagamento, setExcluindoPagamento] = useState(false);
  const [excluindoGasto, setExcluindoGasto] = useState(false);
  const [salvandoGasto, setSalvandoGasto] = useState(false);

  const handleSubmitPagamento = async (values: PagamentoFormValues) => {
    const cliente = clientes.find((c) => c.id === values.cliente_id);
    if (!cliente) {
      toast.error("Selecione um cliente válido.");
      return;
    }
    try {
      await registrar(values, cliente, user?.id);
      await Promise.all([recarregarPagamentos(), recarregarClientes()]);
      toast.success("Pagamento registrado com sucesso.");
      setDialogPagamentoAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    }
  };

  const handleExcluirPagamento = async () => {
    if (!pagamentoExcluindo) return;
    setExcluindoPagamento(true);
    try {
      await excluirPagamento(pagamentoExcluindo.id);
      toast.success("Pagamento excluído com sucesso.");
      setPagamentoExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir pagamento.");
    } finally {
      setExcluindoPagamento(false);
    }
  };

  const handleSubmitGasto = async (values: CreditoFormValues) => {
    setSalvandoGasto(true);
    try {
      await criarCredito({ ...values, tipo: "Compra", created_by: user?.id });
      toast.success("Gasto registrado com sucesso.");
      setDialogGastoAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar gasto.");
    } finally {
      setSalvandoGasto(false);
    }
  };

  const handleExcluirGasto = async () => {
    if (!gastoExcluindo) return;
    setExcluindoGasto(true);
    try {
      await excluirCredito(gastoExcluindo.id);
      toast.success("Gasto excluído com sucesso.");
      setGastoExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir gasto.");
    } finally {
      setExcluindoGasto(false);
    }
  };

  const lucroMesPositivo = resumo.lucroMes >= 0;

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receitas de renovações, gastos com créditos e o lucro entre os dois."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita do mês" value={formatCurrency(resumo.receitaMes)} icon={Wallet} tone="success" />
        <StatCard title="Gastos do mês" value={formatCurrency(resumo.gastosMes)} icon={ShoppingCart} tone="danger" />
        <StatCard
          title="Lucro do mês"
          value={formatCurrency(resumo.lucroMes)}
          icon={lucroMesPositivo ? TrendingUp : TrendingDown}
          tone={lucroMesPositivo ? "success" : "danger"}
        />
        <StatCard title="Lucro do ano" value={formatCurrency(resumo.lucroAno)} icon={PiggyBank} />
      </div>

      <div className="mt-6">
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

        <Tabs defaultValue="receitas" className="mt-4">
          <TabsList>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
          </TabsList>

          <TabsContent value="receitas">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                <StatCard title="Pagamentos no mês" value={String(resumo.pagamentosMes)} icon={Receipt} />
                <StatCard title="Ticket médio (mês)" value={formatCurrency(resumo.ticketMedioMes)} icon={TrendingUp} />
              </div>
              <Button onClick={() => setDialogPagamentoAberto(true)} disabled={clientes.length === 0}>
                <Plus className="h-4 w-4" />
                Registrar pagamento
              </Button>
            </div>
            <PagamentoTable pagamentos={pagamentos} loading={loadingPagamentos} onDelete={setPagamentoExcluindo} />
          </TabsContent>

          <TabsContent value="gastos">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setDialogGastoAberto(true)} disabled={servidores.length === 0}>
                <Plus className="h-4 w-4" />
                Registrar gasto
              </Button>
            </div>
            <CreditoTable creditos={creditos} loading={loadingCreditos} onDelete={setGastoExcluindo} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogPagamentoAberto} onOpenChange={setDialogPagamentoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <PagamentoForm
            clientes={clientes}
            onSubmit={handleSubmitPagamento}
            onCancel={() => setDialogPagamentoAberto(false)}
            submitting={salvando}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogGastoAberto} onOpenChange={setDialogGastoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar gasto (compra de créditos)</DialogTitle>
          </DialogHeader>
          <CreditoForm
            servidores={servidores}
            onSubmit={handleSubmitGasto}
            onCancel={() => setDialogGastoAberto(false)}
            submitting={salvandoGasto}
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
        loading={excluindoPagamento}
        onConfirm={handleExcluirPagamento}
      />

      <ConfirmDialog
        open={!!gastoExcluindo}
        onOpenChange={(open) => !open && setGastoExcluindo(null)}
        title="Excluir gasto"
        description="Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={excluindoGasto}
        onConfirm={handleExcluirGasto}
      />
    </div>
  );
}
