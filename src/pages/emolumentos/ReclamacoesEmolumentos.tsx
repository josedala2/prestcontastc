import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatKz } from "@/lib/emolumentosCalculo";
import { toast } from "sonner";
import { Plus, CheckCircle, XCircle } from "lucide-react";

interface Reclamacao {
  id: string;
  emolumento_id: string;
  tipo: string;
  fundamentacao: string;
  valor_original: number;
  valor_reduzido?: number;
  decisao?: string;
  decidido_por?: string;
  decidido_at?: string;
  estado: string;
  created_at: string;
}

export default function ReclamacoesEmolumentos() {
  const { user } = useAuth();
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("emolumento_reclamacoes").select("*").order("created_at", { ascending: false });
    setReclamacoes((data as unknown as Reclamacao[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDecidir = async (rec: Reclamacao, decisao: "deferida" | "indeferida", valorReduzido?: number) => {
    await supabase.from("emolumento_reclamacoes").update({
      decisao,
      decidido_por: user?.displayName || "sistema",
      decidido_at: new Date().toISOString(),
      valor_reduzido: decisao === "deferida" ? (valorReduzido ?? 0) : null,
      estado: decisao === "deferida" ? "aprovada" : "rejeitada",
    } as any).eq("id", rec.id);

    if (decisao === "deferida" && rec.tipo === "isencao") {
      await supabase.from("emolumentos").update({ estado: "isento", valor_divida: 0 } as any).eq("id", rec.emolumento_id);
    } else if (decisao === "deferida" && rec.tipo === "reducao" && valorReduzido != null) {
      await supabase.from("emolumentos").update({ valor_final: valorReduzido, valor_divida: Math.max(valorReduzido - 0, 0) } as any).eq("id", rec.emolumento_id);
    }

    await supabase.from("emolumento_historico").insert({
      emolumento_id: rec.emolumento_id,
      acao: `${rec.tipo} ${decisao}: ${rec.fundamentacao.slice(0, 80)}`,
      estado_novo: decisao === "deferida" ? (rec.tipo === "isencao" ? "isento" : "em_pedido_reducao") : undefined,
      executado_por: user?.displayName || "sistema",
      perfil_executor: user?.role || "",
    } as any);

    toast.success(`Decisão registada: ${decisao}`);
    load();
  };

  const tipoLabels: Record<string, string> = { reclamacao: "Reclamação", reducao: "Pedido de Redução", isencao: "Isenção" };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold font-serif">Reclamações, Reduções e Isenções</h1>
        <p className="text-sm text-muted-foreground">Gerir pedidos de reclamação, redução e isenção de emolumentos</p>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">A carregar...</div>
            ) : reclamacoes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Sem reclamações registadas</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Fundamentação</th>
                    <th className="text-right p-3">V. Original</th>
                    <th className="text-right p-3">V. Reduzido</th>
                    <th className="text-left p-3">Decisão</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Data</th>
                    <th className="p-3">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {reclamacoes.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-3"><Badge variant="outline">{tipoLabels[r.tipo] || r.tipo}</Badge></td>
                      <td className="p-3 text-xs max-w-[250px] truncate">{r.fundamentacao}</td>
                      <td className="p-3 text-right">{formatKz(Number(r.valor_original))}</td>
                      <td className="p-3 text-right">{r.valor_reduzido != null ? formatKz(Number(r.valor_reduzido)) : "—"}</td>
                      <td className="p-3 text-xs">{r.decisao || "Pendente"}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px]">{r.estado}</Badge></td>
                      <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString("pt-AO")}</td>
                      <td className="p-3">
                        {r.estado === "pendente" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-green-700 h-7 text-xs" onClick={() => handleDecidir(r, "deferida")}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Deferir
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-700 h-7 text-xs" onClick={() => handleDecidir(r, "indeferida")}>
                              <XCircle className="h-3 w-3 mr-1" /> Indeferir
                            </Button>
                          </div>
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
