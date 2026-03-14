import { useState, useRef, RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Entity } from "@/types";
import {
  Upload, FileText, CheckCircle, AlertTriangle, X, Trash2, Send, Paperclip, FileSpreadsheet, Download,
} from "lucide-react";
import { toast } from "sonner";
import { generateCC2Template } from "@/lib/cc2TemplateGenerator";

interface DocRequirement {
  id: string;
  label: string;
  required: boolean;
  accept?: string;
  description?: string;
}

const DOCUMENT_REQUIREMENTS: DocRequirement[] = [
  { id: "modelos", label: "Modelos de Prestação de Contas", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "relatorio_gestao", label: "Relatório de Gestão", required: true, accept: ".pdf,.docx" },
  { id: "balanco", label: "Balanço", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "dem_resultados", label: "Demonstração de Resultados", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "fluxo_caixa", label: "Demonstração de Fluxo de Caixa", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "balancete", label: "Balancete Analítico e Sintético (antes e depois do apuramento)", required: true, accept: ".xlsx,.xls,.csv" },
  { id: "parecer_fiscal", label: "Parecer do Conselho Fiscal", required: true, accept: ".pdf,.docx" },
  { id: "parecer_auditor", label: "Relatório e Parecer do Auditor Externo", required: true, accept: ".pdf,.docx" },
  { id: "comprov_impostos", label: "Comprovativos de Pagamento dos Impostos", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "comprov_seguranca", label: "Comprovativos de Pagamento à Segurança Social", required: false, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "acta_apreciacao", label: "Acta sobre a Apreciação das Contas", required: true, accept: ".pdf,.docx" },
  { id: "extractos", label: "Extratos Bancários de todas as contas do exercício", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "reconciliacoes", label: "Reconciliações Bancárias de todas as contas do exercício", required: false, accept: ".pdf,.xlsx,.xls" },
  { id: "inventario", label: "Inventário dos Bens Patrimoniais adquiridos no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "abates", label: "Relação de Abates e Alienações de Imóveis no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "emolumentos", label: "Comprovativo de Pagamento dos Emolumentos ao Tribunal de Contas", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

interface UploadedDoc {
  name: string;
  size: number;
}

interface Props {
  periodo: string;
  entity: Entity;
  uploadedFile: string | null;
  setUploadedFile: (f: string | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatSize = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export function EntidadeDocumentUpload({ periodo, entity }: Props) {
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDocUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocs((prev) => ({ ...prev, [docId]: { name: file.name, size: file.size } }));
    toast.success(`"${file.name}" carregado com sucesso.`);
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    if (inputRefs.current[docId]) inputRefs.current[docId]!.value = "";
  };

  const requiredDocs = DOCUMENT_REQUIREMENTS.filter((d) => d.required);
  const uploadedRequiredCount = requiredDocs.filter((d) => uploadedDocs[d.id]).length;
  const totalUploaded = Object.keys(uploadedDocs).length;
  const progress = Math.round((uploadedRequiredCount / requiredDocs.length) * 100);
  const allRequiredDone = uploadedRequiredCount === requiredDocs.length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" /> Progresso de Submissão
            </h3>
            <span className="text-sm font-mono font-semibold">
              {uploadedRequiredCount}/{requiredDocs.length} obrigatórios
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{progress}% completo · {totalUploaded} ficheiro(s) total</p>
            {allRequiredDone ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Todos os obrigatórios carregados
              </span>
            ) : (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Documentos obrigatórios em falta
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos Exigidos (Resolução nº 1/17)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DOCUMENT_REQUIREMENTS.map((doc) => {
            const uploaded = uploadedDocs[doc.id];
            return (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  uploaded
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30"
                    : doc.required
                      ? "bg-destructive/5 border-destructive/15"
                      : "bg-muted/20 border-border"
                }`}
              >
                {uploaded ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${uploaded ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                    {doc.label}
                  </p>
                  {uploaded && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {uploaded.name} · {formatSize(uploaded.size)}
                    </p>
                  )}
                </div>

                {doc.required && !uploaded && (
                  <Badge variant="destructive" className="text-[9px] shrink-0">OBRIGATÓRIO</Badge>
                )}
                {!doc.required && !uploaded && (
                  <Badge variant="outline" className="text-[9px] shrink-0">FACULTATIVO</Badge>
                )}

                <input
                  ref={(el) => { inputRefs.current[doc.id] = el; }}
                  type="file"
                  accept={doc.accept}
                  className="hidden"
                  onChange={(e) => handleDocUpload(doc.id, e)}
                />

                {uploaded ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 h-7 px-2"
                      onClick={() => inputRefs.current[doc.id]?.click()}
                    >
                      <Upload className="h-3 w-3" /> Substituir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-destructive"
                      onClick={() => removeDoc(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 shrink-0"
                    onClick={() => inputRefs.current[doc.id]?.click()}
                  >
                    <Upload className="h-3 w-3" /> Carregar
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Balancete template download */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Template do Balancete CC-2</p>
              <p className="text-xs text-muted-foreground">Descarregue o modelo Excel para preenchimento do balancete.</p>
            </div>
            <Button variant="secondary" onClick={generateCC2Template} className="gap-2">
              <Download className="h-4 w-4" /> Descarregar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              disabled={!allRequiredDone}
              className="gap-2"
              onClick={(e) => {
                if (!allRequiredDone) {
                  e.preventDefault();
                  toast.error("Carregue todos os documentos obrigatórios antes de submeter.");
                }
              }}
            >
              <Send className="h-4 w-4" />
              Submeter Prestação de Contas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar Submissão
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Está prestes a submeter a prestação de contas ao Tribunal de Contas de Angola.
                    Esta acção é <strong className="text-foreground">irreversível</strong>.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entidade</span>
                      <span className="font-medium text-foreground">{entity.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período</span>
                      <span className="font-medium text-foreground">{periodo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documentos</span>
                      <span className="font-medium text-foreground">{totalUploaded} ficheiro(s)</span>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toast.success("Prestação de contas submetida com sucesso ao Tribunal de Contas!")}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar Submissão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
