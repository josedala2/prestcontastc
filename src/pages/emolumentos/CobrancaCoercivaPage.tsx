import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEmolumentos } from "@/hooks/useEmolumentos";
import { formatKz, ESTADO_LABELS, EstadoEmolumento } from "@/lib/emolumentosCalculo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Ban, Send } from "lucide-react";

export default function CobrancaCoercivaPage() {
  const { emolumentos, loading, refresh } = useEmolumentos();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Emolumentos em dívida ou já em cobrança coerciva
  const eligiveis = emolumentos.filter((e) => ["em_divida", "aguardando_pagamento", "pago_a_menor", "em_cobranca_coerciva"].includes(e.estado));

  const handleIniciarCoerciva = async (emId: string) => {
    const emol = eligiveis.find((e) => e.id === emId);
    const estadoAnterior = emol?.estado || "";
    await supabase.from("emolumentos").update({ estado: "em_cobranca_coerciva" } as any).eq("id", emId);
    await supabase.from("emolumento_historico").insert({
      emolumento_id: emId,
      acao: "Processo de cobrança coerciva iniciado",
      estado_anterior: estadoAnterior,
      estado_novo: "em_cobranca_coerciva",
      executado_por: user?.displayName || "sistema",
      perfil_executor: user?.role || "",
    } as any);
    toast.success("Cobrança coerciva iniciada");
    refresh();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold font-serif">Cobrança Coerciva</h1>
        <p className="text-sm text-muted-foreground">Emolumentos com dívida pendente elegíveis para cobrança coerciva</p>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">A carregar...</div>
            ) : eligiveis.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Sem emolumentos elegíveis para cobrança coerciva</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3">Processo</th>
                    <th className="text-left p-3">Entidade</th>
                    <th className="text-right p-3">Valor Final</th>
                    <th className="text-right p-3">Pago</th>
                    <th className="text-right p-3">Dívida</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="p-3">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {eligiveis.map((em) => {
                    const info = ESTADO_LABELS[em.estado as EstadoEmolumento];
                    return (
                      <tr key={em.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 font-mono text-xs cursor-pointer hover:underline" onClick={() => navigate(`/emolumentos/${em.id}`)}>{em.numero_processo}</td>
                        <td className="p-3 truncate max-w-[180px]">{em.entity_name}</td>
                        <td className="p-3 text-right">{formatKz(Number(em.valor_final))}</td>
                        <td className="p-3 text-right text-success">{formatKz(Number(em.valor_pago))}</td>
                        <td className="p-3 text-right font-bold text-destructive">{formatKz(Number(em.valor_divida))}</td>
                        <td className="p-3"><Badge variant="outline" className={`text-[10px] ${info?.color || ""}`}>{info?.label || em.estado}</Badge></td>
                        <td className="p-3">
                          {em.estado !== "em_cobranca_coerciva" ? (
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleIniciarCoerciva(em.id)}>
                              <Ban className="h-3 w-3 mr-1" /> Iniciar Coerciva
                            </Button>
                          ) : (
                            <Badge className="bg-destructive/20 text-destructive text-[10px]">Em Cobrança</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
