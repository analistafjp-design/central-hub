import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVencimentoInfo, type UrgenciaVencimento } from "@/utils/status";

const CORES: Record<UrgenciaVencimento, string> = {
  vencido: "bg-red-100 text-red-800 border-red-300",
  critico: "bg-orange-100 text-orange-800 border-orange-300",
  atencao: "bg-amber-100 text-amber-800 border-amber-300",
};

interface VencimentoBadgeProps {
  dataExpiracao: string | null | undefined;
  status: string | null | undefined;
  className?: string;
}

export function VencimentoBadge({ dataExpiracao, status, className }: VencimentoBadgeProps) {
  const info = getVencimentoInfo(dataExpiracao, status);
  if (!info) return null;

  return (
    <Badge variant="outline" className={cn("font-medium", CORES[info.nivel], className)}>
      {info.label}
    </Badge>
  );
}
