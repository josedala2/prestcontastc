import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockAttachments } from "@/data/mockData";
import { Attachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Package, CheckSquare, Square, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const checklistItems = [
  { id: "c1", label: "Relatório de Gestão", done: true },
  { id: "c2", label: "Balanço Patrimonial", done: true },
  { id: "c3", label: "Demonstração de Resultados", done: true },
  { id: "c4", label: "Demonstração do Fluxo de Caixa", done: false },
  { id: "c5", label: "Balancete Analítico e Sintético", done: true },
  { id: "c6", label: "Parecer do Conselho Fiscal", done: true },
  { id: "c7", label: "Relatório e Parecer do Auditor Externo", done: false },
  { id: "c8", label: "Modelos de Prestação de Contas (1 a 10)", done: false },
  { id: "c9", label: "Certidão de Regularidade Fiscal", done: false },
  { id: "c10", label: "Certidão de Regularidade Segurança Social", done: false },
];

const categoryLabels: Record<string, string> = {
  inventario: "Inventário",
  reconciliacao: "Reconciliação",
  parecer: "Parecer/Auditoria",
  outro: "Outros",
};

const Anexos = () => {
  const [attachments, setAttachments] = useState<Attachment[]>(mockAttachments);
  const [checklist, setChecklist] = useState(checklistItems);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<Attachment["category"]>("outro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter((c) => c.done).length;

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAttachment: Attachment = {
        id: `a_${Date.now()}`,
        name: file.name,
        type: file.type,
        category: uploadCategory,
        size: file.size,
        uploadedAt: new Date().toISOString().split("T")[0],
      };
      setAttachments((prev) => [newAttachment, ...prev]);
      setUploadDialogOpen(false);
      toast.success(`Anexo "${file.name}" carregado com sucesso.`);
    }
  };

  const handleGenerateZip = () => {
    const pending = checklist.filter((c) => !c.done).length;
    if (pending > 0) {
      toast.warning(`Atenção: ${pending} item(ns) do checklist ainda não estão concluídos.`);
    }
    toast.success("Pacote ZIP gerado com sucesso (simulado). Integre JSZip para geração real.");
  };

  const handleDownload = (att: Attachment) => {
    toast.info(`Download de "${att.name}" iniciado (simulado).`);
  };

  return (
    <AppLayout>
      <PageHeader title="Anexos e Dossiê" description="Gestão de anexos e checklist do dossiê de prestação de contas">
        <Button variant="outline" className="gap-2" onClick={handleUploadClick}>
          <Upload className="h-4 w-4" /> Carregar Anexo
        </Button>
        <Button className="gap-2" onClick={handleGenerateZip}>
          <Package className="h-4 w-4" /> Gerar Pacote ZIP
        </Button>
      </PageHeader>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Carregar Anexo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Categoria</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as Attachment["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventario">Inventário</SelectItem>
                  <SelectItem value="reconciliacao">Reconciliação</SelectItem>
                  <SelectItem value="parecer">Parecer/Auditoria</SelectItem>
                  <SelectItem value="outro">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Clique para seleccionar ficheiro</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Excel, imagens até 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anexos */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Anexos Carregados ({attachments.length})</h2>
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="bg-card rounded-lg border border-border card-shadow p-4 flex items-center gap-3 animate-fade-in">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">{categoryLabels[att.category]}</span>
                    <span className="text-xs text-muted-foreground">{(att.size / 1024 / 1024).toFixed(1)} MB</span>
                    <span className="text-xs text-muted-foreground">{att.uploadedAt}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(att)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
                    toast.success("Anexo removido.");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {attachments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Nenhum anexo carregado.</div>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Checklist do Dossiê</h2>
            <span className="text-xs text-muted-foreground">{completedCount}/{checklist.length} itens</span>
          </div>
          <div className="bg-card rounded-lg border border-border card-shadow p-4 animate-fade-in">
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                >
                  {item.done ? (
                    <CheckSquare className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Anexos;
