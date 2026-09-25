import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/utils/formatters";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [nome, setNome] = useState(profile?.nome ?? "");
  const [telefone, setTelefone] = useState(profile?.telefone ?? "");
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!profile) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome, telefone: telefone || null })
        .eq("id", profile.id);
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <PageHeader title="Meu perfil" description="Gerencie suas informações de acesso." />

      <Card className="max-w-xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials(profile?.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{profile?.nome}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {profile?.perfil}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>

          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
