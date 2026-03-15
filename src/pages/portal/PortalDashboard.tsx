import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockClarifications, submissionChecklist } from "@/data/mockData";
import { STATUS_LABELS } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { NotificacoesPanel } from "@/components/portal/NotificacoesPanel";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileBarChart,
  MessageSquare,
  Paperclip,
  ArrowRight,
  Send,
  Bell,
} from "lucide-react";

const PortalDashboard = () => {
  const { entity, entityId } = usePortalEntity();
  const { unreadCount } = useSubmissions();
  const entityExercicios = mockFiscalYears.filter((fy) => fy.entityId === entityId);
  const activeExercicio = entityExercicios.find((fy) => fy.year === 2024);
  const pendingClarifications = mockClarifications.filter(
    (cr) => cr.entityId === entityId && cr.status === "pendente"
  );
  const entityUnread = unreadCount(entityId);

  const today = new Date();
  const daysToDeadline = activeExercicio
    ? Math.ceil((new Date(activeExercicio.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const checklistDone = Math.round((activeExercicio?.checklistProgress || 0) / 100 * submissionChecklist.length);

  // Short name for display
  const shortName = entity.name.split(" - ")[1] || entity.name;

  return (
    <PortalLayout>
      <PageHeader
        title="Painel da Entidade"
        description={`${entity.name}`}
      />

      {/* Deadline alert */}
      {activeExercicio && daysToDeadline <= 30 && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          daysToDeadline < 0
            ? "bg-destructive/5 border-destructive/30"
            : daysToDeadline <= 7
              ? "bg-warning/10 border-warning/30"
              : "bg-primary/5 border-primary/20"
        }`}>
          {daysToDeadline < 0 ? (
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-warning shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {daysToDeadline < 0
                ? `Prazo ultrapassado há ${Math.abs(daysToDeadline)} dia(s)!`
                : `${daysToDeadline} dia(s) restantes para submissão`}
            </p>
            <p className="text-xs text-muted-foreground">
              Prazo legal: 30 de Junho de {activeExercicio.year + 1} (Resolução nº 1/17)
            </p>
          </div>
          {activeExercicio.status === "rascunho" && (
            <Button size="sm" className="ml-auto shrink-0" asChild>
              <Link to="/portal/documentos">
                <Send className="h-4 w-4" /> Completar Submissão
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Exercício Activo"
          value={activeExercicio?.year || "—"}
          subtitle={activeExercicio ? STATUS_LABELS[activeExercicio.status].label : ""}
          icon={<Calendar className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Checklist"
          value={`${checklistDone}/${submissionChecklist.length}`}
          subtitle="documentos obrigatórios"
          icon={<Paperclip className="h-5 w-5" />}
          variant={activeExercicio?.checklistProgress === 100 ? "success" : "warning"}
        />
        <StatCard
          title="Validações"
          value={`${activeExercicio?.errorsCount || 0} erros`}
          subtitle={`${activeExercicio?.warningsCount || 0} avisos`}
          icon={<CheckCircle className="h-5 w-5" />}
          variant={activeExercicio?.errorsCount === 0 ? "success" : "destructive"}
        />
        <StatCard
          title="Esclarecimentos"
          value={pendingClarifications.length}
          subtitle="pendentes de resposta"
          icon={<MessageSquare className="h-5 w-5" />}
          variant={pendingClarifications.length > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Notificações"
          value={entityUnread}
          subtitle="não lidas"
          icon={<Bell className="h-5 w-5" />}
          variant={entityUnread > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercícios */}
        <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-primary" /> Exercícios Fiscais
            </h2>
            <Link to="/portal/exercicios" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {entityExercicios.map((fy) => (
              <div key={fy.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{fy.year}</p>
                    <StatusBadge
                      status={STATUS_LABELS[fy.status].label}
                      variant={STATUS_LABELS[fy.status].color as any}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Prazo: {fy.deadline}</p>
                </div>
                <div className="w-20">
                  <Progress value={fy.checklistProgress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">{fy.checklistProgress}%</p>
                </div>
              </div>
            ))}
            {entityExercicios.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem exercícios registados.</p>
            )}
          </div>
        </div>

        {/* Pedidos de Esclarecimento pendentes */}
        <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Pedidos Pendentes
            </h2>
            <Link to="/portal/esclarecimentos" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {pendingClarifications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Sem pedidos pendentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingClarifications.map((cr) => {
                const daysLeft = Math.ceil(
                  (new Date(cr.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={cr.id}
                    to="/portal/esclarecimentos"
                    className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">{cr.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">Criado: {cr.createdAt}</span>
                      <span className={`text-[10px] font-semibold ${daysLeft < 0 ? "text-destructive" : "text-warning"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d atraso` : `${daysLeft}d restantes`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Notifications Panel */}
      <div className="mt-6">
        <NotificacoesPanel />
      </div>
    </PortalLayout>
  );
};

export default PortalDashboard;
