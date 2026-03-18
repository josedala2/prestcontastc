import { formatKz } from "@/lib/dataUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

const COLORS = ["hsl(210,70%,28%)", "hsl(170,50%,42%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

// Dados simulados: 2023 vs 2024
const comparacaoRubricas = [
  { rubrica: "Total Activo", code: "1-4", atual: 18_450_000_000, anterior: 16_200_000_000 },
  { rubrica: "Imobilizações Corpóreas", code: "11", atual: 8_500_000_000, anterior: 7_800_000_000 },
  { rubrica: "Existências", code: "2x", atual: 1_200_000_000, anterior: 1_350_000_000 },
  { rubrica: "Clientes", code: "31", atual: 3_100_000_000, anterior: 2_600_000_000 },
  { rubrica: "Meios Monetários", code: "4x", atual: 2_150_000_000, anterior: 1_950_000_000 },
  { rubrica: "Total Passivo", code: "3x", atual: 6_800_000_000, anterior: 5_900_000_000 },
  { rubrica: "Fornecedores", code: "32", atual: 4_200_000_000, anterior: 3_500_000_000 },
  { rubrica: "Empréstimos", code: "33", atual: 2_600_000_000, anterior: 2_400_000_000 },
  { rubrica: "Capital Próprio", code: "5x", atual: 11_650_000_000, anterior: 10_300_000_000 },
  { rubrica: "Vendas e Prestações", code: "61+62", atual: 12_800_000_000, anterior: 11_500_000_000 },
  { rubrica: "Custos com Pessoal", code: "72", atual: 3_450_000_000, anterior: 2_900_000_000 },
  { rubrica: "Fornec. e Serv. Terceiros", code: "73", atual: 2_100_000_000, anterior: 2_300_000_000 },
  { rubrica: "Amortizações", code: "76", atual: 1_250_000_000, anterior: 1_100_000_000 },
  { rubrica: "Resultado Líquido", code: "88", atual: 1_350_000_000, anterior: 980_000_000 },
];

const evolucaoAnual = [
  { ano: "2021", Activo: 12_500, Passivo: 4_800, Receitas: 9_200, Resultado: 620 },
  { ano: "2022", Activo: 14_100, Passivo: 5_200, Receitas: 10_100, Resultado: 750 },
  { ano: "2023", Activo: 16_200, Passivo: 5_900, Receitas: 11_500, Resultado: 980 },
  { ano: "2024", Activo: 18_450, Passivo: 6_800, Receitas: 12_800, Resultado: 1_350 },
];

const VariacaoBadge = ({ variacao }: { variacao: number }) => {
  const isPositive = variacao > 0;
  const isNeutral = variacao === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
      isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
    }`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : isNeutral ? <ArrowRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{variacao.toFixed(1)}%
    </span>
  );
};

export const ComparacaoAnual = () => {
  const chartData = comparacaoRubricas
    .filter((r) => ["Total Activo", "Total Passivo", "Capital Próprio", "Vendas e Prestações", "Custos com Pessoal", "Resultado Líquido"].includes(r.rubrica))
    .map((r) => ({
      name: r.rubrica,
      "2023": r.anterior / 1e9,
      "2024": r.atual / 1e9,
    }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {comparacaoRubricas
          .filter((r) => ["Total Activo", "Vendas e Prestações", "Custos com Pessoal", "Resultado Líquido"].includes(r.rubrica))
          .map((r) => {
            const variacao = ((r.atual - r.anterior) / r.anterior) * 100;
            return (
              <Card key={r.rubrica}>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.rubrica}</p>
                  <p className="text-lg font-bold font-mono mt-1">{formatKz(r.atual)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">vs {formatKz(r.anterior)}</span>
                    <VariacaoBadge variacao={variacao} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Comparison bar chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Comparação 2023 vs 2024 (Mil Milhões Kz)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis tickFormatter={(v) => `${v.toFixed(1)}B`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} B Kz`} />
              <Legend />
              <Bar dataKey="2023" fill={COLORS[0]} radius={[3, 3, 0, 0]} opacity={0.6} />
              <Bar dataKey="2024" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolution line chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolução Plurianual (2021–2024)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoAnual}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
              <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(1)}T`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `${formatKz(value * 1_000_000)} Kz`} />
              <Legend />
              <Line type="monotone" dataKey="Activo" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Receitas" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Passivo" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Resultado" stroke={COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Full comparison table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tabela Comparativa Detalhada — 2023 vs 2024</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Rubrica</TableHead>
                <TableHead className="text-xs font-semibold">Conta</TableHead>
                <TableHead className="text-xs font-semibold text-right">2023 (Kz)</TableHead>
                <TableHead className="text-xs font-semibold text-right">2024 (Kz)</TableHead>
                <TableHead className="text-xs font-semibold text-right">Δ Absoluta (Kz)</TableHead>
                <TableHead className="text-xs font-semibold text-right">Δ %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparacaoRubricas.map((r) => {
                const delta = r.atual - r.anterior;
                const variacao = ((delta) / r.anterior) * 100;
                const isHighlight = ["Total Activo", "Total Passivo", "Capital Próprio", "Resultado Líquido"].includes(r.rubrica);
                return (
                  <TableRow key={r.rubrica} className={isHighlight ? "bg-primary/5 font-semibold" : ""}>
                    <TableCell className="text-sm">{r.rubrica}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.code}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(r.anterior)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(r.atual)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                      {delta >= 0 ? "+" : ""}{formatKz(delta)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariacaoBadge variacao={variacao} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
