import { MoreVertical, Trash2, Wallet } from "lucide-react";
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
import type { PagamentoComRelacoes } from "@/types";

interface PagamentoTableProps {
  pagamentos: PagamentoComRelacoes[];
  loading: boolean;
  onDelete: (pagamento: PagamentoComRelacoes) => void;
  hideClienteColumn?: boolean;
}

export function PagamentoTable({ pagamentos, loading, onDelete, hideClienteColumn }: PagamentoTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Nenhum pagamento registrado"
        description="Registre um pagamento para acompanhar as renovações e a receita recebida."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            {!hideClienteColumn && <TableHead>Cliente</TableHead>}
            <TableHead className="hidden md:table-cell">Servidor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="hidden sm:table-cell">Meses</TableHead>
            <TableHead className="hidden lg:table-cell">Observações</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{formatDate(p.data_pagamento)}</TableCell>
              {!hideClienteColumn && <TableCell className="font-medium">{p.cliente?.nome ?? "-"}</TableCell>}
              <TableCell className="hidden md:table-cell">{p.servidor?.nome ?? "-"}</TableCell>
              <TableCell className="font-medium">{formatCurrency(p.valor)}</TableCell>
              <TableCell className="hidden sm:table-cell">{p.meses}</TableCell>
              <TableCell className="hidden max-w-[200px] truncate lg:table-cell">
                {p.observacoes || "-"}
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
                      onClick={() => onDelete(p)}
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
