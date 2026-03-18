import { formatKz, defaultFinancialIndicators } from "@/lib/dataUtils";
import { FinancialIndicators } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface BalancoPatrimonialProps {
  entityId: string;
  fiscalYearId: string;
  year: number;
}

interface BalancoLine {
  label: string;
  value: number;
  indent?: number;
  bold?: boolean;
  separator?: boolean;
}

export function BalancoPatrimonial({ entityId, fiscalYearId, year }: BalancoPatrimonialProps) {
  const indicators = mockFinancialIndicators.find(
    (fi) => fi.entityId === entityId && fi.fiscalYearId === fiscalYearId
  );

  const prevIndicators = mockFinancialIndicators.find(
    (fi) => fi.entityId === entityId && fi.year === year - 1
  );

  if (!indicators) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>Dados do Balanço Patrimonial não disponíveis para este exercício.</p>
        </CardContent>
      </Card>
    );
  }

  const activoLines: BalancoLine[] = [
    { label: "ACTIVO", value: indicators.activoTotal, bold: true, separator: true },
    { label: "Activo Não Corrente", value: indicators.activoNaoCorrentes, bold: true },
    { label: "Imobilizações Corpóreas", value: indicators.activoNaoCorrentes * 0.65, indent: 1 },
    { label: "Imobilizações Incorpóreas", value: indicators.activoNaoCorrentes * 0.08, indent: 1 },
    { label: "Investimentos Financeiros", value: indicators.activoNaoCorrentes * 0.15, indent: 1 },
    { label: "Imobilizações em Curso", value: indicators.activoNaoCorrentes * 0.12, indent: 1 },
    { label: "Activo Corrente", value: indicators.activoCorrentes, bold: true },
    { label: "Existências", value: indicators.activoCorrentes * 0.08, indent: 1 },
    { label: "Clientes e Outros Devedores", value: indicators.activoCorrentes * 0.42, indent: 1 },
    { label: "Estado e Outros Entes Públicos", value: indicators.activoCorrentes * 0.06, indent: 1 },
    { label: "Meios Monetários", value: indicators.activoCorrentes * 0.44, indent: 1 },
  ];

  const passivoLines: BalancoLine[] = [
    { label: "CAPITAL PRÓPRIO E PASSIVO", value: indicators.capitalProprio + indicators.passivoTotal, bold: true, separator: true },
    { label: "Capital Próprio", value: indicators.capitalProprio, bold: true },
    { label: "Capital Social", value: indicators.capitalProprio * 0.40, indent: 1 },
    { label: "Reservas Legais", value: indicators.capitalProprio * 0.15, indent: 1 },
    { label: "Reservas de Reavaliação", value: indicators.capitalProprio * 0.10, indent: 1 },
    { label: "Resultados Transitados", value: indicators.capitalProprio * 0.20, indent: 1 },
    { label: "Resultado Líquido do Exercício", value: indicators.resultadoLiquido, indent: 1 },
    { label: "Passivo", value: indicators.passivoTotal, bold: true, separator: true },
    { label: "Passivo Não Corrente", value: indicators.passivoNaoCorrente, bold: true },
    { label: "Empréstimos de Médio e Longo Prazo", value: indicators.passivoNaoCorrente * 0.70, indent: 1 },
    { label: "Provisões para Riscos e Encargos", value: indicators.passivoNaoCorrente * 0.30, indent: 1 },
    { label: "Passivo Corrente", value: indicators.passivoCorrente, bold: true },
    { label: "Fornecedores e Outras Contas a Pagar", value: indicators.passivoCorrente * 0.55, indent: 1 },
    { label: "Estado e Outros Entes Públicos", value: indicators.passivoCorrente * 0.20, indent: 1 },
    { label: "Empréstimos de Curto Prazo", value: indicators.passivoCorrente * 0.15, indent: 1 },
    { label: "Outros Passivos Correntes", value: indicators.passivoCorrente * 0.10, indent: 1 },
  ];

  const equacaoFundamental = indicators.activoTotal - (indicators.capitalProprio + indicators.passivoTotal);
  const isBalanced = Math.abs(equacaoFundamental) < 1;

  const getVariation = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const VariationBadge = ({ current, previous }: { current: number; previous: number | undefined }) => {
    const variation = getVariation(current, previous);
    if (variation === null) return <span className="text-[10px] text-muted-foreground">—</span>;
    const isPositive = variation > 0;
    const isNeutral = Math.abs(variation) < 0.5;
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium",
        isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
      )}>
        {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(variation).toFixed(1)}%
      </span>
    );
  };

  const renderSection = (lines: BalancoLine[], title: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Rubrica</TableHead>
              <TableHead className="text-right">{year}</TableHead>
              {prevIndicators && <TableHead className="text-right">{year - 1}</TableHead>}
              {prevIndicators && <TableHead className="text-right w-[80px]">Var.</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, idx) => (
              <TableRow key={idx} className={cn(line.separator && "border-t-2 border-primary/20")}>
                <TableCell className={cn(
                  line.indent === 1 && "pl-8",
                  line.bold ? "font-semibold text-foreground" : "text-muted-foreground",
                  "text-sm"
                )}>
                  {line.label}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-sm",
                  line.bold ? "font-semibold text-foreground" : "text-foreground",
                  line.value < 0 && "text-destructive"
                )}>
                  {formatKz(line.value)} Kz
                </TableCell>
                {prevIndicators && (
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {/* Approximate previous values based on ratio */}
                    {formatKz(line.value * (prevIndicators.activoTotal / indicators.activoTotal))} Kz
                  </TableCell>
                )}
                {prevIndicators && (
                  <TableCell className="text-right">
                    <VariationBadge
                      current={line.value}
                      previous={line.value * (prevIndicators.activoTotal / indicators.activoTotal)}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Equação Fundamental */}
      <Card className={cn(
        "border-2",
        isBalanced ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Equação Fundamental: Activo = Capital Próprio + Passivo
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatKz(indicators.activoTotal)} = {formatKz(indicators.capitalProprio)} + {formatKz(indicators.passivoTotal)}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isBalanced ? (
                <span className="text-xs text-success font-semibold">✓ Balanço equilibrado</span>
              ) : (
                <span className="text-xs text-destructive font-semibold">
                  Diferença: {formatKz(Math.abs(equacaoFundamental))} Kz
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Activo Total</p>
            <p className="text-lg font-bold font-mono text-foreground">{formatKz(indicators.activoTotal)} Kz</p>
            {prevIndicators && (
              <VariationBadge current={indicators.activoTotal} previous={prevIndicators.activoTotal} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Capital Próprio</p>
            <p className="text-lg font-bold font-mono text-foreground">{formatKz(indicators.capitalProprio)} Kz</p>
            {prevIndicators && (
              <VariationBadge current={indicators.capitalProprio} previous={prevIndicators.capitalProprio} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Passivo Total</p>
            <p className="text-lg font-bold font-mono text-foreground">{formatKz(indicators.passivoTotal)} Kz</p>
            {prevIndicators && (
              <VariationBadge current={indicators.passivoTotal} previous={prevIndicators.passivoTotal} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Resultado Líquido</p>
            <p className={cn(
              "text-lg font-bold font-mono",
              indicators.resultadoLiquido >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatKz(indicators.resultadoLiquido)} Kz
            </p>
            {prevIndicators && (
              <VariationBadge current={indicators.resultadoLiquido} previous={prevIndicators.resultadoLiquido} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Liquidez e Endividamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Indicadores de Liquidez</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Liquidez Corrente", value: indicators.liquidezCorrente, ideal: "≥ 1.0" },
                { label: "Liquidez Seca", value: indicators.liquidezSeca, ideal: "≥ 0.8" },
                { label: "Liquidez Geral", value: indicators.liquidezGeral, ideal: "≥ 1.5" },
              ].map((ind) => (
                <div key={ind.label} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ind.label}</p>
                    <p className="text-[10px] text-muted-foreground">Referência: {ind.ideal}</p>
                  </div>
                  <span className={cn(
                    "text-sm font-mono font-semibold",
                    ind.value >= 1 ? "text-success" : "text-destructive"
                  )}>
                    {ind.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Indicadores de Rentabilidade e Endividamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "ROE (Return on Equity)", value: indicators.roe, suffix: "%" },
                { label: "ROA (Return on Assets)", value: indicators.roa, suffix: "%" },
                { label: "Margem Líquida", value: indicators.margemLiquida, suffix: "%" },
                { label: "Endividamento Geral", value: indicators.endividamentoGeral, suffix: "%" },
              ].map((ind) => (
                <div key={ind.label} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <p className="text-sm font-medium text-foreground">{ind.label}</p>
                  <span className={cn(
                    "text-sm font-mono font-semibold",
                    ind.value >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {ind.value.toFixed(2)}{ind.suffix}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <BalancoCharts indicators={indicators} prevIndicators={prevIndicators} year={year} entityId={entityId} />

      {/* Detailed tables */}
      {renderSection(activoLines, "Activo")}
      {renderSection(passivoLines, "Capital Próprio e Passivo")}
    </div>
  );
}

/* ─── Charts Sub-component ─── */

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(35, 85%, 55%)",
  "hsl(280, 60%, 55%)",
];

function BalancoCharts({
  indicators,
  prevIndicators,
  year,
  entityId,
}: {
  indicators: FinancialIndicators;
  prevIndicators: FinancialIndicators | undefined;
  year: number;
  entityId: string;
}) {
  const activoPieData = [
    { name: "Imob. Corpóreas", value: indicators.activoNaoCorrentes * 0.65 },
    { name: "Imob. Incorpóreas", value: indicators.activoNaoCorrentes * 0.08 },
    { name: "Invest. Financeiros", value: indicators.activoNaoCorrentes * 0.15 },
    { name: "Imob. em Curso", value: indicators.activoNaoCorrentes * 0.12 },
    { name: "Existências", value: indicators.activoCorrentes * 0.08 },
    { name: "Clientes/Devedores", value: indicators.activoCorrentes * 0.42 },
    { name: "Meios Monetários", value: indicators.activoCorrentes * 0.44 },
  ].filter((d) => d.value > 0);

  const passivoPieData = [
    { name: "Capital Social", value: indicators.capitalProprio * 0.40 },
    { name: "Reservas", value: indicators.capitalProprio * 0.25 },
    { name: "Resultados Transitados", value: Math.abs(indicators.capitalProprio * 0.20) },
    { name: "Passivo Não Corrente", value: indicators.passivoNaoCorrente },
    { name: "Passivo Corrente", value: indicators.passivoCorrente },
  ].filter((d) => d.value > 0);

  const barData = prevIndicators
    ? [
        { name: "Activo Total", current: indicators.activoTotal, previous: prevIndicators.activoTotal },
        { name: "Capital Próprio", current: indicators.capitalProprio, previous: prevIndicators.capitalProprio },
        { name: "Passivo Total", current: indicators.passivoTotal, previous: prevIndicators.passivoTotal },
        { name: "Resultado Líq.", current: indicators.resultadoLiquido, previous: prevIndicators.resultadoLiquido },
      ]
    : null;

  const pieChartConfig = {
    value: { label: "Valor" },
  };

  const barChartConfig = {
    current: { label: `${year}`, color: "hsl(var(--primary))" },
    previous: { label: `${year - 1}`, color: "hsl(var(--muted-foreground))" },
  };

  const formatBillions = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return v.toLocaleString();
  };

  const renderCustomLabel = ({ name, percent }: { name?: string; percent?: number }) =>
    (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pie: Composição do Activo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Composição do Activo</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="aspect-square max-h-[280px] w-full">
            <PieChart>
              <Pie
                data={activoPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                label={renderCustomLabel}
                labelLine={false}
              >
                {activoPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatKz(value as number) + " Kz"}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent payload={[]} />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie: Capital Próprio e Passivo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Composição do Capital Próprio e Passivo</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="aspect-square max-h-[280px] w-full">
            <PieChart>
              <Pie
                data={passivoPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                label={renderCustomLabel}
                labelLine={false}
              >
                {passivoPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatKz(value as number) + " Kz"}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent payload={[]} />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bar: Comparação entre exercícios */}
      {barData && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Comparação entre Exercícios ({year - 1} vs {year})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="aspect-[2/1] max-h-[300px] w-full">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tickFormatter={formatBillions} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatKz(value as number) + " Kz"}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent payload={[]} />} />
                <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
