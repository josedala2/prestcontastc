import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  GitBranch,
  Users,
  FileText,
  Clock,
  Search,
  Copy,
  Eye,
  Save,
} from "lucide-react";
import { WORKFLOW_STAGES, type WorkflowStage } from "@/types/workflow";
import { PERFIS_WORKFLOW } from "@/lib/atividadeEngine";

const PERFIS_DISPONIVEIS = [
  "Técnico da Secretaria-Geral",
  "Chefe da Secretaria-Geral",
  "Técnico da Contadoria Geral",
  "Escrivão dos Autos",
  "Chefe de Divisão",
  "Chefe de Secção",
  "Técnico de Análise",
  "Diretor dos Serviços Técnicos",
  "Juiz Relator",
  "Técnico da Secção de Custas e Emolumentos",
  "Ministério Público",
  "Oficial de Diligências",
];

interface EditableStage extends WorkflowStage {
  isNew?: boolean;
}

export function WorkflowDesigner() {
  const [stages, setStages] = useState<EditableStage[]>([...WORKFLOW_STAGES]);
  const [editingStage, setEditingStage] = useState<EditableStage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "visual">("visual");
  const [search, setSearch] = useState("");
  const [newAcao, setNewAcao] = useState("");
  const [newDocumento, setNewDocumento] = useState("");

  const filtered = stages.filter(
    (s) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.responsavelPerfil.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    const maxId = Math.max(...stages.map((s) => s.id), 0);
    setEditingStage({
      id: maxId + 1,
      nome: "",
      descricao: "",
      responsavelPerfil: PERFIS_DISPONIVEIS[0],
      acoes: [],
      documentosGerados: [],
      prazoDefault: 3,
      isNew: true,
    });
    setNewAcao("");
    setNewDocumento("");
    setDialogOpen(true);
  }

  function openEdit(stage: EditableStage) {
    setEditingStage({ ...stage });
    setNewAcao("");
    setNewDocumento("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!editingStage) return;
    if (!editingStage.nome.trim()) {
      toast.error("Nome da etapa é obrigatório.");
      return;
    }
    if (editingStage.isNew) {
      setStages((prev) => [...prev, { ...editingStage, isNew: undefined }]);
      toast.success(`Etapa "${editingStage.nome}" adicionada.`);
    } else {
      setStages((prev) =>
        prev.map((s) => (s.id === editingStage.id ? { ...editingStage, isNew: undefined } : s))
      );
      toast.success(`Etapa "${editingStage.nome}" actualizada.`);
    }
    setDialogOpen(false);
    setEditingStage(null);
  }

  function handleDelete(id: number) {
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;
    setStages((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, id: i + 1 })));
    toast.success(`Etapa "${stage.nome}" removida.`);
  }

  function handleDuplicate(stage: EditableStage) {
    const maxId = Math.max(...stages.map((s) => s.id), 0);
    const idx = stages.findIndex((s) => s.id === stage.id);
    const newStage = { ...stage, id: maxId + 1, nome: `${stage.nome} (Cópia)` };
    const updated = [...stages];
    updated.splice(idx + 1, 0, newStage);
    setStages(updated.map((s, i) => ({ ...s, id: i + 1 })));
    toast.success(`Etapa duplicada.`);
  }

  function moveStage(id: number, direction: "up" | "down") {
    const idx = stages.findIndex((s) => s.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === stages.length - 1)) return;
    const updated = [...stages];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setStages(updated.map((s, i) => ({ ...s, id: i + 1 })));
  }

  function addAcao() {
    if (!editingStage || !newAcao.trim()) return;
    setEditingStage({ ...editingStage, acoes: [...editingStage.acoes, newAcao.trim()] });
    setNewAcao("");
  }

  function removeAcao(idx: number) {
    if (!editingStage) return;
    setEditingStage({ ...editingStage, acoes: editingStage.acoes.filter((_, i) => i !== idx) });
  }

  function addDocumento() {
    if (!editingStage || !newDocumento.trim()) return;
    setEditingStage({ ...editingStage, documentosGerados: [...editingStage.documentosGerados, newDocumento.trim()] });
    setNewDocumento("");
  }

  function removeDocumento(idx: number) {
    if (!editingStage) return;
    setEditingStage({
      ...editingStage,
      documentosGerados: editingStage.documentosGerados.filter((_, i) => i !== idx),
    });
  }

  const totalDias = stages.reduce((sum, s) => sum + s.prazoDefault, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" /> Fluxo de Tramitação Processual
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stages.length} etapas · Prazo total estimado: {totalDias} dias úteis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar etapa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-52 text-xs"
            />
          </div>
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === "visual" ? "default" : "ghost"}
              className="rounded-none h-9 text-xs"
              onClick={() => setViewMode("visual")}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Visual
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              className="rounded-none h-9 text-xs"
              onClick={() => setViewMode("table")}
            >
              Tabela
            </Button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova Etapa
          </Button>
        </div>
      </div>

      {/* Visual Flow View */}
      {viewMode === "visual" && (
        <div className="space-y-1">
          {filtered.map((stage, idx) => (
            <div key={stage.id} className="group flex items-stretch gap-3">
              {/* Left timeline */}
              <div className="flex flex-col items-center w-10 shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                    "bg-primary/10 border-primary text-primary"
                  )}
                >
                  {stage.id}
                </div>
                {idx < filtered.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border my-1" />
                )}
              </div>

              {/* Card */}
              <Card className="flex-1 p-3 hover:shadow-md transition-shadow border-border group-hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">{stage.nome}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <Clock className="h-3 w-3 mr-0.5" /> {stage.prazoDefault}d
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{stage.descricao}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Users className="h-3 w-3" /> {stage.responsavelPerfil}
                      </Badge>
                      {stage.acoes.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {stage.acoes.length} {stage.acoes.length === 1 ? "acção" : "acções"}
                        </Badge>
                      )}
                      {stage.documentosGerados.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <FileText className="h-3 w-3" /> {stage.documentosGerados.length} doc(s)
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(stage.id, "up")} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(stage.id, "down")} disabled={idx === filtered.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(stage)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(stage)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(stage.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs w-10">#</TableHead>
                <TableHead className="text-xs">Etapa</TableHead>
                <TableHead className="text-xs">Responsável</TableHead>
                <TableHead className="text-xs w-16">Prazo</TableHead>
                <TableHead className="text-xs w-16">Acções</TableHead>
                <TableHead className="text-xs w-16">Docs</TableHead>
                <TableHead className="text-xs w-32 text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((stage, idx) => (
                <TableRow key={stage.id} className="hover:bg-muted/30">
                  <TableCell className="font-bold text-primary text-xs">{stage.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-xs">{stage.nome}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-xs">{stage.descricao}</div>
                  </TableCell>
                  <TableCell className="text-xs">{stage.responsavelPerfil}</TableCell>
                  <TableCell className="text-xs">{stage.prazoDefault}d</TableCell>
                  <TableCell className="text-xs">{stage.acoes.length}</TableCell>
                  <TableCell className="text-xs">{stage.documentosGerados.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(stage.id, "up")} disabled={idx === 0}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(stage.id, "down")} disabled={idx === filtered.length - 1}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(stage)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(stage.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button className="gap-2" onClick={() => toast.success("Workflow guardado com sucesso.")}>
          <Save className="h-4 w-4" /> Guardar Workflow
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {editingStage?.isNew ? "Nova Etapa" : `Editar Etapa ${editingStage?.id}`}
            </DialogTitle>
          </DialogHeader>

          {editingStage && (
            <div className="space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs">Nome da Etapa *</Label>
                  <Input
                    value={editingStage.nome}
                    onChange={(e) => setEditingStage({ ...editingStage, nome: e.target.value })}
                    placeholder="Ex: Registo de Entrada"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea
                    value={editingStage.descricao}
                    onChange={(e) => setEditingStage({ ...editingStage, descricao: e.target.value })}
                    placeholder="Descrição da etapa..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">Perfil Responsável</Label>
                  <Select
                    value={editingStage.responsavelPerfil}
                    onValueChange={(v) => setEditingStage({ ...editingStage, responsavelPerfil: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFIS_DISPONIVEIS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prazo Default (dias úteis)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingStage.prazoDefault}
                    onChange={(e) => setEditingStage({ ...editingStage, prazoDefault: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Acções */}
              <div>
                <Label className="text-xs font-semibold">Acções Disponíveis</Label>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px]">
                  {editingStage.acoes.map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                      {a}
                      <button onClick={() => removeAcao(i)} className="ml-0.5 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editingStage.acoes.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Nenhuma acção definida</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newAcao}
                    onChange={(e) => setNewAcao(e.target.value)}
                    placeholder="Nova acção..."
                    className="text-xs"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAcao())}
                  />
                  <Button size="sm" variant="outline" onClick={addAcao} disabled={!newAcao.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Documentos gerados */}
              <div>
                <Label className="text-xs font-semibold">Documentos Gerados</Label>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px]">
                  {editingStage.documentosGerados.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs gap-1 pr-1">
                      <FileText className="h-3 w-3" /> {d}
                      <button onClick={() => removeDocumento(i)} className="ml-0.5 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editingStage.documentosGerados.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Nenhum documento gerado</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newDocumento}
                    onChange={(e) => setNewDocumento(e.target.value)}
                    placeholder="Novo documento..."
                    className="text-xs"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDocumento())}
                  />
                  <Button size="sm" variant="outline" onClick={addDocumento} disabled={!newDocumento.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>
              {editingStage?.isNew ? "Adicionar Etapa" : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
