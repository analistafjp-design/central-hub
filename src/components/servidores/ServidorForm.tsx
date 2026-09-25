import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { servidorSchema, type ServidorFormValues } from "@/lib/validations";
import { PLATAFORMAS } from "@/lib/constants";
import type { Servidor } from "@/types";

interface ServidorFormProps {
  servidor?: Servidor | null;
  onSubmit: (values: ServidorFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function ServidorForm({ servidor, onSubmit, onCancel, submitting }: ServidorFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServidorFormValues>({
    resolver: zodResolver(servidorSchema),
    defaultValues: {
      nome: servidor?.nome ?? "",
      plataforma: servidor?.plataforma ?? "Outro",
      ativo: servidor?.ativo ?? true,
      observacoes: servidor?.observacoes ?? "",
    },
  });

  useEffect(() => {
    reset({
      nome: servidor?.nome ?? "",
      plataforma: servidor?.plataforma ?? "Outro",
      ativo: servidor?.ativo ?? true,
      observacoes: servidor?.observacoes ?? "",
    });
  }, [servidor, reset]);

  const plataforma = watch("plataforma");
  const ativo = watch("ativo");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do servidor *</Label>
          <Input id="nome" placeholder="Ex: WPLAY Principal" {...register("nome")} />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plataforma">Plataforma *</Label>
          <Select
            value={plataforma}
            onValueChange={(v) => setValue("plataforma", v as ServidorFormValues["plataforma"])}
          >
            <SelectTrigger id="plataforma">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATAFORMAS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" placeholder="Notas internas sobre este servidor" {...register("observacoes")} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
        <Label htmlFor="ativo" className="cursor-pointer">
          Servidor ativo
        </Label>
        <Switch id="ativo" checked={ativo} onCheckedChange={(v) => setValue("ativo", v)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {servidor ? "Salvar alterações" : "Cadastrar servidor"}
        </Button>
      </DialogFooter>
    </form>
  );
}
