import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CLIENTE_STATUS_COLORS, type ClienteStatusConst } from "@/lib/constants";

export function ClienteStatusBadge({ status }: { status: ClienteStatusConst | string }) {
  const cor = CLIENTE_STATUS_COLORS[status as ClienteStatusConst] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cor)}>
      {status}
    </Badge>
  );
}

const ALERTA_STATUS_COLORS: Record<string, string> = {
  Pendente: "bg-amber-100 text-amber-800 border-amber-300",
  Enviado: "bg-blue-100 text-blue-800 border-blue-300",
  Resolvido: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function AlertaStatusBadge({ status }: { status: string }) {
  const cor = ALERTA_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cor)}>
      {status}
    </Badge>
  );
}
