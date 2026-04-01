import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmolumentoDetalhe } from "@/hooks/useEmolumentos";
import { formatKz, ESTADO_LABELS, EstadoEmolumento, TIPO_PROCESSO_LABELS, TipoProcesso } from "@/lib/emolumentosCalculo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, FileText, CreditCard, History, AlertTriangle, Receipt, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function EmolumentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emolumento, guias, pagamentos, reclamacoes, historico, loading, refresh } = useEmolumentoDetalhe(id);

  if (loading) return <AppLayout><div className="p-6 text-muted-foreground">A carregar...</div></AppLayout>;
  if (!emolumento) return <AppLayout><div className="p-6 text-muted-foreground">Emolumento não encontrado</div></AppLayout>;

  const estadoInfo = ESTADO_LABELS[emolumento.estado as EstadoEmolumento];

  return (
    <AppLayout>
      <div className="p-6 space-y-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-serif">Emolumento — {emolumento.numero_processo}</h1>
            <p className="text-sm text-muted-foreground">{emolumento.entity_name}</p>
          </div>
          <Badge className={`${estadoInfo?.color || ""} text-sm px-3 py-1`}>{estadoInfo?.label || emolumento.estado}</Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Base Cálculo", value: formatKz(Number(emolumento.base_calculo)) },
            { label: "Valor Mínimo", value: formatKz(Number(emolumento.valor_minimo)) },
            { label: "Valor Final", value: formatKz(Number(emolumento.valor_final)) },
            { label: "Valor Pago", value: formatKz(Number(emolumento.valor_pago)), color: "text-success" },
            { label: "Em Dívida", value: formatKz(Number(emolumento.valor_divida)), color: "text-destructive" },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
                <p className={`text-lg font-bold ${c.color || ""}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info"><FileText className="h-3.5 w-3.5 mr-1" />Informação</TabsTrigger>
            <TabsTrigger value="guias"><Receipt className="h-3.5 w-3.5 mr-1" />Guias ({guias.length})</TabsTrigger>
            <TabsTrigger value="pagamentos"><CreditCard className="h-3.5 w-3.5 mr-1" />Pagamentos ({pagamentos.length})</TabsTrigger>
            <TabsTrigger value="reclamacoes"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Reclamações ({reclamacoes.length})</TabsTrigger>
            <TabsTrigger value="historico"><History className="h-3.5 w-3.5 mr-1" />Histórico ({historico.length})</TabsTrigger>
          </TabsList>

          {/* Info */}
          <TabsContent value="info">
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Tipo:</span> {TIPO_PROCESSO_LABELS[emolumento.tipo_processo as TipoProcesso] || emolumento.tipo_processo}</div>
                <div><span className="text-muted-foreground">Processo:</span> {emolumento.numero_processo}</div>
                <div><span className="text-muted-foreground">Taxa:</span> {(Number(emolumento.taxa_aplicada) * 100).toFixed(1)}%</div>
                <div><span className="text-muted-foreground">Sal. Mín. Ref.:</span> {formatKz(Number(emolumento.salario_minimo_ref))}</div>
                <div><span className="text-muted-foreground">Responsável Pagamento:</span> {emolumento.responsavel_pagamento || "—"}</div>
                <div><span className="text-muted-foreground">Base Legal:</span> {emolumento.base_legal || "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Observações:</span> {emolumento.observacoes || "—"}</div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <EmitirGuiaDialog emolumentoId={emolumento.id} valorFinal={Number(emolumento.valor_final)} valorDivida={Number(emolumento.valor_divida)} estadoAtual={emolumento.estado} onDone={refresh} />
              <RegistarPagamentoDialog emolumentoId={emolumento.id} guias={guias} onDone={refresh} />
            </div>
          </TabsContent>

          {/* Guias */}
          <TabsContent value="guias">
            <Card>
              <CardContent className="p-0">
                {guias.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">Sem guias emitidas</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/30"><th className="p-3 text-left">Nº Guia</th><th className="p-3 text-right">Valor</th><th className="p-3 text-left">Data Emissão</th><th className="p-3 text-left">Data Limite</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Emitido por</th></tr></thead>
                    <tbody>
                      {guias.map((g) => (
                        <tr key={g.id} className="border-b">
                          <td className="p-3 font-mono">{g.numero_guia}</td>
                          <td className="p-3 text-right font-medium">{formatKz(Number(g.valor))}</td>
                          <td className="p-3 text-xs">{new Date(g.data_emissao).toLocaleDateString("pt-AO")}</td>
                          <td className="p-3 text-xs">{g.data_limite ? new Date(g.data_limite).toLocaleDateString("pt-AO") : "—"}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{g.estado}</Badge></td>
                          <td className="p-3 text-xs">{g.emitido_por}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos">
            <Card>
              <CardContent className="p-0">
                {pagamentos.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">Sem pagamentos registados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/30"><th className="p-3 text-right">Valor</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Meio</th><th className="p-3 text-left">Referência</th><th className="p-3 text-left">Registado por</th></tr></thead>
                    <tbody>
                      {pagamentos.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="p-3 text-right font-medium text-success">{formatKz(Number(p.valor_pago))}</td>
                          <td className="p-3 text-xs">{new Date(p.data_pagamento).toLocaleDateString("pt-AO")}</td>
                          <td className="p-3 text-xs">{p.meio_pagamento}</td>
                          <td className="p-3 text-xs font-mono">{p.referencia_comprovativo || "—"}</td>
                          <td className="p-3 text-xs">{p.registado_por}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reclamações */}
          <TabsContent value="reclamacoes">
            <Card>
              <CardContent className="p-0">
                {reclamacoes.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">Sem reclamações</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/30"><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Fundamentação</th><th className="p-3 text-right">V. Original</th><th className="p-3 text-right">V. Reduzido</th><th className="p-3 text-left">Decisão</th><th className="p-3 text-left">Estado</th></tr></thead>
                    <tbody>
                      {reclamacoes.map((r) => (
                        <tr key={r.id} className="border-b">
                          <td className="p-3 capitalize">{r.tipo}</td>
                          <td className="p-3 text-xs max-w-[200px] truncate">{r.fundamentacao}</td>
                          <td className="p-3 text-right">{formatKz(Number(r.valor_original))}</td>
                          <td className="p-3 text-right">{r.valor_reduzido != null ? formatKz(Number(r.valor_reduzido)) : "—"}</td>
                          <td className="p-3 text-xs">{r.decisao || "Pendente"}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{r.estado}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico">
            <Card>
              <CardContent className="p-4">
                {historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">Sem histórico</p>
                ) : (
                  <div className="space-y-3">
                    {historico.map((h) => (
                      <div key={h.id} className="border-l-2 border-primary/30 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-AO")}</span>
                          {h.estado_anterior && h.estado_novo && (
                            <span className="text-[10px] font-mono text-muted-foreground">{h.estado_anterior} → {h.estado_novo}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{h.acao}</p>
                        {h.observacoes && <p className="text-xs text-muted-foreground">{h.observacoes}</p>}
                        <p className="text-[10px] text-muted-foreground">por {h.executado_por}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ---------- Emitir Guia Dialog ---------- */
const ESTADOS_PERMITIDOS_GUIA = ["calculado", "guia_emitida", "aguardando_pagamento", "pagamento_parcial", "pago_a_menor", "em_divida"];

function EmitirGuiaDialog({ emolumentoId, valorFinal, valorDivida, estadoAtual, onDone }: { emolumentoId: string; valorFinal: number; valorDivida: number; estadoAtual: string; onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(valorDivida || valorFinal);
  const [dataLimite, setDataLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const permitido = ESTADOS_PERMITIDOS_GUIA.includes(estadoAtual);

  const handleEmitir = async () => {
    if (!permitido) { toast.error("Não é possível emitir guia no estado actual"); return; }
    setSaving(true);
    const seq = Date.now().toString().slice(-6);
    const numGuia = `GC-${new Date().getFullYear()}/${seq}`;

    await supabase.from("emolumento_guias").insert({
      emolumento_id: emolumentoId,
      numero_guia: numGuia,
      valor,
      data_limite: dataLimite || null,
      emitido_por: user?.displayName || "sistema",
    } as any);

    await supabase.from("emolumentos").update({ estado: "guia_emitida" } as any).eq("id", emolumentoId);
    await supabase.from("emolumento_historico").insert({
      emolumento_id: emolumentoId,
      acao: `Guia ${numGuia} emitida no valor de ${formatKz(valor)}`,
      estado_anterior: estadoAtual,
      estado_novo: "guia_emitida",
      executado_por: user?.displayName || "sistema",
      perfil_executor: user?.role || "",
    } as any);

    toast.success(`Guia ${numGuia} emitida`);
    setSaving(false);
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" disabled={!permitido}><Receipt className="h-4 w-4 mr-1" /> Emitir Guia</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Emitir Guia de Cobrança</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Valor (Kz)</Label><Input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></div>
          <div><Label>Data Limite</Label><Input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} /></div>
          <Button onClick={handleEmitir} disabled={saving} className="w-full">{saving ? "A emitir..." : "Emitir Guia"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Registar Pagamento Dialog ---------- */
function RegistarPagamentoDialog({ emolumentoId, guias, onDone }: { emolumentoId: string; guias: any[]; onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(0);
  const [guiaId, setGuiaId] = useState("");
  const [meio, setMeio] = useState("deposito_bancario");
  const [ref, setRef] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePagar = async () => {
    if (valor <= 0) { toast.error("Valor inválido"); return; }
    setSaving(true);

    await supabase.from("emolumento_pagamentos").insert({
      emolumento_id: emolumentoId,
      guia_id: guiaId || null,
      valor_pago: valor,
      meio_pagamento: meio,
      referencia_comprovativo: ref || null,
      registado_por: user?.displayName || "sistema",
    } as any);

    // Update emolumento totals
    const { data: em } = await supabase.from("emolumentos").select("valor_pago, valor_final").eq("id", emolumentoId).single();
    if (em) {
      const novoPago = Number((em as any).valor_pago) + valor;
      const novaDivida = Number((em as any).valor_final) - novoPago;
      const novoEstado = novaDivida <= 0 ? (novaDivida < 0 ? "pago_em_excesso" : "pago") : "pagamento_parcial";
      await supabase.from("emolumentos").update({ valor_pago: novoPago, valor_divida: Math.max(novaDivida, 0), estado: novoEstado } as any).eq("id", emolumentoId);

      await supabase.from("emolumento_historico").insert({
        emolumento_id: emolumentoId,
        acao: `Pagamento de ${formatKz(valor)} registado (${meio})`,
        estado_novo: novoEstado,
        executado_por: user?.displayName || "sistema",
        perfil_executor: user?.role || "",
      } as any);
    }

    toast.success("Pagamento registado");
    setSaving(false);
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><CreditCard className="h-4 w-4 mr-1" /> Registar Pagamento</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registar Pagamento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {guias.length > 0 && (
            <div>
              <Label>Guia Associada</Label>
              <Select value={guiaId} onValueChange={setGuiaId}>
                <SelectTrigger><SelectValue placeholder="Selecionar guia..." /></SelectTrigger>
                <SelectContent>
                  {guias.map((g) => <SelectItem key={g.id} value={g.id}>{g.numero_guia} — {formatKz(Number(g.valor))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Valor Pago (Kz)</Label><Input type="number" value={valor || ""} onChange={(e) => setValor(Number(e.target.value))} /></div>
          <div>
            <Label>Meio de Pagamento</Label>
            <Select value={meio} onValueChange={setMeio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deposito_bancario">Depósito Bancário</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="multicaixa">Multicaixa</SelectItem>
                <SelectItem value="numerario">Numerário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Referência / Comprovativo</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Nº do comprovativo..." /></div>
          <Button onClick={handlePagar} disabled={saving} className="w-full">{saving ? "A registar..." : "Registar Pagamento"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
