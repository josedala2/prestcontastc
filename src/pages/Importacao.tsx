import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockTrialBalance, formatKz } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Eye, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Importacao = () => {
  const [uploaded, setUploaded] = useState(false);

  return (
    <AppLayout>
      <PageHeader title="Importação de Balancete" description="Importar balancete via Excel/CSV">
        <Button variant="outline" className="gap-2" disabled={!uploaded}>
          <Save className="h-4 w-4" /> Guardar Versão
        </Button>
      </PageHeader>

      {!uploaded ? (
        <div className="bg-card rounded-lg border-2 border-dashed border-border p-12 text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Carregar Ficheiro</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Arraste o seu ficheiro Excel (.xlsx) ou CSV com o balancete, ou clique para seleccionar.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setUploaded(true)} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Seleccionar Ficheiro
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Colunas esperadas: Conta, Descrição, Débito, Crédito, Saldo
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="bg-card rounded-lg border border-border card-shadow p-4 mb-4 flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Balancete_2024_ENDE.xlsx</p>
              <p className="text-xs text-muted-foreground">{mockTrialBalance.length} linhas carregadas</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Pré-visualizar
            </Button>
          </div>

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
                {mockTrialBalance.map((line) => (
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
                    {formatKz(mockTrialBalance.reduce((s, l) => s + l.debit, 0))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatKz(mockTrialBalance.reduce((s, l) => s + l.credit, 0))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatKz(mockTrialBalance.reduce((s, l) => s + l.balance, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Importacao;
