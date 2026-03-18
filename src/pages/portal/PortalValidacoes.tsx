import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { defaultValidations as mockValidations } from "@/lib/dataUtils";
import { VALIDATION_LEVEL_LABELS, ValidationResult } from "@/types";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PortalValidacoes = () => {
  const totalResolved = mockValidations.filter((v) => v.resolved).length;
  const progress = Math.round((totalResolved / mockValidations.length) * 100);
  const errors = mockValidations.filter((v) => v.type === "error" && !v.resolved);
  const warnings = mockValidations.filter((v) => v.type === "warning" && !v.resolved);

  const byLevel = (level: ValidationResult["level"]) =>
    mockValidations.filter((v) => v.level === level);

  return (
    <PortalLayout>
      <PageHeader title="Estado das Validações" description="Veja o resultado das validações automáticas do seu exercício" />

      {/* Summary */}
      <div className="bg-card rounded-lg border border-border card-shadow p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Progresso de Validação</h2>
          <span className="text-sm font-mono font-semibold">
            {totalResolved}/{mockValidations.length} resolvidas
          </span>
        </div>
        <Progress value={progress} className="h-2.5 mb-3" />
        <div className="flex items-center gap-4">
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-sm text-destructive font-medium">
              <XCircle className="h-4 w-4" /> {errors.length} erros bloqueantes
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-sm text-warning font-medium">
              <AlertTriangle className="h-4 w-4" /> {warnings.length} avisos
            </span>
          )}
          {errors.length === 0 && warnings.length === 0 && (
            <span className="flex items-center gap-1 text-sm text-success font-medium">
              <CheckCircle className="h-4 w-4" /> Todas as validações passaram
            </span>
          )}
        </div>
        <div className={cn(
          "mt-4 p-3 rounded-lg border",
          errors.length === 0
            ? "bg-success/5 border-success/30"
            : "bg-destructive/5 border-destructive/30"
        )}>
          <p className="text-xs font-semibold text-foreground">
            {errors.length === 0
              ? "✓ Pronto para submissão — sem erros bloqueantes"
              : `✗ Submissão bloqueada — corrija ${errors.length} erro(s) antes de submeter`}
          </p>
        </div>
      </div>

      {/* By level */}
      {(Object.keys(VALIDATION_LEVEL_LABELS) as ValidationResult["level"][]).map((level) => {
        const levelValidations = byLevel(level);
        const levelMeta = VALIDATION_LEVEL_LABELS[level];

        return (
          <div key={level} className="bg-card rounded-lg border border-border card-shadow p-5 mb-4 animate-fade-in">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">{levelMeta.label}</h3>
              <p className="text-xs text-muted-foreground">{levelMeta.description}</p>
            </div>
            <div className="space-y-2">
              {levelValidations.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    v.resolved
                      ? "bg-success/5 border-success/15"
                      : v.type === "error"
                        ? "bg-destructive/5 border-destructive/15"
                        : "bg-warning/5 border-warning/15"
                  )}
                >
                  {v.resolved ? (
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : v.type === "error" ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{v.code}</span>
                      <p className={cn("text-sm font-medium", v.resolved && "line-through opacity-60")}>
                        {v.message}
                      </p>
                    </div>
                    {v.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                        <Info className="h-3 w-3 shrink-0 mt-0.5" /> {v.detail}
                      </p>
                    )}
                  </div>
                  {v.resolved && (
                    <span className="text-[10px] text-success font-semibold shrink-0">RESOLVIDO</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </PortalLayout>
  );
};

export default PortalValidacoes;
