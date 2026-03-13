import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { formatKz } from "@/data/mockData";
import { toast } from "sonner";

interface ContaBancaria {
  id: string; banco: string; numeroConta: string; moeda: string;
  saldoInicio: number; saldoFim: number; dataCertificacao: string;
}

const initialContas: ContaBancaria[] = [
  { id: "1", banco: "BNA", numeroConta: "0040.0000.1234.5678.9", moeda: "AOA", saldoInicio: 85420000, saldoFim: 49104474.09, dataCertificacao: "2024-12-31" },
  { id: "2", banco: "BAI", numeroConta: "0051.0000.9876.5432.1", moeda: "AOA", saldoInicio: 12500000, saldoFim: 2400000, dataCertificacao: "2024-12-31" },
  { id: "3", banco: "BFA", numeroConta: "0006.0000.4567.8901.2", moeda: "USD", saldoInicio: 250000, saldoFim: 18500, dataCertificacao: "2024-12-31" },
];

export function ExtractoBancario() {
  const [contas, setContas] = useState<ContaBancaria[]>(initialContas);
  const [exercicio, setExercicio] = useState("2024");

  const addConta = () => setContas((p) => [...p, { id: `c_${Date.now()}`, banco: "", numeroConta: "", moeda: "AOA", saldoInicio: 0, saldoFim: 0, dataCertificacao: "2024-12-31" }]);
  const removeConta = (id: string) => setContas((p) => p.filter((c) => c.id !== id));
  const update = (id: string, field: keyof ContaBancaria, value: string | number) =>
    setContas((p) => p.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const totalInicio = contas.reduce((s, c) => s + c.saldoInicio, 0);
  const totalFim = contas.reduce((s, c) => s + c.saldoFim, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Extractos Bancários de Fim de Exercício</CardTitle>
        <CardDescription>Extractos de todas as contas bancárias certificados à data de 31 de Dezembro (Art.º 3.º, al. h) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Exercício</Label><Input value={exercicio} onChange={(e) => setExercicio(e.target.value)} /></div>
          <div><Label>Data de Referência</Label><Input value="31/12/2024" disabled /></div>
          <div className="flex items-end"><Button variant="outline" size="sm" className="gap-1" onClick={addConta}><Plus className="h-3 w-3" /> Nova Conta</Button></div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>N.º Conta</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Saldo Início</TableHead>
                <TableHead className="text-right">Saldo Fim</TableHead>
                <TableHead>Data Cert.</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Input value={c.banco} onChange={(e) => update(c.id, "banco", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input value={c.numeroConta} onChange={(e) => update(c.id, "numeroConta", e.target.value)} className="h-8 text-sm font-mono" /></TableCell>
                  <TableCell><Input value={c.moeda} onChange={(e) => update(c.id, "moeda", e.target.value)} className="h-8 text-sm w-16" /></TableCell>
                  <TableCell><Input type="number" value={c.saldoInicio} onChange={(e) => update(c.id, "saldoInicio", +e.target.value)} className="h-8 text-sm text-right" /></TableCell>
                  <TableCell><Input type="number" value={c.saldoFim} onChange={(e) => update(c.id, "saldoFim", +e.target.value)} className="h-8 text-sm text-right" /></TableCell>
                  <TableCell><Input type="date" value={c.dataCertificacao} onChange={(e) => update(c.id, "dataCertificacao", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeConta(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={3} className="text-sm font-semibold">TOTAIS (AOA)</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatKz(totalInicio)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatKz(totalFim)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => toast.success("Extractos bancários guardados.")}><Save className="h-4 w-4" /> Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
