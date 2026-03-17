import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES, WORKFLOW_ESTADOS, CATEGORIAS_ENTIDADE, type Processo, type ProcessoHistorico } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, Building2,
  User, Calendar, ChevronRight, AlertTriangle, History, Send
} from "lucide-react";
import { cn } from "@/lib/utils";

const ProcessoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [historico, setHistorico] = useState<ProcessoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [procRes, histRes] = await Promise.all([
      supabase.from("processos").select("*").eq("id", id).single(),
      supabase.from("processo_historico").select("*").eq("processo_id", id).order("created_at", { ascending: false }),
    ]);
    if (procRes.data) setProcesso(procRes.data as any);
    if (histRes.data) setHistorico(histRes.data as any[]);
    setLoading(false);
  };

  const advanceStage = async () => {
    if (!processo || processo.etapa_atual >= 18) return;
    setAdvancing(true);

    const nextStage = processo.etapa_atual + 1;
    const nextStageInfo = WORKFLOW_STAGES.find(s => s.id === nextStage);
    const newEstado = nextStage === 18 ? "arquivado" : nextStage >= 12 ? "em_decisao" : nextStage >= 8 ? "em_analise" : "em_validacao";

    const { error } = await supabase.from("processos").update({
      etapa_atual: nextStage,
      estado: newEstado,
      responsavel_atual: nextStageInfo?.responsavelPerfil || null,
      updated_at: new Date().toISOString(),
    } as any).eq("id", processo.id);

    if (!error) {
      await supabase.from("processo_historico").insert({
        processo_id: processo.id,
        etapa_anterior: processo.etapa_atual,
        etapa_seguinte: nextStage,
        estado_anterior: processo.estado,
        estado_seguinte: newEstado,
        acao: `Processo avançado para: ${nextStageInfo?.nome}`,
        executado_por: user?.displayName || "Sistema",
        perfil_executor: user?.role || null,
        observacoes: observacoes || null,
        documentos_gerados: nextStageInfo?.documentosGerados?.length ? nextStageInfo.documentosGerados : null,
      } as any);

      toast({ title: "Processo avançado", description: `Transitou para: ${nextStageInfo?.nome}` });
      setObservacoes("");
      loadData();
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setAdvancing(false);
  };

  const returnToPrevious = async () => {
    if (!processo || processo.etapa_atual <= 1) return;
    setAdvancing(true);

    const prevStage = processo.etapa_atual - 1;
    const prevStageInfo = WORKFLOW_STAGES.find(s => s.id === prevStage);

    const { error } = await supabase.from("processos").update({
      etapa_atual: prevStage,
      estado: "pendente_correccao",
      responsavel_atual: prevStageInfo?.responsavelPerfil || null,
      updated_at: new Date().toISOString(),
    } as any).eq("id", processo.id);

    if (!error) {
      await supabase.from("processo_historico").insert({
        processo_id: processo.id,
        etapa_anterior: processo.etapa_atual,
        etapa_seguinte: prevStage,
        estado_anterior: processo.estado,
        estado_seguinte: "pendente_correccao",
        acao: `Processo devolvido para: ${prevStageInfo?.nome}`,
        executado_por: user?.displayName || "Sistema",
        perfil_executor: user?.role || null,
        observacoes: observacoes || null,
      } as any);

      toast({ title: "Processo devolvido", description: `Devolvido para: ${prevStageInfo?.nome}` });
      setObservacoes("");
      loadData();
    }
    setAdvancing(false);
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">A carregar...</div></AppLayout>;
  }

  if (!processo) {
    return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Processo não encontrado</div></AppLayout>;
  }

  const currentStage = WORKFLOW_STAGES.find(s => s.id === processo.etapa_atual);
  const estadoInfo = WORKFLOW_ESTADOS.find(e => e.value === processo.estado);
  const categoria = CATEGORIAS_ENTIDADE.find(c => c.id === processo.categoria_entidade);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/gestao-processos")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-serif">{processo.numero_processo}</h1>
            <Badge variant="outline" className={cn("text-xs font-medium", estadoInfo?.color)}>
              {estadoInfo?.label || processo.estado}
            </Badge>
            {processo.urgencia === "urgente" && (
              <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Urgente</Badge>
            )}
            <Badge variant="outline" className={cn("text-xs", processo.canal_entrada === "portal" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
              {processo.canal_entrada === "portal" ? "Portal" : "Presencial"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{processo.entity_name} — Exercício {processo.ano_gerencia}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Tramitação — 18 Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const isCurrent = stage.id === processo.etapa_atual;
                  const isCompleted = stage.id < processo.etapa_atual;
                  const isPending = stage.id > processo.etapa_atual;

                  return (
                    <div key={stage.id} className="flex gap-3 mb-1 last:mb-0">
                      {/* Connector */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                          isCompleted && "bg-green-500 border-green-500 text-white",
                          isCurrent && "bg-primary border-primary text-primary-foreground animate-pulse",
                          isPending && "bg-background border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stage.id}
                        </div>
                        {idx < WORKFLOW_STAGES.length - 1 && (
                          <div className={cn(
                            "w-0.5 h-6 my-0.5",
                            isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
                          )} />
                        )}
                      </div>
                      {/* Content */}
                      <div className={cn(
                        "flex-1 pb-2 pt-0.5",
                        isCurrent && "bg-primary/5 rounded-lg px-3 py-2 -mt-0.5 border border-primary/20",
                      )}>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            isPending && "text-muted-foreground",
                            isCompleted && "text-green-700",
                            isCurrent && "text-primary font-bold"
                          )}>
                            {stage.nome}
                          </p>
                          {isCurrent && <Badge className="text-[10px] h-4">Actual</Badge>}
                        </div>
                        {isCurrent && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">{stage.descricao}</p>
                            <p className="text-xs mt-1"><span className="font-semibold">Responsável:</span> {stage.responsavelPerfil}</p>
                            {stage.documentosGerados.length > 0 && (
                              <p className="text-xs mt-0.5"><span className="font-semibold">Documentos:</span> {stage.documentosGerados.join(", ")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {processo.estado !== "arquivado" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Acções da Etapa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStage && (
                  <div className="flex flex-wrap gap-2">
                    {currentStage.acoes.map((acao, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{acao}</Badge>
                    ))}
                  </div>
                )}
                <Textarea
                  placeholder="Observações para o registo de tramitação..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={returnToPrevious} disabled={advancing || processo.etapa_atual <= 1}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Devolver
                  </Button>
                  <Button onClick={advanceStage} disabled={advancing || processo.etapa_atual >= 18} className="flex-1">
                    {processo.etapa_atual >= 18 ? "Processo Concluído" : (
                      <>
                        Avançar para: {WORKFLOW_STAGES.find(s => s.id === processo.etapa_atual + 1)?.nome}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Histórico de Tramitação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sem registo de tramitação</p>
              ) : (
                <div className="space-y-3">
                  {historico.map(h => (
                    <div key={h.id} className="flex gap-3 border-l-2 border-primary/20 pl-3 py-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{h.acao}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            <User className="h-3 w-3 inline mr-1" />
                            {h.executado_por}
                            {h.perfil_executor && ` (${h.perfil_executor})`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(h.created_at).toLocaleString("pt-AO")}
                          </span>
                        </div>
                        {h.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{h.observacoes}"</p>
                        )}
                        {h.documentos_gerados && h.documentos_gerados.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {h.documentos_gerados.map((d, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                <FileText className="h-3 w-3 mr-1" />{d}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Dados do Processo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Nº Processo" value={processo.numero_processo} />
              <InfoRow label="Entidade" value={processo.entity_name} />
              <InfoRow label="Categoria" value={categoria?.nome || processo.categoria_entidade} />
              <InfoRow label="Resolução" value={processo.resolucao_aplicavel || "—"} />
              <InfoRow label="Ano de Gerência" value={String(processo.ano_gerencia)} />
              {processo.periodo_gerencia && <InfoRow label="Período" value={processo.periodo_gerencia} />}
              <Separator />
              <InfoRow label="Canal de Entrada" value={processo.canal_entrada === "portal" ? "Portal" : "Presencial"} />
              <InfoRow label="Submetido por" value={processo.submetido_por} />
              <InfoRow label="Data Submissão" value={new Date(processo.data_submissao).toLocaleDateString("pt-AO")} />
              <Separator />
              <InfoRow label="Responsável Actual" value={processo.responsavel_atual || "—"} />
              {processo.divisao_competente && <InfoRow label="Divisão" value={processo.divisao_competente} />}
              {processo.seccao_competente && <InfoRow label="Secção" value={processo.seccao_competente} />}
              {processo.juiz_relator && <InfoRow label="Juiz Relator" value={processo.juiz_relator} />}
              {processo.tecnico_analise && <InfoRow label="Técnico" value={processo.tecnico_analise} />}
              {processo.portador_nome && (
                <>
                  <Separator />
                  <InfoRow label="Portador" value={processo.portador_nome} />
                  {processo.portador_documento && <InfoRow label="Doc. Portador" value={processo.portador_documento} />}
                </>
              )}
            </CardContent>
          </Card>

          {/* Checklist documental */}
          {categoria && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Checklist Documental
                </CardTitle>
                <p className="text-xs text-muted-foreground">{categoria.baseLegal}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoria.documentos.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center",
                        doc.obrigatorio ? "border-destructive/50" : "border-muted-foreground/30"
                      )}>
                        {doc.obrigatorio && <span className="text-[8px] text-destructive font-bold">!</span>}
                      </div>
                      <div>
                        <p className="text-xs">{doc.nome}</p>
                        <p className={cn("text-[10px]", doc.obrigatorio ? "text-destructive" : "text-muted-foreground")}>
                          {doc.obrigatorio ? "Obrigatório" : "Facultativo"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-xs text-right max-w-[60%]">{value}</span>
  </div>
);

export default ProcessoDetalhe;
