import { useState } from "react";
import { Entity, TIPOLOGIA_GROUPS, TIPOLOGIA_LABELS, RESOLUCAO_LABELS, FiscalYear, ResolucaoCategoria } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  resolucao: ResolucaoCategoria;
  allEntities: Entity[];
  existingFiscalYears: FiscalYear[];
  onCreated: () => void;
}

export function AbrirExerciciosResolucao({ resolucao, allEntities, existingFiscalYears, onCreated }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const tipologias = TIPOLOGIA_GROUPS[resolucao];
  const filteredEntities = allEntities.filter(e => tipologias.includes(e.tipologia));
  const resolucaoLabel = RESOLUCAO_LABELS[resolucao];

  const groupedEntities = tipologias.reduce((acc, tip) => {
    const group = filteredEntities.filter(e => e.tipologia === tip);
    if (group.length > 0) acc.push({ tipologia: tip, label: TIPOLOGIA_LABELS[tip], entities: group });
    return acc;
  }, [] as { tipologia: string; label: string; entities: Entity[] }[]);

  const hasExercise = (entityId: string) =>
    existingFiscalYears.some(fy => fy.entityId === entityId && fy.year === year);

  const availableCount = filteredEntities.filter(e => !hasExercise(e.id)).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEntities.filter(e => !hasExercise(e.id)).map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      toast.error("Seleccione pelo menos uma entidade.");
      return;
    }

    setSaving(true);
    const deadline = `${year + 1}-06-30`;

    const newRows = selectedIds
      .filter(id => !hasExercise(id))
      .map(id => ({
        id: `fy-${id}-${year}`,
        entity_id: id,
        year,
        status: "pendente",
        completude: 0,
        total_receita: 0,
        total_despesa: 0,
        deadline,
      }));

    if (newRows.length === 0) {
      toast.warning("Todas as entidades seleccionadas já possuem exercício para este ano.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("fiscal_years").insert(newRows);

    if (error) {
      console.error(error);
      toast.error("Erro ao criar exercícios: " + error.message);
    } else {
      toast.success(`${newRows.length} exercício(s) aberto(s) com sucesso para ${year}.`);
      setDialogOpen(false);
      setSelectedIds([]);
      onCreated();
    }
    setSaving(false);
  };

  return (
    <>
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-serif leading-tight">{resolucaoLabel.label}</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs mt-0.5 line-clamp-2">{resolucaoLabel.descricao}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs self-start mt-1.5">
            {filteredEntities.length} entidade(s)
          </Badge>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 flex-1 flex flex-col justify-end">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {tipologias.map(tip => {
              const count = filteredEntities.filter(e => e.tipologia === tip).length;
              if (count === 0) return null;
              return (
                <Badge key={tip} variant="outline" className="text-[9px] sm:text-[10px] gap-1 px-1.5 py-0.5">
                  <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{TIPOLOGIA_LABELS[tip]} ({count})</span>
                </Badge>
              );
            })}
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full gap-2 text-xs sm:text-sm h-9 sm:h-10">
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Abrir Exercícios — {resolucaoLabel.label}</span>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Abrir Exercícios Fiscais — {resolucaoLabel.label}</DialogTitle>
            <DialogDescription>{resolucaoLabel.descricao}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ano do Exercício</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <div className="p-3 bg-muted/40 rounded-lg flex-1">
                  <p className="text-xs text-muted-foreground">Período</p>
                  <p className="text-sm font-medium">{year}-01-01 a {year}-12-31 · Prazo: {year + 1}-06-30</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedIds.length === availableCount && availableCount > 0}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  disabled={availableCount === 0}
                />
                <span className="text-sm font-medium">Seleccionar Todas ({availableCount} disponíveis)</span>
              </label>
              {selectedIds.length > 0 && (
                <Badge className="text-xs">{selectedIds.length} seleccionada(s)</Badge>
              )}
            </div>

            {filteredEntities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhuma entidade registada com tipologia da {resolucaoLabel.label}.
              </div>
            ) : (
              <div className="space-y-4">
                {groupedEntities.map(group => (
                  <div key={group.tipologia}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.label}
                    </p>
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {group.entities.map(entity => {
                        const alreadyExists = hasExercise(entity.id);
                        return (
                          <label
                            key={entity.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${alreadyExists ? "opacity-50" : ""}`}
                          >
                            <Checkbox
                              checked={selectedIds.includes(entity.id)}
                              disabled={alreadyExists}
                              onCheckedChange={(checked) => {
                                setSelectedIds(prev =>
                                  checked ? [...prev, entity.id] : prev.filter(id => id !== entity.id)
                                );
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{entity.name}</p>
                              <p className="text-[10px] text-muted-foreground">NIF: {entity.nif}</p>
                            </div>
                            {alreadyExists && (
                              <Badge variant="secondary" className="text-[9px] shrink-0 gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Já aberto
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || selectedIds.length === 0} className="gap-2">
                <BookOpen className="h-4 w-4" />
                {saving ? "A criar..." : `Abrir ${selectedIds.length} Exercício(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
