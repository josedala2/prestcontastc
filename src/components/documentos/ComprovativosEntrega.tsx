import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, CheckCircle, Clock } from "lucide-react";
import { formatKz } from "@/lib/dataUtils";
import { toast } from "sonner";

interface Comprovativo {
  id: string; tipo: string; referencia: string; entidadeDestino: string;
  valor: number; dataDesconto: string; dataEntrega: string; estado: "entregue" | "pendente";
}

const tiposDesconto = [
  "IRT (Imposto sobre Rendimento do Trabalho)",
  "Segurança Social (INSS)",
  "Imposto Industrial",
  "IVA",
  "Imposto de Selo",
  "Outros descontos legais",
];

const initialComprovativos: Comprovativo[] = [
  { id: "1", tipo: "IRT (Imposto sobre Rendimento do Trabalho)", referencia: "IRT-2024/12", entidadeDestino: "AGT — Administração Geral Tributária", valor: 273732067.35, dataDesconto: "2024-12-31", dataEntrega: "2025-01-15", estado: "entregue" },
  { id: "2", tipo: "Segurança Social (INSS)", referencia: "INSS-2024/12", entidadeDestino: "INSS — Instituto Nacional de Segurança Social", valor: 184500000, dataDesconto: "2024-12-31", dataEntrega: "2025-01-20", estado: "entregue" },
  { id: "3", tipo: "IVA", referencia: "IVA-2024/Q4", entidadeDestino: "AGT — Administração Geral Tributária", valor: 64343793.13, dataDesconto: "2024-12-31", dataEntrega: "", estado: "pendente" },
];

export function ComprovativosEntrega() {
  const [comprovativos, setComprovativos] = useState<Comprovativo[]>(initialComprovativos);

  const addItem = () => setComprovativos((p) => [...p, {
    id: `ce_${Date.now()}`, tipo: tiposDesconto[0], referencia: "", entidadeDestino: "",
    valor: 0, dataDesconto: "", dataEntrega: "", estado: "pendente",
  }]);
  const removeItem = (id: string) => setComprovativos((p) => p.filter((c) => c.id !== id));
  const update = (id: string, field: keyof Comprovativo, value: string | number) =>
    setComprovativos((p) => p.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const totalValor = comprovativos.reduce((s, c) => s + c.valor, 0);
  const entregues = comprovativos.filter((c) => c.estado === "entregue").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comprovativos de Entrega de Descontos</CardTitle>
        <CardDescription>Comprovação da entrega de descontos legais às entidades competentes (Art.º 3.º, al. j) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{entregues}/{comprovativos.length} entregues</span>
          <span>Total: {formatKz(totalValor)}</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Desconto</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Entidade Destino</TableHead>
                <TableHead className="text-right">Valor (Kz)</TableHead>
                <TableHead>Data Desconto</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comprovativos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Select value={c.tipo} onValueChange={(v) => update(c.id, "tipo", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{tiposDesconto.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={c.referencia} onChange={(e) => update(c.id, "referencia", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input value={c.entidadeDestino} onChange={(e) => update(c.id, "entidadeDestino", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input type="number" value={c.valor} onChange={(e) => update(c.id, "valor", +e.target.value)} className="h-8 text-sm text-right" /></TableCell>
                  <TableCell><Input type="date" value={c.dataDesconto} onChange={(e) => update(c.id, "dataDesconto", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input type="date" value={c.dataEntrega} onChange={(e) => update(c.id, "dataEntrega", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell>
                    <Select value={c.estado} onValueChange={(v) => update(c.id, "estado", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entregue"><span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" /> Entregue</span></SelectItem>
                        <SelectItem value="pendente"><span className="flex items-center gap-1"><Clock className="h-3 w-3 text-warning" /> Pendente</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={3} className="text-sm font-semibold">TOTAL</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatKz(totalValor)}</TableCell>
                <TableCell colSpan={4}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1" onClick={addItem}><Plus className="h-3 w-3" /> Adicionar</Button>
          <Button className="gap-2" onClick={() => toast.success("Comprovativos guardados.")}><Save className="h-4 w-4" /> Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
