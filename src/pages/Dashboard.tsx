import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockValidations, mockAuditLog, mockClarifications, formatKz } from "@/data/mockData";
import { AlertTriangle, CheckCircle, FileBarChart, Building2, XCircle, Clock, Send, Calendar, MessageSquare, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, VALIDATION_LEVEL_LABELS, ValidationResult } from "@/types";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const activeFy = mockFiscalYears[0];
  const totalPages = Math.ceil(mockFiscalYears.length / ITEMS_PER_PAGE);
  const paginatedFiscalYears = mockFiscalYears.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const errors = mockValidations.filter((v) => v.type === "error" && !v.resolved);
  const warnings = mockValidations.filter((v) => v.type === "warning" && !v.resolved);

  // Deadline tracking
  const today = new Date();
  const entitiesWithDeadline = mockFiscalYears.filter((fy) => !["conforme", "nao_conforme"].includes(fy.status));
  const overdueCount = entitiesWithDeadline.filter((fy) => new Date(fy.deadline) < today && !fy.submittedAt).length;
  const pendingSubmission = mockFiscalYears.filter((fy) => fy.status === "rascunho" || fy.status === "em_validacao").length;
  const submittedCount = mockFiscalYears.filter((fy) => ["submetido", "em_analise", "com_pedidos", "conforme"].includes(fy.status)).length;
  const conformeCount = mockFiscalYears.filter((fy) => fy.status === "conforme").length;

  // Validation levels summary
  const byLevel = (level: ValidationResult["level"]) => mockValidations.filter((v) => v.level === level && !v.resolved);

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description={`Painel de Fiscalização — Tribunal de Contas de Angola`}
      />

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Entidades Registadas"
          value={new Set(mockFiscalYears.map(fy => fy.entityId)).size}
          subtitle={`${conformeCount} conforme(s)`}
          icon={<Building2 className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Pendentes de Submissão"
          value={pendingSubmission}
          subtitle="em rascunho ou validação"
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Em Atraso (> 30/06)"
          value={overdueCount}
          subtitle="prazo ultrapassado"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="destructive"
        />
        <StatCard
          title="Submetidos / Em Análise"
          value={submittedCount}
          subtitle="no tribunal"
          icon={<Send className="h-5 w-5" />}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Fila de processos */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-primary" /> Fila de Processos — Exercício 2024
          </h2>
          <div className="space-y-3">
            {mockFiscalYears.map((fy) => {
              const daysLeft = Math.ceil((new Date(fy.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysLeft < 0 && !fy.submittedAt;
              return (
                <div key={fy.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{fy.entityName}</p>
                      <span className="text-xs text-muted-foreground">{fy.year}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">{formatKz(fy.totalDebito)} Kz</span>
                      {isOverdue && (
                        <span className="text-[10px] text-destructive font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)}d atraso
                        </span>
                      )}
                      {fy.submittedAt && (
                        <span className="text-[10px] text-success">Submetido {fy.submittedAt}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fy.errorsCount > 0 && (
                      <span className="text-[10px] text-destructive font-medium">{fy.errorsCount}E</span>
                    )}
                    {fy.warningsCount > 0 && (
                      <span className="text-[10px] text-warning font-medium">{fy.warningsCount}A</span>
                    )}
                  </div>
                  <div className="w-16">
                    <Progress value={fy.checklistProgress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground text-right mt-0.5">{fy.checklistProgress}%</p>
                  </div>
                  <StatusBadge
                    status={STATUS_LABELS[fy.status].label}
                    variant={STATUS_LABELS[fy.status].color as any}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Motor de Validação — Resumo por nível */}
        <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Validações por Nível
          </h2>
          <div className="space-y-4">
            {(Object.keys(VALIDATION_LEVEL_LABELS) as ValidationResult["level"][]).map((level) => {
              const pending = byLevel(level);
              const levelErrors = pending.filter((v) => v.type === "error");
              const levelWarnings = pending.filter((v) => v.type === "warning");
              return (
                <div key={level} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs font-semibold text-foreground mb-1">{VALIDATION_LEVEL_LABELS[level].label}</p>
                  <div className="flex items-center gap-3">
                    {levelErrors.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" /> {levelErrors.length} erros
                      </span>
                    )}
                    {levelWarnings.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="h-3 w-3" /> {levelWarnings.length} avisos
                      </span>
                    )}
                    {pending.length === 0 && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" /> Tudo OK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submission readiness */}
          <div className={cn(
            "mt-4 p-3 rounded-lg border",
            errors.length === 0 ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"
          )}>
            <p className="text-xs font-semibold text-foreground">
              {errors.length === 0 ? "✓ Pronto para submissão" : `✗ ${errors.length} erro(s) bloqueante(s)`}
            </p>
          </div>
        </div>
      </div>

      {/* Pedidos de Esclarecimento + Auditoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos de Esclarecimento */}
        <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Pedidos de Esclarecimento
          </h2>
          <div className="space-y-3">
            {mockClarifications.map((cr) => (
              <div key={cr.id} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{cr.entityName}</p>
                  <StatusBadge
                    status={cr.status === "pendente" ? "Pendente" : cr.status === "respondido" ? "Respondido" : "Encerrado"}
                    variant={cr.status === "pendente" ? "warning" : cr.status === "respondido" ? "info" : "success"}
                  />
                </div>
                <p className="text-xs text-foreground">{cr.subject}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" /> {cr.createdAt}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Prazo: {cr.deadline}</span>
                  {cr.responses && cr.responses.length > 0 && (
                    <span className="text-[10px] text-success">{cr.responses.length} resposta(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico recente */}
        <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Histórico de Actividades
          </h2>
          <div className="space-y-3">
            {mockAuditLog.slice(0, 6).map((log) => (
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
