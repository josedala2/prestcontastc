import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockValidations } from "@/data/mockData";
import { ValidationResult } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const Validacoes = () => {
  const [validations, setValidations] = useState<ValidationResult[]>(mockValidations);
  const errors = validations.filter((v) => v.type === "error");
  const warnings = validations.filter((v) => v.type === "warning");

  return (
    <AppLayout>
      <PageHeader title="Validações" description="Motor de validação contabilística">
        <Button className="gap-2">
          <RefreshCw className="h-4 w-4" /> Revalidar
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-destructive">{errors.filter((e) => !e.resolved).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Erros pendentes</p>
        </div>
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-warning">{warnings.filter((w) => !w.resolved).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Avisos pendentes</p>
        </div>
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-success">{validations.filter((v) => v.resolved).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Resolvidos</p>
        </div>
      </div>

      <div className="space-y-3">
        {validations.map((v) => (
          <div
            key={v.id}
            className={cn(
              "bg-card rounded-lg border card-shadow p-5 flex items-start gap-4 animate-fade-in",
              v.resolved ? "border-border opacity-60" : v.type === "error" ? "border-destructive/30" : "border-warning/30"
            )}
          >
            {v.resolved ? (
              <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
            ) : v.type === "error" ? (
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{v.code}</span>
                <StatusBadge
                  status={v.type === "error" ? "Erro" : "Aviso"}
                  variant={v.type === "error" ? "destructive" : "warning"}
                />
                {v.resolved && <StatusBadge status="Resolvido" variant="success" />}
              </div>
              <p className="text-sm font-medium text-foreground">{v.message}</p>
              {v.detail && <p className="text-xs text-muted-foreground mt-1">{v.detail}</p>}
            </div>
            {!v.resolved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setValidations((prev) =>
                    prev.map((item) => (item.id === v.id ? { ...item, resolved: true } : item))
                  )
                }
              >
                Resolver
              </Button>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Validacoes;
