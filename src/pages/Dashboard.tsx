import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockValidations, mockAuditLog, formatKz } from "@/data/mockData";
import { AlertTriangle, CheckCircle, FileBarChart, Building2, XCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { STATUS_LABELS } from "@/types";

const Dashboard = () => {
  const activeFy = mockFiscalYears[0];
  const errors = mockValidations.filter((v) => v.type === "error" && !v.resolved);
  const warnings = mockValidations.filter((v) => v.type === "warning" && !v.resolved);

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description={`Exercício ${activeFy.year} — ${activeFy.entityName}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Débito"
          value={`${formatKz(activeFy.totalDebito)} Kz`}
          icon={<FileBarChart className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Total Crédito"
          value={`${formatKz(activeFy.totalCredito)} Kz`}
          icon={<FileBarChart className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Erros"
          value={errors.length}
          subtitle="pendentes de resolução"
          icon={<XCircle className="h-5 w-5" />}
          variant="destructive"
        />
        <StatCard
          title="Avisos"
          value={warnings.length}
          subtitle="a verificar"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado do Exercício */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4">Estado do Exercício</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado actual</span>
              <StatusBadge
                status={STATUS_LABELS[activeFy.status].label}
                variant={STATUS_LABELS[activeFy.status].color as any}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progresso do Checklist</span>
                <span className="text-sm font-medium text-foreground">{activeFy.checklistProgress}%</span>
              </div>
              <Progress value={activeFy.checklistProgress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Entidade</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{activeFy.entityName}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{activeFy.startDate} a {activeFy.endDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validações */}
        <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4">Validações Recentes</h2>
          <div className="space-y-3">
            {mockValidations.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-start gap-2.5">
                {v.resolved ? (
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                ) : v.type === "error" ? (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{v.code}</p>
                  <p className="text-sm text-foreground truncate">{v.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico recente */}
      <div className="mt-6 bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
        <h2 className="text-base font-semibold text-foreground mb-4">Histórico de Actividades</h2>
        <div className="space-y-3">
          {mockAuditLog.map((log) => (
            <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{log.user}</p>
                <p className="text-xs text-muted-foreground">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
