import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, formatKz } from "@/data/mockData";
import { FiscalYear, STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar } from "lucide-react";

const Exercicios = () => {
  const [fiscalYears] = useState<FiscalYear[]>(mockFiscalYears);

  return (
    <AppLayout>
      <PageHeader title="Exercícios Fiscais" description="Gestão de períodos contabilísticos">
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Exercício
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fiscalYears.map((fy) => (
          <div key={fy.id} className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{fy.entityName} — {fy.year}</h3>
                  <p className="text-xs text-muted-foreground">{fy.startDate} a {fy.endDate}</p>
                </div>
              </div>
              <StatusBadge
                status={STATUS_LABELS[fy.status].label}
                variant={STATUS_LABELS[fy.status].color as any}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Débito</p>
                <p className="text-sm font-semibold text-foreground font-mono">{formatKz(fy.totalDebito)}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Crédito</p>
                <p className="text-sm font-semibold text-foreground font-mono">{formatKz(fy.totalCredito)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs text-destructive font-medium">{fy.errorsCount} erros</span>
              <span className="text-xs text-warning font-medium">{fy.warningsCount} avisos</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Checklist</span>
                <span className="text-xs font-medium text-foreground">{fy.checklistProgress}%</span>
              </div>
              <Progress value={fy.checklistProgress} className="h-1.5" />
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Exercicios;
