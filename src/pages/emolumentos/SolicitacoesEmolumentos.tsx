import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSalarioMinimo } from "@/hooks/useEmolumentos";
import { calcularEmolumento, formatKz, TIPO_PROCESSO_LABELS, TipoProcesso } from "@/lib/emolumentosCalculo";
import { toast } from "sonner";
import { Inbox, CheckCircle, Receipt, Calculator, Clock, Eye } from "lucide-react";

interface Solicitacao {
  id: string;
  entity_id: string;
  entity_name: string;
  fiscal_year: string;
  fiscal_year_id: string;
  message: string;
  detail: string | null;
  created_at: string;
  read: boolean;
  processada: boolean; // derived: if emolumento exists for this entity+year
}

export default function SolicitacoesEmolumentos() {
  const { user } = useAuth();
  const { salarioMinimo } = useSalarioMinimo();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSol, setSelectedSol] = useState<Solicitacao | null>(null);
  const [emitirOpen, setEmitirOpen] = useState(false);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    // Fetch notifications that are guide requests
    const { data: notifs } = await supabase
      .from("submission_notifications")
      .select("*")
      .like("message", "%Solicitação de guia de pagamento%")
      .order("created_at", { ascending: false });

    if (!notifs) { setLoading(false); return; }

    // Check which ones already have emolumentos created (match by entity_id + fiscal year via numero_processo)
    const entityIds = [...new Set(notifs.map(n => n.entity_id))];
    const { data: emols } = await supabase
      .from("emolumentos")
      .select("entity_id, numero_processo, estado")
      .in("entity_id", entityIds.length > 0 ? entityIds : ["__none__"]);

    // Build a set of "entity_id|fiscal_year" keys from existing emolumentos
    const emolKeySet = new Set(
      (emols || []).map(e => {
        // Extract year from numero_processo (e.g. "EMO-2024/123456" or "PC-2024/0001")
        const yearMatch = e.numero_processo.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : "";
        return `${e.entity_id}|${year}`;
      })
    );

    const mapped: Solicitacao[] = notifs.map(n => ({
      id: n.id,
      entity_id: n.entity_id,
      entity_name: n.entity_name,
      fiscal_year: n.fiscal_year,
      fiscal_year_id: n.fiscal_year_id,
      message: n.message,
      detail: n.detail,
      created_at: n.created_at,
      read: n.read,
      processada: emolMap.has(n.entity_id),
    }));

    setSolicitacoes(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchSolicitacoes(); }, []);

  const pendentes = solicitacoes.filter(s => !s.processada);
  const processadas = solicitacoes.filter(s => s.processada);

  return (
    <AppLayout>
      <div className="p-6 space-y-4 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold font-serif">Solicitações de Emolumentos</h1>
          <p className="text-sm text-muted-foreground">Pedidos de emissão de guia de pagamento recebidos das entidades</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Inbox className="h-8 w-8 text-primary opacity-50" />
              <div>
                <p className="text-xs text-muted-foreground">Total Recebidas</p>
                <p className="text-2xl font-bold">{solicitacoes.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning opacity-50" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{pendentes.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success opacity-50" />
              <div>
                <p className="text-xs text-muted-foreground">Processadas</p>
                <p className="text-2xl font-bold text-success">{processadas.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">A carregar...</p>
        ) : solicitacoes.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Sem solicitações de emolumentos</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {pendentes.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pendentes de Processamento</h2>
                {pendentes.map(sol => (
                  <SolicitacaoCard
                    key={sol.id}
                    sol={sol}
                    onEmitir={() => { setSelectedSol(sol); setEmitirOpen(true); }}
                  />
                ))}
              </>
            )}
            {processadas.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">Já Processadas</h2>
                {processadas.map(sol => (
                  <SolicitacaoCard key={sol.id} sol={sol} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Emitir Guia Dialog */}
        {selectedSol && (
          <EmitirGuiaFromSolicitacao
            open={emitirOpen}
            onOpenChange={setEmitirOpen}
            solicitacao={selectedSol}
            salarioMinimo={salarioMinimo}
            userName={user?.displayName || "Contadoria"}
            userRole={user?.role || "Contadoria Geral"}
            onDone={() => {
              setEmitirOpen(false);
              setSelectedSol(null);
              fetchSolicitacoes();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

/* ---------- Card de Solicitação ---------- */
function SolicitacaoCard({ sol, onEmitir }: { sol: Solicitacao; onEmitir?: () => void }) {
  // Extract tipo from detail
  const tipoMatch = sol.detail?.match(/Tipo de processo:\s*(.+?)(\n|$)/);
  const tipoLabel = tipoMatch ? tipoMatch[1].trim() : "—";

  return (
    <Card className={`transition-shadow hover:shadow-md ${!sol.processada ? "border-l-4 border-l-warning" : "border-l-4 border-l-success"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{sol.entity_name}</span>
              <Badge variant="outline" className="text-[10px]">Exercício {sol.fiscal_year}</Badge>
              {sol.processada ? (
                <Badge className="bg-success/10 text-success border-success/30 text-[10px]">Processada</Badge>
              ) : (
                <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px]">Pendente</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{tipoLabel}</p>
            <p className="text-[10px] text-muted-foreground">
              Recebida em {new Date(sol.created_at).toLocaleString("pt-AO")}
            </p>
            {sol.detail && (
              <details className="mt-1">
                <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                  <Eye className="h-3 w-3 inline mr-1" />Ver detalhes
                </summary>
                <p className="text-xs text-muted-foreground whitespace-pre-line mt-1 bg-muted/30 p-2 rounded">{sol.detail}</p>
              </details>
            )}
          </div>
          {!sol.processada && onEmitir && (
            <Button size="sm" onClick={onEmitir} className="gap-1.5 shrink-0">
              <Receipt className="h-4 w-4" />
              Criar Emolumento e Emitir Guia
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Dialog: Criar Emolumento + Emitir Guia ---------- */
function EmitirGuiaFromSolicitacao({
  open, onOpenChange, solicitacao, salarioMinimo, userName, userRole, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  solicitacao: Solicitacao;
  salarioMinimo: number;
  userName: string;
  userRole: string;
  onDone: () => void;
}) {
  // Infer tipo from detail
  const tipoMatch = solicitacao.detail?.match(/Tipo de processo:\s*(.+?)(\n|$)/);
  const tipoRaw = tipoMatch ? tipoMatch[1].trim() : "";
  const inferTipo = (): TipoProcesso => {
    if (tipoRaw.includes("Contas") && tipoRaw.includes("Empresa")) return "contas_empresa_publica";
    if (tipoRaw.includes("Contas")) return "contas";
    if (tipoRaw.includes("pessoal")) return "visto_pessoal";
    if (tipoRaw.includes("contratos")) return "visto_contratos";
    return "contas";
  };

  const [tipo, setTipo] = useState<TipoProcesso>(inferTipo());
  const [baseCalculo, setBaseCalculo] = useState(0);
  const [dataLimite, setDataLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const calculo = baseCalculo > 0 ? calcularEmolumento(tipo, baseCalculo, salarioMinimo) : null;

  const handleEmitir = async () => {
    if (baseCalculo <= 0) { toast.error("Informe a base de cálculo"); return; }
    if (!calculo) return;

    setSaving(true);

    // 1. Find or create processo reference
    // Use a synthetic processo reference for standalone emolumentos
    const numProcesso = `EMO-${solicitacao.fiscal_year}/${Date.now().toString().slice(-6)}`;

    // Check if there's a matching processo
    const { data: existingProc } = await supabase
      .from("processos")
      .select("id, numero_processo")
      .eq("entity_id", solicitacao.entity_id)
      .eq("ano_gerencia", Number(solicitacao.fiscal_year))
      .limit(1)
      .maybeSingle();

    const processoId = existingProc?.id || crypto.randomUUID();
    const processoNumero = existingProc?.numero_processo || numProcesso;

    // If no processo exists, we still need a valid UUID for the FK
    if (!existingProc) {
      // Create a minimal processo entry
      await supabase.from("processos").insert({
        id: processoId,
        numero_processo: processoNumero,
        entity_id: solicitacao.entity_id,
        entity_name: solicitacao.entity_name,
        ano_gerencia: Number(solicitacao.fiscal_year),
        categoria_entidade: "categoria_1",
        estado: "emolumento_pendente",
        etapa_atual: 13,
        submetido_por: userName,
      } as any);
    }

    // 2. Create emolumento
    const { data: emol, error: emolErr } = await supabase.from("emolumentos").insert({
      processo_id: processoId,
      entity_id: solicitacao.entity_id,
      entity_name: solicitacao.entity_name,
      numero_processo: processoNumero,
      tipo_processo: tipo,
      base_calculo: baseCalculo,
      taxa_aplicada: calculo.taxa,
      salario_minimo_ref: salarioMinimo,
      valor_minimo: calculo.valorMinimo,
      valor_final: calculo.valorFinal,
      valor_divida: calculo.valorFinal,
      base_legal: calculo.baseLegal,
      estado: "guia_emitida",
      observacoes: `Emolumento criado a partir de solicitação da entidade.`,
    } as any).select("id").single();

    if (emolErr || !emol) {
      toast.error("Erro ao criar emolumento");
      setSaving(false);
      return;
    }

    const emolumentoId = (emol as any).id;

    // 3. Emit guia
    const seq = Date.now().toString().slice(-6);
    const numGuia = `GC-${new Date().getFullYear()}/${seq}`;
    await supabase.from("emolumento_guias").insert({
      emolumento_id: emolumentoId,
      numero_guia: numGuia,
      valor: calculo.valorFinal,
      data_limite: dataLimite || null,
      emitido_por: userName,
    } as any);

    // 4. Record history
    await supabase.from("emolumento_historico").insert({
      emolumento_id: emolumentoId,
      acao: `Emolumento criado e guia ${numGuia} emitida no valor de ${formatKz(calculo.valorFinal)} — Solicitação da entidade`,
      estado_novo: "guia_emitida",
      executado_por: userName,
      perfil_executor: userRole,
    } as any);

    // 5. Notify entity
    await supabase.from("submission_notifications").insert({
      entity_id: solicitacao.entity_id,
      entity_name: solicitacao.entity_name,
      fiscal_year_id: solicitacao.fiscal_year_id,
      fiscal_year: solicitacao.fiscal_year,
      type: "submissao",
      message: `Guia de pagamento emitida — ${numGuia}`,
      detail: `A guia de pagamento do emolumento foi emitida pela Contadoria.\n\nNº Guia: ${numGuia}\nValor: ${formatKz(calculo.valorFinal)}\n${dataLimite ? `Data limite: ${new Date(dataLimite).toLocaleDateString("pt-AO")}` : ""}`,
    } as any);

    // 6. Mark original solicitation as read
    await supabase.from("submission_notifications").update({ read: true } as any).eq("id", solicitacao.id);

    toast.success(`Emolumento criado e guia ${numGuia} emitida com sucesso!`);
    setSaving(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Criar Emolumento e Emitir Guia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity info */}
          <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">Entidade:</span> <strong>{solicitacao.entity_name}</strong></p>
            <p><span className="text-muted-foreground">Exercício:</span> {solicitacao.fiscal_year}</p>
          </div>

          <div>
            <Label className="text-xs">Tipo de Processo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoProcesso)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_PROCESSO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Base de Cálculo (Kz)</Label>
            <Input
              type="number"
              value={baseCalculo || ""}
              onChange={(e) => setBaseCalculo(Number(e.target.value))}
              placeholder="Ex: 50000000"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Data Limite de Pagamento</Label>
            <Input
              type="date"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Preview */}
          {calculo && (
            <Card className="bg-muted/20">
              <CardContent className="p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <Calculator className="h-4 w-4" />
                  Pré-visualização do Cálculo
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Taxa:</span>
                  <span className="font-medium">{(calculo.taxa * 100).toFixed(1)}%</span>
                  <span className="text-muted-foreground">Valor Calculado:</span>
                  <span className="font-medium">{formatKz(calculo.valorCalculado)}</span>
                  <span className="text-muted-foreground">Valor Mínimo Legal:</span>
                  <span className="font-medium">{formatKz(calculo.valorMinimo)}</span>
                  <span className="text-muted-foreground">Valor Final:</span>
                  <span className="font-bold text-primary text-sm">{formatKz(calculo.valorFinal)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{calculo.baseLegal}</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleEmitir} disabled={saving || baseCalculo <= 0} className="w-full gap-2">
            <Receipt className="h-4 w-4" />
            {saving ? "A processar..." : "Criar Emolumento e Emitir Guia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
