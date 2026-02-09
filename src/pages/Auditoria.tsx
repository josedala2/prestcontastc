import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockAuditLog } from "@/data/mockData";
import { Clock, User, FileText } from "lucide-react";

const Auditoria = () => {
  return (
    <AppLayout>
      <PageHeader title="Trilha de Auditoria" description="Registo de todas as acções no sistema" />

      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden animate-fade-in">
        <div className="divide-y divide-border">
          {mockAuditLog.map((log, index) => (
            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                {index < mockAuditLog.length - 1 && (
                  <div className="absolute left-1/2 top-9 w-px h-6 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{log.action}</p>
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
