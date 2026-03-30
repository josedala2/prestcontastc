import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/ui-custom/PageElements";
import {
  CheckCircle, XCircle, Clock, FileText, Eye, Send, Loader2,
  Undo2, ShieldCheck, ArrowRight, Inbox, AlertTriangle, Lock, Bell, Download,
} from "lucide-react";
import { toast } from "sonner";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { generateNotaRemessa, type ProcessoDocData } from "@/lib/workflowDocGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { WORKFLOW_STAGES } from "@/types/workflow";
import { saveAs } from "file-saver";
import { getDocumentRequirements } from "@/components/portal/EntidadeDocumentosTab";
import { EntityTipologia } from "@/types";

interface ProcessoValidacao {
  id: string;
  numero_processo: string;
  entity_id: string;
  entity_name: string;
  categoria_entidade: string;
  ano_gerencia: number;
  etapa_atual: number;
  estado: string;
  responsavel_atual: string | null;
  observacoes: string | null;
  data_submissao: string;
  created_at: string;
  completude_documental: number;
}

interface ProcessoDoc {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  estado: string;
  obrigatorio: boolean;
  caminho_ficheiro?: string | null;
}

interface SubmittedDoc {
  id: string;
  doc_id: string;
  doc_label: string;
  doc_category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  created_at: string;
}

