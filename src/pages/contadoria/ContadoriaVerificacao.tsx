import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TecnicoLayout } from "@/components/TecnicoLayout";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Download, CheckCircle2, XCircle, ClipboardCheck, Send, ArrowLeft, Eye, AlertTriangle, Mail } from "lucide-react";
import { CATEGORIAS_ENTIDADE } from "@/types/workflow";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { generateRelatorioVerificacao, type ProcessoDocData, type ChecklistItem } from "@/lib/workflowDocGenerator";
import { saveAs } from "file-saver";
import { getDocumentRequirements } from "@/components/portal/EntidadeDocumentosTab";
import { EntityTipologia, TIPOLOGIA_RESOLUCAO, RESOLUCAO_LABELS } from "@/types";

interface Processo {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
  ano_gerencia: number;
  categoria_entidade: string;
  data_submissao: string;
  estado: string;
  etapa_atual: number;
  completude_documental: number;
}

interface ProcessoDoc {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
  obrigatorio: boolean;
  validado_por: string | null;
  validado_em: string | null;
  observacoes: string | null;
}

// Internal process documents always shown in checklist
const INTERNAL_CHECKLIST_ITEMS = [
  { id: "acta_recepcao", label: "Acta de Recepção", required: true },
  { id: "nota_remessa", label: "Nota de Remessa", required: true },
];

