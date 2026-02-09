import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2 } from "lucide-react";

interface ResponsavelRow {
  id: string;
  descricao: string;
  nome: string;
  nif: string;
  funcaoCargo: string;
  categoria: string;
  periodoResponsabilidade: string;
  vencimentoAnual: string;
  profissao: string;
  morada: string;
  telefone: string;
  email: string;
}

const emptyRow = (): ResponsavelRow => ({
  id: Date.now().toString(),
  descricao: "", nome: "", nif: "", funcaoCargo: "", categoria: "",
  periodoResponsabilidade: "", vencimentoAnual: "", profissao: "",
  morada: "", telefone: "", email: "",
});

export function Modelo10Form() {
  const [entidade, setEntidade] = useState("");
  const [rows, setRows] = useState<ResponsavelRow[]>([emptyRow()]);
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const update = (id: string, field: keyof ResponsavelRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const headers = [
    { key: "descricao", label: "Descrição" },
    { key: "nome", label: "Nome" },
    { key: "nif", label: "NIF" },
    { key: "funcaoCargo", label: "Função/Cargo" },
    { key: "categoria", label: "Categoria" },
    { key: "periodoResponsabilidade", label: "Período Resp." },
    { key: "vencimentoAnual", label: "Venc. Líquido Anual" },
    { key: "profissao", label: "Profissão" },
    { key: "morada", label: "Morada" },
    { key: "telefone", label: "Telefone" },
    { key: "email", label: "E-mail" },
  ] as { key: keyof ResponsavelRow; label: string }[];

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">RELAÇÃO NOMINAL DOS RESPONSÁVEIS</h3>
        <p className="text-xs text-muted-foreground mt-1">Dados de cada um dos responsáveis pela gestão.</p>
      </div>

      <div>
        <Label>Órgão/Entidade</Label>
        <Input value={entidade} onChange={(e) => setEntidade(e.target.value)} className="max-w-md" />
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map((h) => (
                <TableHead key={h.key} className="text-xs min-w-[110px]">{h.label}</TableHead>
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
