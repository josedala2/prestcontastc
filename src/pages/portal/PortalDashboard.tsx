import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-custom/PageElements";
import { submissionChecklist } from "@/data/mockData";
import { STATUS_LABELS } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useFiscalYears } from "@/hooks/useFiscalYears";
import { NotificacoesPanel } from "@/components/portal/NotificacoesPanel";
import { ProcessoTimeline } from "@/components/portal/ProcessoTimeline";
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
  Stamp,
  Eye,
  XCircle,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PortalDashboard = () => {
  const { entity, entityId } = usePortalEntity();
  const { unreadCount, notifications } = useSubmissions();
  const { fiscalYears: entityExercicios, loading } = useFiscalYears(entityId);
  const activeExercicio = entityExercicios.find((fy) => fy.year === 2024);
  const entityUnread = unreadCount(entityId);

  const today = new Date();
  const daysToDeadline = activeExercicio
    ? Math.ceil((new Date(activeExercicio.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const checklistDone = Math.round((activeExercicio?.checklistProgress || 0) / 100 * submissionChecklist.length);

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
          value={0}
          subtitle="pendentes de resposta"
          icon={<MessageSquare className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Notificações"
          value={entityUnread}
          subtitle="não lidas"
          icon={<Bell className="h-5 w-5" />}
          variant={entityUnread > 0 ? "warning" : "success"}
        />
      </div>

      {/* Process Timeline */}
      <div className="mb-6">
        <ProcessoTimeline fiscalYear="2024" />
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
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">A carregar...</p>
          ) : (
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
          )}
        </div>

        {/* Solicitações de Visto */}
        <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Stamp className="h-4 w-4 text-primary" /> Solicitações de Visto
            </h2>
            <Link to="/portal/solicitacao-visto" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Total", value: 4, color: "text-foreground" },
              { label: "Pendentes", value: 1, color: "text-amber-600", icon: Clock },
              { label: "Aprovados", value: 1, color: "text-green-600", icon: CheckCircle },
              { label: "Recusados", value: 1, color: "text-destructive", icon: XCircle },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded-md bg-muted/30">
                <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { id: "SV-2025-001", tipo: "Prestação de Serviços", estado: "pendente" as const, valor: "18.500.000,00 Kz" },
              { id: "SV-2024-002", tipo: "Empreitada", estado: "em_analise" as const, valor: "120.000.000,00 Kz" },
              { id: "SV-2024-001", tipo: "Fornecimento", estado: "aprovado" as const, valor: "45.000.000,00 Kz" },
            ].map((sol) => {
              const estadoMap = {
                pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
                em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
                aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
                recusado: { label: "Recusado", color: "bg-destructive/10 text-destructive" },
              };
              const config = estadoMap[sol.estado];
              return (
                <Link
                  key={sol.id}
                  to="/portal/solicitacao-visto"
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{sol.id}</span>
                      <span className="text-[10px] text-muted-foreground">{sol.tipo}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{sol.valor}</p>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", config.color)} variant="secondary">
                    {config.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Solicitações de Elementos em Falta */}
        {(() => {
          const solicitacoes = notifications.filter(
            (n) => n.entityId === entityId && n.type === "solicitacao_elementos"
          );
          const pendentes = solicitacoes.filter((s) => !s.read);
          return (
            <div className={cn(
              "bg-card rounded-lg border card-shadow p-5 animate-fade-in lg:col-span-2",
              pendentes.length > 0 ? "border-amber-300 dark:border-amber-700" : "border-border"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-amber-600" />
                  Solicitações de Elementos
                  {pendentes.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] ml-1">{pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}</Badge>
                  )}
                </h2>
                <Link to="/portal/solicitacoes" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {solicitacoes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sem solicitações de elementos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {solicitacoes.slice(0, 3).map((sol) => {
                    const deadline = sol.deadline ? new Date(sol.deadline) : null;
                    const daysLeft = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <Link
                        key={sol.id}
                        to="/portal/solicitacoes"
                        className={cn(
                          "block p-3 rounded-lg transition-colors",
                          sol.read ? "bg-muted/30 hover:bg-muted/50" : "bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                        )}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{sol.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(sol.createdAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {daysLeft !== null && (
                            <span className={cn(
                              "text-[10px] font-semibold",
                              daysLeft < 0 ? "text-destructive" : daysLeft <= 3 ? "text-destructive" : "text-amber-600"
                            )}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d atraso` : `${daysLeft}d restantes`}
                            </span>
                          )}
                          <Badge variant={sol.read ? "secondary" : "outline"} className={cn(
                            "text-[9px] ml-auto",
                            !sol.read && "border-amber-300 text-amber-700"
                          )}>
                            {sol.read ? "Respondido" : "Pendente"}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                  {solicitacoes.length > 3 && (
                    <Link to="/portal/solicitacoes" className="block text-center text-xs text-primary hover:underline py-2">
                      + {solicitacoes.length - 3} mais solicitações
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Pedidos de Esclarecimento */}
        <div className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Pedidos Pendentes
            </h2>
            <Link to="/portal/esclarecimentos" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Sem pedidos pendentes</p>
          </div>
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
