import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockAccounts } from "@/data/mockData";
import { Account } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Pencil, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PlanoContas = () => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ code: "", description: "", nature: "Devedora" as Account["nature"], level: 2 });

  const filtered = accounts.filter(
    (a) => a.code.includes(search) || a.description.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", description: "", nature: "Devedora", level: 2 });
    setDialogOpen(true);
  };

  const openEdit = (acc: Account) => {
    setEditing(acc);
    setForm({ code: acc.code, description: acc.description, nature: acc.nature, level: acc.level });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.description) {
      toast.error("Preencha o código e a descrição.");
      return;
    }
    if (editing) {
      setAccounts((prev) =>
        prev.map((a) => (a.code === editing.code ? { ...a, ...form } : a))
      );
      toast.success("Conta actualizada.");
    } else {
      if (accounts.some((a) => a.code === form.code)) {
        toast.error("Já existe uma conta com este código.");
        return;
      }
      setAccounts((prev) => [...prev, form].sort((a, b) => a.code.localeCompare(b.code)));
      toast.success("Conta adicionada ao plano.");
    }
    setDialogOpen(false);
  };

  const handleDelete = (code: string) => {
    setAccounts((prev) => prev.filter((a) => a.code !== code));
    toast.success("Conta removida do plano.");
  };

  const handleImport = () => {
    toast.success("Importação simulada com sucesso — plano de contas carregado.");
    setImportDialogOpen(false);
  };

  return (
    <AppLayout>
      <PageHeader title="Plano de Contas" description="PGC — Decreto nº 82/2001">
        <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4" /> Importar
        </Button>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
      </PageHeader>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Plano de Contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Seleccione um ficheiro Excel (.xlsx) ou CSV com as colunas: Código, Descrição, Natureza (D/C), Nível.</p>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Arraste ou clique para seleccionar</p>
              <input type="file" accept=".xlsx,.csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => handleImport()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleImport}>Importar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex: 11.1" disabled={!!editing} />
              </div>
              <div>
                <Label>Nível</Label>
                <Input type="number" min={1} max={6} value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 2 })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição da conta" />
            </div>
            <div>
              <Label>Natureza</Label>
              <Select value={form.nature} onValueChange={(v) => setForm({ ...form, nature: v as Account["nature"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Devedora">Devedora</SelectItem>
                  <SelectItem value="Credora">Credora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Pesquisar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs w-24">Código</TableHead>
              <TableHead className="font-semibold text-xs">Descrição</TableHead>
              <TableHead className="font-semibold text-xs w-28">Natureza</TableHead>
              <TableHead className="font-semibold text-xs w-20">Nível</TableHead>
              <TableHead className="font-semibold text-xs w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((acc) => (
              <TableRow key={acc.code}>
                <TableCell className="font-mono text-xs font-medium">{acc.code}</TableCell>
                <TableCell className={cn("text-sm", acc.level === 2 && "font-semibold")}>{acc.description}</TableCell>
                <TableCell>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    acc.nature === "Devedora" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"
                  )}>
                    {acc.nature}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{acc.level}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(acc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(acc.code)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default PlanoContas;
