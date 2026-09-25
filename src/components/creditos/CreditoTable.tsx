import { MoreVertical, Trash2, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { CreditoComServidor } from "@/types";

interface CreditoTableProps {
  creditos: CreditoComServidor[];
  loading: boolean;
  onDelete: (credito: CreditoComServidor) => void;
}

export function CreditoTable({ creditos, loading, onDelete }: CreditoTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (creditos.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nenhum gasto registrado"
        description="Registre a compra de créditos para descontar da sua receita."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Servidor</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="hidden lg:table-cell">Observações</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {creditos.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{formatDate(c.data)}</TableCell>
              <TableCell className="font-medium">{c.servidor?.nome ?? "-"}</TableCell>
              <TableCell>{c.quantidade}</TableCell>
              <TableCell className="font-medium text-destructive">
                -{formatCurrency(c.valor ?? 0)}
              </TableCell>
              <TableCell className="hidden max-w-[200px] truncate lg:table-cell">
                {c.observacoes || "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete(c)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
