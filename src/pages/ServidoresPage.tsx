import { useState } from "react";
import { Plus, Server } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ServidorCard } from "@/components/servidores/ServidorCard";
import { ServidorForm } from "@/components/servidores/ServidorForm";
import { useServidores } from "@/hooks/useServidores";
import { useServidoresResumo } from "@/hooks/useServidoresResumo";
import { useAuth } from "@/contexts/AuthContext";
import type { Servidor } from "@/types";
import type { ServidorFormValues } from "@/lib/validations";

export default function ServidoresPage() {
  const { user } = useAuth();
  const { servidores, loading, criar, atualizar, excluir } = useServidores();
  const { resumos, recarregar: recarregarResumos } = useServidoresResumo();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [servidorEditando, setServidorEditando] = useState<Servidor | null>(null);
  const [servidorExcluindo, setServidorExcluindo] = useState<Servidor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const abrirNovo = () => {
    setServidorEditando(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (servidor: Servidor) => {
    setServidorEditando(servidor);
    setDialogAberto(true);
  };

  const handleSubmit = async (values: ServidorFormValues) => {
    setSalvando(true);
    try {
      if (servidorEditando) {
        await atualizar(servidorEditando.id, values);
        toast.success("Servidor atualizado com sucesso.");
      } else {
        await criar({ ...values, created_by: user?.id });
        toast.success("Servidor cadastrado com sucesso.");
      }
      await recarregarResumos();
      setDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!servidorExcluindo) return;
    setExcluindo(true);
    try {
      await excluir(servidorExcluindo.id);
      toast.success("Servidor excluído com sucesso.");
      setServidorExcluindo(null);
      await recarregarResumos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir servidor.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Servidores"
        description="Gerencie os servidores/plataformas e acompanhe o dashboard de cada um."
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Novo servidor
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : servidores.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Nenhum servidor cadastrado"
          description="Cadastre o primeiro servidor para começar a gerenciar clientes e créditos."
          action={
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4" />
              Novo servidor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servidores.map((servidor) => (
            <ServidorCard
              key={servidor.id}
              servidor={servidor}
              resumo={resumos.find((r) => r.servidor_id === servidor.id)}
              onEdit={abrirEdicao}
              onDelete={setServidorExcluindo}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{servidorEditando ? "Editar servidor" : "Novo servidor"}</DialogTitle>
          </DialogHeader>
          <ServidorForm
            servidor={servidorEditando}
            onSubmit={handleSubmit}
            onCancel={() => setDialogAberto(false)}
            submitting={salvando}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!servidorExcluindo}
        onOpenChange={(open) => !open && setServidorExcluindo(null)}
        title="Excluir servidor"
        description={`Tem certeza que deseja excluir "${servidorExcluindo?.nome}"? Servidores com clientes vinculados não podem ser excluídos.`}
        confirmLabel="Excluir"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </div>
  );
}
