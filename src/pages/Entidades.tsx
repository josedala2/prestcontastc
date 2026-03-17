import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { useEntities } from "@/hooks/useEntities";
import { Entity, TIPOLOGIA_LABELS, TIPOLOGIA_GROUPS, RESOLUCAO_LABELS } from "@/types";
import { SelectGroup, SelectLabel } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, Search, MapPin } from "lucide-react";

const Entidades = () => {
  const { entities: dbEntities, loading } = useEntities();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (dbEntities.length > 0) setEntities(dbEntities);
  }, [dbEntities]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState({
    name: "",
    nif: "",
    tutela: "",
    contacto: "",
    morada: "",
    tipologia: "orgao_autonomo" as Entity["tipologia"],
    provincia: "",
  });

  const filtered = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.nif.includes(search)
  );

  const handleSave = () => {
    if (editing) {
      setEntities((prev) =>
        prev.map((e) => (e.id === editing.id ? { ...e, ...form } : e))
      );
    } else {
      const newEntity: Entity = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setEntities((prev) => [...prev, newEntity]);
    }
    setDialogOpen(false);
    setForm({ name: "", nif: "", tutela: "", contacto: "", morada: "", tipologia: "orgao_autonomo", provincia: "" });
    setEditing(null);
  };

  const openEdit = (entity: Entity) => {
    setEditing(entity);
    setForm({
      name: entity.name,
      nif: entity.nif,
      tutela: entity.tutela,
      contacto: entity.contacto,
      morada: entity.morada,
      tipologia: entity.tipologia,
      provincia: entity.provincia || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", nif: "", tutela: "", contacto: "", morada: "", tipologia: "orgao_autonomo", provincia: "" });
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader title="Entidades" description="Gestão de órgãos e entidades sujeitas a prestação de contas (Resolução 1/17)">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Entidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Entidade" : "Nova Entidade"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da entidade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>NIF</Label>
                  <Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="NIF" />
                </div>
                <div>
                  <Label>Tipologia</Label>
                  <Select value={form.tipologia} onValueChange={(v) => setForm({ ...form, tipologia: v as Entity["tipologia"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPOLOGIA_GROUPS).map(([resolucao, tipologias]) => (
                        <SelectGroup key={resolucao}>
                          <SelectLabel className="text-xs text-muted-foreground">{RESOLUCAO_LABELS[resolucao as keyof typeof RESOLUCAO_LABELS].label}</SelectLabel>
                          {tipologias.map((key) => (
                            <SelectItem key={key} value={key}>{TIPOLOGIA_LABELS[key]}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tutela</Label>
                  <Input value={form.tutela} onChange={(e) => setForm({ ...form, tutela: e.target.value })} placeholder="Ministério" />
                </div>
                <div>
                  <Label>Província</Label>
                  <Input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} placeholder="Luanda" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contacto</Label>
                  <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Telefone" />
                </div>
                <div>
                  <Label>Morada</Label>
                  <Input value={form.morada} onChange={(e) => setForm({ ...form, morada: e.target.value })} placeholder="Morada" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Pesquisar por nome ou NIF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((entity) => (
          <div
            key={entity.id}
            className="bg-card rounded-lg border border-border card-shadow p-5 flex items-center gap-4 animate-fade-in"
          >
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{entity.name}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-muted-foreground">NIF: {entity.nif}</span>
                <span className="text-xs text-muted-foreground">{entity.tutela}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  {TIPOLOGIA_LABELS[entity.tipologia]}
                </span>
                {entity.provincia && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {entity.provincia}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => openEdit(entity)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEntities((prev) => prev.filter((e) => e.id !== entity.id))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhuma entidade encontrada.</div>
        )}
      </div>
    </AppLayout>
  );
};

export default Entidades;
