import { useState, useMemo } from "react";
import { EntityTipologia, TIPOLOGIA_RESOLUCAO, RESOLUCAO_LABELS } from "@/types";
import { PortalLayout } from "@/components/PortalLayout";
import { ActasRecepcaoList } from "@/components/ActasRecepcaoList";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { AnaliseFinanceira } from "@/components/AnaliseFinanceiraReadonly";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { FileSpreadsheet, CheckCircle, AlertTriangle, Send, Clock, FileText, Paperclip } from "lucide-react";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { toast } from "sonner";
import { EntidadeDocumentosTab, getDocumentRequirements } from "@/components/portal/EntidadeDocumentosTab";

const PortalPrestacaoContas = () => {
  const { entity } = usePortalEntity();
  const [periodo, setPeriodo] = useState("2024");

  return (
    <PortalLayout>
      <PageHeader
        title="Prestação de Contas"
        description="Submissão de documentos — Resolução Nº 1/17"
      />

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Entidade</Label>
              <p className="text-sm font-medium">{entity.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIF</Label>
              <p className="text-sm font-medium">{entity.nif}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Ex: 2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <EntidadeView
        periodo={periodo}
        entityName={entity.name}
        entityId={entity.id}
        entityTipologia={entity.tipologia}
        entityNif={entity.nif}
      />
    </PortalLayout>
  );
};

// ─── Status config ───
type SubmissionStatusType = "rascunho" | "pendente" | "recepcionado" | "rejeitado" | "em_analise";

const STATUS_CONFIG: Record<SubmissionStatusType, { label: string; color: string; icon: typeof Clock }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  pendente: { label: "Pendente — Aguarda Recepção pela Secretaria", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  recepcionado: { label: "Recepcionado — Acta de Recepção Emitida", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejeitado: { label: "Devolvido — Documentação Incompleta", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  em_analise: { label: "Em Análise — Processo remetido ao Técnico Validador", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: FileText },
};

function EntidadeView({
  periodo,
  entityName,
  entityId,
  entityTipologia,
  entityNif,
}: {
  periodo: string;
  entityName: string;
  entityId: string;
  entityTipologia: EntityTipologia;
  entityNif: string;
}) {
  const [entidadeTab, setEntidadeTab] = useState("balancete");
  const [docsCompliance, setDocsCompliance] = useState({ allDone: false, uploaded: 0, required: 0 });
  const { getStatus, submit } = useSubmissions();
  const { hasData } = useFinancialData();
  const fiscalYearId = `${entityId}-${periodo}`;
  const dataKey = `${entityId}-${periodo}`;
  const submissionStatus = getStatus(entityId, fiscalYearId);
  const balanceteCarregado = hasData(dataKey);

  const isSubmitted = submissionStatus !== "rascunho";
  const canResubmit = submissionStatus === "rejeitado";
  const StatusIcon = STATUS_CONFIG[submissionStatus].icon;

  const handleSubmit = () => {
    submit(entityId, fiscalYearId, entityName);
    toast.success("Prestação de contas submetida com sucesso! Aguarda recepção pela Secretaria.");
  };

  const statusMessages: Record<string, string> = {
    pendente: "A Secretaria do Tribunal irá verificar a documentação e emitir a Acta de Recepção.",
    recepcionado: "A Secretaria validou a documentação e emitiu a Acta de Recepção.",
    rejeitado: "A Secretaria devolveu a submissão. Corrija os documentos indicados e resubmeta.",
  };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {isSubmitted && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${STATUS_CONFIG[submissionStatus].color}`}>
          <StatusIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{STATUS_CONFIG[submissionStatus].label}</p>
            <p className="text-xs opacity-80">{statusMessages[submissionStatus] || ""}</p>
          </div>
          {canResubmit && (
            <button
              onClick={() => submit(entityId, fiscalYearId, entityName)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Resubmeter
            </button>
          )}
        </div>
      )}

      <Tabs value={entidadeTab} onValueChange={setEntidadeTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="balancete" className="text-xs gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Balancete
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: BALANCETE (uses shared AnaliseFinanceira) ─── */}
        <TabsContent value="balancete" className="space-y-4">
          <AnaliseFinanceira
            entityName={entityName}
            nif={entityNif}
            year={periodo}
            dataKey={dataKey}
            readOnly={isSubmitted && !canResubmit}
            hideTabs={["dre", "indicadores", "resumo"]}
          />
        </TabsContent>

        {/* ─── TAB 2: DOCUMENTOS ─── */}
        <TabsContent value="documentos" className="space-y-4">
          <EntidadeDocumentosTab
            disabled={isSubmitted && !canResubmit}
            tipologia={entityTipologia}
            onComplianceChange={(allDone, uploaded, required) => setDocsCompliance({ allDone, uploaded, required })}
          />
          <ActasRecepcaoList entityId={entityId} fiscalYear={periodo} />
        </TabsContent>
      </Tabs>

      {/* Validation warnings */}
      {(!isSubmitted || canResubmit) && (!balanceteCarregado || !docsCompliance.allDone) && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Submissão bloqueada — pendências detectadas</p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 list-disc list-inside">
              {!balanceteCarregado && <li>Balancete não carregado (tab "Balancete")</li>}
              {!docsCompliance.allDone && (
                <li>Documentos obrigatórios em falta: {docsCompliance.uploaded}/{docsCompliance.required} carregados (tab "Documentos")</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Submit button */}
      {(!isSubmitted || canResubmit) && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                className="gap-2"
                disabled={!balanceteCarregado || !docsCompliance.allDone}
              >
                <Send className="h-4 w-4" />
                Submeter Prestação de Contas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirmar Submissão
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Está prestes a submeter a prestação de contas ao Tribunal de Contas de Angola.
                      Após a submissão, o processo ficará <strong className="text-foreground">pendente</strong> até
                      a Secretaria do Tribunal verificar a documentação e emitir a Acta de Recepção.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entidade</span>
                        <span className="font-medium text-foreground">{entityName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Período</span>
                        <span className="font-medium text-foreground">{periodo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Documentos obrigatórios</span>
                        <span className="font-medium text-foreground">{docsCompliance.uploaded}/{docsCompliance.required}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao confirmar, declara que todos os dados e documentos apresentados são verdadeiros e completos,
                      nos termos da {RESOLUCAO_LABELS[TIPOLOGIA_RESOLUCAO[entityTipologia]].label} do Tribunal de Contas.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Submissão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export default PortalPrestacaoContas;
