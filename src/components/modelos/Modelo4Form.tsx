import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save } from "lucide-react";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const designacoes = [
  "Retenção IRT - Trabalho por conta de Outrem",
  "Retenção IRT - Trabalho por conta Própria",
  "Imposto Predial Urbano",
  "Aplicação sobre Capitais",
  "Outros Impostos",
  "Imposto Industrial",
  "Prestação de Serviços",
  "Liquidação Provisória sobre as Vendas",
  "Imposto de Selo",
  "Outros",
  "Contribuição Seg. Social - Trabalhador",
  "Contribuição Seg. Social - Empregador",
  "Outros Valores",
];

type RowData = { saldoInicial: string; months: Record<string, string> };

export function Modelo4Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [data, setData] = useState<Record<string, RowData>>(
    Object.fromEntries(designacoes.map((d) => [d, { saldoInicial: "", months: Object.fromEntries(meses.map((m) => [m, ""])) }]))
  );
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const update = (desig: string, field: "saldoInicial" | string, value: string) => {
    setData((prev) => {
      const row = { ...prev[desig] };
      if (field === "saldoInicial") row.saldoInicial = value;
      else row.months = { ...row.months, [field]: value };
      return { ...prev, [desig]: row };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DOS DESCONTOS, RETENÇÕES NA FONTE E OUTROS</h3>
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
              <TableHead className="text-xs min-w-[220px] sticky left-0 bg-muted/50 z-10">Designação</TableHead>
              <TableHead className="text-xs min-w-[100px] text-center">Saldo Inicial</TableHead>
              {meses.map((m) => (
                <TableHead key={m} className="text-xs min-w-[85px] text-center">{m}</TableHead>
              ))}
              <TableHead className="text-xs min-w-[100px] text-center font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designacoes.map((d) => {
              const row = data[d];
              const total = Object.values(row.months).reduce((s, v) => s + (parseFloat(v) || 0), 0);
              return (
                <TableRow key={d}>
                  <TableCell className="text-xs font-medium sticky left-0 bg-card z-10">{d}</TableCell>
                  <TableCell className="p-1">
                    <Input className="h-7 text-xs text-right font-mono" value={row.saldoInicial} onChange={(e) => update(d, "saldoInicial", e.target.value)} />
                  </TableCell>
                  {meses.map((m) => (
                    <TableCell key={m} className="p-1">
                      <Input className="h-7 text-xs text-right font-mono" value={row.months[m]} onChange={(e) => update(d, m, e.target.value)} />
                    </TableCell>
                  ))}
                  <TableCell className="text-xs text-right font-mono font-bold">{total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Elaborado por</Label><Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} /></div>
        <div><Label>O Responsável</Label><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
      </div>
      <div className="flex justify-end"><Button className="gap-2"><Save className="h-4 w-4" /> Guardar</Button></div>
    </div>
  );
}
