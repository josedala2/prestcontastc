import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockAttachments } from "@/data/mockData";
import { Attachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Package, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter((c) => c.done).length;

  return (
    <AppLayout>
      <PageHeader title="Anexos e Dossiê" description="Gestão de anexos e checklist do dossiê de prestação de contas">
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Carregar Anexo
        </Button>
        <Button className="gap-2">
          <Package className="h-4 w-4" /> Gerar Pacote ZIP
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anexos */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Anexos Carregados</h2>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
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
