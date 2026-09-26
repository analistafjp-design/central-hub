import { useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Wallet, Phone, Coins, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VencimentoBadge } from "@/components/shared/VencimentoBadge";
import { PagamentoForm } from "@/components/pagamentos/PagamentoForm";
import { useAlertas } from "@/hooks/useAlertas";
import { useClientes } from "@/hooks/useClientes";
import { useRegistrarPagamento } from "@/hooks/useRegistrarPagamento";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { getVencimentoInfo } from "@/utils/status";
import { montarLinkWhatsApp, montarMensagemLembrete } from "@/utils/whatsapp";
import type { ClienteComServidor } from "@/types";
import type { PagamentoFormValues } from "@/lib/validations";

const BORDA_URGENCIA: Record<string, string> = {
  vencido: "border-l-red-500",
  critico: "border-l-orange-500",
  atencao: "border-l-amber-500",
};

export default function AlertasPage() {
  const { user } = useAuth();
  const { clientes, servidoresCreditosBaixos, loading, recarregar, contagem } = useAlertas();
  const { clientes: todosClientes } = useClientes();
  const { registrar, salvando } = useRegistrarPagamento();
  const [clientePagando, setClientePagando] = useState<ClienteComServidor | null>(null);

  const handleSubmitPagamento = async (values: PagamentoFormValues) => {
    if (!clientePagando) return;
    try {
      await registrar(values, clientePagando, user?.id);
      await recarregar();
      toast.success("Pagamento registrado com sucesso.");
      setClientePagando(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Clientes vencidos ou prestes a vencer, do mais urgente para o menos urgente."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vencidos" value={String(contagem.vencidos)} icon={BellRing} tone="danger" loading={loading} />
        <StatCard
          title="Vence em até 3 dias"
          value={String(contagem.criticos)}
          icon={BellRing}
          tone="warning"
          loading={loading}
        />
        <StatCard
          title="Vence em até 7 dias"
          value={String(contagem.atencao)}
          icon={BellRing}
          loading={loading}
        />
        <StatCard
          title="Créditos baixos"
          value={String(contagem.creditosBaixos)}
          icon={Coins}
          tone={contagem.creditosBaixos > 0 ? "warning" : undefined}
          loading={loading}
        />
      </div>

      {!loading && servidoresCreditosBaixos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Servidores com poucos créditos</h2>
          <ul className="space-y-3">
            {servidoresCreditosBaixos.map((servidor) => (
              <li
                key={servidor.servidor_id}
                className="flex flex-col gap-3 rounded-lg border border-l-4 border-l-orange-500 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{servidor.nome}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Restam apenas <strong className="text-orange-600">{servidor.creditos_disponiveis}</strong>{" "}
                    {servidor.creditos_disponiveis === 1 ? "crédito" : "créditos"} — considere comprar mais.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" asChild>
                  <Link to="/financeiro">
                    <Coins className="h-4 w-4" />
                    Registrar compra de créditos
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="Nenhum alerta no momento"
            description="Nenhum cliente vencido ou vencendo nos próximos dias."
          />
        ) : (
          <ul className="space-y-3">
            {clientes.map((cliente) => {
              const info = getVencimentoInfo(cliente.data_expiracao, cliente.status);
              const nivel = cliente.status === "Vencido" ? "vencido" : (info?.nivel ?? "vencido");
              return (
                <li
                  key={cliente.id}
                  className={`flex flex-col gap-3 rounded-lg border border-l-4 bg-white p-4 sm:flex-row sm:items-center sm:justify-between ${BORDA_URGENCIA[nivel]}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/clientes?busca=${encodeURIComponent(cliente.nome)}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {cliente.nome}
                      </Link>
                      <VencimentoBadge dataExpiracao={cliente.data_expiracao} status={cliente.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cliente.servidor?.nome ?? "-"} · Venceu/vence em {formatDate(cliente.data_expiracao)} ·{" "}
                      {formatCurrency(cliente.valor_mensal)}
                    </p>
                    {cliente.telefone && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {cliente.telefone}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {cliente.telefone && (
                      <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" asChild>
                        <a
                          href={montarLinkWhatsApp(cliente.telefone, montarMensagemLembrete(cliente)) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Avisar no WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setClientePagando(cliente)}>
                      <Wallet className="h-4 w-4" />
                      Registrar pagamento
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!clientePagando} onOpenChange={(open) => !open && setClientePagando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          {clientePagando && (
            <PagamentoForm
              clientes={todosClientes}
              clienteFixo={clientePagando}
              onSubmit={handleSubmitPagamento}
              onCancel={() => setClientePagando(null)}
              submitting={salvando}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
