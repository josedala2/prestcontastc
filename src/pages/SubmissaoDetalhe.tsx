import { useState, useEffect, useMemo } from "react";
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
import { submissionChecklist } from "@/lib/dataUtils";
import { useEntities } from "@/hooks/useEntities";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { exportActaRecepcaoPdf } from "@/lib/exportUtils";
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Eye, Stamp, Pencil,
  AlertTriangle, Undo2, Building2, X, Send, Download, ShieldCheck,
  FolderOpen, File, ArrowUpDown, ArrowUp, ArrowDown, Search,
  ChevronLeft, ChevronRight, Archive, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
  const { entities: allEntities } = useEntities();
  const entity = allEntities.find((e) => e.id === id) || allEntities[0];
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
  const [docSortField, setDocSortField] = useState<"label" | "name" | "size">("label");
  const [docSortDir, setDocSortDir] = useState<"asc" | "desc">("asc");
  const [docSearch, setDocSearch] = useState("");
  const [docPage, setDocPage] = useState(0);
  const DOC_PAGE_SIZE = 5;
  const [exportingZip, setExportingZip] = useState(false);
  const { recepcionar, rejeitar, remeterParaTecnico, getStatus } = useSubmissions();

  const handleExportZip = async () => {
    setExportingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Processo_${entity.name.replace(/[^a-zA-Z0-9À-ú ]/g, "").replace(/\s+/g, "_")}_${periodo}`)!;

      // Download acta
      if (generatedActaFilePath) {
        const { data } = await supabase.storage.from("actas-recepcao").download(generatedActaFilePath);
        if (data) folder.file(generatedActaFileName || "Acta_Recepcao.pdf", data);
      }

      // Download all submission docs
      for (const doc of submissionDocs) {
        const { data } = await supabase.storage.from("submission-documents").download(doc.file_path);
        if (data) folder.file(doc.file_name, data);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `Processo_${entity.name.replace(/[^a-zA-Z0-9À-ú]/g, "_")}_${periodo}.zip`);
      toast.success("Pacote ZIP gerado com sucesso");
    } catch (err) {
      console.error("Erro ao gerar ZIP:", err);
      toast.error("Erro ao gerar o pacote ZIP");
    } finally {
      setExportingZip(false);
    }
  };

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
        const { data, error } = await supabase.storage
          .from("submission-documents")
          .download(subDoc.file_path);
        if (error || !data) { setDocPreviewUrl(null); }
        else { setDocPreviewUrl(URL.createObjectURL(data)); }
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
    try {
      const { data, error } = await supabase.storage.from("submission-documents").download(subDoc.file_path);
      if (error || !data) return;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = subDoc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao descarregar documento.");
    }
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
    toast.success(`Processo autuado — ${entity.name} — ${periodo}`);
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
                <FileText className="h-4 w-4" /> Confirmar e Autuar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Processo Autuado com Sucesso</p>
              <p className="text-xs text-muted-foreground">A documentação foi verificada e o processo foi autuado.</p>
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
                    <Eye className="h-3.5 w-3.5" /> Visualizar Acta
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

          {/* Visualizar Processo Completo */}
          {(() => {
            // Build unified doc list for sorting/filtering/pagination
            const allDocs: Array<{ type: "acta" | "doc"; label: string; fileName: string; size: number; doc?: SubmissionDoc }> = [];
            if (generatedActaFilePath) {
              allDocs.push({ type: "acta", label: "Acta de Recepção", fileName: generatedActaFileName || "acta.pdf", size: 0 });
            }
            submissionDocs.forEach(d => allDocs.push({ type: "doc", label: d.doc_label, fileName: d.file_name, size: d.file_size, doc: d }));

            const filtered = allDocs.filter(d => {
              if (!docSearch.trim()) return true;
              const q = docSearch.toLowerCase();
              return d.label.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q);
            });

            const sorted = [...filtered].sort((a, b) => {
              let cmp = 0;
              if (docSortField === "label") cmp = a.label.localeCompare(b.label, "pt");
              else if (docSortField === "name") cmp = a.fileName.localeCompare(b.fileName, "pt");
              else if (docSortField === "size") cmp = a.size - b.size;
              return docSortDir === "asc" ? cmp : -cmp;
            });

            const totalPages = Math.max(1, Math.ceil(sorted.length / DOC_PAGE_SIZE));
            const safePage = Math.min(docPage, totalPages - 1);
            const paged = sorted.slice(safePage * DOC_PAGE_SIZE, (safePage + 1) * DOC_PAGE_SIZE);

            const SortIcon = docSortDir === "asc" ? ArrowUp : ArrowDown;

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      Processo Completo
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {allDocs.length} documento(s)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visualize todos os documentos do processo, desde a capa até ao último documento submetido.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Toolbar: Search + Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar documentos..."
                        value={docSearch}
                        onChange={(e) => { setDocSearch(e.target.value); setDocPage(0); }}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <Select value={docSortField} onValueChange={(v: any) => { setDocSortField(v); setDocPage(0); }}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="label">Ordenar: Nome</SelectItem>
                        <SelectItem value="name">Ordenar: Ficheiro</SelectItem>
                        <SelectItem value="size">Ordenar: Tamanho</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setDocSortDir(d => d === "asc" ? "desc" : "asc")}
                      title={docSortDir === "asc" ? "Ascendente" : "Descendente"}
                    >
                      <SortIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      disabled={exportingZip || allDocs.length === 0}
                      onClick={handleExportZip}
                    >
                      {exportingZip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                      {exportingZip ? "A gerar..." : "Exportar ZIP"}
                    </Button>
                  </div>

                  {/* Document list */}
                  <div className="space-y-2">
                    {paged.map((item, idx) => item.type === "acta" ? (
                      <div key="acta" className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Stamp className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Acta de Recepção</p>
                            <p className="text-[10px] text-muted-foreground">{actaNumero} · Documento oficial</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar"
                            onClick={() => { const { data } = supabase.storage.from("actas-recepcao").getPublicUrl(generatedActaFilePath!); setPdfPreviewUrl(data.publicUrl); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Descarregar"
                            onClick={async () => {
                              const { data, error } = await supabase.storage.from("actas-recepcao").download(generatedActaFilePath!);
                              if (error || !data) return;
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a"); a.href = url; a.download = generatedActaFileName || "acta.pdf"; a.click(); URL.revokeObjectURL(url);
                            }}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div key={item.doc!.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <File className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.doc!.doc_label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.doc!.file_name} · {(item.doc!.file_size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar"
                            onClick={() => {
                              const { data } = supabase.storage.from("submission-documents").getPublicUrl(item.doc!.file_path);
                              if (item.doc!.file_name.toLowerCase().endsWith(".pdf")) { setPdfPreviewUrl(data.publicUrl); }
                              else { setDocPreview({ label: item.doc!.doc_label, category: item.doc!.doc_category }); setDocPreviewUrl(data.publicUrl); }
                            }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Descarregar"
                            onClick={() => handleDownloadDoc(item.doc!)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {sorted.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{docSearch ? "Nenhum documento encontrado para a pesquisa." : "Nenhum documento encontrado no processo."}</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground">
                        {safePage * DOC_PAGE_SIZE + 1}–{Math.min((safePage + 1) * DOC_PAGE_SIZE, sorted.length)} de {sorted.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage === 0}
                          onClick={() => setDocPage(p => Math.max(0, p - 1))}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <Button key={i} variant={i === safePage ? "default" : "outline"} size="sm"
                            className="h-7 w-7 p-0 text-[10px]" onClick={() => setDocPage(i)}>
                            {i + 1}
                          </Button>
                        ))}
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage >= totalPages - 1}
                          onClick={() => setDocPage(p => Math.min(totalPages - 1, p + 1))}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Remeter para Chefe de Divisão */}
          {!remetido ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Send className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Remessa para o Chefe de Divisão</p>
                <p className="text-xs text-muted-foreground">Envie o processo autuado para o Chefe de Divisão competente.</p>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const fiscalYearId = `${entity.id}-${periodo}`;
                  remeterParaTecnico(entity.id, fiscalYearId, entity.name, `entidade@${entity.nif}.ao`);
                  setRemetido(true);
                  toast.success(`Processo encaminhado para o Chefe de Divisão — ${entity.name} — ${periodo}`);
                }}
              >
                <Send className="h-3.5 w-3.5" /> Remeter para Chefe de Divisão
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Processo Encaminhado ao Chefe de Divisão</p>
                <p className="text-xs text-muted-foreground">O processo autuado foi encaminhado para o Chefe de Divisão competente para prosseguimento da tramitação.</p>
              </div>
              <Badge variant="secondary" className="text-xs">Em Tramitação</Badge>
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
              <FileText className="h-4 w-4" /> Confirmar e Autuar
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
