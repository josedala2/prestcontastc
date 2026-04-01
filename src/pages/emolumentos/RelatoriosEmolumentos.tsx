import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmolumentos } from "@/hooks/useEmolumentos";
import { formatKz, TIPO_PROCESSO_LABELS, ESTADO_LABELS, EstadoEmolumento, TipoProcesso } from "@/lib/emolumentosCalculo";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function RelatoriosEmolumentos() {
  const { emolumentos, loading } = useEmolumentos();

  const byTipo = useMemo(() => {
    const acc: Record<string, { count: number; total: number }> = {};
    emolumentos.forEach((e) => {
      if (!acc[e.tipo_processo]) acc[e.tipo_processo] = { count: 0, total: 0 };
      acc[e.tipo_processo].count++;
      acc[e.tipo_processo].total += Number(e.valor_final);
    });
    return Object.entries(acc).map(([tipo, v]) => ({
      name: TIPO_PROCESSO_LABELS[tipo as TipoProcesso]?.slice(0, 25) || tipo,
      count: v.count,
      total: v.total,
    }));
  }, [emolumentos]);

  const byEstado = useMemo(() => {
    const acc: Record<string, number> = {};
    emolumentos.forEach((e) => { acc[e.estado] = (acc[e.estado] || 0) + 1; });
    return Object.entries(acc).map(([estado, count]) => ({
      name: ESTADO_LABELS[estado as EstadoEmolumento]?.label || estado,
      value: count,
    }));
  }, [emolumentos]);

  const totalFinal = emolumentos.reduce((s, e) => s + Number(e.valor_final), 0);
  const totalPago = emolumentos.reduce((s, e) => s + Number(e.valor_pago), 0);
  const totalDivida = emolumentos.reduce((s, e) => s + Number(e.valor_divida), 0);
  const taxaCobr = totalFinal > 0 ? ((totalPago / totalFinal) * 100).toFixed(1) : "0";

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold font-serif">Relatórios de Emolumentos</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Emitido</p><p className="text-xl font-bold">{formatKz(totalFinal)}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Cobrado</p><p className="text-xl font-bold text-green-700">{formatKz(totalPago)}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total em Dívida</p><p className="text-xl font-bold text-red-700">{formatKz(totalDivida)}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Taxa de Cobrança</p><p className="text-xl font-bold text-primary">{taxaCobr}%</p></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* By Type */}
          <Card>
            <CardHeader><CardTitle className="text-base">Por Tipo de Processo</CardTitle></CardHeader>
            <CardContent>
              {byTipo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => formatKz(v)} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Estado */}
          <Card>
            <CardHeader><CardTitle className="text-base">Por Estado</CardTitle></CardHeader>
            <CardContent>
              {byEstado.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={byEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {byEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
