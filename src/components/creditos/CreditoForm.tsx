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
import { creditoSchema, type CreditoFormValues } from "@/lib/validations";
import type { Servidor } from "@/types";

interface CreditoFormProps {
  servidores: Servidor[];
  onSubmit: (values: CreditoFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function CreditoForm({ servidores, onSubmit, onCancel, submitting }: CreditoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreditoFormValues>({
    resolver: zodResolver(creditoSchema),
    defaultValues: {
      servidor_id: "",
      quantidade: 1,
      valor: 0,
      data: hoje(),
      observacoes: "",
    },
  });

  const servidorId = watch("servidor_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="servidor_id">Servidor *</Label>
        <Select value={servidorId} onValueChange={(v) => setValue("servidor_id", v)}>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade de créditos *</Label>
          <Input
            id="quantidade"
            type="number"
            min="1"
            step="1"
            {...register("quantidade", { valueAsNumber: true })}
          />
          {errors.quantidade && <p className="text-sm text-destructive">{errors.quantidade.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor pago (R$) *</Label>
          <Input id="valor" type="number" step="0.01" min="0" {...register("valor", { valueAsNumber: true })} />
          {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="data">Data da compra *</Label>
          <Input id="data" type="date" {...register("data")} />
          {errors.data && <p className="text-sm text-destructive">{errors.data.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" placeholder="Ex: pacote de 50 créditos" {...register("observacoes")} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar gasto
        </Button>
      </DialogFooter>
    </form>
  );
}
