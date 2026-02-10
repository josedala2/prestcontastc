import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { submissionChecklist, mockAttachments } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import {
  Upload,
  CheckCircle,
  FileText,
  AlertTriangle,
  Paperclip,
} from "lucide-react";

const PortalDocumentos = () => {
  const [checkedItems, setCheckedItems] = useState<string[]>(
    submissionChecklist.slice(0, 6).map((c) => c.id)
  );

  const progress = Math.round((checkedItems.length / submissionChecklist.length) * 100);
  const allRequiredDone = submissionChecklist
    .filter((c) => c.required)
    .every((c) => checkedItems.includes(c.id));

  const handleToggle = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUpload = () => {
    toast.success("Documento carregado com sucesso");
  };

  return (
    <PortalLayout>
      <PageHeader title="Documentos & Anexos" description="Carregue e gira os documentos obrigatórios para submissão">
        <Button size="sm" onClick={handleUpload}>
          <Upload className="h-4 w-4" /> Carregar Documento
        </Button>
      </PageHeader>

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
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isChecked
                    ? "bg-success/5 border-success/20"
                    : item.required
                      ? "bg-destructive/5 border-destructive/15 hover:bg-destructive/8"
                      : "bg-muted/20 border-border hover:bg-muted/40"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(item.id)}
                />
                <FileText className={`h-4 w-4 shrink-0 ${isChecked ? "text-success" : "text-muted-foreground"}`} />
                <span className={`text-sm flex-1 ${isChecked ? "text-success line-through opacity-70" : "text-foreground"}`}>
                  {item.label}
                </span>
                {item.required && !isChecked && (
                  <span className="text-[9px] text-destructive font-bold px-1.5 py-0.5 rounded bg-destructive/10">
                    OBRIGATÓRIO
                  </span>
                )}
                {isChecked && (
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Uploaded files */}
      <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
        <h2 className="text-sm font-semibold text-foreground mb-4">Ficheiros Carregados</h2>
        <div className="space-y-2">
          {mockAttachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(att.size / 1024).toFixed(0)} KB · v{att.version || 1} · {att.uploadedAt}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Substituir
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <Button size="lg" disabled={!allRequiredDone} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Submeter Prestação de Contas
        </Button>
      </div>
    </PortalLayout>
  );
};

export default PortalDocumentos;
