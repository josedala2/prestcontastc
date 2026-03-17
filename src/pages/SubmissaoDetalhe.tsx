import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockEntities, submissionChecklist } from "@/data/mockData";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { exportActaRecepcaoPdf } from "@/lib/exportUtils";
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Eye, Stamp, Pencil,
  AlertTriangle, Undo2, Building2, X, Send, Download, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface SubmissionDoc {
  id: string;
  doc_id: string;
  doc_label: string;
  doc_category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
}

const SubmissaoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entity = mockEntities.find((e) => e.id === id) || mockEntities[0];
  const periodo = "2024";

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [generatedActaFilePath, setGeneratedActaFilePath] = useState<string | null>(null);
  const [generatedActaFileName, setGeneratedActaFileName] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [actaGerada, setActaGerada] = useState(false);
  const [remetido, setRemetido] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<{ label: string; category: string } | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewLoading, setDocPreviewLoading] = useState(false);
  const [submissionDocs, setSubmissionDocs] = useState<SubmissionDoc[]>([]);
  const { recepcionar, rejeitar, remeterParaTecnico, getStatus } = useSubmissions();

  const fiscalYearId = `${entity.id}-${periodo}`;

  // Load uploaded documents from DB
  useEffect(() => {
    const loadDocs = async () => {
      const { data } = await supabase
        .from("submission_documents")
        .select("*")
        .eq("entity_id", entity.id)
        .eq("fiscal_year_id", fiscalYearId);
      if (data) setSubmissionDocs(data as any);
    };
    loadDocs();
  }, [entity.id, fiscalYearId]);

  const requiredItems = submissionChecklist.filter((c) => c.required);
  const allRequiredChecked = requiredItems.every((item) => checkedDocs[item.id]);
  const checkedCount = submissionChecklist.filter((item) => checkedDocs[item.id]).length;

  const handleToggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  // Map checklist IDs to submission doc_ids from EntidadeDocumentosTab
  const DOC_CATEGORY_MAP: Record<string, string[]> = {
    c1: ["relatorio_gestao"],
    c2: ["balanco"],
    c3: ["dem_resultados"],
    c4: ["fluxo_caixa"],
    c5: ["balancete_analitico"],
    c6: ["parecer_fiscal"],
    c7: ["parecer_auditor"],
    c8: ["modelos"],
    c9: ["comprov_impostos"],
    c10: ["comprov_seguranca"],
    c11: ["inventario"],
    c12: ["extractos", "folhas_caixa"],
    c13: ["reconciliacoes", "ordens_saque"],
  };

  const findSubmissionDoc = (checklistId: string): SubmissionDoc | undefined => {
    const docIds = DOC_CATEGORY_MAP[checklistId] || [];
    return submissionDocs.find(d => docIds.includes(d.doc_id));
  };

  const handleOpenDocPreview = async (label: string, category: string, checklistId: string) => {
    const subDoc = findSubmissionDoc(checklistId);
    if (subDoc) {
      setDocPreviewLoading(true);
      setDocPreview({ label, category });
      try {
        const { data } = supabase.storage
          .from("submission-documents")
          .getPublicUrl(subDoc.file_path);
        setDocPreviewUrl(data.publicUrl);
      } catch {
        setDocPreviewUrl(null);
      }
      setDocPreviewLoading(false);
    } else {
      setDocPreview({ label, category });
      setDocPreviewUrl(null);
    }
  };

  const handleDownloadDoc = async (subDoc: SubmissionDoc) => {
    const { data } = supabase.storage
      .from("submission-documents")
      .getPublicUrl(subDoc.file_path);
    window.open(data.publicUrl, "_blank");
  };

  const now = new Date();
  const actaNumero = `AR-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(parseInt(entity.id || "1")).padStart(3, "0")}`;

  const buildActaData = () => ({
    actaNumero,
    entityName: entity.name,
    entityNif: entity.nif,
    entityTutela: entity.tutela,
    entityMorada: entity.morada,
    exercicioYear: parseInt(periodo),
    periodoInicio: `${periodo}-01-01`,
    periodoFim: `${periodo}-12-31`,
    submittedAt: now.toISOString(),
    totalDebito: 0,
    totalCredito: 0,
    documentosVerificados: submissionChecklist.map((item) => ({
      label: item.label,
      required: item.required,
      checked: !!checkedDocs[item.id],
    })),
  });

  const handlePreviewPdf = async () => {
    const data = buildActaData();
    const dataUri = await exportActaRecepcaoPdf(data, true);
    setPdfPreviewUrl(dataUri);
  };

  const handleConfirmRecepcao = async () => {
    const data = buildActaData();
    const { blob, fileName } = await exportActaRecepcaoPdf(data);
    setActaGerada(true);

    const filePath = `${entity.id}/${periodo}/${fileName}`;
    try {
      await supabase.storage
        .from("actas-recepcao")
        .upload(filePath, blob, { contentType: "application/pdf", upsert: true });

      const fiscalYearId = `${entity.id}-${periodo}`;
      await supabase.from("actas_recepcao").insert({
        entity_id: entity.id,
        entity_name: entity.name,
        fiscal_year: periodo,
        fiscal_year_id: fiscalYearId,
        acta_numero: actaNumero,
        file_path: filePath,
        file_name: fileName,
      } as any);

      setGeneratedActaFilePath(filePath);
      setGeneratedActaFileName(fileName);
    } catch (err) {
      console.error("Error persisting acta:", err);
    }

    const fiscalYearId = `${entity.id}-${periodo}`;
    recepcionar(entity.id, fiscalYearId, entity.name, `entidade@${entity.nif}.ao`);
    setConfirmDialogOpen(false);
    toast.success(`Nota de Remessa gerada — ${entity.name} — ${periodo}`);
  };

  const handleConfirmRejeicao = () => {
    if (!motivoRejeicao.trim()) return;
    const fiscalYearId = `${entity.id}-${periodo}`;
    rejeitar(entity.id, fiscalYearId, motivoRejeicao.trim(), entity.name, `entidade@${entity.nif}.ao`);
    setRejectDialogOpen(false);
    setMotivoRejeicao("");
    toast.warning(`Submissão devolvida — ${entity.name} — ${periodo}`);
    navigate("/submissoes");
  };

  return (
    <AppLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/submissoes")} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar às Submissões
        </Button>
      </div>

      <PageHeader
        title="Documentos Submetidos"
        description="Verifique a documentação e emita a acta de recepção"
      />

      {/* Entity Info (compact) */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Entidade</Label>
              <p className="text-sm font-medium">{entity.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIF</Label>
              <p className="text-sm font-medium font-mono">{entity.nif}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Exercício</Label>
              <p className="text-sm font-medium">{periodo}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tutela</Label>
              <p className="text-sm font-medium">{entity.tutela}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Verification Checklist */}
      {!actaGerada ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Verificação Documental (Resolução 1/17)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {submissionChecklist.filter(i => findSubmissionDoc(i.id)).length}/{submissionChecklist.length} carregados
                  </Badge>
                  <Badge variant={allRequiredChecked ? "default" : "secondary"}>
                    {checkedCount}/{submissionChecklist.length} verificados
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Confirme a existência de cada documento antes de emitir a acta de recepção. Os documentos sinalizados a verde foram carregados pela entidade.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">✓</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-center">Obrigatório</TableHead>
                    <TableHead className="text-center">Ficheiro</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center w-24">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionChecklist.map((item) => {
                    const isChecked = !!checkedDocs[item.id];
                    const subDoc = findSubmissionDoc(item.id);
                    return (
                      <TableRow
                        key={item.id}
                        className={
                          isChecked
                            ? "bg-success/5"
                            : subDoc
                              ? "bg-green-50/50 dark:bg-green-950/10"
                              : item.required
                                ? "bg-destructive/5"
                                : ""
                        }
                      >
                        <TableCell>
                          <Checkbox checked={isChecked} onCheckedChange={() => handleToggleDoc(item.id)} />
                        </TableCell>
                        <TableCell className="text-sm">{item.label}</TableCell>
                        <TableCell className="text-center">
                          {item.required ? (
                            <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {subDoc ? (
                            <span className="flex items-center justify-center gap-1.5 text-xs">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-700 dark:text-green-400 font-medium max-w-[140px] truncate" title={subDoc.file_name}>
                                {subDoc.file_name}
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Não carregado
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isChecked ? (
                            <span className="flex items-center justify-center gap-1 text-success text-xs">
                              <CheckCircle className="h-3.5 w-3.5" /> Verificado
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                              <XCircle className="h-3.5 w-3.5" /> Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={subDoc ? `Visualizar ${subDoc.file_name}` : `Visualizar ${item.label}`}
                            onClick={() => handleOpenDocPreview(item.label, item.category, item.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {!allRequiredChecked ? (
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Todos os documentos obrigatórios devem ser verificados para emitir a nota de remessa.
              </p>
            ) : <div />}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/submissoes")}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => setRejectDialogOpen(true)} className="gap-2">
                <Undo2 className="h-4 w-4" /> Devolver
              </Button>
              <Button variant="secondary" onClick={handlePreviewPdf} className="gap-2">
                <Eye className="h-4 w-4" /> Visualizar PDF
              </Button>
              <Button disabled={!allRequiredChecked} onClick={() => setConfirmDialogOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" /> Confirmar e Gerar Nota de Remessa
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Nota de Remessa Emitida</p>
              <p className="text-xs text-muted-foreground">A documentação foi verificada e a nota de remessa foi gerada com sucesso.</p>
            </div>
            <div className="flex items-center gap-2">
              {generatedActaFilePath && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const { data } = supabase.storage.from("actas-recepcao").getPublicUrl(generatedActaFilePath);
                      setPdfPreviewUrl(data.publicUrl);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Visualizar Nota
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={async () => {
                      const { data, error } = await supabase.storage.from("actas-recepcao").download(generatedActaFilePath);
                      if (error || !data) { toast.error("Erro ao descarregar."); return; }
                      const url = URL.createObjectURL(data);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = generatedActaFileName || "acta.pdf";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Descarregar PDF
                  </Button>
                </>
              )}
              {!remetido && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setActaGerada(false); setCheckedDocs({}); setGeneratedActaFilePath(null); }}>
                  <Pencil className="h-3.5 w-3.5" /> Editar e Regenerar
                </Button>
              )}
            </div>
          </div>

          {/* Remeter para Chefe da Secretaria-Geral */}
          {!remetido ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Send className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Remessa para Validação da Chefe da Secretaria</p>
                <p className="text-xs text-muted-foreground">Envie o processo para a Chefe da Secretaria-Geral proceder à validação documental.</p>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const fiscalYearId = `${entity.id}-${periodo}`;
                  remeterParaTecnico(entity.id, fiscalYearId, entity.name, `entidade@${entity.nif}.ao`);
                  setRemetido(true);
                  toast.success(`Processo encaminhado para a Chefe da Secretaria-Geral — ${entity.name} — ${periodo}`);
                }}
              >
                <Send className="h-3.5 w-3.5" /> Remeter para Chefe
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Processo em Validação pela Chefe da Secretaria</p>
                <p className="text-xs text-muted-foreground">O processo foi encaminhado para a Chefe da Secretaria-Geral e aguarda validação documental.</p>
              </div>
              <Badge variant="secondary" className="text-xs">Em Validação</Badge>
            </div>
          )}

          <ActasRecepcaoList
            entityId={entity.id}
            fiscalYear={periodo}
            allowEdit={!remetido}
            onEdit={() => { setActaGerada(false); setCheckedDocs({}); }}
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Confirmar Emissão da Nota de Remessa
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirma a emissão da nota de remessa com os seguintes dados?</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referência</span>
                    <span className="font-medium text-foreground font-mono">{actaNumero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entidade</span>
                    <span className="font-medium text-foreground">{entity.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exercício</span>
                    <span className="font-medium text-foreground">{periodo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documentos verificados</span>
                    <span className="font-medium text-foreground">{checkedCount}/{submissionChecklist.length}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRecepcao} className="gap-2">
              <FileText className="h-4 w-4" /> Confirmar e Gerar Nota de Remessa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-destructive" /> Devolver Submissão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Indique o motivo da devolução da submissão.</p>
                <div>
                  <Label>Motivo da Devolução</Label>
                  <Textarea
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    placeholder="Descreva os documentos em falta ou irregularidades encontradas..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRejeicao}
              disabled={!motivoRejeicao.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              <Undo2 className="h-4 w-4" /> Confirmar Devolução
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!pdfPreviewUrl} onOpenChange={() => setPdfPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pré-visualização — Acta de Recepção</span>
              <Button variant="ghost" size="sm" onClick={() => setPdfPreviewUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {pdfPreviewUrl && (
            <iframe src={pdfPreviewUrl} className="flex-1 w-full h-full rounded-lg border" title="PDF Preview" />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!docPreview} onOpenChange={() => { setDocPreview(null); setDocPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {docPreview?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            {docPreviewLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">A carregar documento...</p>
              </div>
            ) : docPreviewUrl ? (
              <>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Submetido</Badge>
                    <span className="text-xs text-muted-foreground">{entity.name} · Exercício {periodo}</span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(docPreviewUrl, "_blank")}>
                    <Download className="h-3 w-3" /> Descarregar
                  </Button>
                </div>
                {docPreviewUrl.match(/\.(pdf)$/i) || docPreviewUrl.includes(".pdf") ? (
                  <iframe
                    src={docPreviewUrl}
                    className="flex-1 w-full rounded-lg border"
                    title="Document Preview"
                  />
                ) : docPreviewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 rounded-lg border p-4">
                    <img src={docPreviewUrl} alt={docPreview?.label} className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-muted/30 rounded-lg border p-8">
                    <FileText className="h-12 w-12 text-primary/40" />
                    <p className="text-sm text-muted-foreground">
                      Pré-visualização não disponível para este tipo de ficheiro.
                    </p>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(docPreviewUrl, "_blank")}>
                      <Download className="h-3.5 w-3.5" /> Descarregar Ficheiro
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 border rounded-lg bg-muted/30 p-8">
                <Building2 className="h-10 w-10 text-primary/40" />
                <p className="text-sm text-muted-foreground text-center">
                  Documento não encontrado. A entidade ainda não submeteu este ficheiro.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SubmissaoDetalhe;
