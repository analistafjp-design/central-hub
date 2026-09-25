import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceitaPorServidor } from "@/services/dashboardService";
import { formatCurrency } from "@/utils/formatters";
import { SemDados } from "./SemDados";

export function ReceitaPorServidorChart({ data }: { data: ReceitaPorServidor[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita mensal por servidor</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <SemDados />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="servidor" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="receita" fill="#1668E3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
