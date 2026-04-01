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
import { Receipt, CheckCircle, Clock, AlertTriangle, CreditCard, ShieldCheck, Send, Plus } from "lucide-react";
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

export default function PortalEmolumentos() {
  const { entity } = usePortalEntity();
  const [emolumentos, setEmolumentos] = useState<EmolumentoPortal[]>([]);
  const [guias, setGuias] = useState<Record<string, GuiaPortal[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
      setLoading(false);
    })();
  }, [entity.id]);

  const temEmolumentoValidado = emolumentos.some(e => e.estado === "validado" || e.estado === "isento");

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Emolumentos"
          description="Consulte o estado dos emolumentos e guias de pagamento"
        />
        <SolicitarGuiaDialog entityId={entity.id} entityName={entity.name} onDone={() => {
          // Reload emolumentos
          (async () => {
            const { data } = await supabase
              .from("emolumentos")
              .select("id, numero_processo, tipo_processo, valor_final, valor_pago, valor_divida, estado, created_at")
              .eq("entity_id", entity.id)
              .order("created_at", { ascending: false });
            setEmolumentos((data as unknown as EmolumentoPortal[]) || []);
          })();
        }} />
      </div>

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
                  <p className="text-xs text-muted-foreground">Não existem emolumentos associados a esta entidade. Contacte o Tribunal para solicitar a guia de pagamento.</p>
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
            <p className="text-xs text-muted-foreground mt-1">Contacte a Secretaria do Tribunal para solicitar a emissão da guia de pagamento.</p>
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
                      <p className="text-xs text-warning">Guia emitida. Efectue o pagamento para prosseguir.</p>
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
    await supabase.from("submission_notifications").insert({
      entity_id: entityId,
      entity_name: entityName,
      fiscal_year_id: `${entityId}-${exercicio}`,
      fiscal_year: exercicio,
      type: "submissao",
      message: `Solicitação de guia de pagamento de emolumento — Exercício ${exercicio}`,
      detail: `A entidade ${entityName} solicita a emissão da guia de pagamento do emolumento para o exercício ${exercicio}.\n\nTipo de processo: ${TIPOS.find(t => t.value === tipoProcesso)?.label || tipoProcesso}\n\n${observacoes ? `Observações: ${observacoes}` : ""}`,
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
