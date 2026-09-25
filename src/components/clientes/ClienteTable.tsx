import { MoreVertical, Pencil, Trash2, Phone, Server, Wallet } from "lucide-react";
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
import { ClienteStatusBadge } from "@/components/shared/StatusBadge";
import { VencimentoBadge } from "@/components/shared/VencimentoBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { ClienteComServidor } from "@/types";

interface ClienteTableProps {
  clientes: ClienteComServidor[];
  loading: boolean;
  onEdit: (cliente: ClienteComServidor) => void;
  onDelete: (cliente: ClienteComServidor) => void;
  onRegistrarPagamento?: (cliente: ClienteComServidor) => void;
  hideServidorColumn?: boolean;
}

export function ClienteTable({
  clientes,
  loading,
  onEdit,
  onDelete,
  onRegistrarPagamento,
  hideServidorColumn,
}: ClienteTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente encontrado"
        description="Cadastre um novo cliente ou ajuste os filtros de busca."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            {!hideServidorColumn && <TableHead className="hidden lg:table-cell">Servidor</TableHead>}
            <TableHead className="hidden sm:table-cell">Valor mensal</TableHead>
            <TableHead className="hidden xl:table-cell">Expira em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="font-medium">
                <div>{cliente.nome}</div>
                {cliente.plano && <div className="text-xs text-muted-foreground">{cliente.plano}</div>}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {cliente.telefone || "-"}
                </span>
              </TableCell>
              {!hideServidorColumn && (
                <TableCell className="hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Server className="h-3.5 w-3.5" />
                    {cliente.servidor?.nome ?? "-"}
                  </span>
                </TableCell>
              )}
              <TableCell className="hidden sm:table-cell">{formatCurrency(cliente.valor_mensal)}</TableCell>
              <TableCell className="hidden xl:table-cell">{formatDate(cliente.data_expiracao)}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <ClienteStatusBadge status={cliente.status} />
                  <VencimentoBadge dataExpiracao={cliente.data_expiracao} status={cliente.status} />
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRegistrarPagamento && (
                      <DropdownMenuItem onClick={() => onRegistrarPagamento(cliente)}>
                        <Wallet className="mr-2 h-4 w-4" /> Registrar pagamento
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(cliente)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(cliente)}
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
