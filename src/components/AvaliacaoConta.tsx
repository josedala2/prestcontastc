import { useState, useMemo } from "react";
import { useComplianceQuestions } from "@/hooks/useFinancialData";
import { COMPLIANCE_NIVEL_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, MinusCircle, AlertTriangle, Info, ClipboardCheck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvaliacaoContaProps {
  entityId: string;
  fiscalYearId: string;
  year: number;
}

type QuestionStatus = "pending" | "conforme" | "nao_conforme" | "nao_aplicavel";

const STATUS_OPTIONS: { value: QuestionStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "conforme", label: "Conforme" },
  { value: "nao_conforme", label: "Não Conforme" },
  { value: "nao_aplicavel", label: "Não Aplicável" },
];

const CLASSIFICATION_LABELS: Record<string, { label: string; variant: string }> = {
  sem_gravidade: { label: "Sem Gravidade", variant: "secondary" },
  grave: { label: "Grave", variant: "destructive" },
  muito_grave: { label: "Muito Grave", variant: "destructive" },
};

export function AvaliacaoConta({ entityId, fiscalYearId, year }: AvaliacaoContaProps) {
  const [results, setResults] = useState<Record<string, QuestionStatus>>(() => {
    const initial: Record<string, QuestionStatus> = {};
    complianceQuestions.forEach((q) => {
      initial[q.id] = "pending";
    });
    return initial;
  });

  const updateStatus = (questionId: string, status: QuestionStatus) => {
    setResults((prev) => ({ ...prev, [questionId]: status }));
  };

  const stats = useMemo(() => {
    const evaluated = Object.values(results).filter((s) => s !== "pending");
    const applicable = Object.entries(results).filter(([, s]) => s !== "nao_aplicavel" && s !== "pending");
    const conformes = Object.values(results).filter((s) => s === "conforme").length;
    const naoConformes = Object.entries(results).filter(([, s]) => s === "nao_conforme");
    const total = complianceQuestions.length;
    const progressPercent = (evaluated.length / total) * 100;

    // Calculate weighted score for non-conformities
    let weightedScore = 0;
    naoConformes.forEach(([qId]) => {
      const q = complianceQuestions.find((cq) => cq.id === qId);
      if (q) weightedScore += q.score;
    });

    // Determine nivel
    let nivel: 1 | 2 | 3 = 1;
    const hasMuitoGrave = naoConformes.some(([qId]) => {
      const q = complianceQuestions.find((cq) => cq.id === qId);
      return q?.classification === "muito_grave";
    });
    const graveCount = naoConformes.filter(([qId]) => {
      const q = complianceQuestions.find((cq) => cq.id === qId);
      return q?.classification === "grave";
    }).length;

    if (hasMuitoGrave || graveCount >= 5 || weightedScore >= 15) {
      nivel = 3;
    } else if (graveCount >= 2 || weightedScore >= 6) {
      nivel = 2;
    }

    return {
      total,
      evaluated: evaluated.length,
      conformes,
      naoConformes: naoConformes.length,
      naoAplicaveis: Object.values(results).filter((s) => s === "nao_aplicavel").length,
      pending: Object.values(results).filter((s) => s === "pending").length,
      progressPercent,
      weightedScore,
      nivel,
    };
  }, [results]);

  const nivelInfo = COMPLIANCE_NIVEL_LABELS[stats.nivel];

  const getStatusIcon = (status: QuestionStatus) => {
    switch (status) {
      case "conforme":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "nao_conforme":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "nao_aplicavel":
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Progresso</p>
            <div className="flex items-center gap-3">
              <Progress value={stats.progressPercent} className="flex-1 h-2" />
              <span className="text-sm font-bold">{stats.evaluated}/{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Conformes</p>
            <p className="text-lg font-bold text-success">{stats.conformes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Não Conformes</p>
            <p className="text-lg font-bold text-destructive">{stats.naoConformes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Pontuação Ponderada</p>
            <p className="text-lg font-bold font-mono text-foreground">{stats.weightedScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Nível Final */}
      <Card className={cn(
        "border-2",
        stats.nivel === 1 ? "border-success/30 bg-success/5" :
        stats.nivel === 2 ? "border-warning/30 bg-warning/5" :
        "border-destructive/30 bg-destructive/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Scale className={cn(
                "h-6 w-6",
                stats.nivel === 1 ? "text-success" :
                stats.nivel === 2 ? "text-warning" :
                "text-destructive"
              )} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Nível {stats.nivel} — {nivelInfo.label}
                </p>
                <p className="text-xs text-muted-foreground max-w-lg">{nivelInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase">Classificação Automática</p>
              <Badge variant={stats.nivel === 1 ? "default" : stats.nivel === 2 ? "secondary" : "destructive"} className="mt-1">
                {nivelInfo.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">27 Questões de Conformidade — Modelo CC-3</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.pending > 0 ? `${stats.pending} questões pendentes` : "Avaliação completa"}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Questão</TableHead>
                <TableHead className="w-[120px]">Gravidade</TableHead>
                <TableHead className="w-[40px] text-center">Pts</TableHead>
                <TableHead className="w-[170px]">Classificação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceQuestions.map((q, idx) => {
                const status = results[q.id];
                const classInfo = CLASSIFICATION_LABELS[q.classification];
                return (
                  <TableRow
                    key={q.id}
                    className={cn(
                      status === "nao_conforme" && "bg-destructive/5",
                      status === "conforme" && "bg-success/5",
                      status === "nao_aplicavel" && "opacity-50"
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{q.question}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{q.norma}</span>
                          {q.responsabilidade && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{q.responsabilidade}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={q.classification === "muito_grave" ? "destructive" : q.classification === "grave" ? "outline" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          q.classification === "grave" && "border-destructive/50 text-destructive"
                        )}
                      >
                        {classInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold text-sm">
                      {q.score}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <Select value={status} onValueChange={(v) => updateStatus(q.id, v as QuestionStatus)}>
                          <SelectTrigger className="h-8 text-xs w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Critérios de Classificação Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([1, 2, 3] as const).map((n) => (
              <div
                key={n}
                className={cn(
                  "p-3 rounded-lg border",
                  n === stats.nivel ? "border-primary bg-primary/5" : "border-border bg-muted/20"
                )}
              >
                <p className={cn(
                  "text-sm font-semibold",
                  n === 1 ? "text-success" : n === 2 ? "text-warning" : "text-destructive"
                )}>
                  Nível {n} — {COMPLIANCE_NIVEL_LABELS[n].label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{COMPLIANCE_NIVEL_LABELS[n].description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
