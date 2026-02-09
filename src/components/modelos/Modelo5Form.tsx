import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2 } from "lucide-react";

interface InvestRow {
  id: string;
  designacao: string;
  anoInicio: string;
  previstos: string;
  finPIP: string;
  finAutofinanciamento: string;
  finEmprestimos: string;
  finOutros: string;
  exAnteriores: string;
  exCorrente: string;
  acumulados: string;
  exFuturos: string;
}

const emptyRow = (): InvestRow => ({
  id: Date.now().toString(),
  designacao: "", anoInicio: "", previstos: "",
  finPIP: "", finAutofinanciamento: "", finEmprestimos: "", finOutros: "",
  exAnteriores: "", exCorrente: "", acumulados: "", exFuturos: "",
});

export function Modelo5Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [rows, setRows] = useState<InvestRow[]>([emptyRow()]);
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const update = (id: string, field: keyof InvestRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DOS INVESTIMENTOS</h3>
        <p className="text-xs text-muted-foreground mt-1">Os financiamentos devem ser desagregados consoante a sua origem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><Label>Órgão/Entidade</Label><Input value={entidade} onChange={(e) => setEntidade(e.target.value)} /></div>
        <div><Label>Gestão de</Label><Input type="date" value={gestaoInicio} onChange={(e) => setGestaoInicio(e.target.value)} /></div>
        <div><Label>a</Label><Input type="date" value={gestaoFim} onChange={(e) => setGestaoFim(e.target.value)} /></div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs min-w-[160px]">Designação</TableHead>
              <TableHead className="text-xs min-w-[80px]">Ano Início</TableHead>
              <TableHead className="text-xs min-w-[100px]">Previstos</TableHead>
              <TableHead className="text-xs min-w-[90px]">Fin. PIP</TableHead>
              <TableHead className="text-xs min-w-[90px]">Autofin.</TableHead>
              <TableHead className="text-xs min-w-[90px]">Emprést.</TableHead>
              <TableHead className="text-xs min-w-[90px]">Outros</TableHead>
              <TableHead className="text-xs min-w-[100px]">Ex. Anteriores</TableHead>
              <TableHead className="text-xs min-w-[100px]">Ex. Corrente</TableHead>
              <TableHead className="text-xs min-w-[100px]">Acumulados</TableHead>
              <TableHead className="text-xs min-w-[100px]">Ex. Futuros</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {(["designacao", "anoInicio", "previstos", "finPIP", "finAutofinanciamento", "finEmprestimos", "finOutros", "exAnteriores", "exCorrente", "acumulados", "exFuturos"] as (keyof InvestRow)[]).map((f) => (
                  <TableCell key={f} className="p-1">
                    <Input className="h-7 text-xs" value={row[f]} onChange={(e) => update(row.id, f, e.target.value)} />
                  </TableCell>
                ))}
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRows((r) => [...r, emptyRow()])}>
        <Plus className="h-3.5 w-3.5" /> Adicionar Linha
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Elaborado por</Label><Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} /></div>
        <div><Label>O Responsável</Label><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
      </div>
      <div className="flex justify-end"><Button className="gap-2"><Save className="h-4 w-4" /> Guardar</Button></div>
    </div>
  );
}
