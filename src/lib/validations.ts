import { z } from "zod";
import { PLATAFORMAS, CLIENTE_STATUS } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    nome: z.string().min(3, "Informe seu nome completo."),
    email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const servidorSchema = z.object({
  nome: z.string().min(2, "Informe o nome do servidor."),
  plataforma: z.enum(PLATAFORMAS),
  ativo: z.boolean(),
  observacoes: z.string().optional(),
});
export type ServidorFormValues = z.infer<typeof servidorSchema>;

export const clienteSchema = z.object({
  nome: z.string().min(3, "Informe o nome completo."),
  usuario: z.string().optional(),
  senha: z.string().optional(),
  telefone: z
    .string()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, {
      message: "Telefone inválido.",
    }),
  plano: z.string().optional(),
  valor_mensal: z
    .number({ invalid_type_error: "Informe um valor válido." })
    .min(0, "O valor não pode ser negativo."),
  servidor_id: z.string().min(1, "Selecione um servidor."),
  observacoes: z.string().optional(),
  data_expiracao: z.string().min(1, "Informe a data de expiração."),
  status: z.enum(CLIENTE_STATUS),
});
export type ClienteFormValues = z.infer<typeof clienteSchema>;
