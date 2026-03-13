import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { formatKz } from "@/data/mockData";
import { toast } from "sonner";

interface BemAbatido {
  id: string; codigo: string; descricao: string; categoria: string;
  dataAquisicao: string; valorAquisicao: number; amortizacaoAcumulada: number;
  valorResidual: number; dataAbate: string; motivo: string;
  autorizacao: string; destinoFinal: string;
}

const motivos = ["Obsolescência", "Avaria irreparável", "Sinistro", "Alienação/Venda", "Doação", "Furto/Extravio", "Outro"];
const destinos = ["Sucata", "Vendido em hasta pública", "Doado", "Destruído", "Em processo de alienação"];

const initialAbates: BemAbatido[] = [
  { id: "1", codigo: "IMC-015", descricao: "Impressora HP LaserJet 4050", categoria: "Equipamento informático", dataAquisicao: "2016-03-10", valorAquisicao: 1200000, amortizacaoAcumulada: 1200000, valorResidual: 0, dataAbate: "2024-07-15", motivo: "Obsolescência", autorizacao: "Despacho n.º 42/2024", destinoFinal: "Sucata" },
  { id: "2", codigo: "IMC-008", descricao: "Viatura Mitsubishi L200", categoria: "Equipamento transporte", dataAquisicao: "2017-11-20", valorAquisicao: 28000000, amortizacaoAcumulada: 28000000, valorResidual: 0, dataAbate: "2024-09-01", motivo: "Sinistro", autorizacao: "Despacho n.º 67/2024", destinoFinal: "Vendido em hasta pública" },
];

export function RelacaoAbates() {
  const [abates, setAbates] = useState<BemAbatido[]>(initialAbates);

  const addAbate = () => setAbates((p) => [...p, {
    id: `ab_${Date.now()}`, codigo: "", descricao: "", categoria: "Equipamento informático",
    dataAquisicao: "", valorAquisicao: 0, amortizacaoAcumulada: 0, valorResidual: 0,
    dataAbate: "", motivo: motivos[0], autorizacao: "", destinoFinal: destinos[0],
  }]);
  const removeAbate = (id: string) => setAbates((p) => p.filter((a) => a.id !== id));
  const update = (id: string, field: keyof BemAbatido, value: string | number) => {
    setAbates((p) => p.map((a) => {
      if (a.id !== id) return a;
      const updated = { ...a, [field]: value };
      if (field === "valorAquisicao" || field === "amortizacaoAcumulada") {
        updated.valorResidual = Math.max(0, updated.valorAquisicao - updated.amortizacaoAcumulada);
      }
      return updated;
    }));
  };

  const totalValorAq = abates.reduce((s, a) => s + a.valorAquisicao, 0);
  const totalResidual = abates.reduce((s, a) => s + a.valorResidual, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relação de Bens Imóveis e Móveis Abatidos</CardTitle>
        <CardDescription>Lista dos bens patrimoniais abatidos ao inventário durante o exercício, com fundamentação e autorização (Art.º 3.º, al. l) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Bens Abatidos</p>
            <p className="text-lg font-bold text-foreground">{abates.length}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Original</p>
            <p className="text-sm font-bold text-foreground">{formatKz(totalValorAq)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Residual</p>
            <p className="text-sm font-bold text-warning">{formatKz(totalResidual)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Aquis.</TableHead>
                <TableHead className="text-right">V. Aquisição</TableHead>
                <TableHead className="text-right">V. Residual</TableHead>
                <TableHead>Data Abate</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Autorização</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abates.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><Input value={a.codigo} onChange={(e) => update(a.id, "codigo", e.target.value)} className="h-8 text-xs font-mono w-20" /></TableCell>
                  <TableCell><Input value={a.descricao} onChange={(e) => update(a.id, "descricao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="date" value={a.dataAquisicao} onChange={(e) => update(a.id, "dataAquisicao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="number" value={a.valorAquisicao} onChange={(e) => update(a.id, "valorAquisicao", +e.target.value)} className="h-8 text-xs text-right" /></TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatKz(a.valorResidual)}</TableCell>
                  <TableCell><Input type="date" value={a.dataAbate} onChange={(e) => update(a.id, "dataAbate", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={a.motivo} onValueChange={(v) => update(a.id, "motivo", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{motivos.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={a.autorizacao} onChange={(e) => update(a.id, "autorizacao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={a.destinoFinal} onValueChange={(v) => update(a.id, "destinoFinal", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{destinos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeAbate(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={3} className="text-sm font-semibold">TOTAIS</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatKz(totalValorAq)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatKz(totalResidual)}</TableCell>
                <TableCell colSpan={5}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1" onClick={addAbate}><Plus className="h-3 w-3" /> Adicionar Bem Abatido</Button>
          <Button className="gap-2" onClick={() => toast.success("Relação de abates guardada.")}><Save className="h-4 w-4" /> Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
