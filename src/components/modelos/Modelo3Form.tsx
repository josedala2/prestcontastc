import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save } from "lucide-react";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type MonthData = Record<string, string>;

const emptyMonths = (): MonthData => Object.fromEntries(meses.map((m) => [m, ""]));

export function Modelo3Form() {
  const [entidade, setEntidade] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [salarioBase, setSalarioBase] = useState<MonthData>(emptyMonths());
  const [subsidios, setSubsidios] = useState<MonthData>(emptyMonths());
  const [totalBruto, setTotalBruto] = useState<MonthData>(emptyMonths());
  const [irt, setIrt] = useState<MonthData>(emptyMonths());
  const [segSocial, setSegSocial] = useState<MonthData>(emptyMonths());
  const [outrosDescontos, setOutrosDescontos] = useState<MonthData>(emptyMonths());
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const updateField = (setter: React.Dispatch<React.SetStateAction<MonthData>>, mes: string, val: string) => {
    setter((prev) => ({ ...prev, [mes]: val }));
  };

  const rows = [
    { label: "Salário Base (A)", data: salarioBase, setter: setSalarioBase },
    { label: "Subsídios (B)", data: subsidios, setter: setSubsidios },
    { label: "Total Bruto (C)", data: totalBruto, setter: setTotalBruto },
    { label: "IRT (D)", data: irt, setter: setIrt },
    { label: "Seg. Social (E)", data: segSocial, setter: setSegSocial },
    { label: "Outros Descontos (F)", data: outrosDescontos, setter: setOutrosDescontos },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary">MAPA DE DESPESAS COM O PESSOAL</h3>
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
              <TableHead className="text-xs min-w-[160px] sticky left-0 bg-muted/50 z-10">Rubrica</TableHead>
              {meses.map((m) => (
                <TableHead key={m} className="text-xs min-w-[100px] text-center">{m}</TableHead>
              ))}
              <TableHead className="text-xs min-w-[110px] text-center font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-xs font-medium sticky left-0 bg-card z-10">{row.label}</TableCell>
                {meses.map((m) => (
                  <TableCell key={m} className="p-1">
                    <Input
                      className="h-7 text-xs text-right font-mono"
                      value={row.data[m]}
                      onChange={(e) => updateField(row.setter, m, e.target.value)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-xs text-right font-mono font-bold">
                  {Object.values(row.data).reduce((s, v) => s + (parseFloat(v) || 0), 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 font-bold">
              <TableCell className="text-xs font-bold sticky left-0 bg-primary/5 z-10">Total Líquido (H=C-G)</TableCell>
              {meses.map((m) => {
                const bruto = parseFloat(totalBruto[m]) || 0;
                const descontos = (parseFloat(irt[m]) || 0) + (parseFloat(segSocial[m]) || 0) + (parseFloat(outrosDescontos[m]) || 0);
                return <TableCell key={m} className="text-xs text-right font-mono">{(bruto - descontos).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>;
              })}
              <TableCell className="text-xs text-right font-mono font-bold">—</TableCell>
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
