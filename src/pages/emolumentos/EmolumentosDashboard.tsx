import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmolumentos } from "@/hooks/useEmolumentos";
import { formatKz, ESTADO_LABELS, EstadoEmolumento } from "@/lib/emolumentosCalculo";
import { Receipt, AlertTriangle, CheckCircle, Clock, TrendingUp, Ban, FileText, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmolumentosDashboard() {
  const { emolumentos, loading } = useEmolumentos();
  const navigate = useNavigate();

  const totalFinal = emolumentos.reduce((s, e) => s + Number(e.valor_final), 0);
  const totalPago = emolumentos.reduce((s, e) => s + Number(e.valor_pago), 0);
  const totalDivida = emolumentos.reduce((s, e) => s + Number(e.valor_divida), 0);

  const byEstado = emolumentos.reduce<Record<string, number>>((acc, e) => {
    acc[e.estado] = (acc[e.estado] || 0) + 1;
    return acc;
  }, {});

  const pendentes = (byEstado["aguardando_pagamento"] || 0) + (byEstado["guia_emitida"] || 0);
  const coercivos = byEstado["em_cobranca_coerciva"] || 0;
  const reclamacoes = (byEstado["em_reclamacao"] || 0) + (byEstado["em_pedido_reducao"] || 0);

  const kpis = [
    { label: "Total Emolumentos", value: emolumentos.length, icon: FileText, color: "text-primary" },
    { label: "Valor Total", value: formatKz(totalFinal), icon: DollarSign, color: "text-info" },
    { label: "Receita Cobrada", value: formatKz(totalPago), icon: TrendingUp, color: "text-success" },
    { label: "Em Dívida", value: formatKz(totalDivida), icon: AlertTriangle, color: "text-destructive" },
    { label: "Pendentes", value: pendentes, icon: Clock, color: "text-warning" },
    { label: "Pagos", value: byEstado["pago"] || 0, icon: CheckCircle, color: "text-success" },
    { label: "Cobrança Coerciva", value: coercivos, icon: Ban, color: "text-destructive" },
    { label: "Reclamações", value: reclamacoes, icon: Receipt, color: "text-secondary" },
  ];

  // Recent emolumentos
  const recentes = emolumentos.slice(0, 8);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Gestão de Emolumentos</h1>
          <p className="text-sm text-muted-foreground">Dashboard operacional de emolumentos e custas</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Por Estado */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Estado</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byEstado).map(([estado, count]) => {
                const info = ESTADO_LABELS[estado as EstadoEmolumento];
                return (
                  <Badge key={estado} variant="outline" className={`${info?.color || ""} px-3 py-1`}>
                    {info?.label || estado}: {count}
                  </Badge>
                );
              })}
              {Object.keys(byEstado).length === 0 && (
                <p className="text-sm text-muted-foreground">Sem emolumentos registados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Últimos emolumentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos Emolumentos</CardTitle>
            <button onClick={() => navigate("/emolumentos/lista")} className="text-xs text-primary hover:underline">
              Ver todos →
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">A carregar...</p>
            ) : recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem emolumentos registados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Processo</th>
                      <th className="py-2 pr-3">Entidade</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3 text-right">Valor</th>
                      <th className="py-2 pr-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentes.map((em) => {
                      const info = ESTADO_LABELS[em.estado as EstadoEmolumento];
                      return (
                        <tr key={em.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/emolumentos/${em.id}`)}>
                          <td className="py-2 pr-3 font-mono text-xs">{em.numero_processo}</td>
                          <td className="py-2 pr-3 truncate max-w-[200px]">{em.entity_name}</td>
                          <td className="py-2 pr-3 text-xs">{em.tipo_processo}</td>
                          <td className="py-2 pr-3 text-right font-medium">{formatKz(Number(em.valor_final))}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={`text-[10px] ${info?.color || ""}`}>
                              {info?.label || em.estado}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
