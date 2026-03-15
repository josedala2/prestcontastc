import { useState, useRef } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { submissionChecklist } from "@/data/mockData";
import { Attachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle,
  FileText,
  AlertTriangle,
  Paperclip,
  Trash2,
  Download,
  Eye,
  X,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  inventario: "Inventário",
  reconciliacao: "Reconciliação",
  parecer: "Parecer",
  balancete: "Balancete",
  relatorio_gestao: "Relatório de Gestão",
  demonstracoes: "Demonstrações",
  outro: "Outro",
};

const initialAttachments: Attachment[] = [
  { id: "a1", name: "Inventário Patrimonial 2024.pdf", type: "application/pdf", category: "inventario", size: 2450000, uploadedAt: "2025-03-15", version: 1, required: true },
  { id: "a2", name: "Reconciliação Bancária - BFA.xlsx", type: "application/xlsx", category: "reconciliacao", size: 1200000, uploadedAt: "2025-03-18", version: 1, required: true },
  { id: "a3", name: "Parecer Conselho Fiscal.pdf", type: "application/pdf", category: "parecer", size: 890000, uploadedAt: "2025-04-02", version: 1, required: true },
  { id: "a4", name: "Balanço Patrimonial 2024.pdf", type: "application/pdf", category: "demonstracoes", size: 1560000, uploadedAt: "2025-04-05", version: 2, required: true },
  { id: "a5", name: "Demonstração de Resultados 2024.pdf", type: "application/pdf", category: "demonstracoes", size: 980000, uploadedAt: "2025-04-05", version: 1, required: true },
];

const PortalDocumentos = () => {
  const { entity } = usePortalEntity();
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkedItems = submissionChecklist
    .filter((c) => attachments.some((a) => a.category === c.category))
    .map((c) => c.id);

  const progress = Math.round((checkedItems.length / submissionChecklist.length) * 100);
  const allRequiredDone = submissionChecklist
    .filter((c) => c.required)
    .every((c) => checkedItems.includes(c.id));

  const openUploadDialog = (category?: string, replaceAttId?: string) => {
    setSelectedCategory(category || "");
    setSelectedFiles([]);
    setReplaceId(replaceAttId || null);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadConfirm = () => {
    if (!selectedCategory) {
      toast.error("Seleccione uma categoria.");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Seleccione pelo menos um ficheiro.");
      return;
    }

    const now = new Date().toISOString().split("T")[0];

    if (replaceId) {
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === replaceId
            ? { ...a, name: selectedFiles[0].name, size: selectedFiles[0].size, uploadedAt: now, version: (a.version || 1) + 1 }
            : a
        )
      );
      toast.success(`Ficheiro substituído: ${selectedFiles[0].name}`);
    } else {
      const newAtts: Attachment[] = selectedFiles.map((f, i) => ({
        id: `upload_${Date.now()}_${i}`,
        name: f.name,
        type: f.type,
        category: selectedCategory as Attachment["category"],
        size: f.size,
        uploadedAt: now,
        version: 1,
        required: false,
      }));
      setAttachments((prev) => [...prev, ...newAtts]);
      toast.success(`${selectedFiles.length} ficheiro(s) carregado(s) com sucesso.`);
    }

    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setSelectedCategory("");
    setReplaceId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: string) => {
    const att = attachments.find((a) => a.id === id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Ficheiro "${att?.name}" removido.`);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <PortalLayout>
      <PageHeader title="Documentos & Anexos" description="Carregue e gira os documentos obrigatórios para submissão">
        <Button size="sm" className="gap-2" onClick={() => openUploadDialog()}>
          <Upload className="h-4 w-4" /> Carregar Documento
        </Button>
      </PageHeader>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{replaceId ? "Substituir Ficheiro" : "Carregar Documento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ficheiro(s)</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para seleccionar ou arraste ficheiros
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">PDF, XLSX, DOCX, JPG (máx. 20MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple={!replaceId}
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Ficheiros seleccionados</Label>
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUploadConfirm} disabled={selectedFiles.length === 0 || !selectedCategory} className="gap-2">
                <Upload className="h-4 w-4" /> {replaceId ? "Substituir" : "Carregar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress bar */}
      <div className="bg-card rounded-lg border border-border card-shadow p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" /> Progresso de Submissão
          </h2>
          <span className="text-sm font-mono font-semibold text-foreground">
            {checkedItems.length}/{submissionChecklist.length}
          </span>
        </div>
        <Progress value={progress} className="h-2.5 mb-2" />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{progress}% completo</p>
          {allRequiredDone ? (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Todos os obrigatórios carregados
            </span>
          ) : (
            <span className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Documentos obrigatórios em falta
            </span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-lg border border-border card-shadow p-5 mb-6 animate-fade-in">
        <h2 className="text-sm font-semibold text-foreground mb-4">Checklist Documental (Resolução nº 1/17)</h2>
        <div className="space-y-2">
          {submissionChecklist.map((item) => {
            const isChecked = checkedItems.includes(item.id);
            const categoryAttachments = attachments.filter((a) => a.category === item.category);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isChecked
                    ? "bg-success/5 border-success/20"
                    : item.required
                      ? "bg-destructive/5 border-destructive/15"
                      : "bg-muted/20 border-border"
                }`}
              >
                <Checkbox checked={isChecked} disabled />
                <FileText className={`h-4 w-4 shrink-0 ${isChecked ? "text-success" : "text-muted-foreground"}`} />
                <span className={`text-sm flex-1 ${isChecked ? "text-success" : "text-foreground"}`}>
                  {item.label}
                </span>
                {item.required && !isChecked && (
                  <span className="text-[9px] text-destructive font-bold px-1.5 py-0.5 rounded bg-destructive/10">
                    OBRIGATÓRIO
                  </span>
                )}
                {isChecked && (
                  <span className="text-[10px] text-success">{categoryAttachments.length} ficheiro(s)</span>
                )}
                {!isChecked && (
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openUploadDialog(item.category)}>
                    <Upload className="h-3 w-3" /> Carregar
                  </Button>
                )}
                {isChecked && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded files */}
      <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
        <h2 className="text-sm font-semibold text-foreground mb-4">Ficheiros Carregados ({attachments.length})</h2>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum ficheiro carregado.</p>
            <Button variant="outline" className="mt-3 gap-2" onClick={() => openUploadDialog()}>
              <Upload className="h-4 w-4" /> Carregar primeiro documento
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {CATEGORY_LABELS[att.category] || att.category} · {formatSize(att.size)} · v{att.version || 1} · {att.uploadedAt}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2" onClick={() => openUploadDialog(att.category, att.id)}>
                    <Upload className="h-3 w-3" /> Substituir
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-destructive" onClick={() => handleDelete(att.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actas de Recepção emitidas pela Secretaria */}
      <div className="mt-6">
        <ActasRecepcaoList entityId={entity.id} />
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <Button size="lg" disabled={!allRequiredDone} className="gap-2" onClick={() => toast.info("Submissão disponível após activação do backend.")}>
          <CheckCircle className="h-4 w-4" />
          Submeter Prestação de Contas
        </Button>
      </div>
    </PortalLayout>
  );
};

export default PortalDocumentos;
