import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { clienteSchema, type ClienteFormValues } from "@/lib/validations";
import { maskTelefone } from "@/lib/masks";
import { CLIENTE_STATUS } from "@/lib/constants";
import type { ClienteComServidor, Servidor } from "@/types";

interface ClienteFormProps {
  cliente?: ClienteComServidor | null;
  servidores: Servidor[];
  servidorIdFixo?: string;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

function amanhaMaisNDias(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function ClienteForm({
  cliente,
  servidores,
  servidorIdFixo,
  onSubmit,
  onCancel,
  submitting,
}: ClienteFormProps) {
  const defaultValues: ClienteFormValues = {
    nome: cliente?.nome ?? "",
    usuario: cliente?.usuario ?? "",
    senha: cliente?.senha ?? "",
    telefone: cliente?.telefone ?? "",
    plano: cliente?.plano ?? "",
    valor_mensal: cliente?.valor_mensal ?? 0,
    servidor_id: cliente?.servidor_id ?? servidorIdFixo ?? "",
    observacoes: cliente?.observacoes ?? "",
    data_expiracao: cliente?.data_expiracao ?? amanhaMaisNDias(30),
    status: cliente?.status ?? "Ativo",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, reset]);

  const servidorId = watch("servidor_id");
  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto px-1" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome completo *</Label>
          <Input id="nome" placeholder="Nome do cliente" {...register("nome")} />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="usuario">Usuário</Label>
          <Input id="usuario" placeholder="Login no painel" {...register("usuario")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" placeholder="Senha no painel" {...register("senha")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            placeholder="(00) 00000-0000"
            {...register("telefone")}
            onChange={(e) => setValue("telefone", maskTelefone(e.target.value))}
          />
          {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plano">Plano</Label>
          <Input id="plano" placeholder="Ex: Mensal, Trimestral" {...register("plano")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_mensal">Valor mensal (R$) *</Label>
          <Input
            id="valor_mensal"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register("valor_mensal", { valueAsNumber: true })}
          />
          {errors.valor_mensal && <p className="text-sm text-destructive">{errors.valor_mensal.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="servidor_id">Servidor *</Label>
          <Select
            value={servidorId}
            onValueChange={(v) => setValue("servidor_id", v)}
            disabled={Boolean(servidorIdFixo)}
          >
            <SelectTrigger id="servidor_id">
              <SelectValue placeholder="Selecione um servidor" />
            </SelectTrigger>
            <SelectContent>
              {servidores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.servidor_id && <p className="text-sm text-destructive">{errors.servidor_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_expiracao">Data de expiração *</Label>
          <Input id="data_expiracao" type="date" {...register("data_expiracao")} />
          {errors.data_expiracao && (
            <p className="text-sm text-destructive">{errors.data_expiracao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as ClienteFormValues["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENTE_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" placeholder="Notas internas sobre este cliente" {...register("observacoes")} />
      </div>

      {/* sticky: com muitos campos, o formulário rola dentro de max-h-[70vh] — sem isso,
          o botão de salvar ficaria escondido até rolar até o fim, principalmente no celular. */}
      <DialogFooter className="sticky bottom-0 -mx-1 border-t border-border bg-background px-1 pb-1 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
