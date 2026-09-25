import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ClienteFilters } from "@/components/clientes/ClienteFilters";
import { ClienteTable } from "@/components/clientes/ClienteTable";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ImportarClientesDialog } from "@/components/clientes/ImportarClientesDialog";
import { useClientes } from "@/hooks/useClientes";
import { useServidores } from "@/hooks/useServidores";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import type { ClienteComServidor } from "@/types";
import type { ClienteFormValues } from "@/lib/validations";

export default function ClientesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [status, setStatus] = useState("");
  const [servidorId, setServidorId] = useState("");
  const buscaDebounced = useDebounce(busca, 300);

  const filtros = useMemo(
    () => ({
      busca: buscaDebounced || undefined,
      status: status || undefined,
      servidorId: servidorId || undefined,
    }),
    [buscaDebounced, status, servidorId],
  );

  const { clientes, loading, criar, atualizar, excluir, recarregar } = useClientes(filtros);
  const { servidores } = useServidores();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteComServidor | null>(null);
  const [clienteExcluindo, setClienteExcluindo] = useState<ClienteComServidor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

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
        await criar({ ...values, created_by: user?.id });
        toast.success("Cliente cadastrado com sucesso.");
      }
      setDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!clienteExcluindo) return;
    setExcluindo(true);
    try {
      await excluir(clienteExcluindo.id);
      toast.success("Cliente excluído com sucesso.");
      setClienteExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes cadastrados em todos os servidores."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setImportarAberto(true)}
              disabled={servidores.length === 0}
            >
              <Upload className="h-4 w-4" />
              Importar planilha
            </Button>
            <Button onClick={abrirNovo} disabled={servidores.length === 0}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </>
        }
      />

      <ClienteFilters
        busca={busca}
        onBuscaChange={setBusca}
        status={status}
        onStatusChange={setStatus}
        servidorId={servidorId}
        onServidorIdChange={setServidorId}
        servidores={servidores}
      />

      <ClienteTable
        clientes={clientes}
        loading={loading}
        onEdit={abrirEdicao}
        onDelete={setClienteExcluindo}
      />

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clienteEditando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={clienteEditando}
            servidores={servidores}
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
        servidores={servidores}
        onImportado={recarregar}
      />
    </div>
  );
}
