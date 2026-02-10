import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockValidations } from "@/data/mockData";
import { ValidationResult, VALIDATION_LEVEL_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Filter, ShieldCheck, Calculator, Scale } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const levelIcons: Record<ValidationResult["level"], React.ReactNode> = {
  completude: <ShieldCheck className="h-4 w-4" />,
  consistencia: <Calculator className="h-4 w-4" />,
  regras_tribunal: <Scale className="h-4 w-4" />,
};

const Validacoes = () => {
  const [validations, setValidations] = useState<ValidationResult[]>(mockValidations);
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "resolved">("all");
  const [activeLevel, setActiveLevel] = useState<"all" | ValidationResult["level"]>("all");

  const errors = validations.filter((v) => v.type === "error" && !v.resolved);
  const warnings = validations.filter((v) => v.type === "warning" && !v.resolved);
  const resolved = validations.filter((v) => v.resolved);

  const byLevel = (level: ValidationResult["level"]) => validations.filter((v) => v.level === level && !v.resolved);

  const handleRevalidate = () => {
    setValidations((prev) =>
      prev.map((v) => (v.code === "TB-001" ? { ...v, resolved: true } : v))
    );
    toast.success("Revalidação concluída — verificação dos 3 níveis executada.");
  };

  const handleResolve = (id: string) => {
    setValidations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
    );
    toast.success("Validação marcada como resolvida.");
  };

  const handleUnresolve = (id: string) => {
    setValidations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: false } : item))
    );
  };

  const filtered = validations.filter((v) => {
    const matchesFilter = filter === "all" ? true
      : filter === "resolved" ? v.resolved
      : v.type === filter && !v.resolved;
    const matchesLevel = activeLevel === "all" || v.level === activeLevel;
    return matchesFilter && matchesLevel;
  });

  const canSubmit = errors.length === 0 && byLevel("completude").length === 0;

  return (
    <AppLayout>
      <PageHeader title="Validações" description="Motor de validação contabilística — 3 níveis (Resolução 1/17)">
        <Button className="gap-2" onClick={handleRevalidate}>
          <RefreshCw className="h-4 w-4" /> Revalidar
        </Button>
      </PageHeader>

      {/* Summary by level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(Object.keys(VALIDATION_LEVEL_LABELS) as ValidationResult["level"][]).map((level) => {
          const levelErrors = validations.filter((v) => v.level === level && v.type === "error" && !v.resolved);
          const levelWarnings = validations.filter((v) => v.level === level && v.type === "warning" && !v.resolved);
          const levelResolved = validations.filter((v) => v.level === level && v.resolved);
          return (
            <div
              key={level}
              className={cn(
                "bg-card rounded-lg border card-shadow p-4 animate-fade-in cursor-pointer transition-colors",
                activeLevel === level ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
              )}
              onClick={() => setActiveLevel(activeLevel === level ? "all" : level)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-primary/10 text-primary">{levelIcons[level]}</div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{VALIDATION_LEVEL_LABELS[level].label}</p>
                  <p className="text-[10px] text-muted-foreground">{VALIDATION_LEVEL_LABELS[level].description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-destructive font-medium">{levelErrors.length} erros</span>
                <span className="text-xs text-warning font-medium">{levelWarnings.length} avisos</span>
                <span className="text-xs text-success font-medium">{levelResolved.length} ✓</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission readiness */}
      <div className={cn(
        "rounded-lg border p-4 mb-6 flex items-center gap-3 animate-fade-in",
        canSubmit ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"
      )}>
        {canSubmit ? (
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            {canSubmit ? "Pronto para submissão" : "Submissão bloqueada"}
          </p>
          <p className="text-xs text-muted-foreground">
            {canSubmit
              ? "Todos os erros críticos e itens de completude foram resolvidos."
              : `${errors.length} erro(s) pendente(s) — resolva antes de submeter ao Tribunal de Contas.`
            }
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-destructive">{errors.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Erros pendentes</p>
        </div>
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-warning">{warnings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Avisos pendentes</p>
        </div>
        <div className="bg-card rounded-lg border border-border card-shadow p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-success">{resolved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Resolvidos</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({validations.length})</SelectItem>
            <SelectItem value="error">Erros ({errors.length})</SelectItem>
            <SelectItem value="warning">Avisos ({warnings.length})</SelectItem>
            <SelectItem value="resolved">Resolvidos ({resolved.length})</SelectItem>
          </SelectContent>
        </Select>
        {activeLevel !== "all" && (
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setActiveLevel("all")}>
            Limpar filtro de nível
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((v) => (
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
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{v.code}</span>
                <StatusBadge
                  status={v.type === "error" ? "Erro" : "Aviso"}
                  variant={v.type === "error" ? "destructive" : "warning"}
                />
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  {levelIcons[v.level]}
                  {VALIDATION_LEVEL_LABELS[v.level].label.split("—")[0].trim()}
                </span>
                {v.resolved && <StatusBadge status="Resolvido" variant="success" />}
              </div>
              <p className="text-sm font-medium text-foreground">{v.message}</p>
              {v.detail && <p className="text-xs text-muted-foreground mt-1">{v.detail}</p>}
            </div>
            {v.resolved ? (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleUnresolve(v.id)}>
                Reabrir
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleResolve(v.id)}>
                Resolver
              </Button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhuma validação encontrada para o filtro seleccionado.</div>
        )}
      </div>
    </AppLayout>
  );
};

export default Validacoes;
