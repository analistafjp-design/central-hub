import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { daysUntil } from "@/utils/status";
import type { ClienteComServidor } from "@/types";

export function ProximosVencimentos({ clientes }: { clientes: ClienteComServidor[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos vencimentos</CardTitle>
      </CardHeader>
      <CardContent>
        {clientes.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nenhum vencimento próximo"
            description="Nenhum cliente ativo vence nos próximos dias."
          />
        ) : (
          <ul className="divide-y divide-border">
            {clientes.map((cliente) => {
              const dias = daysUntil(cliente.data_expiracao);
              return (
                <li key={cliente.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/clientes?busca=${encodeURIComponent(cliente.nome)}`}
                      className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {cliente.nome}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {cliente.servidor?.nome ?? "-"} · {formatCurrency(cliente.valor_mensal)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(cliente.data_expiracao)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dias === 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `em ${dias} dias`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
