import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Trash2 } from "lucide-react";

interface ContratoRow {
  id: string;
  entidade: string;
  objecto: string;
  dataContrato: string;
  valorContrato: string;
  vistoTCProcesso: string;
  vistoTCResolucao: string;
  vistoTCData: string;
  dataPrimeiroPagamento: string;
  pagNormais: string;
  pagRevisao: string;
  pagTrabalhos: string;
  acumNormais: string;
  acumRevisao: string;
  acumTrabalhos: string;
  observacoes: string;
}

const emptyRow = (): ContratoRow => ({
  id: Date.now().toString(),
  entidade: "", objecto: "", dataContrato: "", valorContrato: "",
  vistoTCProcesso: "", vistoTCResolucao: "", vistoTCData: "",
  dataPrimeiroPagamento: "", pagNormais: "", pagRevisao: "", pagTrabalhos: "",
  acumNormais: "", acumRevisao: "", acumTrabalhos: "", observacoes: "",
});

export function Modelo7Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [rows, setRows] = useState<ContratoRow[]>([emptyRow()]);
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const update = (id: string, field: keyof ContratoRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const headers = [
    { key: "entidade", label: "Entidade" },
    { key: "objecto", label: "Objecto" },
    { key: "dataContrato", label: "Data" },
    { key: "valorContrato", label: "Valor" },
    { key: "vistoTCProcesso", label: "Visto TC Proc." },
    { key: "vistoTCResolucao", label: "Visto TC Res." },
    { key: "vistoTCData", label: "Visto TC Data" },
    { key: "dataPrimeiroPagamento", label: "1º Pagamento" },
    { key: "pagNormais", label: "Pag. Normais" },
    { key: "pagRevisao", label: "Pag. Revisão" },
    { key: "pagTrabalhos", label: "Pag. Trabalhos" },
    { key: "acumNormais", label: "Acum. Normais" },
    { key: "acumRevisao", label: "Acum. Revisão" },
    { key: "acumTrabalhos", label: "Acum. Trabalhos" },
    { key: "observacoes", label: "Obs." },
  ] as { key: keyof ContratoRow; label: string }[];

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DOS CONTRATOS DE EMPREITADA, FORNECIMENTO, CONCESSÃO E OUTROS</h3>
        <p className="text-xs text-muted-foreground mt-1">Contratos celebrados no período ou anteriores com pagamentos na gestão em análise.</p>
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
              {headers.map((h) => (
                <TableHead key={h.key} className="text-xs min-w-[90px]">{h.label}</TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {headers.map((h) => (
                  <TableCell key={h.key} className="p-1">
                    <Input className="h-7 text-xs" value={row[h.key]} onChange={(e) => update(row.id, h.key, e.target.value)} />
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
