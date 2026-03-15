import { useState } from "react";
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
  AlertTriangle, Undo2, Building2, X,
} from "lucide-react";
import { toast } from "sonner";

const SubmissaoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entity = mockEntities.find((e) => e.id === id) || mockEntities[0];
  const periodo = "2024";

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [actaGerada, setActaGerada] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<{ label: string; category: string } | null>(null);
  const { recepcionar, rejeitar } = useSubmissions();

  const requiredItems = submissionChecklist.filter((c) => c.required);
  const allRequiredChecked = requiredItems.every((item) => checkedDocs[item.id]);
  const checkedCount = submissionChecklist.filter((item) => checkedDocs[item.id]).length;

  const handleToggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
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

  const handlePreviewPdf = () => {
    const data = buildActaData();
    const dataUri = exportActaRecepcaoPdf(data, true);
    setPdfPreviewUrl(dataUri);
  };

  const handleConfirmRecepcao = async () => {
    const data = buildActaData();
    const { blob, fileName } = exportActaRecepcaoPdf(data);
    setActaGerada(true);

    const filePath = `${entity.id}/${periodo}/${fileName}`;
    try {
      await supabase.storage
        .from("actas-recepcao")
        .upload(filePath, blob, { contentType: "application/pdf" });

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
    } catch (err) {
      console.error("Error persisting acta:", err);
    }

    const fiscalYearId = `${entity.id}-${periodo}`;
    recepcionar(entity.id, fiscalYearId, entity.name, `entidade@${entity.nif}.ao`);
    setConfirmDialogOpen(false);
    toast.success(`Acta de recepção gerada — ${entity.name} — ${periodo}`);
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
                <Badge variant={allRequiredChecked ? "default" : "secondary"}>
                  {checkedCount}/{submissionChecklist.length} verificados
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Confirme a existência de cada documento antes de emitir a acta de recepção.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">✓</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-center">Obrigatório</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center w-24">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionChecklist.map((item) => {
                    const isChecked = !!checkedDocs[item.id];
                    return (
                      <TableRow key={item.id} className={isChecked ? "bg-success/5" : ""}>
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
                            title={`Visualizar ${item.label}`}
                            onClick={() => setDocPreview({ label: item.label, category: item.category })}
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
                Todos os documentos obrigatórios devem ser verificados para emitir a acta.
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
                <Stamp className="h-4 w-4" /> Confirmar e Gerar Acta
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Acta de Recepção Emitida</p>
              <p className="text-xs text-muted-foreground">A documentação foi verificada e a acta de recepção foi gerada com sucesso.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setActaGerada(false); setCheckedDocs({}); }}>
              <Pencil className="h-3.5 w-3.5" /> Editar e Regenerar
            </Button>
          </div>
          <ActasRecepcaoList
            entityId={entity.id}
            fiscalYear={periodo}
            allowEdit
            onEdit={() => { setActaGerada(false); setCheckedDocs({}); }}
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" /> Confirmar Emissão da Acta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Confirma a emissão da acta de recepção com os seguintes dados?</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acta Nº</span>
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
              <Stamp className="h-4 w-4" /> Confirmar e Gerar Acta
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
      <Dialog open={!!docPreview} onOpenChange={() => setDocPreview(null)}>
        <DialogContent className="max-w-3xl h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {docPreview?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 border rounded-lg bg-muted/30 p-8 overflow-auto">
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-background border">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{docPreview?.label}</p>
                  <p className="text-xs text-muted-foreground">Categoria: {docPreview?.category}</p>
                </div>
                <Badge variant="outline" className="shrink-0">Submetido</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-md bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">Entidade</p>
                  <p className="font-medium">{entity.name}</p>
                </div>
                <div className="p-3 rounded-md bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">Exercício</p>
                  <p className="font-medium">{periodo}</p>
                </div>
                <div className="p-3 rounded-md bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">Data de Submissão</p>
                  <p className="font-medium">{now.toLocaleDateString("pt-AO")}</p>
                </div>
                <div className="p-3 rounded-md bg-background border">
                  <p className="text-xs text-muted-foreground mb-1">Formato</p>
                  <p className="font-medium">PDF / Digital</p>
                </div>
              </div>
              <div className="p-4 rounded-md bg-primary/5 border border-primary/20 text-center">
                <Building2 className="h-10 w-10 mx-auto mb-2 text-primary/40" />
                <p className="text-sm text-muted-foreground">Pré-visualização do documento disponível após integração com o sistema de armazenamento.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SubmissaoDetalhe;
