import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockAuditLog } from "@/data/mockData";
import { Clock, User, FileText, Upload, ShieldCheck, Pencil, Send, Download, CheckCircle } from "lucide-react";

const actionTypeIcons: Record<string, React.ReactNode> = {
  importacao: <Upload className="h-4 w-4" />,
  validacao: <ShieldCheck className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  edicao: <Pencil className="h-4 w-4" />,
  submissao: <Send className="h-4 w-4" />,
  aprovacao: <CheckCircle className="h-4 w-4" />,
  exportacao: <Download className="h-4 w-4" />,
};

const actionTypeColors: Record<string, string> = {
  importacao: "bg-primary/10 text-primary",
  validacao: "bg-warning/10 text-warning",
  upload: "bg-info/10 text-info",
  edicao: "bg-muted text-muted-foreground",
  submissao: "bg-success/10 text-success",
  aprovacao: "bg-success/10 text-success",
  exportacao: "bg-primary/10 text-primary",
};

const Auditoria = () => {
  return (
    <AppLayout>
      <PageHeader title="Trilha de Auditoria" description="Registo imutável de todas as acções críticas no sistema (WORM)" />

      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden animate-fade-in">
        <div className="divide-y divide-border">
          {mockAuditLog.map((log, index) => (
            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${actionTypeColors[log.actionType || "edicao"]}`}>
                  {actionTypeIcons[log.actionType || "edicao"] || <FileText className="h-4 w-4" />}
                </div>
                {index < mockAuditLog.length - 1 && (
                  <div className="absolute left-1/2 top-9 w-px h-6 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  {log.actionType && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                      {log.actionType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {log.user}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {log.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Auditoria;
