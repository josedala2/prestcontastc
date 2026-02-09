import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockValidations } from "@/data/mockData";
import { ValidationResult } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Validacoes = () => {
  const [validations, setValidations] = useState<ValidationResult[]>(mockValidations);
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "resolved">("all");
  const errors = validations.filter((v) => v.type === "error");
  const warnings = validations.filter((v) => v.type === "warning");

  const handleRevalidate = () => {
    // Simulate re-validation
    setValidations((prev) =>
      prev.map((v) => (v.code === "TB-001" ? { ...v, resolved: true } : v))
    );
    toast.success("Revalidação concluída — 1 erro resolvido automaticamente.");
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
    if (filter === "all") return true;
    if (filter === "resolved") return v.resolved;
    return v.type === filter && !v.resolved;
  });

  return (
    <AppLayout>
      <PageHeader title="Validações" description="Motor de validação contabilística">
        <Button className="gap-2" onClick={handleRevalidate}>
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

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({validations.length})</SelectItem>
            <SelectItem value="error">Erros ({errors.filter((e) => !e.resolved).length})</SelectItem>
            <SelectItem value="warning">Avisos ({warnings.filter((w) => !w.resolved).length})</SelectItem>
            <SelectItem value="resolved">Resolvidos ({validations.filter((v) => v.resolved).length})</SelectItem>
          </SelectContent>
        </Select>
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
