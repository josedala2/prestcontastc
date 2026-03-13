import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { formatKz } from "@/data/mockData";
import { toast } from "sonner";

interface BemPatrimonial {
  id: string; codigo: string; descricao: string; categoria: string;
  dataAquisicao: string; valorAquisicao: number; amortizacaoAcumulada: number;
  valorLiquido: number; localizacao: string; estado: string;
}

const categorias = ["Terrenos", "Edifícios", "Equipamento básico", "Equipamento transporte", "Equipamento administrativo", "Equipamento informático", "Mobiliário", "Outras imobilizações"];
const estados = ["Bom", "Razoável", "Mau", "Inoperacional", "Em manutenção"];

const initialBens: BemPatrimonial[] = [
  { id: "1", codigo: "IMC-001", descricao: "Edifício Sede — Luanda", categoria: "Edifícios", dataAquisicao: "2015-06-01", valorAquisicao: 2500000000, amortizacaoAcumulada: 875000000, valorLiquido: 1625000000, localizacao: "Luanda — Sede", estado: "Bom" },
  { id: "2", codigo: "IMC-002", descricao: "Viatura Toyota Land Cruiser", categoria: "Equipamento transporte", dataAquisicao: "2021-03-15", valorAquisicao: 42000000, amortizacaoAcumulada: 16800000, valorLiquido: 25200000, localizacao: "Garagem Central", estado: "Bom" },
  { id: "3", codigo: "IMC-003", descricao: "Servidor Dell PowerEdge R740", categoria: "Equipamento informático", dataAquisicao: "2022-01-10", valorAquisicao: 8500000, amortizacaoAcumulada: 5100000, valorLiquido: 3400000, localizacao: "Data Center", estado: "Razoável" },
  { id: "4", codigo: "IMC-004", descricao: "Gerador Caterpillar 500kVA", categoria: "Equipamento básico", dataAquisicao: "2018-09-20", valorAquisicao: 95000000, amortizacaoAcumulada: 57000000, valorLiquido: 38000000, localizacao: "Edifício Sede", estado: "Bom" },
];

export function InventarioPatrimonial() {
  const [bens, setBens] = useState<BemPatrimonial[]>(initialBens);

  const addBem = () => setBens((p) => [...p, {
    id: `ip_${Date.now()}`, codigo: "", descricao: "", categoria: categorias[0],
    dataAquisicao: "", valorAquisicao: 0, amortizacaoAcumulada: 0, valorLiquido: 0,
    localizacao: "", estado: "Bom",
  }]);
  const removeBem = (id: string) => setBens((p) => p.filter((b) => b.id !== id));
  const update = (id: string, field: keyof BemPatrimonial, value: string | number) => {
    setBens((p) => p.map((b) => {
      if (b.id !== id) return b;
      const updated = { ...b, [field]: value };
      if (field === "valorAquisicao" || field === "amortizacaoAcumulada") {
        updated.valorLiquido = updated.valorAquisicao - updated.amortizacaoAcumulada;
      }
      return updated;
    }));
  };

  const totalAquisicao = bens.reduce((s, b) => s + b.valorAquisicao, 0);
  const totalAmort = bens.reduce((s, b) => s + b.amortizacaoAcumulada, 0);
  const totalLiquido = bens.reduce((s, b) => s + b.valorLiquido, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inventário Patrimonial</CardTitle>
        <CardDescription>Relação completa dos bens patrimoniais da entidade, com valores de aquisição e amortização (Art.º 3.º, al. k) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Bens</p>
            <p className="text-lg font-bold text-foreground">{bens.length}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Aquisição</p>
            <p className="text-sm font-bold text-foreground">{formatKz(totalAquisicao)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Valor Líquido</p>
            <p className="text-sm font-bold text-primary">{formatKz(totalLiquido)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data Aquis.</TableHead>
                <TableHead className="text-right">V. Aquisição</TableHead>
                <TableHead className="text-right">Amort. Acum.</TableHead>
                <TableHead className="text-right">V. Líquido</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bens.map((b) => (
                <TableRow key={b.id}>
                  <TableCell><Input value={b.codigo} onChange={(e) => update(b.id, "codigo", e.target.value)} className="h-8 text-xs font-mono w-20" /></TableCell>
                  <TableCell><Input value={b.descricao} onChange={(e) => update(b.id, "descricao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={b.categoria} onValueChange={(v) => update(b.id, "categoria", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="date" value={b.dataAquisicao} onChange={(e) => update(b.id, "dataAquisicao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input type="number" value={b.valorAquisicao} onChange={(e) => update(b.id, "valorAquisicao", +e.target.value)} className="h-8 text-xs text-right" /></TableCell>
                  <TableCell><Input type="number" value={b.amortizacaoAcumulada} onChange={(e) => update(b.id, "amortizacaoAcumulada", +e.target.value)} className="h-8 text-xs text-right" /></TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">{formatKz(b.valorLiquido)}</TableCell>
                  <TableCell><Input value={b.localizacao} onChange={(e) => update(b.id, "localizacao", e.target.value)} className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={b.estado} onValueChange={(v) => update(b.id, "estado", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeBem(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={4} className="text-sm font-semibold">TOTAIS</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatKz(totalAquisicao)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatKz(totalAmort)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatKz(totalLiquido)}</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1" onClick={addBem}><Plus className="h-3 w-3" /> Adicionar Bem</Button>
          <Button className="gap-2" onClick={() => toast.success("Inventário guardado.")}><Save className="h-4 w-4" /> Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
