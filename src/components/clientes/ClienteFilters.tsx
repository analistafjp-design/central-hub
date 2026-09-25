import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENTE_STATUS } from "@/lib/constants";
import type { Servidor } from "@/types";

interface ClienteFiltersProps {
  busca: string;
  onBuscaChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  servidorId: string;
  onServidorIdChange: (value: string) => void;
  servidores: Servidor[];
  hideServidorFilter?: boolean;
}

export function ClienteFilters({
  busca,
  onBuscaChange,
  status,
  onStatusChange,
  servidorId,
  onServidorIdChange,
  servidores,
  hideServidorFilter,
}: ClienteFiltersProps) {
  const temFiltroAtivo = busca || status || servidorId;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome, usuário ou telefone..."
          className="pl-9 pr-9"
        />
        {busca && (
          <button
            type="button"
            onClick={() => onBuscaChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!hideServidorFilter && (
        <Select value={servidorId || "todos"} onValueChange={(v) => onServidorIdChange(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos os servidores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os servidores</SelectItem>
            {servidores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={status || "todos"} onValueChange={(v) => onStatusChange(v === "todos" ? "" : v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {CLIENTE_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {temFiltroAtivo && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onBuscaChange("");
            onStatusChange("");
            onServidorIdChange("");
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
