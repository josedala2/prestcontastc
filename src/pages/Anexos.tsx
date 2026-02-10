import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockAttachments, submissionChecklist } from "@/data/mockData";
import { Attachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Package, CheckSquare, Square, Download, AlertTriangle, Send, History, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateDossierZip } from "@/lib/exportUtils";

const categoryLabels: Record<string, string> = {
  inventario: "Inventário",
  reconciliacao: "Reconciliação",
  parecer: "Parecer/Auditoria",
  balancete: "Balancete",
  relatorio_gestao: "Relatório de Gestão",
  demonstracoes: "Demonstrações",
  outro: "Outros",
};

const Anexos = () => {
  const [attachments, setAttachments] = useState<Attachment[]>(mockAttachments);
  const [checklist, setChecklist] = useState(submissionChecklist.map((item) => ({
    ...item,
    done: mockAttachments.some((a) => a.category === item.category),
  })));
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<Attachment["category"]>("outro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter((c) => c.done).length;
  const requiredCount = checklist.filter((c) => c.required).length;
  const requiredDone = checklist.filter((c) => c.required && c.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);
  const canSubmit = requiredDone === requiredCount;

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const existingVersions = attachments.filter((a) => a.name === file.name);
      const newAttachment: Attachment = {
        id: `a_${Date.now()}`,
        name: file.name,
        type: file.type,
        category: uploadCategory,
        size: file.size,
        uploadedAt: new Date().toISOString().split("T")[0],
        version: existingVersions.length + 1,
        required: false,
      };
      setAttachments((prev) => [newAttachment, ...prev]);
      setUploadDialogOpen(false);
      toast.success(`Anexo "${file.name}" carregado (v${newAttachment.version}).`);
    }
  };

  const [generatingZip, setGeneratingZip] = useState(false);

  const handleGenerateZip = async () => {
    const pending = checklist.filter((c) => c.required && !c.done).length;
    if (pending > 0) {
      toast.warning(`Atenção: ${pending} item(ns) obrigatório(s) do checklist ainda não estão concluídos.`);
      return;
    }
    setGeneratingZip(true);
    try {
      await generateDossierZip();
      toast.success("Pacote ZIP do dossiê gerado e descarregado com sucesso.");
    } catch (e) {
      toast.error("Erro ao gerar pacote ZIP.");
    } finally {
      setGeneratingZip(false);
    }
  };

  const handleDownload = (att: Attachment) => {
    toast.info(`Download de "${att.name}" v${att.version || 1} iniciado (simulado).`);
  };

  return (
    <AppLayout>
      <PageHeader title="Anexos e Dossiê" description="Gestão de anexos e checklist obrigatório — Resolução 1/17">
        <Button variant="outline" className="gap-2" onClick={handleUploadClick}>
          <Upload className="h-4 w-4" /> Carregar Anexo
        </Button>
        <Button className="gap-2" onClick={handleGenerateZip} disabled={!canSubmit || generatingZip}>
          {generatingZip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />} Gerar Pacote ZIP
        </Button>
      </PageHeader>

      {/* Submission readiness */}
      <div className={cn(
        "rounded-lg border p-4 mb-6 flex items-center gap-3 animate-fade-in",
        canSubmit ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30"
      )}>
        {canSubmit ? (
          <Send className="h-5 w-5 text-success shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {canSubmit ? "Dossiê completo — pronto para submissão" : `${requiredCount - requiredDone} documento(s) obrigatório(s) em falta`}
          </p>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{checklist.length} itens completos • {requiredDone}/{requiredCount} obrigatórios
          </p>
        </div>
        <div className="w-24">
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{progress}%</p>
        </div>
      </div>

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
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada novo upload do mesmo ficheiro cria uma nova versão (histórico mantido).
            </p>
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
                    {att.version && att.version > 1 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                        <History className="h-3 w-3" /> v{att.version}
                      </span>
                    )}
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
            <h2 className="text-base font-semibold text-foreground">Checklist do Dossiê (Resolução 1/17)</h2>
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
                  <span className={cn("text-sm flex-1", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                    {item.label}
                  </span>
                  {item.required && !item.done && (
                    <span className="text-[10px] text-destructive font-semibold px-1.5 py-0.5 rounded bg-destructive/10">
                      Obrigatório
                    </span>
                  )}
                  {item.required && item.done && (
                    <span className="text-[10px] text-success font-medium">✓</span>
                  )}
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
