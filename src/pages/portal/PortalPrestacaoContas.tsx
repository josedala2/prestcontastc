import { useState, useRef, useCallback } from "react";
import { EntityTipologia } from "@/types";
import { PortalLayout } from "@/components/PortalLayout";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { FileSpreadsheet, CheckCircle, Upload, FileUp, X, Download, AlertTriangle, Send, Clock, FileText, Paperclip } from "lucide-react";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { generateCC2Template } from "@/lib/cc2TemplateGenerator";
import { EntidadeDocumentosTab } from "@/components/portal/EntidadeDocumentosTab";




// ─── Main Component ───
const PortalPrestacaoContas = () => {
  const { entity } = usePortalEntity();
  const [periodo, setPeriodo] = useState("2024");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        setUploadedFile(file.name);
        toast.success("Ficheiro carregado com sucesso!");
      } catch {
        toast.error("Erro ao processar o ficheiro. Verifique se é um ficheiro Excel válido.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <PortalLayout>
      <PageHeader
        title="Prestação de Contas"
        description="Submissão de documentos — Resolução Nº 1/17"
      />

      {/* Header Info */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Entidade</Label>
              <p className="text-sm font-medium">{entity.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIF</Label>
              <p className="text-sm font-medium">{entity.nif}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Ex: 2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <EntidadeView
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        periodo={periodo}
        entityName={entity.name}
        entityId={entity.id}
        entityTipologia={entity.tipologia}
      />
    </PortalLayout>
  );
};

// ─── Entidade View (tabs: Balancete + Documentos + Estado) ───
type SubmissionStatus = "rascunho" | "pendente" | "recepcionado" | "rejeitado" | "em_analise";

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; icon: typeof Clock }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  pendente: { label: "Pendente — Aguarda Recepção pela Secretaria", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  recepcionado: { label: "Recepcionado — Acta de Recepção Emitida", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejeitado: { label: "Devolvido — Documentação Incompleta", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  em_analise: { label: "Em Análise — Processo remetido ao Técnico Validador", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: FileText },
};

function EntidadeView({
  uploadedFile,
  setUploadedFile,
  fileInputRef,
  handleFileUpload,
  periodo,
  entityName,
  entityId,
  entityTipologia,
}: {
  uploadedFile: string | null;
  setUploadedFile: (f: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  periodo: string;
  entityName: string;
  entityId: string;
  entityTipologia: EntityTipologia;
}) {
  const [entidadeTab, setEntidadeTab] = useState("balancete");
  const { getStatus, submit } = useSubmissions();
  const fiscalYearId = `${entityId}-${periodo}`;
  const submissionStatus = getStatus(entityId, fiscalYearId);

  const isSubmitted = submissionStatus !== "rascunho";
  const canResubmit = submissionStatus === "rejeitado";
  const StatusIcon = STATUS_CONFIG[submissionStatus].icon;

  const handleSubmit = () => {
    submit(entityId, fiscalYearId, entityName);
    toast.success("Prestação de contas submetida com sucesso! Aguarda recepção pela Secretaria.");
  };

  const statusMessages: Record<string, string> = {
    pendente: "A Secretaria do Tribunal irá verificar a documentação e emitir a Acta de Recepção.",
    recepcionado: "A Secretaria validou a documentação e emitiu a Acta de Recepção.",
    rejeitado: "A Secretaria devolveu a submissão. Corrija os documentos indicados e resubmeta.",
  };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {isSubmitted && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${STATUS_CONFIG[submissionStatus].color}`}>
          <StatusIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{STATUS_CONFIG[submissionStatus].label}</p>
            <p className="text-xs opacity-80">{statusMessages[submissionStatus] || ""}</p>
          </div>
          {canResubmit && (
            <button
              onClick={() => submit(entityId, fiscalYearId, entityName)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Resubmeter
            </button>
          )}
        </div>
      )}

      <Tabs value={entidadeTab} onValueChange={setEntidadeTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="balancete" className="text-xs gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Balancete
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: BALANCETE ─── */}
        <TabsContent value="balancete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Carregar Balancete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Carregue o ficheiro Excel do balancete conforme o modelo CC-2/CC-3 da Resolução 1/17.
                  O sistema irá calcular automaticamente o Balanço Patrimonial, a Demonstração de Resultados
                  e os Indicadores Financeiros com base nos dados fornecidos.
                </p>
              </div>

              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Arraste o ficheiro ou clique para carregar</p>
                <p className="text-xs text-muted-foreground mb-4">Formatos aceites: .xlsx, .xls, .csv</p>
                
                {uploadedFile && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <FileUp className="h-3 w-3" />
                      {uploadedFile}
                    </Badge>
                    {!isSubmitted && (
                      <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isSubmitted && !canResubmit}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    disabled={isSubmitted && !canResubmit}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Carregar Balancete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={generateCC2Template}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descarregar Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: DOCUMENTOS ─── */}
        <TabsContent value="documentos" className="space-y-4">
          <EntidadeDocumentosTab disabled={isSubmitted && !canResubmit} tipologia={entity.tipologia} />
          <ActasRecepcaoList entityId={entityId} fiscalYear={periodo} />
        </TabsContent>
      </Tabs>

      {/* Submit button */}
      {(!isSubmitted || canResubmit) && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                className="gap-2"
                disabled={!uploadedFile}
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
                      Após a submissão, o processo ficará <strong className="text-foreground">pendente</strong> até
                      a Secretaria do Tribunal verificar a documentação e emitir a Acta de Recepção.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entidade</span>
                        <span className="font-medium text-foreground">{entityName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Período</span>
                        <span className="font-medium text-foreground">{periodo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balancete</span>
                        <span className="font-medium text-foreground">{uploadedFile || "—"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao confirmar, declara que todos os dados e documentos apresentados são verdadeiros e completos,
                      nos termos da Resolução nº 1/17 do Tribunal de Contas.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Submissão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}




export default PortalPrestacaoContas;
