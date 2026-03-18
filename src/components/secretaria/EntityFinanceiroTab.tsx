import { FinancialIndicators } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKz } from "@/lib/dataUtils";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface EntityFinanceiroTabProps {
  indicators: FinancialIndicators[];
  entityName: string;
}

export function EntityFinanceiroTab({ indicators, entityName }: EntityFinanceiroTabProps) {
  const sorted = [...indicators].sort((a, b) => b.year - a.year);
  const latest = sorted[0];

  if (!latest) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem dados financeiros disponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balanço Patrimonial */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Balanço Patrimonial — {latest.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard label="Activo Total" value={formatKz(latest.activoTotal)} suffix="Kz" />
            <MetricCard label="Capital Próprio" value={formatKz(latest.capitalProprio)} suffix="Kz" />
            <MetricCard label="Passivo Total" value={formatKz(latest.passivoTotal)} suffix="Kz" />
            <MetricCard label="Activo Não Corrente" value={formatKz(latest.activoNaoCorrentes)} suffix="Kz" />
            <MetricCard label="Activo Corrente" value={formatKz(latest.activoCorrentes)} suffix="Kz" />
            <MetricCard label="Passivo Corrente" value={formatKz(latest.passivoCorrente)} suffix="Kz" />
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Demonstração de Resultados — {latest.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard label="Proveitos Operacionais" value={formatKz(latest.proveitosOperacionais)} suffix="Kz" />
            <MetricCard label="Custos Operacionais" value={formatKz(latest.custosOperacionais)} suffix="Kz" />
            <MetricCard
              label="Resultado Operacional"
              value={formatKz(latest.resultadoOperacional)}
              suffix="Kz"
              trend={latest.resultadoOperacional >= 0 ? "up" : "down"}
            />
            <MetricCard label="Resultado Antes Impostos" value={formatKz(latest.resultadoAntesImpostos)} suffix="Kz" />
            <MetricCard label="Imposto s/ Rendimento" value={formatKz(latest.impostoRendimento)} suffix="Kz" />
            <MetricCard
              label="Resultado Líquido"
              value={formatKz(latest.resultadoLiquido)}
              suffix="Kz"
              trend={latest.resultadoLiquido >= 0 ? "up" : "down"}
              highlight
            />
          </div>
        </CardContent>
      </Card>

      {/* Indicadores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Indicadores Financeiros — {latest.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <IndicatorCard label="Liquidez Corrente" value={latest.liquidezCorrente.toFixed(2)} good={latest.liquidezCorrente >= 1} />
            <IndicatorCard label="Liquidez Geral" value={latest.liquidezGeral.toFixed(2)} good={latest.liquidezGeral >= 1} />
            <IndicatorCard label="ROE" value={`${latest.roe.toFixed(2)}%`} good={latest.roe > 0} />
            <IndicatorCard label="ROA" value={`${latest.roa.toFixed(2)}%`} good={latest.roa > 0} />
            <IndicatorCard label="Margem Líquida" value={`${latest.margemLiquida.toFixed(2)}%`} good={latest.margemLiquida > 0} />
            <IndicatorCard label="Endiv. Geral" value={`${latest.endividamentoGeral.toFixed(2)}%`} good={latest.endividamentoGeral < 50} />
            <IndicatorCard label="PMR (dias)" value={latest.prazoMedioRecebimento.toFixed(0)} />
            <IndicatorCard label="PMP (dias)" value={latest.prazoMedioPagamento.toFixed(0)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, suffix, trend, highlight }: {
  label: string; value: string; suffix?: string; trend?: "up" | "down"; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
        {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
        <p className="text-sm font-bold font-mono">{value} {suffix}</p>
      </div>
    </div>
  );
}

function IndicatorCard({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg p-3 bg-muted/30">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm font-bold font-mono">{value}</p>
        {good !== undefined && (
          <Badge variant={good ? "default" : "destructive"} className="text-[8px] px-1.5 py-0">
            {good ? "Bom" : "Risco"}
          </Badge>
        )}
      </div>
    </div>
  );
}
