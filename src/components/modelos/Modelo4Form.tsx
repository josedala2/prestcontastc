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

type RowData = { saldoInicial: string; months: Record<string, string>; entregasExercicio: string };

export function Modelo4Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [data, setData] = useState<Record<string, RowData>>(
    Object.fromEntries(designacoes.map((d) => [d, { saldoInicial: "", months: Object.fromEntries(meses.map((m) => [m, ""])), entregasExercicio: "" }]))
  );
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const update = (desig: string, field: "saldoInicial" | "entregasExercicio" | string, value: string) => {
    setData((prev) => {
      const row = { ...prev[desig] };
      if (field === "saldoInicial") row.saldoInicial = value;
      else if (field === "entregasExercicio") row.entregasExercicio = value;
      else row.months = { ...row.months, [field]: value };
      return { ...prev, [desig]: row };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DAS ENTREGAS DOS DESCONTOS, RETENÇÕES NA FONTE E OUTROS</h3>
        <p className="text-xs text-muted-foreground mt-1">Conforme Modelo n.º 4 da Resolução n.º 1/17 do Tribunal de Contas.</p>
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
              <TableHead className="text-xs min-w-[120px] text-center font-bold bg-accent/10">Entregas no Exercício</TableHead>
              <TableHead className="text-xs min-w-[110px] text-center font-bold bg-primary/10">Saldo Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designacoes.map((d) => {
              const row = data[d];
              const totalMensal = Object.values(row.months).reduce((s, v) => s + (parseFloat(v) || 0), 0);
              const saldoInicial = parseFloat(row.saldoInicial) || 0;
              const entregas = parseFloat(row.entregasExercicio) || 0;
              const saldoFinal = saldoInicial + totalMensal - entregas;
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
                  <TableCell className="text-xs text-right font-mono font-bold">{totalMensal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="p-1 bg-accent/5">
                    <Input className="h-7 text-xs text-right font-mono" value={row.entregasExercicio} onChange={(e) => update(d, "entregasExercicio", e.target.value)} />
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold bg-primary/5">
                    {saldoFinal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Linha de totais */}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="text-xs font-bold sticky left-0 bg-primary/5 z-10">Total</TableCell>
              <TableCell className="text-xs text-right font-mono font-bold">
                {designacoes.reduce((s, d) => s + (parseFloat(data[d].saldoInicial) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
              {meses.map((m) => (
                <TableCell key={m} className="text-xs text-right font-mono font-bold">
                  {designacoes.reduce((s, d) => s + (parseFloat(data[d].months[m]) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                </TableCell>
              ))}
              <TableCell className="text-xs text-right font-mono font-bold">
                {designacoes.reduce((s, d) => s + Object.values(data[d].months).reduce((ms, v) => ms + (parseFloat(v) || 0), 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-xs text-right font-mono font-bold bg-accent/10">
                {designacoes.reduce((s, d) => s + (parseFloat(data[d].entregasExercicio) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-xs text-right font-mono font-bold bg-primary/10">
                {designacoes.reduce((s, d) => {
                  const si = parseFloat(data[d].saldoInicial) || 0;
                  const tm = Object.values(data[d].months).reduce((ms, v) => ms + (parseFloat(v) || 0), 0);
                  const ee = parseFloat(data[d].entregasExercicio) || 0;
                  return s + (si + tm - ee);
                }, 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
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
