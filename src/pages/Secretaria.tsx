import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { mockFiscalYears, mockEntities, submissionChecklist, formatKz } from "@/data/mockData";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, FileCheck, Stamp, Clock, AlertTriangle, Building2, FileText, Inbox, BarChart3, CalendarCheck, Eye, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { exportActaRecepcaoPdf } from "@/lib/exportUtils";
import { EntityProfilePanel } from "@/components/secretaria/EntityProfilePanel";
import { useSubmissions } from "@/contexts/SubmissionContext";

const Secretaria = () => {
  const submetidos = mockFiscalYears.filter((fy) => fy.status === "submetido");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actasGeradas, setActasGeradas] = useState<string[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const { recepcionar } = useSubmissions();

  const selectedFy = submetidos.find((fy) => fy.id === selectedId);
  const selectedEntity = selectedFy ? mockEntities.find((e) => e.id === selectedFy.entityId) : null;

  const requiredItems = submissionChecklist.filter((c) => c.required);
  const allRequiredChecked = requiredItems.every((item) => checkedDocs[item.id]);
  const checkedCount = submissionChecklist.filter((item) => checkedDocs[item.id]).length;

  const handleSelectExercicio = (fyId: string) => {
    setSelectedId(fyId);
    setCheckedDocs({});
  };

  const handleToggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const now = new Date();
  const actaNumero = selectedFy
    ? `AR-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(submetidos.indexOf(selectedFy) + 1).padStart(3, "0")}`
    : "";

  const buildActaData = () => {
    if (!selectedFy || !selectedEntity) return null;
    return {
      actaNumero,
      entityName: selectedEntity.name,
      entityNif: selectedEntity.nif,
      entityTutela: selectedEntity.tutela,
      entityMorada: selectedEntity.morada,
      exercicioYear: selectedFy.year,
      periodoInicio: selectedFy.startDate,
      periodoFim: selectedFy.endDate,
      submittedAt: selectedFy.submittedAt || "",
      totalDebito: selectedFy.totalDebito,
      totalCredito: selectedFy.totalCredito,
      documentosVerificados: submissionChecklist.map((item) => ({
        label: item.label,
        required: item.required,
        checked: !!checkedDocs[item.id],
      })),
    };
  };

  const handlePreviewPdf = () => {
    const data = buildActaData();
    if (!data) return;
    const dataUri = exportActaRecepcaoPdf(data, true);
    setPdfPreviewUrl(dataUri);
  };

  const handleConfirmRecepcao = () => {
    const data = buildActaData();
    if (!data || !selectedFy) return;
    exportActaRecepcaoPdf(data);
    setActasGeradas((prev) => [...prev, selectedFy.id]);
    // Update shared submission status to "recepcionado"
    const fiscalYearId = `${selectedFy.entityId}-${selectedFy.year}`;
    recepcionar(selectedFy.entityId, fiscalYearId);
    setConfirmDialogOpen(false);
    setSelectedId(null);
    setCheckedDocs({});
    toast.success(`Acta de recepção gerada — ${selectedFy.entityName} — ${selectedFy.year}`);
  };

  // Dashboard stats
  const pendentesCount = submetidos.length - actasGeradas.length;
  const emAnalise = mockFiscalYears.filter((fy) => fy.status === "em_analise").length;
  const totalSubmetidos = mockFiscalYears.filter((fy) => ["submetido", "em_analise", "com_pedidos", "conforme", "nao_conforme"].includes(fy.status)).length;
  const hoje = new Date();
  const submetidosEsteMes = submetidos.filter((fy) => {
    if (!fy.submittedAt) return false;
    const d = new Date(fy.submittedAt);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  // ── Verificação Documental content (passed as children to tabs) ──
  const verificacaoContent = selectedFy && selectedEntity ? (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Verificação Documental (Resolução 1/17)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handlePreviewPdf}
              >
                <Eye className="h-3.5 w-3.5" />
                Visualizar PDF
              </Button>
              <Badge variant={allRequiredChecked ? "default" : "secondary"}>
                {checkedCount}/{submissionChecklist.length} verificados
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Confirme a existência de cada documento antes de emitir a acta de recepção.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">✓</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-center">Obrigatório</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionChecklist.map((item) => {
                const isChecked = !!checkedDocs[item.id];
                return (
                  <TableRow key={item.id} className={isChecked ? "bg-success/5" : ""}>
                    <TableCell>
                      <Checkbox checked={isChecked} onCheckedChange={() => handleToggleDoc(item.id)} />
                    </TableCell>
                    <TableCell className="text-sm">{item.label}</TableCell>
                    <TableCell className="text-center">
                      {item.required ? (
                        <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isChecked ? (
                        <span className="flex items-center justify-center gap-1 text-success text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Verificado
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                          <XCircle className="h-3.5 w-3.5" /> Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title={`Visualizar ${item.label}`}
                        onClick={handlePreviewPdf}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Acções */}
      <div className="flex items-center justify-between">
        {!allRequiredChecked ? (
          <p className="text-xs text-warning flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Todos os documentos obrigatórios devem ser verificados para emitir a acta.
          </p>
        ) : <div />}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSelectedId(null); setCheckedDocs({}); }}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handlePreviewPdf}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Visualizar PDF
          </Button>
          <Button
            disabled={!allRequiredChecked}
            onClick={() => setConfirmDialogOpen(true)}
            className="gap-2"
          >
            <Stamp className="h-4 w-4" />
            Confirmar e Gerar Acta
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <AppLayout>
      <PageHeader
        title="Secretaria — Recepção de Contas"
        description="Valide a documentação das prestações de contas submetidas e emita a acta de recepção."
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pendentes de Recepção" value={pendentesCount} subtitle="aguardam validação documental" icon={<Inbox className="h-5 w-5" />} variant={pendentesCount > 0 ? "warning" : "success"} />
        <StatCard title="Actas Emitidas" value={actasGeradas.length} subtitle="nesta sessão" icon={<Stamp className="h-5 w-5" />} variant="success" />
        <StatCard title="Em Análise (TCA)" value={emAnalise} subtitle="transitaram para análise" icon={<BarChart3 className="h-5 w-5" />} variant="primary" />
        <StatCard title="Recebidos Este Mês" value={submetidosEsteMes} subtitle={`de ${totalSubmetidos} total`} icon={<CalendarCheck className="h-5 w-5" />} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Lista de Exercícios Submetidos ── */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Pendentes de Recepção
              </CardTitle>
              <p className="text-xs text-muted-foreground">{submetidos.length - actasGeradas.length} exercício(s) aguardam validação documental</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {submetidos.filter((fy) => !actasGeradas.includes(fy.id)).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma conta pendente de recepção.</p>
                </div>
              ) : (
                submetidos.filter((fy) => !actasGeradas.includes(fy.id)).map((fy) => {
                  const entity = mockEntities.find((e) => e.id === fy.entityId);
                  return (
                    <button
                      key={fy.id}
                      onClick={() => handleSelectExercicio(fy.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedId === fy.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{fy.entityName}</p>
                          <p className="text-xs text-muted-foreground">Exercício {fy.year}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Submetido</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {entity?.tipologia === "empresa_publica" ? "Empresa Pública" : entity?.tipologia === "instituto_publico" ? "Instituto" : "Fundo"}
                        </span>
                        <span>Subm. {fy.submittedAt}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {actasGeradas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-success">
                  <Stamp className="h-4 w-4" />
                  Actas Geradas ({actasGeradas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {actasGeradas.map((fyId) => {
                  const fy = mockFiscalYears.find((f) => f.id === fyId);
                  if (!fy) return null;
                  return (
                    <div key={fyId} className="flex items-center justify-between p-2.5 rounded-lg bg-success/5 border border-success/20">
                      <div>
                        <p className="text-sm font-medium">{fy.entityName} — {fy.year}</p>
                        <p className="text-[10px] text-muted-foreground">Acta emitida em {now.toLocaleDateString("pt-AO")}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Painel de Perfil da Entidade (com abas) ── */}
        <div className="lg:col-span-2">
          {!selectedFy || !selectedEntity ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">Seleccione um exercício</p>
                <p className="text-sm">Escolha um exercício da lista para ver o perfil da entidade e validar a documentação.</p>
              </CardContent>
            </Card>
          ) : (
            <EntityProfilePanel entity={selectedEntity} fiscalYear={selectedFy}>
              {verificacaoContent}
            </EntityProfilePanel>
          )}
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" />
              Confirmar Emissão da Acta de Recepção
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Está prestes a confirmar a recepção formal da prestação de contas e gerar a respectiva acta.</p>
                {selectedFy && selectedEntity && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Acta Nº</span><span className="font-bold text-foreground font-mono">{actaNumero}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Entidade</span><span className="font-medium text-foreground">{selectedEntity.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">NIF</span><span className="font-medium text-foreground font-mono">{selectedEntity.nif}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Exercício</span><span className="font-medium text-foreground">{selectedFy.year}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Documentos verificados</span><span className="font-medium text-foreground">{checkedCount}/{submissionChecklist.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Data de recepção</span><span className="font-medium text-foreground">{now.toLocaleDateString("pt-AO")}</span></div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">A acta de recepção será registada na trilha de auditoria e o exercício transitará para o estado "Em Análise".</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRecepcao} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmar e Gerar Acta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Pré-visualização PDF inline */}
      <Dialog
        open={!!pdfPreviewUrl}
        onOpenChange={(open) => {
          if (!open) setPdfPreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              Pré-visualização — Acta de Recepção (Rascunho)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Pré-visualização da Acta de Recepção"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Secretaria;