export default function ContadoriaVerificacao() {
  const { user } = useAuth();
  // avancarEtapaProcesso imported directly

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [entityTipologia, setEntityTipologia] = useState<EntityTipologia>("empresa_publica");
  const [documentos, setDocumentos] = useState<ProcessoDoc[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [solicitarDialogOpen, setSolicitarDialogOpen] = useState(false);
  const [elementosSelecionados, setElementosSelecionados] = useState<Record<string, boolean>>({});
  const [mensagemSolicitacao, setMensagemSolicitacao] = useState("");
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [acting, setActing] = useState(false);

  // Dynamic checklist based on entity tipologia
  const docRequirements = useMemo(() => getDocumentRequirements(entityTipologia), [entityTipologia]);
  const resolucao = TIPOLOGIA_RESOLUCAO[entityTipologia];
  const resolucaoInfo = RESOLUCAO_LABELS[resolucao];

  const CHECKLIST_ITEMS = useMemo(() => {
    const items = docRequirements.map(d => ({
      id: d.id,
      label: d.label,
      obrigatorio: d.required,
    }));
    // Add internal process docs
    INTERNAL_CHECKLIST_ITEMS.forEach(item => {
      if (!items.find(i => i.id === item.id)) {
        items.push({ id: item.id, label: item.label, obrigatorio: item.required });
      }
    });
    return items;
  }, [docRequirements]);

  const executadoPor = user?.displayName || "Técnico da Contadoria Geral";

  // Load processes at etapa 4
  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 4)
      .order("created_at", { ascending: false });
    setProcessos((data as any[]) || []);
    setLoading(false);
  };

  // Load documents for selected process
  useEffect(() => {
    if (!selectedProcesso) {
      setDocumentos([]);
      setCheckedItems({});
      setObservacoes({});
      return;
    }
    fetchDocumentos(selectedProcesso.id);
    // Fetch entity tipologia for dynamic checklist
    (async () => {
      const { data } = await supabase
        .from("entities")
        .select("tipologia")
        .eq("id", selectedProcesso.entity_id)
        .single();
      if (data?.tipologia) {
        setEntityTipologia(data.tipologia as EntityTipologia);
      }
    })();
  }, [selectedProcesso]);

  const fetchDocumentos = async (processoId: string) => {
    const { data } = await supabase
      .from("processo_documentos")
      .select("*")
      .eq("processo_id", processoId)
      .order("created_at", { ascending: true });
    setDocumentos((data as any[]) || []);
  };

  const handlePreviewDoc = async (doc: ProcessoDoc) => {
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

  const handleDownloadDoc = async (doc: ProcessoDoc) => {
    if (!doc.caminho_ficheiro) return;
    const { data } = await supabase.storage.from("processo-documentos").download(doc.caminho_ficheiro);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nome_ficheiro;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const requiredCount = CHECKLIST_ITEMS.filter((i) => i.obrigatorio).length;
  const requiredChecked = CHECKLIST_ITEMS.filter((i) => i.obrigatorio && checkedItems[i.id]).length;
  const allRequiredChecked = requiredChecked === requiredCount;

  // Approve → advance to etapa 5
  const handleApprove = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      // Build checklist data for the report
      const checklistData: ChecklistItem[] = CHECKLIST_ITEMS.map((item) => ({
        label: item.label,
        obrigatorio: item.obrigatorio,
        verificado: !!checkedItems[item.id],
        observacao: observacoes[item.id] || undefined,
      }));

      const docData: ProcessoDocData = {
        numeroProcesso: selectedProcesso.numero_processo,
        entityName: selectedProcesso.entity_name,
        anoGerencia: selectedProcesso.ano_gerencia,
        categoriaEntidade: selectedProcesso.categoria_entidade,
        canalEntrada: "portal",
        dataSubmissao: selectedProcesso.data_submissao,
        responsavelAtual: executadoPor,
        submetidoPor: "sistema",
        etapaAtual: selectedProcesso.etapa_atual,
        estado: selectedProcesso.estado,
      };

      const docsAnexos = documentos.map((d) => ({
        tipo: d.tipo_documento,
        ficheiro: d.nome_ficheiro,
        estado: d.estado,
      }));

      // Generate Relatório de Verificação Documental PDF
      const relatorioBlob = await generateRelatorioVerificacao(docData, executadoPor, checklistData, docsAnexos);

      const sanitized = selectedProcesso.numero_processo.replace(/[^a-zA-Z0-9-]/g, "_");
      const timestamp = new Date().toISOString().slice(0, 10);
      const relatorioFileName = `Relatorio_Verificacao_${sanitized}_${timestamp}.pdf`;
      const relatorioPath = `${selectedProcesso.id}/${relatorioFileName}`;

      // Upload to storage
      await supabase.storage.from("processo-documentos").upload(relatorioPath, relatorioBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      // Register in processo_documentos
      await supabase.from("processo_documentos").insert({
        processo_id: selectedProcesso.id,
        tipo_documento: "Relatório de Verificação Documental",
        nome_ficheiro: relatorioFileName,
        caminho_ficheiro: relatorioPath,
        estado: "validado",
        obrigatorio: true,
        validado_por: executadoPor,
        validado_em: new Date().toISOString(),
      } as any);

      // Download for user
      saveAs(relatorioBlob, relatorioFileName);

      // Advance workflow
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 5,
        novoEstado: "verificado",
        executadoPor,
        perfilExecutor: "Técnico da Contadoria Geral",
        observacoes: `Verificação documental concluída — ${checkedCount}/${CHECKLIST_ITEMS.length} itens verificados. Relatório de Verificação gerado.`,
        documentosGerados: ["Relatório de Verificação Documental"],
      });

      await supabase.from("processos").update({
        responsavel_atual: "Escrivão dos Autos",
        completude_documental: Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100),
      } as any).eq("id", selectedProcesso.id);

      try {
        await gerarAtividadesParaEvento("validacao_aprovada", selectedProcesso.id, {
          categoriaEntidade: selectedProcesso.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      toast.success(`Relatório de Verificação gerado — ${selectedProcesso.numero_processo} encaminhado para Registo e Autuação`);
      setApproveDialogOpen(false);
      setSelectedProcesso(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // Reject → return process to entity for re-editing
  const handleReject = async () => {
    if (!selectedProcesso || !motivoRejeicao.trim()) return;
    setActing(true);
    try {
      const fiscalYearId = `${selectedProcesso.entity_id}-${selectedProcesso.ano_gerencia}`;
      const fiscalYear = String(selectedProcesso.ano_gerencia);

      // Return to etapa 2 (devolvido à entidade)
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 2,
        novoEstado: "devolvido",
        executadoPor,
        perfilExecutor: "Técnico da Contadoria Geral",
        observacoes: `Processo devolvido à entidade pela Contadoria: ${motivoRejeicao.trim()}`,
      });

      await supabase.from("processos").update({
        responsavel_atual: "Entidade",
      } as any).eq("id", selectedProcesso.id);

      // Update submission status to allow entity to re-edit and resubmit
      await supabase.from("submissions").update({
        status: "rejeitado",
        rejeitado_at: new Date().toISOString(),
        motivo_rejeicao: motivoRejeicao.trim(),
      } as any).eq("entity_id", selectedProcesso.entity_id).eq("fiscal_year_id", fiscalYearId);

      // Notify entity about rejection
      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: fiscalYearId,
        fiscal_year: fiscalYear,
        type: "rejeitado",
        message: `Processo ${selectedProcesso.numero_processo} devolvido pela Contadoria Geral — Exercício ${fiscalYear}`,
        detail: `O Técnico da Contadoria Geral devolveu o processo com o seguinte motivo:\n\n${motivoRejeicao.trim()}\n\nPor favor, corrija as irregularidades apontadas e volte a submeter a prestação de contas através do Portal.`,
      } as any);

      // Notify Secretaria about the return
      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: fiscalYearId,
        fiscal_year: fiscalYear,
        type: "devolucao_contadoria",
        message: `Processo ${selectedProcesso.numero_processo} devolvido pela Contadoria à entidade ${selectedProcesso.entity_name}`,
        detail: `Motivo: ${motivoRejeicao.trim()}\n\nO processo foi devolvido à entidade para correcção. A Secretaria será notificada quando a entidade resubmeter.`,
      } as any);

      toast.warning(`Processo ${selectedProcesso.numero_processo} devolvido à entidade ${selectedProcesso.entity_name}`);
      setRejectDialogOpen(false);
      setMotivoRejeicao("");
      setSelectedProcesso(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // Solicitar elementos em falta
  const uncheckedItems = CHECKLIST_ITEMS.filter((i) => !checkedItems[i.id]);

  const handleSolicitarElementos = async () => {
    if (!selectedProcesso) return;
    const selected = CHECKLIST_ITEMS.filter((i) => elementosSelecionados[i.id]);
    if (selected.length === 0) {
      toast.error("Seleccione pelo menos um elemento em falta");
      return;
    }
    setActing(true);
    try {
      const fiscalYearId = `${selectedProcesso.entity_id}-${selectedProcesso.ano_gerencia}`;
      const fiscalYear = String(selectedProcesso.ano_gerencia);
      const listaElementos = selected.map((i) => `• ${i.label}`).join("\n");
      const detalhe = mensagemSolicitacao.trim()
        ? `${listaElementos}\n\nObservações: ${mensagemSolicitacao.trim()}`
        : listaElementos;

      // Return process to entity (etapa 2) to allow re-submission
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 2,
        novoEstado: "aguardando_elementos",
        executadoPor,
        perfilExecutor: "Técnico da Contadoria Geral",
        observacoes: `Solicitação de ${selected.length} elemento(s) em falta. Processo devolvido à entidade.`,
      });

      await supabase.from("processos").update({
        responsavel_atual: "Entidade",
      } as any).eq("id", selectedProcesso.id);

      // Notify entity about missing elements
      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: fiscalYearId,
        fiscal_year: fiscalYear,
        type: "solicitacao_elementos",
        message: `Solicitação de elementos em falta — Processo ${selectedProcesso.numero_processo}`,
        detail: detalhe,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Notify Secretaria about the solicitation
      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: fiscalYearId,
        fiscal_year: fiscalYear,
        type: "devolucao_contadoria",
        message: `Processo ${selectedProcesso.numero_processo} — Elementos solicitados à entidade ${selectedProcesso.entity_name}`,
        detail: `Foram solicitados ${selected.length} elemento(s) em falta:\n\n${detalhe}\n\nPrazo: 15 dias. A Secretaria será notificada quando a entidade responder.`,
      } as any);

      // Log in processo_historico
      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 4,
        etapa_seguinte: 2,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: "aguardando_elementos",
        acao: `Solicitação de ${selected.length} elemento(s) em falta — processo devolvido à entidade`,
        executado_por: executadoPor,
        perfil_executor: "Técnico da Contadoria Geral",
        observacoes: detalhe,
      } as any);

      toast.success(`Solicitação de ${selected.length} elemento(s) enviada — processo devolvido à entidade ${selectedProcesso.entity_name}`);
      setSolicitarDialogOpen(false);
      setElementosSelecionados({});
      setMensagemSolicitacao("");
      setSelectedProcesso(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // Separate attached docs into categories
  const actaDoc = documentos.find((d) => d.tipo_documento === "Acta de Recebimento");
  const notaDoc = documentos.find((d) => d.tipo_documento === "Nota de Remessa");
  const otherDocs = documentos.filter((d) => d.tipo_documento !== "Acta de Recebimento" && d.tipo_documento !== "Nota de Remessa");

  return (
    <TecnicoLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Verificação Documental</h1>
          <p className="text-sm text-muted-foreground">Conferência dos processos encaminhados pela Secretaria-Geral (Etapa 4)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Process list */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Processos Pendentes ({processos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
                ) : processos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem processos na etapa 4</p>
                ) : (
                  <div className="divide-y divide-border">
                    {processos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProcesso(p)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                          selectedProcesso?.id === p.id ? "bg-primary/5 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{p.numero_processo}</span>
                          <Badge variant="secondary" className="text-[10px]">Etapa 4</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.entity_name}</p>
                        <p className="text-[10px] text-muted-foreground">Exercício: {p.ano_gerencia}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detail panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedProcesso ? (
              <Card className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground text-sm">Seleccione um processo para iniciar a verificação</p>
              </Card>
            ) : (
              <>
                {/* Process info */}
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processo</p>
                        <p className="font-semibold text-foreground">{selectedProcesso.numero_processo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entidade</p>
                        <p className="font-medium text-foreground truncate">{selectedProcesso.entity_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exercício</p>
                        <p className="font-medium text-foreground">{selectedProcesso.ano_gerencia}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Completude</p>
                        <p className="font-medium text-foreground">{selectedProcesso.completude_documental}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attached documents (Acta + Nota de Remessa) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Documentos Anexos ao Processo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3">Nenhum documento anexo encontrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Tipo</TableHead>
                            <TableHead className="text-xs">Ficheiro</TableHead>
                            <TableHead className="text-xs">Estado</TableHead>
                            <TableHead className="text-xs">Validado por</TableHead>
                            <TableHead className="text-xs text-right">Acções</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Show Acta and Nota first, then others */}
                          {[actaDoc, notaDoc, ...otherDocs].filter(Boolean).map((doc) => (
                            <TableRow key={doc!.id} className={
                              doc!.tipo_documento === "Acta de Recebimento" || doc!.tipo_documento === "Nota de Remessa"
                                ? "bg-primary/5"
                                : ""
                            }>
                              <TableCell className="text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  {doc!.tipo_documento}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {doc!.nome_ficheiro}
                              </TableCell>
                              <TableCell>
                                <Badge variant={doc!.estado === "validado" ? "default" : "secondary"} className="text-[10px]">
                                  {doc!.estado === "validado" ? "Validado" : "Pendente"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {doc!.validado_por || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handlePreviewDoc(doc!)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDownloadDoc(doc!)}>
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

                {/* Checklist */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      Checklist de Conformidade — Resolução nº 1/17
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {checkedCount}/{CHECKLIST_ITEMS.length} verificados
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-10">✓</TableHead>
                          <TableHead className="text-xs">Documento</TableHead>
                          <TableHead className="text-xs w-24">Obrigatório</TableHead>
                          <TableHead className="text-xs w-20">Anexo</TableHead>
                          <TableHead className="text-xs">Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {CHECKLIST_ITEMS.map((item) => {
                          // Match checklist item to an attached document by label similarity
                          const matchedDoc = documentos.find((d) =>
                            d.tipo_documento.toLowerCase().includes(item.label.toLowerCase().split(" ")[0]) ||
                            item.label.toLowerCase().includes(d.tipo_documento.toLowerCase().split(" ")[0]) ||
                            d.nome_ficheiro.toLowerCase().includes(item.id.replace(/_/g, ""))
                          );
                          return (
                            <TableRow key={item.id} className={matchedDoc ? "" : "bg-muted/30"}>
                              <TableCell>
                                <Checkbox
                                  checked={!!checkedItems[item.id]}
                                  onCheckedChange={() => toggleCheck(item.id)}
                                />
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {item.label}
                                {matchedDoc && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                    {matchedDoc.nome_ficheiro}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.obrigatorio ? (
                                  <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">Facultativo</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {matchedDoc ? (
                                  <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 px-2" title="Visualizar" onClick={() => handlePreviewDoc(matchedDoc)}>
                                      <Eye className="h-3.5 w-3.5 text-primary" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2" title="Descarregar" onClick={() => handleDownloadDoc(matchedDoc)}>
                                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <input
                                  type="text"
                                  placeholder="Observação..."
                                  className="text-xs bg-transparent border-b border-border w-full focus:outline-none focus:border-primary py-1"
                                  value={observacoes[item.id] || ""}
                                  onChange={(e) => setObservacoes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={acting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Devolver à Secretaria
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Pre-select unchecked items
                      const preSelected: Record<string, boolean> = {};
                      uncheckedItems.forEach((i) => { preSelected[i.id] = true; });
                      setElementosSelecionados(preSelected);
                      setSolicitarDialogOpen(true);
                    }}
                    disabled={acting || uncheckedItems.length === 0}
                    className="border-amber-500 text-amber-700 hover:bg-amber-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Solicitar Elementos ({uncheckedItems.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setApproveDialogOpen(true)}
                    disabled={!allRequiredChecked || acting}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Aprovar e Encaminhar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Approve dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Aprovação</AlertDialogTitle>
            <AlertDialogDescription>
              O processo <strong>{selectedProcesso?.numero_processo}</strong> será encaminhado para a etapa de Registo e Autuação.
              Foram verificados {checkedCount} de {CHECKLIST_ITEMS.length} documentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={acting}>
              {acting ? "A processar..." : "Confirmar Aprovação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver Processo</AlertDialogTitle>
            <AlertDialogDescription>
              Indique o motivo da devolução do processo <strong>{selectedProcesso?.numero_processo}</strong> à Secretaria-Geral.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da devolução..."
            value={motivoRejeicao}
            onChange={(e) => setMotivoRejeicao(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={acting || !motivoRejeicao.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? "A processar..." : "Confirmar Devolução"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Solicitar elementos dialog */}
      <Dialog open={solicitarDialogOpen} onOpenChange={setSolicitarDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-600" />
              Solicitar Elementos em Falta
            </DialogTitle>
            <DialogDescription>
              Seleccione os documentos em falta para notificar a entidade <strong>{selectedProcesso?.entity_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  id={`elem-${item.id}`}
                  checked={!!elementosSelecionados[item.id]}
                  onCheckedChange={() =>
                    setElementosSelecionados((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                />
                <Label htmlFor={`elem-${item.id}`} className="text-sm cursor-pointer flex-1">
                  {item.label}
                  {item.obrigatorio && (
                    <Badge variant="destructive" className="ml-2 text-[9px]">Obrigatório</Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Observações adicionais (opcional)</Label>
            <Textarea
              placeholder="Indique informações adicionais sobre os elementos solicitados..."
              value={mensagemSolicitacao}
              onChange={(e) => setMensagemSolicitacao(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSolicitarDialogOpen(false)} disabled={acting}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSolicitarElementos}
              disabled={acting || Object.values(elementosSelecionados).filter(Boolean).length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {acting ? "A enviar..." : `Enviar Solicitação (${Object.values(elementosSelecionados).filter(Boolean).length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TecnicoLayout>
  );
}
