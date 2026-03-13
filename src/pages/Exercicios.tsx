import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockEntities, formatKz } from "@/data/mockData";
import { FiscalYear, STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar, Pencil, Trash2, Eye, Clock, AlertTriangle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Exercicios = () => {
  const navigate = useNavigate();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(mockFiscalYears);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FiscalYear | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({
    entityId: "",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
    status: "rascunho" as FiscalYear["status"],
  });

  const openNew = () => {
    setEditing(null);
    const yr = new Date().getFullYear();
    setForm({
      entityId: mockEntities[0]?.id || "",
      year: yr,
      startDate: `${yr}-01-01`,
      endDate: `${yr}-12-31`,
      status: "rascunho",
    });
    setDialogOpen(true);
  };

  const openEdit = (fy: FiscalYear) => {
    setEditing(fy);
    setForm({
      entityId: fy.entityId,
      year: fy.year,
      startDate: fy.startDate,
      endDate: fy.endDate,
      status: fy.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const entity = mockEntities.find((e) => e.id === form.entityId);
    if (!entity) {
      toast.error("Seleccione uma entidade.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Preencha as datas do exercício.");
      return;
    }

    if (editing) {
      setFiscalYears((prev) =>
        prev.map((fy) =>
          fy.id === editing.id
            ? { ...fy, entityId: form.entityId, entityName: entity.name, year: form.year, startDate: form.startDate, endDate: form.endDate, status: form.status }
            : fy
        )
      );
      toast.success("Exercício actualizado com sucesso.");
    } else {
      const newFy: FiscalYear = {
        id: `fy_${Date.now()}`,
        entityId: form.entityId,
        entityName: entity.name,
        year: form.year,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        totalDebito: 0,
        totalCredito: 0,
        errorsCount: 0,
        warningsCount: 0,
        checklistProgress: 0,
        deadline: `${form.year + 1}-04-30`,
      };
      setFiscalYears((prev) => [newFy, ...prev]);
      toast.success("Exercício criado com sucesso.");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setFiscalYears((prev) => prev.filter((fy) => fy.id !== id));
    toast.success("Exercício removido.");
  };

  const handleStatusChange = (id: string, status: FiscalYear["status"]) => {
    setFiscalYears((prev) =>
      prev.map((fy) => (fy.id === id ? { ...fy, status } : fy))
    );
    toast.success(`Estado alterado para "${STATUS_LABELS[status].label}".`);
  };

  const getDaysToDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const detailFy = detailId ? fiscalYears.find((fy) => fy.id === detailId) : null;

  // Workflow transitions
  const WORKFLOW_TRANSITIONS: Record<FiscalYear["status"], FiscalYear["status"][]> = {
    rascunho: ["em_validacao"],
    em_validacao: ["rascunho", "submetido"],
    submetido: ["em_analise"],
    em_analise: ["com_pedidos", "conforme", "nao_conforme"],
    com_pedidos: ["em_analise"],
    conforme: [],
    nao_conforme: ["em_analise"],
  };

  return (
    <AppLayout>
      <PageHeader title="Exercícios Fiscais" description="Gestão de períodos contabilísticos — Prazo: 30 de Junho do ano seguinte">
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Exercício
        </Button>
      </PageHeader>

      {/* New / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Entidade</Label>
              <Select value={form.entityId} onValueChange={(v) => setForm({ ...form, entityId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione a entidade" />
                </SelectTrigger>
                <SelectContent>
                  {mockEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ano</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground">Prazo de entrega (automático)</p>
              <p className="text-sm font-medium">{form.year + 1}-04-30</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailFy} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes — {detailFy?.entityName} {detailFy?.year}</DialogTitle>
          </DialogHeader>
          {detailFy && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Período</p>
                  <p className="text-sm font-medium">{detailFy.startDate} a {detailFy.endDate}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Estado</p>
                  <StatusBadge status={STATUS_LABELS[detailFy.status].label} variant={STATUS_LABELS[detailFy.status].color as any} />
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Total Débito</p>
                  <p className="text-sm font-semibold font-mono">{formatKz(detailFy.totalDebito)}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Total Crédito</p>
                  <p className="text-sm font-semibold font-mono">{formatKz(detailFy.totalCredito)}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Prazo de Entrega</p>
                  <p className="text-sm font-medium">{detailFy.deadline}</p>
                </div>
                {detailFy.submittedAt && (
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-[10px] text-muted-foreground uppercase">Submetido em</p>
                    <p className="text-sm font-medium">{detailFy.submittedAt}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-destructive font-medium">{detailFy.errorsCount} erros</span>
                <span className="text-xs text-warning font-medium">{detailFy.warningsCount} avisos</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Checklist</span>
                  <span className="text-xs font-medium">{detailFy.checklistProgress}%</span>
                </div>
                <Progress value={detailFy.checklistProgress} className="h-1.5" />
              </div>
              {WORKFLOW_TRANSITIONS[detailFy.status].length > 0 && (
                <div>
                  <Label className="text-xs">Avançar Estado</Label>
                  <div className="flex gap-2 mt-1.5">
                    {WORKFLOW_TRANSITIONS[detailFy.status].map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => { handleStatusChange(detailFy.id, nextStatus); setDetailId(null); }}
                      >
                        {nextStatus === "submetido" && <Send className="h-3 w-3" />}
                        {STATUS_LABELS[nextStatus].label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fiscalYears.map((fy) => {
          const daysLeft = getDaysToDeadline(fy.deadline);
          const isOverdue = daysLeft < 0 && !["conforme", "nao_conforme", "submetido", "em_analise", "com_pedidos"].includes(fy.status);
          return (
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

              {/* Deadline indicator */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Prazo: {fy.deadline}</span>
                {isOverdue && (
                  <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                    <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)} dias em atraso
                  </span>
                )}
                {!isOverdue && daysLeft > 0 && daysLeft <= 30 && !["conforme", "nao_conforme"].includes(fy.status) && (
                  <span className="text-xs text-warning font-medium">{daysLeft} dias restantes</span>
                )}
                {fy.submittedAt && (
                  <span className="text-xs text-success font-medium">Submetido: {fy.submittedAt}</span>
                )}
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

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Checklist</span>
                  <span className="text-xs font-medium text-foreground">{fy.checklistProgress}%</span>
                </div>
                <Progress value={fy.checklistProgress} className="h-1.5" />
              </div>

              <div className="flex items-center gap-1 border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/exercicios/${fy.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> Ver
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => openEdit(fy)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive" onClick={() => handleDelete(fy.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </Button>
              </div>
            </div>
          );
        })}
        {fiscalYears.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">Nenhum exercício registado.</div>
        )}
      </div>
    </AppLayout>
  );
};

export default Exercicios;
