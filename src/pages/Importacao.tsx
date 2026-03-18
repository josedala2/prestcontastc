import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { formatKz } from "@/lib/dataUtils";
import { useTrialBalance } from "@/hooks/useFinancialData";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Eye, EyeOff, Save, RotateCcw, Download, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { exportBalanceteExcel, exportBalancetePdf } from "@/lib/exportUtils";

const Importacao = () => {
  const { trialBalance } = useTrialBalance("1", "fy1");
  const [uploaded, setUploaded] = useState(false);
  const [preview, setPreview] = useState(true);
  const [versions, setVersions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploaded(true);
      toast.success(`Ficheiro "${file.name}" carregado com ${trialBalance.length} linhas.`);
    }
  };

  const handleSaveVersion = () => {
    const version = `v${versions.length + 1} — ${new Date().toLocaleString("pt-AO")}`;
    setVersions((prev) => [version, ...prev]);
    toast.success(`Versão guardada: ${version}`);
  };

  const handleReset = () => {
    setUploaded(false);
    setVersions([]);
    toast.info("Importação reiniciada.");
  };

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportBalanceteExcel(trialBalance);
      toast.success("Balancete exportado em Excel com sucesso.");
    } catch (e) {
      toast.error("Erro ao exportar.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportBalancetePdf(trialBalance);
      toast.success("Balancete exportado em PDF com sucesso.");
    } catch (e) {
      toast.error("Erro ao exportar.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Importação de Balancete" description="Importar balancete via Excel/CSV">
        <div className="flex gap-2">
          {uploaded && (
            <>
              <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExportPdf} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" /> Reiniciar
              </Button>
              <Button className="gap-2" onClick={handleSaveVersion}>
                <Save className="h-4 w-4" /> Guardar Versão
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

      {!uploaded ? (
        <div
          className="bg-card rounded-lg border-2 border-dashed border-border p-12 text-center animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
          onClick={handleFileSelect}
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Carregar Ficheiro</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Arraste o seu ficheiro Excel (.xlsx) ou CSV com o balancete, ou clique para seleccionar.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={(e) => { e.stopPropagation(); handleFileSelect(); }} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Seleccionar Ficheiro
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Colunas esperadas: Conta, Descrição, Débito, Crédito, Saldo
          </p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-4">
          <div className="bg-card rounded-lg border border-border card-shadow p-4 flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Balancete importado</p>
              <p className="text-xs text-muted-foreground">{trialBalance.length} linhas carregadas • {versions.length} versão(ões) guardada(s)</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreview(!preview)}>
              {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {preview ? "Ocultar" : "Mostrar"}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleFileSelect}>
              <Upload className="h-3.5 w-3.5" /> Reimportar
            </Button>
          </div>

          {versions.length > 0 && (
            <div className="bg-card rounded-lg border border-border card-shadow p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Versões Guardadas</p>
              <div className="space-y-1">
                {versions.map((v, i) => (
                  <p key={i} className="text-sm text-foreground">{v}</p>
                ))}
              </div>
            </div>
          )}

          {preview && (
            <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">Conta</TableHead>
                    <TableHead className="font-semibold text-xs">Descrição</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Débito (Kz)</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Crédito (Kz)</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Saldo (Kz)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                      <TableCell className="text-sm">{line.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{line.debit > 0 ? formatKz(line.debit) : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{line.credit > 0 ? formatKz(line.credit) : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatKz(line.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={2} className="text-sm">TOTAIS</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatKz(trialBalance.reduce((s, l) => s + l.debit, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatKz(trialBalance.reduce((s, l) => s + l.credit, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatKz(mockTrialBalance.reduce((s, l) => s + l.balance, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Importacao;
