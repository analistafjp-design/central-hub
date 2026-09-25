import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Users, UserCheck, UserX, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ClienteFilters } from "@/components/clientes/ClienteFilters";
import { ClienteTable } from "@/components/clientes/ClienteTable";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ImportarClientesDialog } from "@/components/clientes/ImportarClientesDialog";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useServidorResumo } from "@/hooks/useServidoresResumo";
import { useClientes } from "@/hooks/useClientes";
import { useDebounce } from "@/hooks/useDebounce";
import { useRegistrarPagamento } from "@/hooks/useRegistrarPagamento";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import type { ClienteComServidor, Servidor } from "@/types";
import type { ClienteFormValues, PagamentoFormValues } from "@/lib/validations";

export default function ServidorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resumo, loading: loadingResumo, recarregar: recarregarResumo } = useServidorResumo(id);

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const buscaDebounced = useDebounce(busca, 300);

  const filtros = useMemo(
    () => ({ servidorId: id, busca: buscaDebounced || undefined, status: status || undefined }),
    [id, buscaDebounced, status],
  );

  const { clientes, loading, criar, atualizar, excluir, recarregar } = useClientes(filtros);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteComServidor | null>(null);
  const [clienteExcluindo, setClienteExcluindo] = useState<ClienteComServidor | null>(null);
  const [clientePagando, setClientePagando] = useState<ClienteComServidor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const { registrar, salvando: salvandoPagamento } = useRegistrarPagamento();

  const servidorParaForm: Servidor[] = useMemo(() => {
    if (!id || !resumo) return [];
    return [
      {
        id,
        nome: resumo.nome,
        plataforma: resumo.plataforma,
        ativo: resumo.ativo,
        observacoes: null,
        created_by: null,
        created_at: "",
        updated_at: "",
      },
    ];
  }, [id, resumo]);

  if (!id) return null;

  const abrirNovo = () => {
    setClienteEditando(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (cliente: ClienteComServidor) => {
    setClienteEditando(cliente);
    setDialogAberto(true);
  };

  const handleSubmit = async (values: ClienteFormValues) => {
    setSalvando(true);
    try {
      if (clienteEditando) {
        await atualizar(clienteEditando.id, values);
        toast.success("Cliente atualizado com sucesso.");
      } else {
        await criar({ ...values, servidor_id: id, created_by: user?.id });
        toast.success("Cliente cadastrado com sucesso.");
      }
      await recarregarResumo();
      setDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmitPagamento = async (values: PagamentoFormValues) => {
    if (!clientePagando) return;
    try {
      await registrar(values, clientePagando, user?.id);
      await Promise.all([recarregar(), recarregarResumo()]);
      toast.success("Pagamento registrado com sucesso.");
      setClientePagando(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    }
  };

  const handleExcluir = async () => {
    if (!clienteExcluindo) return;
    setExcluindo(true);
    try {
      await excluir(clienteExcluindo.id);
      toast.success("Cliente excluído com sucesso.");
      setClienteExcluindo(null);
      await recarregarResumo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => navigate("/servidores")}>
        <ArrowLeft className="h-4 w-4" />
        Servidores
      </Button>

      <PageHeader
        title={loadingResumo ? "Carregando..." : (resumo?.nome ?? "Servidor")}
        description={resumo ? `Plataforma ${resumo.plataforma}` : undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportarAberto(true)}>
              <Upload className="h-4 w-4" />
              Importar planilha
            </Button>
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </>
        }
      />

      {loadingResumo ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard title="Clientes" value={String(resumo?.clientes_total ?? 0)} icon={Users} />
          <StatCard title="Ativos" value={String(resumo?.clientes_ativos ?? 0)} icon={UserCheck} tone="success" />
          <StatCard title="Vencidos" value={String(resumo?.clientes_vencidos ?? 0)} icon={UserX} tone="danger" />
          <StatCard
            title="Receita mensal"
            value={formatCurrency(resumo?.receita_mensal ?? 0)}
            icon={Wallet}
          />
          <StatCard
            title="Créditos disponíveis"
            value={String(resumo?.creditos_disponiveis ?? 0)}
            icon={Coins}
          />
        </div>
      )}

      <div className="mt-6">
        <ClienteFilters
          busca={busca}
          onBuscaChange={setBusca}
          status={status}
          onStatusChange={setStatus}
          servidorId=""
          onServidorIdChange={() => {}}
          servidores={[]}
          hideServidorFilter
        />

        <ClienteTable
          clientes={clientes}
          loading={loading}
          onEdit={abrirEdicao}
          onDelete={setClienteExcluindo}
          onRegistrarPagamento={setClientePagando}
          hideServidorColumn
        />
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clienteEditando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={clienteEditando}
            servidores={servidorParaForm}
            servidorIdFixo={id}
            onSubmit={handleSubmit}
            onCancel={() => setDialogAberto(false)}
            submitting={salvando}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!clienteExcluindo}
        onOpenChange={(open) => !open && setClienteExcluindo(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${clienteExcluindo?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />

      <ImportarClientesDialog
        open={importarAberto}
        onOpenChange={setImportarAberto}
        servidores={servidorParaForm}
        servidorIdFixo={id}
        onImportado={async () => {
          await recarregar();
          await recarregarResumo();
        }}
      />

      <Dialog open={!!clientePagando} onOpenChange={(open) => !open && setClientePagando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          {clientePagando && (
            <PagamentoForm
              clientes={clientes}
              clienteFixo={clientePagando}
              onSubmit={handleSubmitPagamento}
              onCancel={() => setClientePagando(null)}
              submitting={salvandoPagamento}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
