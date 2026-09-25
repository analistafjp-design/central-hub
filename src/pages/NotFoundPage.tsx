import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-hub-gray-light p-6 text-center">
      <p className="text-6xl font-bold text-hub-blue-dark">404</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        A página que você procura não existe ou foi movida. Volte para o painel do {APP_NAME}.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Voltar para o início</Link>
      </Button>
    </div>
  );
}
