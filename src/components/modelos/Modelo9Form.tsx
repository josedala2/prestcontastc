import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2 } from "lucide-react";

interface SaldoRow {
  id: string;
  descricao: string;
  kwanzas: string;
  outraMoeda: string;
  taxaCambio: string;
  totalKwanzas: string;
}

const defaultAbertura = (): SaldoRow[] => [
  { id: "a1", descricao: "Em Cofre", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
  { id: "a2", descricao: "Depósito à ordem - Conta 1", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
  { id: "a3", descricao: "Depósito a prazo - Conta 1", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
];

const defaultEncerramento = (): SaldoRow[] => [
  { id: "e1", descricao: "Em Cofre", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
  { id: "e2", descricao: "Depósito à ordem - Conta 1", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
  { id: "e3", descricao: "Depósito a prazo - Conta 1", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" },
];

function SaldoTable({ rows, setRows, title }: { rows: SaldoRow[]; setRows: (r: SaldoRow[]) => void; title: string }) {
  const update = (id: string, field: keyof SaldoRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs min-w-[180px]">Descrição</TableHead>
              <TableHead className="text-xs min-w-[120px]">Kwanzas</TableHead>
              <TableHead className="text-xs min-w-[120px]">Outra Moeda</TableHead>
              <TableHead className="text-xs min-w-[100px]">Taxa Câmbio</TableHead>
              <TableHead className="text-xs min-w-[120px]">Total Kwanzas</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="p-1"><Input className="h-7 text-xs" value={row.descricao} onChange={(e) => update(row.id, "descricao", e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 text-xs text-right font-mono" value={row.kwanzas} onChange={(e) => update(row.id, "kwanzas", e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 text-xs text-right font-mono" value={row.outraMoeda} onChange={(e) => update(row.id, "outraMoeda", e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 text-xs text-right font-mono" value={row.taxaCambio} onChange={(e) => update(row.id, "taxaCambio", e.target.value)} /></TableCell>
                <TableCell className="p-1"><Input className="h-7 text-xs text-right font-mono" value={row.totalKwanzas} onChange={(e) => update(row.id, "totalKwanzas", e.target.value)} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows(rows.filter((x) => x.id !== row.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="text-xs font-bold">Total</TableCell>
              <TableCell className="text-xs text-right font-mono font-bold">
                {rows.reduce((s, r) => s + (parseFloat(r.kwanzas) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-xs text-right font-mono font-bold">
                {rows.reduce((s, r) => s + (parseFloat(r.totalKwanzas) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => setRows([...rows, { id: Date.now().toString(), descricao: "", kwanzas: "", outraMoeda: "", taxaCambio: "", totalKwanzas: "" }])}>
        <Plus className="h-3.5 w-3.5" /> Adicionar Linha
      </Button>
    </div>
  );
}

export function Modelo9Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [abertura, setAbertura] = useState<SaldoRow[]>(defaultAbertura());
  const [encerramento, setEncerramento] = useState<SaldoRow[]>(defaultEncerramento());
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">SALDO DE ABERTURA E DE ENCERRAMENTO DA CONTA</h3>
        <p className="text-xs text-muted-foreground mt-1">Saldos em cofre e depósito à ordem e a prazo de todas as contas bancárias. Valores certificados por documento da instituição bancária.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><Label>Órgão/Entidade</Label><Input value={entidade} onChange={(e) => setEntidade(e.target.value)} /></div>
        <div><Label>Gestão de</Label><Input type="date" value={gestaoInicio} onChange={(e) => setGestaoInicio(e.target.value)} /></div>
        <div><Label>a</Label><Input type="date" value={gestaoFim} onChange={(e) => setGestaoFim(e.target.value)} /></div>
      </div>

      <SaldoTable rows={abertura} setRows={setAbertura} title="Saldo de Abertura" />
      <SaldoTable rows={encerramento} setRows={setEncerramento} title="Saldo de Encerramento" />

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Elaborado por</Label><Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} /></div>
        <div><Label>O Responsável</Label><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
      </div>
      <div className="flex justify-end"><Button className="gap-2"><Save className="h-4 w-4" /> Guardar</Button></div>
    </div>
  );
}
