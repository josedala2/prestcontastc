import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, formatKz } from "@/data/mockData";
import { STATUS_LABELS } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, CheckCircle, Eye } from "lucide-react";

const PortalExercicios = () => {
  const navigate = useNavigate();
  const entityExercicios = mockFiscalYears.filter((fy) => fy.entityId === "1");
  const today = new Date();

  return (
    <PortalLayout>
      <PageHeader title="Exercícios Fiscais" description="Histórico de exercícios e estado de submissão" />

      <div className="space-y-4">
        {entityExercicios.map((fy) => {
          const daysLeft = Math.ceil(
            (new Date(fy.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isOverdue = daysLeft < 0 && !fy.submittedAt;

          return (
            <div key={fy.id} className="bg-card rounded-lg border border-border card-shadow p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Exercício {fy.year}</h3>
                    <StatusBadge
                      status={STATUS_LABELS[fy.status].label}
                      variant={STATUS_LABELS[fy.status].color as any}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Período: {fy.startDate} a {fy.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Prazo: {fy.deadline}</p>
                  {isOverdue && (
                    <span className="text-xs text-destructive font-semibold flex items-center gap-1 justify-end mt-0.5">
                      <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)}d atraso
                    </span>
                  )}
                  {fy.submittedAt && (
                    <span className="text-xs text-success flex items-center gap-1 justify-end mt-0.5">
                      <CheckCircle className="h-3 w-3" /> Submetido {fy.submittedAt}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Total Débito</p>
                  <p className="text-sm font-mono font-medium text-foreground">{formatKz(fy.totalDebito)} Kz</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Total Crédito</p>
                  <p className="text-sm font-mono font-medium text-foreground">{formatKz(fy.totalCredito)} Kz</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Validações</p>
                  <p className="text-sm font-medium">
                    {fy.errorsCount > 0 && <span className="text-destructive">{fy.errorsCount} erros</span>}
                    {fy.errorsCount > 0 && fy.warningsCount > 0 && " / "}
                    {fy.warningsCount > 0 && <span className="text-warning">{fy.warningsCount} avisos</span>}
                    {fy.errorsCount === 0 && fy.warningsCount === 0 && (
                      <span className="text-success">✓ OK</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Progresso</p>
                  <div className="flex items-center gap-2">
                    <Progress value={fy.checklistProgress} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium text-muted-foreground">{fy.checklistProgress}%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/portal/exercicios/${fy.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> Ver Detalhe
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
};

export default PortalExercicios;
