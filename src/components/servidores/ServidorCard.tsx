import { Link } from "react-router-dom";
import { Coins, MoreVertical, Pencil, Trash2, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CREDITOS_ALERTA_MINIMO } from "@/lib/constants";
import { formatCurrency } from "@/utils/formatters";
import type { Servidor, ServidorResumo } from "@/types";

interface ServidorCardProps {
  servidor: Servidor;
  resumo?: ServidorResumo;
  onEdit: (servidor: Servidor) => void;
  onDelete: (servidor: Servidor) => void;
}

export function ServidorCard({ servidor, resumo, onEdit, onDelete }: ServidorCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0">
          <Link
            to={`/servidores/${servidor.id}`}
            className="truncate text-base font-semibold text-hub-blue-dark hover:underline"
          >
            {servidor.nome}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{servidor.plataforma}</Badge>
            {!servidor.ativo && (
              <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-600">
                Inativo
              </Badge>
            )}
            {servidor.ativo && resumo !== undefined && resumo.creditos_disponiveis < CREDITOS_ALERTA_MINIMO && (
              <Badge variant="outline" className="border-orange-300 bg-orange-100 text-orange-700">
                <Coins className="mr-1 h-3 w-3" />
                Créditos baixos
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ações">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(servidor)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(servidor)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{resumo?.clientes_ativos ?? 0}</strong> ativos
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="whitespace-normal">
              <strong className="text-foreground">{formatCurrency(resumo?.receita_mensal ?? 0)}</strong>/mês
            </span>
          </div>
          <div
            className={
              resumo !== undefined && resumo.creditos_disponiveis < CREDITOS_ALERTA_MINIMO
                ? "flex items-center gap-2 text-orange-600"
                : "flex items-center gap-2 text-muted-foreground"
            }
          >
            <Coins className="h-4 w-4" />
            <span>
              <strong className={resumo !== undefined && resumo.creditos_disponiveis < CREDITOS_ALERTA_MINIMO ? "text-orange-700" : "text-foreground"}>
                {resumo?.creditos_disponiveis ?? 0}
              </strong>{" "}
              créditos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
