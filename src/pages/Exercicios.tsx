import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockEntities, formatKz } from "@/data/mockData";
import { FiscalYear, STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Pencil, Trash2, Eye, Clock, AlertTriangle, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
    setForm({
      entityId: "",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
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

    // Validar duplicação de ano+entidade
    const duplicate = fiscalYears.find(
      (fy) => fy.entityId === form.entityId && fy.year === form.year && (!editing || fy.id !== editing.id)
    );
    if (duplicate) {
      toast.error(`Já existe um exercício para ${entity.name} no ano ${form.year}.`);
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
        id: crypto.randomUUID(),
        entityId: form.entityId,
        entityName: entity.name,
        year: form.year,
        startDate: form.startDate,
        endDate: form.endDate,
        status: "rascunho",
        totalDebito: 0,
        totalCredito: 0,
        errorsCount: 0,
        warningsCount: 0,
        checklistProgress: 0,
        deadline: `${form.year + 1}-06-30`,
      };
      setFiscalYears((prev) => [...prev, newFy]);
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
      <PageHeader title="Exercícios Fiscais" description="Gestão de períodos contabilísticos — Prazo: 30 de Junho do ano seguinte" />

      {/* New / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Exercício</DialogTitle>
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
              <p className="text-sm font-medium">{form.year + 1}-06-30</p>
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

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Entidade / Ano</TableHead>
              <TableHead className="text-xs font-semibold">Período</TableHead>
              <TableHead className="text-xs font-semibold">Estado</TableHead>
              <TableHead className="text-xs font-semibold">Prazo</TableHead>
              <TableHead className="text-xs font-semibold text-right">Débito</TableHead>
              <TableHead className="text-xs font-semibold text-right">Crédito</TableHead>
              <TableHead className="text-xs font-semibold text-center">Checklist</TableHead>
              <TableHead className="text-xs font-semibold text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fiscalYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum exercício registado.
                </TableCell>
              </TableRow>
            ) : (
              fiscalYears.map((fy) => {
                const daysLeft = getDaysToDeadline(fy.deadline);
                const isOverdue = daysLeft < 0 && !["conforme", "nao_conforme", "submetido", "em_analise", "com_pedidos"].includes(fy.status);
                return (
                  <TableRow key={fy.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{fy.entityName}</p>
                        <p className="text-xs text-muted-foreground">{fy.year}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fy.startDate} a {fy.endDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={STATUS_LABELS[fy.status].label}
                        variant={STATUS_LABELS[fy.status].color as any}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{fy.deadline}</span>
                        {isOverdue && (
                          <span className="flex items-center gap-0.5 text-[10px] text-destructive font-medium">
                            <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)}d
                          </span>
                        )}
                        {!isOverdue && daysLeft > 0 && daysLeft <= 30 && !["conforme", "nao_conforme"].includes(fy.status) && (
                          <span className="text-[10px] text-warning font-medium">{daysLeft}d</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatKz(fy.totalDebito)}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatKz(fy.totalCredito)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={fy.checklistProgress} className="h-1.5 w-16" />
                        <span className="text-[10px] text-muted-foreground">{fy.checklistProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Ver" onClick={() => navigate(`/exercicios/${fy.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar" onClick={() => openEdit(fy)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" title="Remover" onClick={() => handleDelete(fy.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default Exercicios;
