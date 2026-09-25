import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientePorStatus } from "@/services/dashboardService";
import { SemDados } from "./SemDados";

const CORES: Record<string, string> = {
  Ativo: "#16A34A",
  Vencido: "#DC2626",
  Cancelado: "#94A3B8",
};

export function ClientesPorStatusChart({ data }: { data: ClientePorStatus[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes por status</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <SemDados />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="quantidade"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={CORES[entry.status] ?? "#5B6B7B"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
