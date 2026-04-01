import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKz, ESTADO_LABELS, EstadoEmolumento } from "@/lib/emolumentosCalculo";
import { Receipt, CheckCircle, Clock, AlertTriangle, CreditCard, ShieldCheck, Send, Plus, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

interface EmolumentoPortal {
  id: string;
  numero_processo: string;
  tipo_processo: string;
  valor_final: number;
  valor_pago: number;
  valor_divida: number;
  estado: string;
  created_at: string;
}

interface GuiaPortal {
  id: string;
  numero_guia: string;
  valor: number;
  data_emissao: string;
  data_limite: string | null;
  estado: string;
}

interface SolicitacaoPendente {
  id: string;
  message: string;
  detail: string | null;
  created_at: string;
}

export default function PortalEmolumentos() {
  const { entity } = usePortalEntity();
  const [emolumentos, setEmolumentos] = useState<EmolumentoPortal[]>([]);
  const [guias, setGuias] = useState<Record<string, GuiaPortal[]>>({});
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<SolicitacaoPendente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("emolumentos")
      .select("id, numero_processo, tipo_processo, valor_final, valor_pago, valor_divida, estado, created_at")
      .eq("entity_id", entity.id)
      .order("created_at", { ascending: false });
    const ems = (data as unknown as EmolumentoPortal[]) || [];
    setEmolumentos(ems);

    // Load guias for each emolumento
    if (ems.length > 0) {
      const ids = ems.map(e => e.id);
      const { data: guiasData } = await supabase
        .from("emolumento_guias")
        .select("id, emolumento_id, numero_guia, valor, data_emissao, data_limite, estado")
        .in("emolumento_id", ids)
        .order("created_at", { ascending: false });
      
      const guiasMap: Record<string, GuiaPortal[]> = {};
      (guiasData || []).forEach((g: any) => {
        if (!guiasMap[g.emolumento_id]) guiasMap[g.emolumento_id] = [];
        guiasMap[g.emolumento_id].push(g);
      });
      setGuias(guiasMap);
    }

    // Load pending solicitations (requests sent but no emolumento yet)
    const { data: notifs } = await supabase
      .from("submission_notifications")
      .select("id, message, detail, created_at")
      .eq("entity_id", entity.id)
      .like("message", "%Solicitação de guia de pagamento%")
      .order("created_at", { ascending: false });

    // Filter: only show solicitations that don't have a matching emolumento
    const solPendentes = (notifs || []).filter(() => {
      // If entity has no emolumentos at all, all solicitations are pending
      return ems.length === 0;
    });
    // More precise: show if no emolumento created after the solicitation
    if (ems.length > 0) {
      const emolCreatedDates = ems.map(e => new Date(e.created_at).getTime());
      const filteredSols = (notifs || []).filter(n => {
        const solDate = new Date(n.created_at).getTime();
        // Pending if no emolumento was created after this solicitation
        return !emolCreatedDates.some(d => d >= solDate);
      });
      setSolicitacoesPendentes(filteredSols);
    } else {
      setSolicitacoesPendentes(notifs || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [entity.id]);

  const temEmolumentoValidado = emolumentos.some(e => e.estado === "validado" || e.estado === "isento");

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Emolumentos"
          description="Consulte o estado dos emolumentos e guias de pagamento"
        />
        <SolicitarGuiaDialog entityId={entity.id} entityName={entity.name} onDone={fetchData} />
      </div>

      {/* Solicitações pendentes */}
      {solicitacoesPendentes.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-warning">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-semibold">Solicitações Pendentes de Processamento</span>
            </div>
            {solicitacoesPendentes.map(sol => (
              <div key={sol.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  Enviada em {new Date(sol.created_at).toLocaleString("pt-AO")}
                </p>
                <p className="text-xs mt-1">{sol.message}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">Aguarda processamento pela Contadoria</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status geral */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {temEmolumentoValidado ? (
              <>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-success">Pagamento Validado</p>
                  <p className="text-xs text-muted-foreground">O formulário de prestação de contas está disponível.</p>
                </div>
              </>
            ) : emolumentos.length > 0 ? (
              <>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning">Aguardando Validação</p>
                  <p className="text-xs text-muted-foreground">O pagamento do emolumento deve ser validado pela Contadoria antes de poder submeter a prestação de contas.</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Sem Emolumentos</p>
                  <p className="text-xs text-muted-foreground">Solicite a guia de pagamento usando o botão acima.</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de emolumentos */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
      ) : emolumentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sem emolumentos registados para esta entidade.</p>
            <p className="text-xs text-muted-foreground mt-1">Utilize o botão "Solicitar Guia de Pagamento" para iniciar o processo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emolumentos.map(em => {
            const estadoInfo = ESTADO_LABELS[em.estado as EstadoEmolumento];
            const emGuias = guias[em.id] || [];

            return (
              <Card key={em.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Processo {em.numero_processo}
                    </CardTitle>
                    <Badge className={`${estadoInfo?.color || ""} text-xs`}>
                      {estadoInfo?.label || em.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Values */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Valor Final</p>
                      <p className="text-sm font-bold">{formatKz(Number(em.valor_final))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Valor Pago</p>
                      <p className="text-sm font-bold text-success">{formatKz(Number(em.valor_pago))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Em Dívida</p>
                      <p className="text-sm font-bold text-destructive">{formatKz(Number(em.valor_divida))}</p>
                    </div>
                  </div>

                  {/* Guias */}
                  {emGuias.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Receipt className="h-3 w-3" /> Guias de Pagamento
                      </div>
                      {emGuias.map(g => (
                        <div key={g.id} className="px-3 py-2 border-t flex items-center justify-between text-sm">
                          <div>
                            <span className="font-mono text-xs">{g.numero_guia}</span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {new Date(g.data_emissao).toLocaleDateString("pt-AO")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatKz(Number(g.valor))}</span>
                            {g.data_limite && (
                              <span className="text-[10px] text-muted-foreground">
                                Limite: {new Date(g.data_limite).toLocaleDateString("pt-AO")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action: Informar Pagamento */}
                  {["guia_emitida", "aguardando_pagamento", "calculado"].includes(em.estado) && (
                    <InformarPagamentoDialog
                      emolumentoId={em.id}
                      entityId={entity.id}
                      entityName={entity.name}
                      valorDivida={Number(em.valor_divida)}
                      onDone={fetchData}
                    />
                  )}

                  {/* Status message */}
                  {em.estado === "validado" && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 border border-success/20">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <p className="text-xs text-success">Pagamento validado. Pode submeter a prestação de contas.</p>
                    </div>
                  )}
                  {["guia_emitida", "aguardando_pagamento"].includes(em.estado) && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                      <CreditCard className="h-4 w-4 text-warning shrink-0" />
                      <p className="text-xs text-warning">Guia emitida. Efectue o pagamento e informe abaixo.</p>
                    </div>
                  )}
                  {["pago", "pago_em_excesso"].includes(em.estado) && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-xs text-primary">Pagamento registado. Aguarda validação pela Contadoria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}

/* ---------- Informar Pagamento Dialog ---------- */
function InformarPagamentoDialog({
  emolumentoId, entityId, entityName, valorDivida, onDone,
}: {
  emolumentoId: string; entityId: string; entityName: string; valorDivida: number; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(valorDivida);
  const [meio, setMeio] = useState("deposito_bancario");
  const [referencia, setReferencia] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [saving, setSaving] = useState(false);

  const handleInformar = async () => {
    if (valor <= 0) { toast.error("Indique o valor pago"); return; }
    if (!referencia.trim()) { toast.error("Indique a referência do comprovativo"); return; }
    setSaving(true);

    // Send notification to Contadoria with payment info
    await supabase.from("submission_notifications").insert({
      entity_id: entityId,
      entity_name: entityName,
      fiscal_year_id: `${entityId}-${new Date().getFullYear()}`,
      fiscal_year: String(new Date().getFullYear()),
      type: "submissao",
      message: `Pagamento de emolumento informado — ${formatKz(valor)}`,
      detail: `A entidade ${entityName} informa o pagamento do emolumento.\n\nValor: ${formatKz(valor)}\nMeio: ${meio === "deposito_bancario" ? "Depósito Bancário" : meio === "transferencia" ? "Transferência" : meio === "multicaixa" ? "Multicaixa" : "Numerário"}\nReferência: ${referencia}\n${dataPagamento ? `Data: ${new Date(dataPagamento).toLocaleDateString("pt-AO")}` : ""}\n\nEmolumento ID: ${emolumentoId}`,
    } as any);

    // Record in emolumento history
    await supabase.from("emolumento_historico").insert({
      emolumento_id: emolumentoId,
      acao: `Entidade informou pagamento de ${formatKz(valor)} via ${meio} (Ref: ${referencia})`,
      estado_novo: "aguardando_pagamento",
      executado_por: entityName,
      perfil_executor: "Entidade",
      observacoes: `Aguarda registo e validação pela Contadoria`,
    } as any);

    // Update emolumento state to awaiting payment confirmation
    await supabase.from("emolumentos").update({
      estado: "aguardando_pagamento",
    } as any).eq("id", emolumentoId);

    // Registar no log de auditoria
    await supabase.from("audit_log").insert({
      action: `Pagamento de emolumento informado — ${formatKz(valor)}`,
      username: entityName,
      action_type: "pagamento_emolumento_informado",
      detail: `Entidade: ${entityName}\nValor: ${formatKz(valor)}\nMeio: ${meio}\nReferência: ${referencia}${dataPagamento ? `\nData: ${dataPagamento}` : ""}`,
    } as any);

    toast.success("Pagamento informado com sucesso! A Contadoria irá verificar e validar.");
    setSaving(false);
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Upload className="h-4 w-4" />
          Informar Pagamento Efectuado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Informar Pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Informe os detalhes do pagamento efectuado. A Contadoria irá verificar e validar o pagamento.
          </p>

          <div>
            <Label className="text-xs">Valor Pago (Kz) *</Label>
            <Input
              type="number"
              value={valor || ""}
              onChange={(e) => setValor(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Meio de Pagamento</Label>
            <Select value={meio} onValueChange={setMeio}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deposito_bancario">Depósito Bancário</SelectItem>
                <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                <SelectItem value="multicaixa">Multicaixa</SelectItem>
                <SelectItem value="numerario">Numerário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Referência / Nº Comprovativo *</Label>
            <Input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Nº do comprovativo de pagamento..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Data do Pagamento</Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button onClick={handleInformar} disabled={saving} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {saving ? "A enviar..." : "Informar Pagamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Solicitar Guia de Pagamento Dialog ---------- */
function SolicitarGuiaDialog({ entityId, entityName, onDone }: { entityId: string; entityName: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [exercicio, setExercicio] = useState(String(new Date().getFullYear()));
  const [tipoProcesso, setTipoProcesso] = useState("contas");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  const TIPOS = [
    { value: "contas", label: "Processo de Contas" },
    { value: "contas_empresa_publica", label: "Contas — Empresa Pública" },
    { value: "visto_pessoal", label: "Visto — Actos relativos a pessoal" },
    { value: "visto_contratos", label: "Visto — Restantes actos e contratos" },
  ];

  const handleSolicitar = async () => {
    if (!exercicio.trim()) { toast.error("Indique o exercício fiscal"); return; }
    setSaving(true);

    // Create a notification to the Secretaria/Contadoria requesting the guide
    const { error } = await supabase.from("submission_notifications").insert({
      entity_id: entityId,
      entity_name: entityName,
      fiscal_year_id: `${entityId}-${exercicio}`,
      fiscal_year: exercicio,
      type: "submissao",
      message: `Solicitação de guia de pagamento de emolumento — Exercício ${exercicio}`,
      detail: `A entidade ${entityName} solicita a emissão da guia de pagamento do emolumento para o exercício ${exercicio}.\n\nTipo de processo: ${TIPOS.find(t => t.value === tipoProcesso)?.label || tipoProcesso}\n\n${observacoes ? `Observações: ${observacoes}` : ""}`,
    } as any);

    if (error) {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
      setSaving(false);
      return;
    }

    // Registar no log de auditoria
    await supabase.from("audit_log").insert({
      action: `Solicitação de guia de pagamento de emolumento — Exercício ${exercicio}`,
      username: entityName,
      action_type: "solicitacao_emolumento",
      detail: `Entidade: ${entityName}\nTipo: ${TIPOS.find(t => t.value === tipoProcesso)?.label || tipoProcesso}\nExercício: ${exercicio}${observacoes ? `\nObservações: ${observacoes}` : ""}`,
    } as any);

    toast.success("Solicitação de guia de pagamento enviada com sucesso! A Contadoria irá processar o pedido.");
    setSaving(false);
    setOpen(false);
    setObservacoes("");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Solicitar Guia de Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Solicitar Guia de Pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Solicite a emissão da guia de pagamento do emolumento. Após o processamento, a guia ficará disponível nesta página.
          </p>

          <div>
            <Label className="text-xs">Exercício Fiscal *</Label>
            <Input
              value={exercicio}
              onChange={(e) => setExercicio(e.target.value)}
              placeholder="Ex: 2024"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Tipo de Processo *</Label>
            <Select value={tipoProcesso} onValueChange={setTipoProcesso}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o pedido..."
              className="mt-1"
              rows={3}
            />
          </div>

          <Button onClick={handleSolicitar} disabled={saving} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {saving ? "A enviar..." : "Enviar Solicitação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
