import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { CheckCircle, Circle, Send, FileSearch, ClipboardCheck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "submetido", label: "Submetido", description: "Prestação de contas enviada ao Tribunal", icon: Send },
  { key: "recepcionado", label: "Recepcionado", description: "Documentação verificada pela Secretaria", icon: ClipboardCheck },
  { key: "em_analise", label: "Em Análise", description: "Análise técnica em curso", icon: FileSearch },
  { key: "parecer", label: "Parecer Emitido", description: "Parecer técnico finalizado", icon: Scale },
] as const;

function getActiveStep(submissionStatus: string, hasParecer: boolean): number {
  if (hasParecer) return 4;
  if (submissionStatus === "em_analise") return 3;
  if (submissionStatus === "recepcionado") return 2;
  if (submissionStatus === "pendente") return 1;
  if (submissionStatus === "rejeitado") return 0;
  return 0;
}

interface ProcessoTimelineProps {
  fiscalYear?: string;
}

export function ProcessoTimeline({ fiscalYear = "2024" }: ProcessoTimelineProps) {
  const { entityId } = usePortalEntity();
  const { getStatus } = useSubmissions();
  const fiscalYearId = `${entityId}-${fiscalYear}`;
  const status = getStatus(entityId, fiscalYearId);

  const isSubmitted = status !== "rascunho";
  const activeStep = isSubmitted ? getActiveStep(status, false) : -1;

  if (!isSubmitted) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 animate-fade-in">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Estado do Processo — {fiscalYear}
        </h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          A prestação de contas ainda não foi submetida.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5 animate-fade-in">
      <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        Estado do Processo — {fiscalYear}
      </h2>

      {/* Timeline */}
      <div className="relative flex items-start justify-between">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
          style={{ width: activeStep > 0 ? `${((activeStep - 1) / (STEPS.length - 1)) * 100}%` : "0%" }}
        />

        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isCompleted = i < activeStep;
          const isCurrent = i === activeStep;
          const isPending = i > activeStep;

          return (
            <div key={step.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / STEPS.length}%` }}>
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary/10 border-primary text-primary ring-4 ring-primary/20",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <p className={cn(
                "text-xs font-medium mt-2 text-center",
                (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground text-center mt-0.5 max-w-[120px] hidden md:block">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {status === "rejeitado" && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
          A submissão foi devolvida pela Secretaria. Corrija os documentos e resubmeta.
        </div>
      )}
    </div>
  );
}
