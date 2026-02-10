import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockTrialBalance, formatKz } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Printer, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { exportBalancoPdf, exportDrePdf, exportFullReportExcel } from "@/lib/exportUtils";

const COLORS = ["hsl(210,70%,28%)", "hsl(170,50%,42%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(280,60%,50%)"];

const Relatorios = () => {
  const ativoLines = mockTrialBalance.filter((l) => ["11.1", "11.2", "11.3", "18", "22", "31", "43", "45"].includes(l.accountCode));
  const totalAtivo = ativoLines.reduce((s, l) => s + l.balance, 0);

  const passivoLines = mockTrialBalance.filter((l) => ["32"].includes(l.accountCode));
  const totalPassivo = passivoLines.reduce((s, l) => s + Math.abs(l.balance), 0);

  const capitalLines = mockTrialBalance.filter((l) => ["51", "55", "88"].includes(l.accountCode));
  const totalCapital = capitalLines.reduce((s, l) => s + Math.abs(l.balance), 0);

  const custos = mockTrialBalance.filter((l) => ["61", "62", "63", "66"].includes(l.accountCode));
  const totalCustos = custos.reduce((s, l) => s + l.balance, 0);

  const proveitos = mockTrialBalance.filter((l) => ["71", "72", "78"].includes(l.accountCode));
  const totalProveitos = proveitos.reduce((s, l) => s + Math.abs(l.balance), 0);

  const resultado = totalProveitos - totalCustos;

  const balancoData = [
    { name: "Ativo", value: totalAtivo },
    { name: "Passivo", value: totalPassivo },
    { name: "Capital Próprio", value: totalCapital },
  ];

  const dreData = [
    ...custos.map((c) => ({ name: c.description, Custos: c.balance, Proveitos: 0 })),
    ...proveitos.map((p) => ({ name: p.description, Custos: 0, Proveitos: Math.abs(p.balance) })),
  ];

  const liquidezGeral = totalAtivo / totalPassivo;
  const endividamento = (totalPassivo / (totalPassivo + totalCapital)) * 100;
  const rentabilidade = (resultado / totalProveitos) * 100;

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportBalancoPdf(ativoLines, passivoLines, capitalLines);
      exportDrePdf(custos, proveitos, resultado);
      toast.success("PDF do Balanço e DRE exportados com sucesso.");
    } catch (e) {
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportFullReportExcel(mockTrialBalance, ativoLines, passivoLines, capitalLines, custos, proveitos);
      toast.success("Relatório Excel exportado com sucesso (3 folhas: Balancete, Balanço, DRE).");
    } catch (e) {
      toast.error("Erro ao exportar Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <PageHeader title="Relatórios e Demonstrações" description="Balanço Patrimonial, DRE e Indicadores Financeiros">
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleExportPdf} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Exportar PDF
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Exportar Excel
        </Button>
      </PageHeader>

      <Tabs defaultValue="balanco" className="animate-fade-in">
        <TabsList className="mb-4">
          <TabsTrigger value="balanco">Balanço Patrimonial</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        </TabsList>

        <TabsContent value="balanco">
          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <div className="p-4 bg-primary/5 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">Balanço Patrimonial — Exercício 2024</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Conta</TableHead>
                  <TableHead className="text-xs font-semibold">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Valor (Kz)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">ACTIVO</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalAtivo)}</TableCell>
                </TableRow>
                {ativoLines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(l.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">PASSIVO</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalPassivo)}</TableCell>
                </TableRow>
                {passivoLines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(Math.abs(l.balance))}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">CAPITAL PRÓPRIO</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalCapital)}</TableCell>
                </TableRow>
                {capitalLines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(Math.abs(l.balance))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dre">
          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <div className="p-4 bg-primary/5 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">Demonstração de Resultados do Exercício — 2024</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Conta</TableHead>
                  <TableHead className="text-xs font-semibold">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Valor (Kz)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5">
                  <TableCell colSpan={2} className="font-bold text-sm">CUSTOS E PERDAS</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalCustos)}</TableCell>
                </TableRow>
                {custos.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(l.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-success/5">
                  <TableCell colSpan={2} className="font-bold text-sm">PROVEITOS E GANHOS</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalProveitos)}</TableCell>
                </TableRow>
                {proveitos.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatKz(Math.abs(l.balance))}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={2} className="text-sm text-primary">RESULTADO LÍQUIDO</TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">{formatKz(resultado)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border card-shadow p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Composição do Balanço</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={balancoData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {balancoData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${formatKz(value)} Kz`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-lg border border-border card-shadow p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Custos vs Proveitos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `${formatKz(value)} Kz`} />
                  <Bar dataKey="Custos" fill={COLORS[3]} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Proveitos" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="indicadores">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border border-border card-shadow p-6 text-center animate-fade-in">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Liquidez Geral</p>
              <p className="text-3xl font-bold text-primary">{liquidezGeral.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Activo / Passivo</p>
            </div>
            <div className="bg-card rounded-lg border border-border card-shadow p-6 text-center animate-fade-in">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Endividamento</p>
              <p className="text-3xl font-bold text-warning">{endividamento.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Passivo / (Passivo + Cap. Próprio)</p>
            </div>
            <div className="bg-card rounded-lg border border-border card-shadow p-6 text-center animate-fade-in">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Rentabilidade Líquida</p>
              <p className="text-3xl font-bold text-success">{rentabilidade.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Resultado / Proveitos</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Relatorios;
