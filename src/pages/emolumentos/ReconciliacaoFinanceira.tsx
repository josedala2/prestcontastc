import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmolumentos } from "@/hooks/useEmolumentos";
import { formatKz } from "@/lib/emolumentosCalculo";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface GuiaComPagamentos {
  id: string;
  numero_guia: string;
  valor: number;
  emolumento_id: string;
  estado: string;
  data_emissao: string;
  total_pago: number;
  diferenca: number;
  conciliado: boolean;
}

export default function ReconciliacaoFinanceira() {
  const { emolumentos } = useEmolumentos();
  const [guias, setGuias] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [gRes, pRes] = await Promise.all([
        supabase.from("emolumento_guias").select("*").order("created_at", { ascending: false }),
        supabase.from("emolumento_pagamentos").select("*"),
      ]);
      setGuias(gRes.data || []);
      setPagamentos(pRes.data || []);
      setLoading(false);
    })();
  }, []);

  const reconciliacao = useMemo<GuiaComPagamentos[]>(() => {
    return guias.map((g) => {
      const pagGuia = pagamentos.filter((p) => p.guia_id === g.id);
      const totalPago = pagGuia.reduce((s: number, p: any) => s + Number(p.valor_pago), 0);
      const diferenca = Number(g.valor) - totalPago;
      return {
        ...g,
        valor: Number(g.valor),
        total_pago: totalPago,
        diferenca,
        conciliado: Math.abs(diferenca) < 0.01,
      };
    });
  }, [guias, pagamentos]);

  const totalGuias = reconciliacao.reduce((s, r) => s + r.valor, 0);
  const totalPago = reconciliacao.reduce((s, r) => s + r.total_pago, 0);
  const totalDif = totalGuias - totalPago;
  const conciliados = reconciliacao.filter((r) => r.conciliado).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold font-serif">Reconciliação Financeira</h1>
        <p className="text-sm text-muted-foreground">Comparação entre guias emitidas e depósitos/pagamentos registados</p>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Guias</p><p className="text-lg font-bold">{formatKz(totalGuias)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Pago</p><p className="text-lg font-bold text-success">{formatKz(totalPago)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Diferença</p><p className={`text-lg font-bold ${totalDif > 0 ? "text-destructive" : "text-success"}`}>{formatKz(totalDif)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Conciliados</p><p className="text-lg font-bold">{conciliados}/{reconciliacao.length}</p></CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">A carregar...</div>
            ) : reconciliacao.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Sem guias para reconciliação</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3">Nº Guia</th>
                    <th className="text-right p-3">Valor Guia</th>
                    <th className="text-right p-3">Total Pago</th>
                    <th className="text-right p-3">Diferença</th>
                    <th className="text-left p-3">Data Emissão</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliacao.map((r) => (
                    <tr key={r.id} className={`border-b ${r.conciliado ? "" : "bg-destructive/5"}`}>
                      <td className="p-3 font-mono text-xs">{r.numero_guia}</td>
                      <td className="p-3 text-right">{formatKz(r.valor)}</td>
                      <td className="p-3 text-right text-success">{formatKz(r.total_pago)}</td>
                      <td className={`p-3 text-right font-medium ${r.diferenca > 0 ? "text-destructive" : r.diferenca < 0 ? "text-info" : ""}`}>
                        {formatKz(r.diferenca)}
                      </td>
                      <td className="p-3 text-xs">{new Date(r.data_emissao).toLocaleDateString("pt-AO")}</td>
                      <td className="p-3 text-center">
                        {r.conciliado ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