export function SecretariaValidacaoTab() {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoValidacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoValidacao | null>(null);
  const [documentos, setDocumentos] = useState<ProcessoDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [entityTipologia, setEntityTipologia] = useState<EntityTipologia>("empresa_publica");

  // Notifications
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  // Submitted documents (from portal)
  const [submittedDocs, setSubmittedDocs] = useState<SubmittedDoc[]>([]);
  const [loadingSubmittedDocs, setLoadingSubmittedDocs] = useState(false);

  // Approve flow
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [encaminhando, setEncaminhando] = useState(false);
  const [approvedProcessos, setApprovedProcessos] = useState<string[]>([]);

  // Reject flow
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const isChefe = user?.role === "Chefe da Secretaria-Geral" ||
    user?.role === "Administrador do Sistema" ||
    user?.role === "Presidente do Tribunal de Contas";

  // Fetch encaminhamento notifications
  const fetchNotificacoes = useCallback(async () => {
    const { data } = await supabase
      .from("submission_notifications")
      .select("*")
      .eq("type", "encaminhamento_validacao")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotificacoes(data || []);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("submission_notifications").update({ read: true } as any).eq("id", id);
    setNotificacoes((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = useMemo(() => notificacoes.filter((n) => !n.read).length, [notificacoes]);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 3)
      .in("estado", ["pendente", "em_validacao", "validado"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProcessos(data as unknown as ProcessoValidacao[]);
    }
    setLoading(false);
  }, []);

  const fetchDocumentos = useCallback(async (processoId: string) => {
    setLoadingDocs(true);
    const { data } = await supabase
      .from("processo_documentos")
      .select("id, tipo_documento, nome_ficheiro, estado, obrigatorio, caminho_ficheiro")
      .eq("processo_id", processoId);
    setDocumentos((data as unknown as ProcessoDoc[]) || []);
    setLoadingDocs(false);
  }, []);

  // Fetch submitted documents from the entity portal
  const fetchSubmittedDocs = useCallback(async (entityId: string, anoGerencia: number) => {
    setLoadingSubmittedDocs(true);
    const fiscalYearId = `${entityId}-${anoGerencia}`;
    try {
      const { data, error } = await supabase
        .from("submission_documents")
        .select("*")
        .eq("entity_id", entityId)
        .eq("fiscal_year_id", fiscalYearId)
        .order("created_at", { ascending: true });
      if (!error) {
        setSubmittedDocs((data || []) as SubmittedDoc[]);
      }
    } catch (err) {
      console.error("Error fetching submitted docs:", err);
    } finally {
      setLoadingSubmittedDocs(false);
    }
  }, []);

  const handleViewSubmittedDoc = async (doc: SubmittedDoc) => {
    try {
      const { data, error } = await supabase.storage.from("submission-documents").download(doc.file_path);
      if (error || !data) { toast.error("Erro ao abrir documento."); return; }
      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
    } catch {
      toast.error("Erro ao abrir documento.");
    }
  };

  const handleViewProcessoDoc = async (doc: ProcessoDoc) => {
    if (!doc.caminho_ficheiro) return;
    try {
      const { data, error } = await supabase.storage.from("processo-documentos").download(doc.caminho_ficheiro);
      if (error || !data) { toast.error("Erro ao abrir documento."); return; }
      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
    } catch {
      toast.error("Erro ao abrir documento.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  useEffect(() => {
    fetchProcessos();
    fetchNotificacoes();
  }, [fetchProcessos, fetchNotificacoes]);

  useEffect(() => {
    if (selectedProcesso) {
      fetchDocumentos(selectedProcesso.id);
      fetchSubmittedDocs(selectedProcesso.entity_id, selectedProcesso.ano_gerencia);
      // Fetch entity tipologia for document requirements
      (async () => {
        const { data } = await supabase
          .from("entities")
          .select("tipologia")
          .eq("id", selectedProcesso.entity_id)
          .limit(1);
        if (data && data.length > 0) {
          setEntityTipologia(data[0].tipologia as EntityTipologia);
        }
      })();
    } else {
      setSubmittedDocs([]);
    }
  }, [selectedProcesso, fetchDocumentos, fetchSubmittedDocs]);

  // Build checklist: required docs mapped to submitted docs
  const checklistItems = useMemo(() => {
    const requirements = getDocumentRequirements(entityTipologia);
    return requirements.map((req) => {
      const matchedDoc = submittedDocs.find((d) => d.doc_id === req.id);
      return {
        ...req,
        submitted: !!matchedDoc,
        doc: matchedDoc || null,
      };
    });
  }, [entityTipologia, submittedDocs]);

  const checklistProgress = useMemo(() => {
    const required = checklistItems.filter((c) => c.required);
    const submitted = required.filter((c) => c.submitted);
    return { total: checklistItems.length, required: required.length, submitted: submitted.length, allRequired: submitted.length === required.length };
  }, [checklistItems]);

  // Approve validation — mark as validated and immediately advance to etapa 4 (Contadoria)
  const handleApprove = async () => {
    if (!selectedProcesso) return;
    setApproving(true);
    try {
      // Directly advance to etapa 4 (combines approve + forward in one step)
      await handleEncaminharContadoria(selectedProcesso);
      setApproveDialogOpen(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  // Forward to Contadoria Geral (etapa 4)
  const handleEncaminharContadoria = async (processo: ProcessoValidacao) => {
    setEncaminhando(true);
    try {
      // Generate Nota de Remessa PDF
      const docData: ProcessoDocData = {
        numeroProcesso: processo.numero_processo,
        entityName: processo.entity_name,
        anoGerencia: processo.ano_gerencia,
        categoriaEntidade: processo.categoria_entidade,
        canalEntrada: "portal",
        dataSubmissao: processo.data_submissao,
        responsavelAtual: "Chefe da Secretaria-Geral",
        submetidoPor: "Técnico da Secretaria-Geral",
        etapaAtual: 4,
        estado: "em_analise",
      };
      const executadoPor = user?.displayName || "Chefe da Secretaria-Geral";
      const notaBlob = await generateNotaRemessa(docData, executadoPor, "Contadoria Geral");

      // Upload to storage
      const sanitized = processo.numero_processo.replace(/[^a-zA-Z0-9-]/g, "_");
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Nota_Remessa_${sanitized}_${timestamp}.pdf`;
      const filePath = `${processo.id}/${fileName}`;

      await supabase.storage.from("processo-documentos").upload(filePath, notaBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      // Register Nota de Remessa in processo_documentos
      await supabase.from("processo_documentos").insert({
        processo_id: processo.id,
        tipo_documento: "Nota de Remessa",
        nome_ficheiro: fileName,
        caminho_ficheiro: filePath,
        estado: "validado",
        obrigatorio: true,
        validado_por: executadoPor,
        validado_em: new Date().toISOString(),
      } as any);

      // Also attach the Acta de Recebimento (generated earlier by Secretaria)
      try {
        const { data: actaData } = await supabase
          .from("actas_recepcao")
          .select("*")
          .eq("entity_id", processo.entity_id)
          .eq("fiscal_year", String(processo.ano_gerencia))
          .order("created_at", { ascending: false })
          .limit(1);

        if (actaData && actaData.length > 0) {
          const acta = actaData[0];
          // Copy acta file to processo-documentos bucket
          const actaDestPath = `${processo.id}/${acta.file_name}`;
          const { data: actaFileData } = await supabase.storage
            .from("actas-recepcao")
            .download(acta.file_path);

          if (actaFileData) {
            await supabase.storage.from("processo-documentos").upload(actaDestPath, actaFileData, {
              contentType: "application/pdf",
              upsert: true,
            });

            await supabase.from("processo_documentos").insert({
              processo_id: processo.id,
              tipo_documento: "Acta de Recebimento",
              nome_ficheiro: acta.file_name,
              caminho_ficheiro: actaDestPath,
              estado: "validado",
              obrigatorio: true,
              validado_por: executadoPor,
              validado_em: new Date().toISOString(),
            } as any);
          }
        }
      } catch (actaErr) {
        console.error("Erro ao anexar Acta de Recebimento:", actaErr);
      }

      // Download for user
      saveAs(notaBlob, fileName);

      // Advance workflow
      await avancarEtapaProcesso({
        processoId: processo.id,
        novaEtapa: 4,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Chefe da Secretaria-Geral",
        observacoes: "Nota de Remessa e Acta de Recebimento anexas. Encaminhado para verificação documental pela Contadoria Geral.",
        documentosGerados: ["Nota de Remessa", "Acta de Recebimento"],
      });

      // Update responsavel
      await supabase.from("processos").update({
        responsavel_atual: "Técnico da Contadoria Geral",
      }).eq("id", processo.id);

      // Generate activities for the next stage
      try {
        await gerarAtividadesParaEvento("encaminhamento_contadoria", processo.id, {
          categoriaEntidade: processo.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      // Notificação automática para a Contadoria Geral
      try {
        await supabase.from("submission_notifications").insert({
          entity_id: processo.entity_id,
          entity_name: processo.entity_name,
          fiscal_year_id: `${processo.entity_id}-${processo.ano_gerencia}`,
          fiscal_year: String(processo.ano_gerencia),
          type: "encaminhamento_contadoria",
          message: `Processo ${processo.numero_processo} de ${processo.entity_name} (${processo.ano_gerencia}) encaminhado para verificação documental`,
          detail: `A Chefe da Secretaria-Geral aprovou a validação documental e encaminhou o processo para a Contadoria Geral. Aguarda verificação detalhada pelo Técnico da Contadoria.`,
        } as any);
      } catch (err) {
        console.error("Erro ao criar notificação:", err);
      }

      toast.success(`Nota de Remessa gerada e processo ${processo.numero_processo} encaminhado para a Contadoria Geral`);
      // Remove from local list
      setProcessos((prev) => prev.filter((p) => p.id !== processo.id));
      setApprovedProcessos((prev) => prev.filter((id) => id !== processo.id));
      if (selectedProcesso?.id === processo.id) {
        setSelectedProcesso(null);
      }
    } catch (err: any) {
      toast.error(`Erro ao encaminhar: ${err.message}`);
    } finally {
      setEncaminhando(false);
    }
  };

  // Reject validation — send back to etapa 1
  const handleReject = async () => {
    if (!selectedProcesso || !motivoRejeicao.trim()) return;
    setRejecting(true);
    try {
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 1,
        novoEstado: "pendente_correccao",
        executadoPor: user?.displayName || "Chefe da Secretaria-Geral",
        perfilExecutor: "Chefe da Secretaria-Geral",
        observacoes: `Validação reprovada: ${motivoRejeicao}`,
      });

      await supabase.from("processos").update({
        responsavel_atual: "Técnico da Secretaria-Geral",
      }).eq("id", selectedProcesso.id);

      // Generate activities for rejected validation
      try {
        await gerarAtividadesParaEvento("validacao_reprovada", selectedProcesso.id, {
          categoriaEntidade: selectedProcesso.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      toast.warning(`Validação reprovada — ${selectedProcesso.entity_name}. Devolvido ao Técnico.`);
      setProcessos((prev) => prev.filter((p) => p.id !== selectedProcesso.id));
      setSelectedProcesso(null);
      setRejectDialogOpen(false);
      setMotivoRejeicao("");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setRejecting(false);
    }
  };

  const pendentesCount = processos.filter((p) => !approvedProcessos.includes(p.id)).length;
  const aprovadosCount = approvedProcessos.length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pendentes de Validação"
          value={pendentesCount}
          subtitle="aguardam decisão da chefia"
          icon={<Clock className="h-5 w-5" />}
          variant={pendentesCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Aprovados (por encaminhar)"
          value={aprovadosCount}
          subtitle="prontos para Contadoria Geral"
          icon={<CheckCircle className="h-5 w-5" />}
          variant={aprovadosCount > 0 ? "primary" : "default"}
        />
        <StatCard
          title="Total Processos"
          value={processos.length}
          subtitle="na etapa de validação"
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Notificações de Encaminhamento */}
      {isChefe && notificacoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notificações de Encaminhamento
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">
                  {unreadCount} pendente{unreadCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-48 overflow-y-auto">
            {notificacoes.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-2.5",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "mt-0.5 p-1 rounded-full shrink-0",
                  !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs leading-snug", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {n.message}
                  </p>
                  {n.detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.detail}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.created_at).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {!isChefe && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Apenas a Chefe da Secretaria-Geral pode aprovar ou reprovar validações.
              Está a visualizar em modo de leitura.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Process list */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                Processos em Validação
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {processos.length} processo(s) na etapa 3
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : processos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum processo pendente de validação.</p>
                </div>
              ) : (
                processos.map((proc) => {
                  const isApproved = approvedProcessos.includes(proc.id);
                  return (
                    <button
                      key={proc.id}
                      onClick={() => setSelectedProcesso(proc)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedProcesso?.id === proc.id
                          ? "border-primary bg-primary/5"
                          : isApproved
                            ? "border-green-300 bg-green-50 dark:bg-green-950/10"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{proc.entity_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{proc.numero_processo}</p>
                        </div>
                        {isApproved ? (
                          <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200">Aprovado</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Em Validação</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>Exercício {proc.ano_gerencia}</span>
                        <span>•</span>
                        <span>{new Date(proc.created_at).toLocaleDateString("pt-AO")}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Process detail */}
        <div className="lg:col-span-2">
          {!selectedProcesso ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">Seleccione um processo</p>
                <p className="text-sm">Escolha um processo da lista para validar a conformidade documental.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Process info card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {selectedProcesso.entity_name}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedProcesso.numero_processo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Exercício</p>
                      <p className="font-medium">{selectedProcesso.ano_gerencia}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Etapa Actual</p>
                      <p className="font-medium">3 — {WORKFLOW_STAGES[2]?.nome}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Estado</p>
                      <Badge variant="secondary" className="text-[10px]">{selectedProcesso.estado}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Completude</p>
                      <p className="font-medium">{selectedProcesso.completude_documental}%</p>
                    </div>
                  </div>
                  {selectedProcesso.observacoes && (
                    <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                      <strong>Observações:</strong> {selectedProcesso.observacoes}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist de Conformidade */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Checklist de Conformidade
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={checklistProgress.allRequired ? "default" : "destructive"} className="text-[10px]">
                        {checklistProgress.submitted}/{checklistProgress.required} obrigatórios
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {submittedDocs.length} ficheiro(s) total
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Documentos exigidos conforme a resolução aplicável. Visualize cada documento antes de aprovar.
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingSubmittedDocs ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> A carregar documentos…
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Documento Exigido</TableHead>
                          <TableHead className="text-center">Obrigatório</TableHead>
                          <TableHead>Ficheiro</TableHead>
                          <TableHead className="text-center">Tamanho</TableHead>
                          <TableHead className="text-center w-24">Acções</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checklistItems.map((item) => (
                          <TableRow key={item.id} className={cn(!item.submitted && item.required && "bg-destructive/5")}>
                            <TableCell className="text-center">
                              {item.submitted ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground opacity-40" />
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={cn("text-sm", item.submitted ? "font-medium" : "text-muted-foreground")}>
                                {item.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.required ? (
                                <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.doc ? (
                                <span className="text-xs truncate max-w-[180px] block" title={item.doc.file_name}>
                                  {item.doc.file_name}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Não submetido</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {item.doc ? formatFileSize(item.doc.file_size) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.doc ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    title={`Visualizar ${item.doc.file_name}`}
                                    onClick={() => handleViewSubmittedDoc(item.doc!)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    title={`Descarregar ${item.doc.file_name}`}
                                    onClick={() => handleViewSubmittedDoc(item.doc!)}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Additional submitted docs not in checklist */}
                        {submittedDocs
                          .filter((sd) => !checklistItems.some((ci) => ci.doc?.id === sd.id))
                          .map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="text-center">
                                <FileText className="h-4 w-4 text-primary opacity-60" />
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">{doc.doc_label}</span>
                                <p className="text-[10px] text-muted-foreground">{doc.doc_category}</p>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="text-[10px]">Adicional</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs truncate max-w-[180px] block" title={doc.file_name}>
                                  {doc.file_name}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewSubmittedDoc(doc)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewSubmittedDoc(doc)}>
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Documentos do Processo (gerados internamente) */}
              {documentos.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentos Internos do Processo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead className="text-center">Obrigatório</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-center w-20">Ver</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentos.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="text-sm">{doc.nome_ficheiro}</TableCell>
                            <TableCell className="text-center">
                              {doc.obrigatorio ? (
                                <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {doc.estado === "validado" ? (
                                <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                                  <CheckCircle className="h-3.5 w-3.5" /> Validado
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                                  <Clock className="h-3.5 w-3.5" /> {doc.estado}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {doc.caminho_ficheiro ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleViewProcessoDoc(doc)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              {isChefe && (
                <Card>
                  <CardContent className="py-4">
                    {approvedProcessos.includes(selectedProcesso.id) ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 text-sm text-green-800 dark:text-green-200">
                          <CheckCircle className="h-4 w-4" />
                          Validação aprovada. Gere a Nota de Remessa e encaminhe à Contadoria Geral.
                        </div>
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleEncaminharContadoria(selectedProcesso)}
                          disabled={encaminhando}
                        >
                          {encaminhando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          Gerar Nota de Remessa e Encaminhar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          className="gap-2 flex-1"
                          onClick={() => setRejectDialogOpen(true)}
                        >
                          <Undo2 className="h-4 w-4" />
                          Reprovar Validação
                        </Button>
                        <Button
                          className="gap-2 flex-1"
                          onClick={() => setApproveDialogOpen(true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprovar Validação
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Approve confirmation dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Aprovar Validação
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirma que a documentação do processo está conforme?</p>
                {selectedProcesso && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processo</span>
                      <span className="font-mono font-medium text-foreground">{selectedProcesso.numero_processo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entidade</span>
                      <span className="font-medium text-foreground">{selectedProcesso.entity_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercício</span>
                      <span className="font-medium text-foreground">{selectedProcesso.ano_gerencia}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Após aprovação, será gerada a Nota de Remessa e o processo encaminhado para a Contadoria Geral (Etapa 4).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approving} className="gap-2">
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reprovar Validação
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>O processo será devolvido ao Técnico da Secretaria-Geral para correcção.</p>
                {selectedProcesso && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <span className="text-muted-foreground">Processo:</span>{" "}
                    <span className="font-mono font-medium text-foreground">{selectedProcesso.numero_processo}</span>
                    {" — "}{selectedProcesso.entity_name}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="motivo" className="text-sm font-medium text-foreground">
                    Motivo da reprovação <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder="Descreva os problemas encontrados na documentação..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{motivoRejeicao.length}/500</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotivoRejeicao("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!motivoRejeicao.trim() || rejecting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Confirmar Reprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
