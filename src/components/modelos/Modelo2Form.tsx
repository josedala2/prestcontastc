import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2 } from "lucide-react";

interface SubsidioRow {
  id: string;
  entidadeConcede: string;
  dataRecebimento: string;
  periodoReferencia: string;
  descricao: string;
  valor: string;
  observacoes: string;
}

const emptyRow = (): SubsidioRow => ({
  id: Date.now().toString(),
  entidadeConcede: "",
  dataRecebimento: "",
  periodoReferencia: "",
  descricao: "",
  valor: "",
  observacoes: "",
});

export function Modelo2Form() {
  const [ano, setAno] = useState("");
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [rows, setRows] = useState<SubsidioRow[]>([emptyRow()]);
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const updateRow = (id: string, field: keyof SubsidioRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DOS SUBSÍDIOS RECEBIDOS</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><Label>Ano</Label><Input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2024" /></div>
        <div><Label>Órgão/Entidade</Label><Input value={entidade} onChange={(e) => setEntidade(e.target.value)} /></div>
        <div><Label>Gestão de</Label><Input type="date" value={gestaoInicio} onChange={(e) => setGestaoInicio(e.target.value)} /></div>
        <div><Label>a</Label><Input type="date" value={gestaoFim} onChange={(e) => setGestaoFim(e.target.value)} /></div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs min-w-[160px]">Entidade que concede</TableHead>
              <TableHead className="text-xs min-w-[120px]">Data recebimento</TableHead>
              <TableHead className="text-xs min-w-[120px]">Período referência</TableHead>
              <TableHead className="text-xs min-w-[180px]">Descrição</TableHead>
              <TableHead className="text-xs min-w-[120px]">Valor (Kz)</TableHead>
              <TableHead className="text-xs min-w-[140px]">Observações</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell><Input className="h-8 text-sm" value={row.entidadeConcede} onChange={(e) => updateRow(row.id, "entidadeConcede", e.target.value)} /></TableCell>
                <TableCell><Input className="h-8 text-sm" type="date" value={row.dataRecebimento} onChange={(e) => updateRow(row.id, "dataRecebimento", e.target.value)} /></TableCell>
                <TableCell><Input className="h-8 text-sm" value={row.periodoReferencia} onChange={(e) => updateRow(row.id, "periodoReferencia", e.target.value)} /></TableCell>
                <TableCell><Input className="h-8 text-sm" value={row.descricao} onChange={(e) => updateRow(row.id, "descricao", e.target.value)} /></TableCell>
                <TableCell><Input className="h-8 text-sm text-right font-mono" value={row.valor} onChange={(e) => updateRow(row.id, "valor", e.target.value)} /></TableCell>
                <TableCell><Input className="h-8 text-sm" value={row.observacoes} onChange={(e) => updateRow(row.id, "observacoes", e.target.value)} /></TableCell>
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
