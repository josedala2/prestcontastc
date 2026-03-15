import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { EntidadeDocumentosTab } from "@/components/portal/EntidadeDocumentosTab";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { mockEntities } from "@/data/mockData";
import { generateCC2Template } from "@/lib/cc2TemplateGenerator";
import {
  ArrowLeft, FileSpreadsheet, CheckCircle, Upload, FileUp, X, Download,
  AlertTriangle, Send, Building2, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const SubmissaoManual = () => {
  const navigate = useNavigate();
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [periodo, setPeriodo] = useState("2024");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("balancete");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit } = useSubmissions();

  const entity = mockEntities.find((e) => e.id === selectedEntityId);
  const fiscalYearId = entity ? `${entity.id}-${periodo}` : "";

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        XLSX.read(data, { type: "array" });
        setUploadedFile(file.name);
        toast.success("Ficheiro carregado com sucesso!");
      } catch {
        toast.error("Erro ao processar o ficheiro. Verifique se é um ficheiro Excel válido.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = () => {
    if (!entity) return;
    submit(entity.id, fiscalYearId);
    toast.success(`Prestação de contas submetida em nome de ${entity.name}!`);
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
        title="Submeter por Entidade"
        description="Submissão de prestação de contas em nome de entidades sem acesso ao portal"
      />

      {/* Entity & Period Selection */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Entidade</Label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar entidade..." />
                </SelectTrigger>
                <SelectContent>
                  {mockEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {e.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIF</Label>
              <p className="text-sm font-medium font-mono mt-2">{entity?.nif || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Exercício</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-9 text-sm mt-1"
                placeholder="Ex: 2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEntityId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Seleccione uma entidade para iniciar a submissão da prestação de contas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

            {/* TAB 1: BALANCETE */}
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
                        <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Carregar Balancete
                      </Button>
                      <Button variant="secondary" onClick={generateCC2Template} className="gap-2">
                        <Download className="h-4 w-4" />
                        Descarregar Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4">
              <EntidadeDocumentosTab disabled={false} />
              <ActasRecepcaoList entityId={entity!.id} fiscalYear={periodo} />
            </TabsContent>
          </Tabs>

          {/* Submit */}
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="gap-2" disabled={!uploadedFile}>
                  <Send className="h-4 w-4" />
                  Submeter Prestação de Contas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Confirmar Submissão em Nome da Entidade
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>
                        Está prestes a submeter a prestação de contas em nome de <strong className="text-foreground">{entity?.name}</strong>.
                        Esta acção é realizada pela Secretaria para entidades sem acesso ao portal.
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entidade</span>
                          <span className="font-medium text-foreground">{entity?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NIF</span>
                          <span className="font-medium text-foreground font-mono">{entity?.nif}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exercício</span>
                          <span className="font-medium text-foreground">{periodo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balancete</span>
                          <span className="font-medium text-foreground">{uploadedFile || "—"}</span>
                        </div>
                      </div>
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
        </div>
      )}
    </AppLayout>
  );
};

export default SubmissaoManual;
