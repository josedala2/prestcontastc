import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { mockAccounts } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PlanoContas = () => {
  return (
    <AppLayout>
      <PageHeader title="Plano de Contas" description="PGC — Decreto nº 82/2001">
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Importar
        </Button>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
      </PageHeader>

      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs w-24">Código</TableHead>
              <TableHead className="font-semibold text-xs">Descrição</TableHead>
              <TableHead className="font-semibold text-xs w-28">Natureza</TableHead>
              <TableHead className="font-semibold text-xs w-20">Nível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAccounts.map((acc) => (
              <TableRow key={acc.code}>
                <TableCell className="font-mono text-xs font-medium">{acc.code}</TableCell>
                <TableCell className={cn("text-sm", acc.level === 2 && "font-semibold")}>{acc.description}</TableCell>
                <TableCell>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    acc.nature === "Devedora" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"
                  )}>
                    {acc.nature}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{acc.level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default PlanoContas;
