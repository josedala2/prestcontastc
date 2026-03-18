import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { formatKz } from "@/lib/dataUtils";
import { useTrialBalance } from "@/hooks/useFinancialData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Printer, Loader2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { exportBalancoPdf, exportDrePdf, exportFullReportExcel } from "@/lib/exportUtils";
import { ComparacaoAnual } from "@/components/relatorios/ComparacaoAnual";

const COLORS = ["hsl(210,70%,28%)", "hsl(170,50%,42%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(280,60%,50%)", "hsl(150,50%,35%)"];

const Relatorios = () => {
  const { trialBalance: mockTrialBalance, loading: loadingTB } = useTrialBalance("1", "fy1");

  // ─── Helper: filtrar contas por prefixo de código (nível 2 = 2 dígitos) ───
  const filterByPrefix = (prefix: string) =>
    mockTrialBalance.filter((l) => l.accountCode.startsWith(prefix) && l.accountCode.length === 2);

  const filterByCode = (code: string) =>
    mockTrialBalance.filter((l) => l.accountCode === code);
  // ══════════════════════════════════════════════════
  // BALANÇO PATRIMONIAL — conforme PGC Angola
  // ══════════════════════════════════════════════════

  // ── ACTIVO NÃO CORRENTE (Classe 1) ──
  // Contas: 11-14 (bruto) menos 18 (amortizações) e 19 (provisões)
  const activoNCBruto = mockTrialBalance.filter(
    (l) => ["11", "12", "13", "14"].includes(l.accountCode)
  );
  const activoNCContra = mockTrialBalance.filter(
    (l) => ["18", "19"].includes(l.accountCode)
  );
  const activoNCLines = [...activoNCBruto, ...activoNCContra];
  const totalActivoNC = activoNCLines.reduce((s, l) => s + l.balance, 0);

  // ── ACTIVO CORRENTE ──
  // Classe 2 (Existências): 22-28, menos 29 (provisões)
  const existenciasLines = mockTrialBalance.filter(
    (l) => ["22", "23", "24", "25", "26", "27", "28", "29"].includes(l.accountCode)
  );
  const totalExistencias = existenciasLines.reduce((s, l) => s + l.balance, 0);

  // Classe 3 — Classificação por saldo: devedores → Activo, credores → Passivo
  // Excepção: conta 38 (provisão cobrança duvidosa) é sempre contra-activo
  const classe3Codes = ["31", "32", "33", "34", "35", "36", "37", "39"];
  const classe3Lines = mockTrialBalance.filter(
    (l) => classe3Codes.includes(l.accountCode)
  );
  const contasReceberAll = classe3Lines.filter((l) => l.balance > 0);
  const totalContasReceber = contasReceberAll.reduce((s, l) => s + l.balance, 0);

  // Provisões para cobrança duvidosa (contra-activo — sempre deduz do activo)
  const provisoesCDLines = filterByCode("38");
  const totalProvisoesCD = provisoesCDLines.reduce((s, l) => s + l.balance, 0);

  // Classe 4 — Meios Monetários: 41-45, 48, menos 49
  const meiosMonetariosLines = mockTrialBalance.filter(
    (l) => ["41", "42", "43", "44", "45", "48", "49"].includes(l.accountCode)
  );
  const totalMeiosMonetarios = meiosMonetariosLines.reduce((s, l) => s + l.balance, 0);

  const activoCorrenteLines = [...existenciasLines, ...contasReceberAll, ...provisoesCDLines, ...meiosMonetariosLines];
  const totalActivoCorrentes = totalExistencias + totalContasReceber + totalProvisoesCD + totalMeiosMonetarios;

  const totalAtivo = totalActivoNC + totalActivoCorrentes;

  // ── PASSIVO ──
  // Classe 3 com saldo credor (negativo), excluindo conta 38 (contra-activo)
  const passivoLines = classe3Lines.filter((l) => l.balance < 0);
  const totalPassivo = passivoLines.reduce((s, l) => s + (-l.balance), 0);

  // ── CAPITAL PRÓPRIO (Classe 5 + Classe 8) ──
  // Usa -balance: credores (negativos) → positivos; devedores (positivos) → negativos (prejuízos)
  const capitalLines = mockTrialBalance.filter(
    (l) => ["51", "52", "53", "54", "55", "56", "57", "58"].includes(l.accountCode)
  );
  const resultadosLines = mockTrialBalance.filter(
    (l) => ["81", "88"].includes(l.accountCode)
  );
  const capitalAllLines = [...capitalLines, ...resultadosLines];
  const totalCapital = capitalAllLines.reduce((s, l) => s + (-l.balance), 0);

  // Verificação equação fundamental
  const diferencaBalanco = totalAtivo - (totalPassivo + totalCapital);

  // ══════════════════════════════════════════════════
  // DEMONSTRAÇÃO DE RESULTADOS — conforme PGC Angola
  // Classe 6 = Proveitos e Ganhos, Classe 7 = Custos e Perdas
  // ══════════════════════════════════════════════════

  // ── PROVEITOS (Classe 6) ──
  const proveitosOperacionais = mockTrialBalance.filter(
    (l) => ["61", "62", "63", "64", "65"].includes(l.accountCode)
  );
  const totalProveitosOp = proveitosOperacionais.reduce((s, l) => s + Math.abs(l.balance), 0);

  const proveitosFinanceiros = mockTrialBalance.filter(
    (l) => ["66", "67"].includes(l.accountCode)
  );
  const totalProveitosFin = proveitosFinanceiros.reduce((s, l) => s + Math.abs(l.balance), 0);

  const proveitosNaoOp = mockTrialBalance.filter(
    (l) => ["68", "69"].includes(l.accountCode)
  );
  const totalProveitosNaoOp = proveitosNaoOp.reduce((s, l) => s + Math.abs(l.balance), 0);

  const allProveitos = [...proveitosOperacionais, ...proveitosFinanceiros, ...proveitosNaoOp];
  const totalProveitos = totalProveitosOp + totalProveitosFin + totalProveitosNaoOp;

  // ── CUSTOS (Classe 7) ──
  const custosOperacionais = mockTrialBalance.filter(
    (l) => ["71", "72", "73", "74", "75"].includes(l.accountCode)
  );
  const totalCustosOp = custosOperacionais.reduce((s, l) => s + l.balance, 0);

  const custosFinanceiros = mockTrialBalance.filter(
    (l) => ["76", "77"].includes(l.accountCode)
  );
  const totalCustosFin = custosFinanceiros.reduce((s, l) => s + l.balance, 0);

  const custosNaoOp = mockTrialBalance.filter(
    (l) => ["78", "79"].includes(l.accountCode)
  );
  const totalCustosNaoOp = custosNaoOp.reduce((s, l) => s + l.balance, 0);

  const allCustos = [...custosOperacionais, ...custosFinanceiros, ...custosNaoOp];
  const totalCustos = totalCustosOp + totalCustosFin + totalCustosNaoOp;

  // ── Resultados ──
  const resultadoOperacional = totalProveitosOp - totalCustosOp;
  const resultadoFinanceiro = totalProveitosFin - totalCustosFin;
  const resultadoNaoOperacional = totalProveitosNaoOp - totalCustosNaoOp;
  const resultadoLiquido = totalProveitos - totalCustos;

  // ── Indicadores ──
  const liquidezGeral = totalAtivo / totalPassivo;
  const endividamento = (totalPassivo / (totalPassivo + totalCapital)) * 100;
  const rentabilidade = totalProveitos > 0 ? (resultadoLiquido / totalProveitos) * 100 : 0;

  // ── Dados para gráficos ──
  const balancoData = [
    { name: "Activo NC", value: Math.abs(totalActivoNC) },
    { name: "Activo Corrente", value: Math.abs(totalActivoCorrentes) },
    { name: "Passivo", value: totalPassivo },
    { name: "Capital Próprio", value: totalCapital },
  ];

  const dreData = [
    ...allCustos.map((c) => ({ name: c.description, Custos: Math.abs(c.balance), Proveitos: 0 })),
    ...allProveitos.map((p) => ({ name: p.description, Custos: 0, Proveitos: Math.abs(p.balance) })),
  ];

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportBalancoPdf(activoNCLines, passivoLines, capitalAllLines);
      exportDrePdf(allCustos, allProveitos, resultadoLiquido);
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
      exportFullReportExcel(mockTrialBalance, [...activoNCLines, ...activoCorrenteLines], passivoLines, capitalAllLines, allCustos, allProveitos);
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

  // ── Helper para renderizar secção de linhas ──
  // mode: 'raw' = balance as-is, 'abs' = Math.abs, 'negate' = -balance (credit→positive)
  const renderLines = (lines: typeof mockTrialBalance, mode: 'raw' | 'abs' | 'negate' = 'raw') =>
    lines.map((l) => {
      const val = mode === 'abs' ? Math.abs(l.balance) : mode === 'negate' ? -l.balance : l.balance;
      return (
        <TableRow key={l.id}>
          <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
          <TableCell className="text-sm">{l.description}</TableCell>
          <TableCell className="text-right font-mono text-sm">
            {formatKz(val)}
          </TableCell>
        </TableRow>
      );
    });

  return (
    <AppLayout>
      <PageHeader title="Relatórios e Demonstrações" description="Balanço Patrimonial, DRE e Indicadores Financeiros — conforme PGC/Resolução 1/17">
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
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="comparacao">Comparação Anual</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        </TabsList>

        {/* ══════ BALANÇO PATRIMONIAL ══════ */}
        <TabsContent value="balanco">
          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <div className="p-4 bg-primary/5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary">Balanço Patrimonial — Exercício 2024</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Classificação conforme PGC (Classes 1-5, 8)</p>
              </div>
              {Math.abs(diferencaBalanco) > 1 && (
                <span className="text-xs text-destructive font-semibold">
                  ⚠ Diferença: {formatKz(diferencaBalanco)}
                </span>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold w-24">Conta</TableHead>
                  <TableHead className="text-xs font-semibold">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-40">Valor (Kz)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ACTIVO NÃO CORRENTE */}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">ACTIVO NÃO CORRENTE (Classe 1)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalActivoNC)}</TableCell>
                </TableRow>
                {renderLines(activoNCBruto)}
                {activoNCContra.length > 0 && (
                  <>
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground italic pl-6">Amortizações e Provisões (dedução)</TableCell>
                    </TableRow>
                    {renderLines(activoNCContra)}
                  </>
                )}

                {/* ACTIVO CORRENTE */}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">ACTIVO CORRENTE (Classes 2, 3, 4)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalActivoCorrentes)}</TableCell>
                </TableRow>
                {existenciasLines.length > 0 && (
                  <>
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground pl-6">Existências (Classe 2)</TableCell>
                    </TableRow>
                    {renderLines(existenciasLines)}
                  </>
                )}
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground pl-6">Contas a Receber (Classe 3 — saldos devedores)</TableCell>
                </TableRow>
                {renderLines(contasReceberAll)}
                {provisoesCDLines.length > 0 && renderLines(provisoesCDLines)}
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground pl-6">Meios Monetários (Classe 4)</TableCell>
                </TableRow>
                {renderLines(meiosMonetariosLines)}

                {/* TOTAL ACTIVO */}
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <TableCell colSpan={2} className="text-sm font-bold text-primary">TOTAL DO ACTIVO</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalAtivo)}</TableCell>
                </TableRow>

                {/* PASSIVO */}
                <TableRow className="bg-destructive/5">
                  <TableCell colSpan={2} className="font-bold text-sm">PASSIVO (Classe 3 — saldos credores)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalPassivo)}</TableCell>
                </TableRow>
                {renderLines(passivoLines, 'negate')}

                {/* CAPITAL PRÓPRIO */}
                <TableRow className="bg-accent/10">
                  <TableCell colSpan={2} className="font-bold text-sm">CAPITAL PRÓPRIO (Classe 5)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(capitalLines.reduce((s, l) => s + (-l.balance), 0))}</TableCell>
                </TableRow>
                {renderLines(capitalLines, 'negate')}
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground pl-6">Resultados (Classe 8)</TableCell>
                </TableRow>
                {renderLines(resultadosLines, 'negate')}

                {/* TOTAL PASSIVO + CP */}
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <TableCell colSpan={2} className="text-sm font-bold text-primary">TOTAL PASSIVO + CAPITAL PRÓPRIO</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm text-primary">{formatKz(totalPassivo + totalCapital)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ══════ DRE ══════ */}
        <TabsContent value="dre">
          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <div className="p-4 bg-primary/5 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">Demonstração de Resultados do Exercício — 2024</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Classe 6 = Proveitos e Ganhos · Classe 7 = Custos e Perdas (PGC Angola)</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold w-24">Conta</TableHead>
                  <TableHead className="text-xs font-semibold">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-40">Valor (Kz)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* PROVEITOS OPERACIONAIS */}
                <TableRow className="bg-success/5">
                  <TableCell colSpan={2} className="font-bold text-sm">PROVEITOS OPERACIONAIS (61-65)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalProveitosOp)}</TableCell>
                </TableRow>
                {renderLines(proveitosOperacionais, 'abs')}

                {/* CUSTOS OPERACIONAIS */}
                <TableRow className="bg-destructive/5">
                  <TableCell colSpan={2} className="font-bold text-sm">CUSTOS OPERACIONAIS (71-75)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalCustosOp)}</TableCell>
                </TableRow>
                {renderLines(custosOperacionais)}

                {/* RESULTADO OPERACIONAL */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="text-sm font-semibold flex items-center gap-2">
                    {resultadoOperacional >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    RESULTADO OPERACIONAL
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm font-semibold ${resultadoOperacional >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatKz(resultadoOperacional)}
                  </TableCell>
                </TableRow>

                {/* PROVEITOS FINANCEIROS */}
                <TableRow className="bg-success/5">
                  <TableCell colSpan={2} className="font-bold text-sm">PROVEITOS FINANCEIROS (66-67)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalProveitosFin)}</TableCell>
                </TableRow>
                {renderLines(proveitosFinanceiros, 'abs')}

                {/* CUSTOS FINANCEIROS */}
                <TableRow className="bg-destructive/5">
                  <TableCell colSpan={2} className="font-bold text-sm">CUSTOS FINANCEIROS (76-77)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalCustosFin)}</TableCell>
                </TableRow>
                {renderLines(custosFinanceiros)}

                {/* RESULTADO FINANCEIRO */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="text-sm font-semibold">RESULTADO FINANCEIRO</TableCell>
                  <TableCell className={`text-right font-mono text-sm font-semibold ${resultadoFinanceiro >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatKz(resultadoFinanceiro)}
                  </TableCell>
                </TableRow>

                {/* PROVEITOS NÃO OPERACIONAIS */}
                <TableRow className="bg-success/5">
                  <TableCell colSpan={2} className="font-bold text-sm">PROVEITOS NÃO OPERACIONAIS (68-69)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalProveitosNaoOp)}</TableCell>
                </TableRow>
                {renderLines(proveitosNaoOp, 'abs')}

                {/* CUSTOS NÃO OPERACIONAIS */}
                <TableRow className="bg-destructive/5">
                  <TableCell colSpan={2} className="font-bold text-sm">CUSTOS NÃO OPERACIONAIS (78-79)</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">{formatKz(totalCustosNaoOp)}</TableCell>
                </TableRow>
                {renderLines(custosNaoOp)}

                {/* RESULTADO NÃO OPERACIONAL */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="text-sm font-semibold">RESULTADO NÃO OPERACIONAL</TableCell>
                  <TableCell className={`text-right font-mono text-sm font-semibold ${resultadoNaoOperacional >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatKz(resultadoNaoOperacional)}
                  </TableCell>
                </TableRow>

                {/* TOTAIS */}
                <TableRow className="bg-success/10 font-bold border-t">
                  <TableCell colSpan={2} className="text-sm font-bold">TOTAL PROVEITOS E GANHOS (Classe 6)</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{formatKz(totalProveitos)}</TableCell>
                </TableRow>
                <TableRow className="bg-destructive/10 font-bold">
                  <TableCell colSpan={2} className="text-sm font-bold">TOTAL CUSTOS E PERDAS (Classe 7)</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{formatKz(totalCustos)}</TableCell>
                </TableRow>

                {/* RESULTADO LÍQUIDO */}
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/30">
                  <TableCell colSpan={2} className="text-sm text-primary font-bold">RESULTADO LÍQUIDO DO EXERCÍCIO</TableCell>
                  <TableCell className={`text-right font-mono text-sm font-bold ${resultadoLiquido >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatKz(resultadoLiquido)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="fluxo">
          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <div className="p-4 bg-primary/5 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">Demonstração do Fluxo de Caixa — Exercício 2024</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Método Indirecto (conforme PGC)</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Rubrica</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Valor (Kz)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">A. ACTIVIDADES OPERACIONAIS</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Resultado líquido do exercício</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(resultadoLiquido)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Amortizações e depreciações (73)</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(totalCustosOp > 0 ? (filterByCode("73")[0]?.balance || 0) : 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Provisões do exercício (74)</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(filterByCode("74")[0]?.balance || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Variação de clientes e devedores</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-520000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Variação de fornecedores e credores</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(410000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Variação de existências</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-180000000)}</TableCell>
                </TableRow>
                {(() => {
                  const amort = filterByCode("73")[0]?.balance || 0;
                  const prov = filterByCode("74")[0]?.balance || 0;
                  const fluxoOp = resultadoLiquido + amort + prov - 520000000 + 410000000 - 180000000;
                  return (
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="text-sm font-semibold pl-6">Fluxo das actividades operacionais (1)</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatKz(fluxoOp)}</TableCell>
                    </TableRow>
                  );
                })()}

                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">B. ACTIVIDADES DE INVESTIMENTO</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Aquisição de imobilizações corpóreas</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-2100000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Alienação de imobilizações</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(150000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Investimentos financeiros</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-450000000)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell className="text-sm font-semibold pl-6">Fluxo das actividades de investimento (2)</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatKz(-2400000000)}</TableCell>
                </TableRow>

                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-sm text-primary">C. ACTIVIDADES DE FINANCIAMENTO</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Obtenção de empréstimos</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(3000000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Reembolso de empréstimos</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-800000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Juros pagos</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(-350000000)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm pl-6">Subsídios recebidos</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(600000000)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell className="text-sm font-semibold pl-6">Fluxo das actividades de financiamento (3)</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatKz(2450000000)}</TableCell>
                </TableRow>

                {(() => {
                  const amort = filterByCode("73")[0]?.balance || 0;
                  const prov = filterByCode("74")[0]?.balance || 0;
                  const fluxoOp = resultadoLiquido + amort + prov - 520000000 + 410000000 - 180000000;
                  const varCaixa = fluxoOp - 2400000000 + 2450000000;
                  return (
                    <>
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell className="text-sm font-bold text-primary">VARIAÇÃO DE CAIXA E EQUIVALENTES (1+2+3)</TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-primary">{formatKz(varCaixa)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-sm">Caixa e equivalentes no início do período</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatKz(1200000000)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell className="text-sm font-bold text-primary">CAIXA E EQUIVALENTES NO FIM DO PERÍODO</TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-primary">{formatKz(1200000000 + varCaixa)}</TableCell>
                      </TableRow>
                    </>
                  );
                })()}
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
              <h3 className="text-sm font-semibold text-foreground mb-4">Custos (Cl.7) vs Proveitos (Cl.6)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={90} />
                  <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `${formatKz(value)} Kz`} />
                  <Bar dataKey="Custos" fill={COLORS[3]} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Proveitos" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── Comparação Ano-a-Ano ── */}
        <TabsContent value="comparacao">
          <ComparacaoAnual />
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
              <p className={`text-3xl font-bold ${rentabilidade >= 0 ? "text-success" : "text-destructive"}`}>{rentabilidade.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Resultado / Proveitos</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Relatorios;
