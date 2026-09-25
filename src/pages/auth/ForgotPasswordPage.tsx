import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setEnviando(true);
    const { error } = await sendPasswordReset(values.email);
    setEnviando(false);

    if (error) {
      toast.error(error);
      return;
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <AuthLayout title="Verifique seu e-mail" description="Enviamos um link de recuperação de senha.">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hub-blue-lighter">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua
            senha em instantes.
          </p>
          <Link to="/entrar" className="text-sm font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      description="Informe seu e-mail e enviaremos um link para redefinição."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar link de recuperação
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link to="/entrar" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
