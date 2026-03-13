import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { formatKz } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LinhaReconciliacao {
  id: string; descricao: string; valorContabilidade: number; valorBanco: number;
}

const initialLinhas: LinhaReconciliacao[] = [
  { id: "1", descricao: "Saldo s/ extracto bancário BNA", valorContabilidade: 0, valorBanco: 49104474.09 },
  { id: "2", descricao: "Saldo s/ contabilidade (conta 43.1)", valorContabilidade: 49104474.09, valorBanco: 0 },
  { id: "3", descricao: "(-) Cheques emitidos e não descontados", valorContabilidade: -2350000, valorBanco: 0 },
  { id: "4", descricao: "(+) Depósitos em trânsito", valorContabilidade: 1800000, valorBanco: 0 },
  { id: "5", descricao: "(-) Débitos bancários não contabilizados", valorContabilidade: 0, valorBanco: -550000 },
];

export function Reconciliacoes() {
  const [banco, setBanco] = useState("BNA");
  const [conta, setConta] = useState("0040.0000.1234.5678.9");
  const [dataRef, setDataRef] = useState("2024-12-31");
  const [linhas, setLinhas] = useState<LinhaReconciliacao[]>(initialLinhas);
  const [notas, setNotas] = useState("");

  const addLinha = () => setLinhas((p) => [...p, { id: `r_${Date.now()}`, descricao: "", valorContabilidade: 0, valorBanco: 0 }]);
  const removeLinha = (id: string) => setLinhas((p) => p.filter((l) => l.id !== id));
  const update = (id: string, field: keyof LinhaReconciliacao, value: string | number) =>
    setLinhas((p) => p.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const totalContab = linhas.reduce((s, l) => s + l.valorContabilidade, 0);
  const totalBanco = linhas.reduce((s, l) => s + l.valorBanco, 0);
  const diferenca = Math.abs(totalContab - totalBanco);
  const conciliado = diferenca < 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reconciliação Bancária</CardTitle>
        <CardDescription>Reconciliação entre saldos contabilísticos e bancários (Art.º 3.º, al. i) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Banco</Label><Input value={banco} onChange={(e) => setBanco(e.target.value)} /></div>
          <div><Label>N.º Conta</Label><Input value={conta} onChange={(e) => setConta(e.target.value)} className="font-mono" /></div>
          <div><Label>Data de Referência</Label><Input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} /></div>
        </div>

        <div className={cn("rounded-lg border p-3 flex items-center gap-2", conciliado ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30")}>
          {conciliado ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
          <span className="text-sm font-medium">{conciliado ? "Saldos conciliados" : `Diferença por conciliar: ${formatKz(diferenca)}`}</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Contabilidade (Kz)</TableHead>
                <TableHead className="text-right">Banco (Kz)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.id}>
                  <TableCell><Input value={l.descricao} onChange={(e) => update(l.id, "descricao", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input type="number" value={l.valorContabilidade} onChange={(e) => update(l.id, "valorContabilidade", +e.target.value)} className="h-8 text-sm text-right" /></TableCell>
                  <TableCell><Input type="number" value={l.valorBanco} onChange={(e) => update(l.id, "valorBanco", +e.target.value)} className="h-8 text-sm text-right" /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeLinha(l.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="text-sm font-semibold">TOTAIS</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatKz(totalContab)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatKz(totalBanco)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" className="gap-1" onClick={addLinha}><Plus className="h-3 w-3" /> Adicionar Linha</Button>

        <div><Label>Notas e Justificações</Label><Textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Justificação de itens pendentes..." /></div>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => toast.success("Reconciliação guardada.")}><Save className="h-4 w-4" /> Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
