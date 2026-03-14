import { FiscalYear, STATUS_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKz } from "@/data/mockData";
import { CalendarCheck } from "lucide-react";

interface EntityExerciciosTabProps {
  fiscalYears: FiscalYear[];
}

export function EntityExerciciosTab({ fiscalYears }: EntityExerciciosTabProps) {
  const sorted = [...fiscalYears].sort((a, b) => b.year - a.year);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" />
          Histórico de Exercícios ({sorted.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Total Débito</TableHead>
              <TableHead className="text-right">Total Crédito</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Checklist</TableHead>
              <TableHead>Submetido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((fy) => {
              const statusInfo = STATUS_LABELS[fy.status];
              return (
                <TableRow key={fy.id}>
                  <TableCell className="font-bold">{fy.year}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fy.startDate} — {fy.endDate}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(fy.totalDebito)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatKz(fy.totalCredito)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusInfo.color === "success" ? "default" : statusInfo.color === "destructive" ? "destructive" : "secondary"} className="text-[10px]">
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{fy.checklistProgress}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fy.submittedAt || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
