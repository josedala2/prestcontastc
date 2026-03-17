import { useState, useEffect } from "react";
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

const CHECKLIST_ITEMS = [
  { id: "balancete", label: "Balancete de Verificação", obrigatorio: true },
  { id: "balanco", label: "Balanço Patrimonial", obrigatorio: true },
  { id: "dr", label: "Demonstração de Resultados", obrigatorio: true },
  { id: "fluxo_caixa", label: "Mapa de Fluxos de Caixa", obrigatorio: true },
  { id: "notas", label: "Notas às Demonstrações Financeiras", obrigatorio: true },
  { id: "inventario", label: "Inventário Patrimonial", obrigatorio: true },
  { id: "extracto", label: "Extracto Bancário", obrigatorio: true },
  { id: "reconciliacao", label: "Reconciliação Bancária", obrigatorio: true },
  { id: "relatorio_gestao", label: "Relatório de Gestão", obrigatorio: true },
  { id: "certidao_divida", label: "Certidão de Dívida", obrigatorio: false },
  { id: "orcamento", label: "Mapa de Execução Orçamental", obrigatorio: true },
  { id: "relacao_abates", label: "Relação de Abates", obrigatorio: false },
];

export default function ContadoriaVerificacao() {
  const { user } = useAuth();
  // avancarEtapaProcesso imported directly

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
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
    const { data } = supabase.storage.from("processo-documentos").getPublicUrl(doc.caminho_ficheiro);
    if (data?.publicUrl) window.open(data.publicUrl, "_blank");
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

  // Reject → return to etapa 3
  const handleReject = async () => {
    if (!selectedProcesso || !motivoRejeicao.trim()) return;
    setActing(true);
    try {
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 3,
        novoEstado: "em_validacao",
        executadoPor,
        perfilExecutor: "Técnico da Contadoria Geral",
        observacoes: `Devolvido à Secretaria: ${motivoRejeicao.trim()}`,
      });

      await supabase.from("processos").update({
        responsavel_atual: "Chefe da Secretaria-Geral",
      } as any).eq("id", selectedProcesso.id);

      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: `${selectedProcesso.entity_id}-${selectedProcesso.ano_gerencia}`,
        fiscal_year: String(selectedProcesso.ano_gerencia),
        type: "devolucao_contadoria",
        message: `Processo ${selectedProcesso.numero_processo} devolvido pela Contadoria Geral`,
        detail: motivoRejeicao.trim(),
      } as any);

      toast.warning(`Processo ${selectedProcesso.numero_processo} devolvido à Secretaria`);
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
      const listaElementos = selected.map((i) => `• ${i.label}`).join("\n");
      const detalhe = mensagemSolicitacao.trim()
        ? `${listaElementos}\n\nObservações: ${mensagemSolicitacao.trim()}`
        : listaElementos;

      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: `${selectedProcesso.entity_id}-${selectedProcesso.ano_gerencia}`,
        fiscal_year: String(selectedProcesso.ano_gerencia),
        type: "solicitacao_elementos",
        message: `Solicitação de elementos em falta — Processo ${selectedProcesso.numero_processo}`,
        detail: detalhe,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);

      // Log in processo_historico
      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 4,
        etapa_seguinte: 4,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: selectedProcesso.estado,
        acao: `Solicitação de ${selected.length} elemento(s) em falta à entidade`,
        executado_por: executadoPor,
        perfil_executor: "Técnico da Contadoria Geral",
        observacoes: detalhe,
      } as any);

      toast.success(`Solicitação de ${selected.length} elemento(s) enviada à entidade ${selectedProcesso.entity_name}`);
      setSolicitarDialogOpen(false);
      setElementosSelecionados({});
      setMensagemSolicitacao("");
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
                          <TableHead className="text-xs">Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {CHECKLIST_ITEMS.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={!!checkedItems[item.id]}
                                onCheckedChange={() => toggleCheck(item.id)}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium">{item.label}</TableCell>
                            <TableCell>
                              {item.obrigatorio ? (
                                <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Facultativo</Badge>
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
                        ))}
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
    </TecnicoLayout>
  );
}
