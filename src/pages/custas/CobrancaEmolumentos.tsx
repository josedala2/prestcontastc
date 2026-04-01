import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatKz, ESTADO_LABELS, EstadoEmolumento } from "@/lib/emolumentosCalculo";
import { toast } from "sonner";
import { Receipt, ExternalLink, Plus } from "lucide-react";

interface ProcessoComEmolumento {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
  estado: string;
  etapa_atual: number;
  emolumento_id?: string;
  emolumento_estado?: string;
  emolumento_valor?: number;
  emolumento_pago?: number;
}

export default function CobrancaEmolumentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<ProcessoComEmolumento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch processes at stage 13
      const { data: procs } = await supabase
        .from("processos")
        .select("id, numero_processo, entity_name, entity_id, estado, etapa_atual")
        .eq("etapa_atual", 13)
        .order("updated_at", { ascending: false });

      if (!procs || procs.length === 0) {
        setProcessos([]);
        setLoading(false);
        return;
      }

      // Fetch linked emolumentos
      const procIds = procs.map((p) => p.id);
      const { data: emols } = await supabase
        .from("emolumentos")
        .select("id, processo_id, estado, valor_final, valor_pago")
        .in("processo_id", procIds);

      const emolMap = new Map(
        (emols || []).map((e: any) => [e.processo_id, e])
      );

      const merged = procs.map((p) => {
        const e = emolMap.get(p.id);
        return {
          ...p,
          emolumento_id: e?.id,
          emolumento_estado: e?.estado,
          emolumento_valor: e ? Number(e.valor_final) : undefined,
          emolumento_pago: e ? Number(e.valor_pago) : undefined,
        } as ProcessoComEmolumento;
      });

      setProcessos(merged);
      setLoading(false);
    })();
  }, []);

  const handleAvancar = async (processo: ProcessoComEmolumento) => {
    if (!processo.emolumento_id) {
      toast.error("Crie um emolumento antes de avançar");
      return;
    }
    if (processo.emolumento_estado !== "pago" && processo.emolumento_estado !== "pago_em_excesso" && processo.emolumento_estado !== "isento") {
      toast.error("O emolumento deve estar pago ou isento para avançar");
      return;
    }

    const { error } = await supabase.rpc("avancar_etapa_processo", {
      p_processo_id: processo.id,
      p_nova_etapa: 14,
      p_novo_estado: "em_analise",
      p_executado_por: user?.displayName || "sistema",
      p_perfil_executor: user?.role || "",
      p_observacoes: "Emolumentos cobrados — processo avança para Ministério Público",
    });

    if (error) {
      toast.error("Erro ao avançar: " + error.message);
      return;
    }

    toast.success("Processo avançado para a Etapa 14");
    setProcessos((prev) => prev.filter((p) => p.id !== processo.id));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Cobrança de Emolumentos — Etapa 13
          </h1>
          <p className="text-sm text-muted-foreground">
            Processos aguardando cálculo, emissão de guia e confirmação de pagamento de emolumentos.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : processos.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Sem processos na Etapa 13</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {processos.map((p) => {
              const estadoEmol = p.emolumento_estado
                ? ESTADO_LABELS[p.emolumento_estado as EstadoEmolumento]
                : null;

              return (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{p.numero_processo}</p>
                      <p className="text-xs text-muted-foreground">{p.entity_name}</p>
                    </div>

                    {p.emolumento_id ? (
                      <>
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatKz(p.emolumento_valor || 0)}</p>
                          <p className="text-xs text-muted-foreground">Pago: {formatKz(p.emolumento_pago || 0)}</p>
                        </div>
                        <Badge className={estadoEmol?.color || ""}>{estadoEmol?.label || p.emolumento_estado}</Badge>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/emolumentos/${p.emolumento_id}`)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver Detalhe
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAvancar(p)}
                          disabled={p.emolumento_estado !== "pago" && p.emolumento_estado !== "pago_em_excesso" && p.emolumento_estado !== "isento"}
                        >
                          Confirmar e Avançar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-muted-foreground">Sem emolumento</Badge>
                        <Button size="sm" onClick={() => navigate("/emolumentos/novo")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Criar Emolumento
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
