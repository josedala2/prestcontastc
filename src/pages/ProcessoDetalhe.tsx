import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { roleStagePermissions } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES, WORKFLOW_ESTADOS, CATEGORIAS_ENTIDADE, type Processo, type ProcessoHistorico } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { generateWorkflowDocument, type ProcessoDocData } from "@/lib/workflowDocGenerator";
import { saveAs } from "file-saver";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, Building2,
  User, Calendar, AlertTriangle, History, Send, Download, Loader2, Upload, Trash2, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
interface ProcessoDocumento {
  id: string;
  processo_id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
  obrigatorio: boolean;
  versao: number;
  created_at: string;
}

const ProcessoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canActOnStage } = useAuth();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [historico, setHistorico] = useState<ProcessoHistorico[]>([]);
  const [documentos, setDocumentos] = useState<ProcessoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTipoDoc, setUploadTipoDoc] = useState("Documento Digitalizado");
  const [previewDoc, setPreviewDoc] = useState<ProcessoDocumento | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [procRes, histRes, docsRes] = await Promise.all([
      supabase.from("processos").select("*").eq("id", id).single(),
      supabase.from("processo_historico").select("*").eq("processo_id", id).order("created_at", { ascending: false }),
      supabase.from("processo_documentos").select("*").eq("processo_id", id).order("created_at", { ascending: false }),
    ]);
    if (procRes.data) setProcesso(procRes.data as any);
    if (histRes.data) setHistorico(histRes.data as any[]);
    if (docsRes.data) setDocumentos(docsRes.data as any[]);
    setLoading(false);
  };

  const buildDocData = (): ProcessoDocData | null => {
    if (!processo) return null;
    const cat = CATEGORIAS_ENTIDADE.find(c => c.id === processo.categoria_entidade);
    return {
      numeroProcesso: processo.numero_processo,
      entityName: processo.entity_name,
      anoGerencia: processo.ano_gerencia,
      categoriaEntidade: cat?.nome || processo.categoria_entidade,
      canalEntrada: processo.canal_entrada,
      dataSubmissao: processo.data_submissao,
      responsavelAtual: processo.responsavel_atual || "",
      submetidoPor: processo.submetido_por,
      juizRelator: processo.juiz_relator || undefined,
      tecnicoAnalise: processo.tecnico_analise || undefined,
      portadorNome: processo.portador_nome || undefined,
      portadorDocumento: processo.portador_documento || undefined,
      observacoes: processo.observacoes || undefined,
      etapaAtual: processo.etapa_atual,
      estado: processo.estado,
    };
  };

  const generateAndSaveDocument = async (docType: string) => {
    if (!processo) return;
    setGeneratingDoc(docType);
    try {
      const docData = buildDocData();
      if (!docData) return;
      const result = await generateWorkflowDocument(docType, docData, user?.displayName || "Sistema");
      if (!result) {
        toast({ title: "Documento não suportado", description: `"${docType}" ainda não tem modelo definido.`, variant: "destructive" });
        return;
      }

      // Save to processo_documentos table
      await supabase.from("processo_documentos").insert({
        processo_id: processo.id,
        tipo_documento: docType,
        nome_ficheiro: result.fileName,
        estado: "gerado",
        obrigatorio: false,
        versao: 1,
      } as any);

      // Download
      saveAs(result.blob, result.fileName);
      toast({ title: "Documento gerado", description: `${docType} — ${result.fileName}` });
      loadData();
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingDoc(null);
    }
  };

  const autoGenerateStageDocuments = async (stageId: number) => {
    const stage = WORKFLOW_STAGES.find(s => s.id === stageId);
    if (!stage || stage.documentosGerados.length === 0 || !processo) return;

    const docData = buildDocData();
    if (!docData) return;

    const generated: string[] = [];
    for (const docType of stage.documentosGerados) {
      try {
        const result = await generateWorkflowDocument(docType, docData, user?.displayName || "Sistema");
        if (result) {
          await supabase.from("processo_documentos").insert({
            processo_id: processo.id,
            tipo_documento: docType,
            nome_ficheiro: result.fileName,
            estado: "gerado",
            obrigatorio: false,
            versao: 1,
          } as any);
          saveAs(result.blob, result.fileName);
          generated.push(docType);
        }
      } catch { /* continue */ }
    }
    return generated;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !processo) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const filePath = `${processo.id}/etapa-${processo.etapa_atual}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("processo-documentos")
          .upload(filePath, file);

        if (uploadError) {
          toast({ title: "Erro no upload", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
          continue;
        }

        await supabase.from("processo_documentos").insert({
          processo_id: processo.id,
          tipo_documento: uploadTipoDoc,
          nome_ficheiro: file.name,
          caminho_ficheiro: filePath,
          estado: "anexado",
          obrigatorio: false,
          versao: 1,
        } as any);

        // Record in history
        await supabase.from("processo_historico").insert({
          processo_id: processo.id,
          etapa_anterior: processo.etapa_atual,
          etapa_seguinte: processo.etapa_atual,
          estado_anterior: processo.estado,
          estado_seguinte: processo.estado,
          acao: `Documento anexado: ${file.name}`,
          executado_por: user?.displayName || "Sistema",
          perfil_executor: user?.role || null,
          observacoes: `Tipo: ${uploadTipoDoc} | Etapa: ${WORKFLOW_STAGES.find(s => s.id === processo.etapa_atual)?.nome}`,
          documentos_alterados: [file.name],
        } as any);
      }

      toast({ title: "Upload concluído", description: `${files.length} ficheiro(s) anexado(s) com sucesso` });
      loadData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getFilePublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("processo-documentos").getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const downloadAttachment = async (filePath: string, fileName: string) => {
    const url = getFilePublicUrl(filePath);
    if (url) window.open(url, "_blank");
  };

  const openPreview = (doc: ProcessoDocumento) => {
    if (!doc.caminho_ficheiro) return;
    const url = getFilePublicUrl(doc.caminho_ficheiro);
    setPreviewUrl(url);
    setPreviewDoc(doc);
  };

  const isPdfFile = (fileName: string) =>
    fileName.toLowerCase().endsWith(".pdf");

  const isImageFile = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp|tif|tiff)$/i.test(fileName);

  const deleteAttachment = async (docId: string, filePath: string | null) => {
    if (filePath) {
      await supabase.storage.from("processo-documentos").remove([filePath]);
    }
    // We can't delete from processo_documentos (no RLS), so mark as removed
    await supabase.from("processo_documentos").update({ estado: "removido" } as any).eq("id", docId);
    toast({ title: "Documento removido" });
    loadData();
  };

  const advanceStage = async () => {
    if (!processo || processo.etapa_atual >= 18) return;
    setAdvancing(true);

    const currentStageId = processo.etapa_atual;
    const nextStage = currentStageId + 1;
    const nextStageInfo = WORKFLOW_STAGES.find(s => s.id === nextStage);
    const currentStageInfo = WORKFLOW_STAGES.find(s => s.id === currentStageId);
    const newEstado = nextStage === 18 ? "arquivado" : nextStage >= 12 ? "em_decisao" : nextStage >= 8 ? "em_analise" : "em_validacao";

    // Auto-generate documents for the CURRENT stage before advancing
    let generatedDocs: string[] = [];
    if (currentStageInfo?.documentosGerados?.length) {
      const docs = await autoGenerateStageDocuments(currentStageId);
      if (docs) generatedDocs = docs;
    }

    const { error } = await supabase.from("processos").update({
      etapa_atual: nextStage,
      estado: newEstado,
      responsavel_atual: nextStageInfo?.responsavelPerfil || null,
      updated_at: new Date().toISOString(),
    } as any).eq("id", processo.id);

    if (!error) {
      await supabase.from("processo_historico").insert({
        processo_id: processo.id,
        etapa_anterior: currentStageId,
        etapa_seguinte: nextStage,
        estado_anterior: processo.estado,
        estado_seguinte: newEstado,
        acao: `Processo avançado para: ${nextStageInfo?.nome}`,
        executado_por: user?.displayName || "Sistema",
        perfil_executor: user?.role || null,
        observacoes: observacoes || null,
        documentos_gerados: generatedDocs.length > 0 ? generatedDocs : (currentStageInfo?.documentosGerados?.length ? currentStageInfo.documentosGerados : null),
      } as any);

      // Internal notification for the next responsible
      await supabase.from("submission_notifications").insert({
        entity_id: processo.entity_id,
        entity_name: processo.entity_name,
        fiscal_year_id: `fy-${processo.ano_gerencia}`,
        fiscal_year: String(processo.ano_gerencia),
        type: "em_analise",
        message: `Processo ${processo.numero_processo} avançou para etapa ${nextStage}: ${nextStageInfo?.nome}`,
        detail: `O processo da entidade ${processo.entity_name} (${processo.numero_processo}) transitou da etapa ${currentStageId} para a etapa ${nextStage}. Responsável: ${nextStageInfo?.responsavelPerfil || "—"}.${observacoes ? ` Observações: ${observacoes}` : ""}`,
      } as any);

      const docMsg = generatedDocs.length > 0 ? ` | Documentos gerados: ${generatedDocs.join(", ")}` : "";
      toast({ title: "Processo avançado", description: `Transitou para: ${nextStageInfo?.nome}${docMsg}` });
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

      // Internal notification for the previous responsible
      await supabase.from("submission_notifications").insert({
        entity_id: processo.entity_id,
        entity_name: processo.entity_name,
        fiscal_year_id: `fy-${processo.ano_gerencia}`,
        fiscal_year: String(processo.ano_gerencia),
        type: "rejeitado",
        message: `Processo ${processo.numero_processo} devolvido para etapa ${prevStage}: ${prevStageInfo?.nome}`,
        detail: `O processo da entidade ${processo.entity_name} (${processo.numero_processo}) foi devolvido da etapa ${processo.etapa_atual} para a etapa ${prevStage}. Responsável: ${prevStageInfo?.responsavelPerfil || "—"}.${observacoes ? ` Motivo: ${observacoes}` : ""}`,
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
  const canAct = canActOnStage(processo.etapa_atual);

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
                  const isMyStage = user?.role ? (roleStagePermissions[user.role] || []).includes(stage.id) : false;

                  return (
                    <div key={stage.id} className={cn(
                      "flex gap-3 mb-1 last:mb-0",
                      isMyStage && !isCurrent && "relative",
                    )}>
                      {/* Left indicator for user's stages */}
                      {isMyStage && !isCurrent && (
                        <div className="absolute -left-1.5 top-1 w-1 h-5 rounded-full bg-accent" />
                      )}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                          isCompleted && "bg-green-500 border-green-500 text-white",
                          isCurrent && isMyStage && "bg-accent border-accent text-accent-foreground ring-2 ring-accent/30 ring-offset-1",
                          isCurrent && !isMyStage && "bg-primary border-primary text-primary-foreground animate-pulse",
                          isPending && isMyStage && "bg-accent/20 border-accent text-accent-foreground",
                          isPending && !isMyStage && "bg-background border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stage.id}
                        </div>
                        {idx < WORKFLOW_STAGES.length - 1 && (
                          <div className={cn("w-0.5 h-6 my-0.5", isCompleted ? "bg-green-500" : "bg-muted-foreground/20")} />
                        )}
                      </div>
                      <div className={cn(
                        "flex-1 pb-2 pt-0.5",
                        isCurrent && isMyStage && "bg-accent/10 rounded-lg px-3 py-2 -mt-0.5 border border-accent/30",
                        isCurrent && !isMyStage && "bg-primary/5 rounded-lg px-3 py-2 -mt-0.5 border border-primary/20",
                      )}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn(
                            "text-sm font-medium",
                            isPending && !isMyStage && "text-muted-foreground",
                            isPending && isMyStage && "text-accent-foreground",
                            isCompleted && "text-green-700",
                            isCurrent && "text-primary font-bold"
                          )}>
                            {stage.nome}
                          </p>
                          {isCurrent && isMyStage && (
                            <Badge className="text-[10px] h-4 bg-accent text-accent-foreground">A sua etapa</Badge>
                          )}
                          {isCurrent && !isMyStage && <Badge className="text-[10px] h-4">Actual</Badge>}
                          {!isCurrent && isMyStage && (
                            <span className="text-[10px] text-accent font-semibold">● Sua competência</span>
                          )}
                        </div>
                        {/* Always show responsible profile */}
                        <p className={cn(
                          "text-[10px] mt-0.5",
                          isCurrent ? "text-muted-foreground" : "text-muted-foreground/70"
                        )}>
                          <User className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                          {stage.responsavelPerfil}
                          {stage.prazoDefault > 0 && <span className="ml-2">· {stage.prazoDefault}d</span>}
                        </p>
                        {isCurrent && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">{stage.descricao}</p>
                            {stage.documentosGerados.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs font-semibold">Documentos a gerar:</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {stage.documentosGerados.map((d, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/20" onClick={() => generateAndSaveDocument(d)}>
                                      {generatingDoc === d ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                                      {d}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
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
                {!canAct && (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">Sem permissão nesta etapa</p>
                      <p className="text-[11px] text-amber-600">
                        O seu perfil <strong>{user?.role}</strong> não pode agir na etapa actual.
                        Responsável: <strong>{currentStage?.responsavelPerfil}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStage && (
                  <div className="flex flex-wrap gap-2">
                    {currentStage.acoes.map((acao, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{acao}</Badge>
                    ))}
                  </div>
                )}
                {canAct ? (
                  <>
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
                        {advancing ? (
                          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A processar...</span>
                        ) : processo.etapa_atual >= 18 ? "Processo Concluído" : (
                          <>
                            Avançar para: {WORKFLOW_STAGES.find(s => s.id === processo.etapa_atual + 1)?.nome}
                            {currentStage?.documentosGerados?.length ? ` (+ ${currentStage.documentosGerados.length} doc${currentStage.documentosGerados.length > 1 ? "s" : ""})` : ""}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aguardando acção do perfil responsável para esta etapa.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents (Generated + Uploaded) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Documentos do Processo ({documentos.filter(d => d.estado !== "removido").length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload section */}
              {canAct && processo.estado !== "arquivado" && (
                <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Anexar Documentos à Etapa Actual
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">Tipo de documento</label>
                      <Select value={uploadTipoDoc} onValueChange={setUploadTipoDoc}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Documento Digitalizado">Documento Digitalizado</SelectItem>
                          <SelectItem value="Comprovativo">Comprovativo</SelectItem>
                          <SelectItem value="Extracto Bancário">Extracto Bancário</SelectItem>
                          <SelectItem value="Relatório">Relatório</SelectItem>
                          <SelectItem value="Ofício">Ofício</SelectItem>
                          <SelectItem value="Despacho">Despacho</SelectItem>
                          <SelectItem value="Parecer">Parecer</SelectItem>
                          <SelectItem value="Certidão">Certidão</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                      {uploading ? "A enviar..." : "Escolher ficheiros"}
                    </Button>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tif,.tiff"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-[10px] text-muted-foreground">PDF, Word, Excel, Imagens — até 50 MB por ficheiro</p>
                </div>
              )}

              {/* Document list */}
              {documentos.filter(d => d.estado !== "removido").length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum documento anexado</p>
              ) : (
                <div className="space-y-2">
                  {documentos.filter(d => d.estado !== "removido").map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded flex items-center justify-center",
                          doc.estado === "anexado" ? "bg-blue-100" : "bg-primary/10"
                        )}>
                          <FileText className={cn("h-4 w-4", doc.estado === "anexado" ? "text-blue-600" : "text-primary")} />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{doc.tipo_documento}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.nome_ficheiro} — {new Date(doc.created_at).toLocaleString("pt-AO")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={cn("text-[10px]",
                          doc.estado === "gerado" && "bg-green-50 text-green-700",
                          doc.estado === "anexado" && "bg-blue-50 text-blue-700",
                          doc.estado === "pendente" && "bg-amber-50 text-amber-700"
                        )}>
                          {doc.estado === "gerado" ? "Gerado" : doc.estado === "anexado" ? "Anexado" : "Pendente"}
                        </Badge>
                        {doc.caminho_ficheiro ? (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Pré-visualizar" onClick={() => openPreview(doc)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Descarregar" onClick={() => downloadAttachment(doc.caminho_ficheiro!, doc.nome_ficheiro)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => generateAndSaveDocument(doc.tipo_documento)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canAct && doc.estado === "anexado" && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteAttachment(doc.id, doc.caminho_ficheiro)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* Inline PDF/Image Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) { setPreviewDoc(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate">{previewDoc?.nome_ficheiro}</span>
              <Badge variant="outline" className="text-[10px] ml-2">{previewDoc?.tipo_documento}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border overflow-hidden bg-muted/30">
            {previewUrl && previewDoc && isPdfFile(previewDoc.nome_ficheiro) ? (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title={`Pré-visualização: ${previewDoc.nome_ficheiro}`}
              />
            ) : previewUrl && previewDoc && isImageFile(previewDoc.nome_ficheiro) ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  src={previewUrl}
                  alt={previewDoc.nome_ficheiro}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <FileText className="h-12 w-12 opacity-30" />
                <p className="text-sm">Pré-visualização não disponível para este formato.</p>
                {previewDoc?.caminho_ficheiro && (
                  <Button size="sm" variant="outline" onClick={() => downloadAttachment(previewDoc.caminho_ficheiro!, previewDoc.nome_ficheiro)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Descarregar Ficheiro
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {previewDoc && new Date(previewDoc.created_at).toLocaleString("pt-AO")}
            </p>
            {previewDoc?.caminho_ficheiro && (
              <Button size="sm" variant="outline" onClick={() => downloadAttachment(previewDoc.caminho_ficheiro!, previewDoc.nome_ficheiro)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Descarregar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
