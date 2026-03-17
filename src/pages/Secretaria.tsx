import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockFiscalYears, mockEntities, submissionChecklist, formatKz } from "@/data/mockData";
import { getDocumentRequirements } from "@/components/portal/EntidadeDocumentosTab";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle, XCircle, FileCheck, Stamp, Clock, AlertTriangle, Building2,
  FileText, Inbox, BarChart3, CalendarCheck, Eye, X, Undo2, ShieldCheck,
  TrendingUp, ArrowRight, Bell, Activity, PieChart,
} from "lucide-react";
import { toast } from "sonner";
import { exportActaRecepcaoPdf } from "@/lib/exportUtils";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { EntityProfilePanel } from "@/components/secretaria/EntityProfilePanel";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { SecretariaVistoTab } from "@/components/secretaria/SecretariaVistoTab";

const Secretaria = () => {
  const { recepcionar, rejeitar, submissions, getUploadedDocs } = useSubmissions();

  // Merge: mock "submetido" + dynamically submitted via Portal ("pendente" in SubmissionContext)
  const submetidos = useMemo(() => {
    // Start with mock data that has status "submetido"
    const fromMock = mockFiscalYears.filter((fy) => fy.status === "submetido");
    
    // Add fiscal years that were dynamically submitted via Portal
    const dynamicSubmissions = submissions.filter((s) => s.status === "pendente");
    const dynamicFys = dynamicSubmissions
      .map((s) => {
        // Find the fiscal year in mockData (it may have status "rascunho")
        const fy = mockFiscalYears.find(
          (f) => f.entityId === s.entityId && `${f.entityId}-${f.year}` === s.fiscalYearId
        );
        if (!fy) return null;
        // Don't duplicate if already in fromMock
        if (fromMock.some((m) => m.id === fy.id)) return null;
        return { ...fy, status: "submetido" as const, submittedAt: s.submittedAt || new Date().toISOString() };
      })
      .filter(Boolean) as typeof fromMock;

    return [...fromMock, ...dynamicFys];
  }, [submissions]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actasGeradas, setActasGeradas] = useState<string[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

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

  const handlePreviewPdf = async () => {
    const data = buildActaData();
    if (!data) return;
    const dataUri = await exportActaRecepcaoPdf(data, true);
    setPdfPreviewUrl(dataUri);
  };

  const handleConfirmRecepcao = async () => {
    const data = buildActaData();
    if (!data || !selectedFy || !selectedEntity) return;
    const { blob, fileName } = await exportActaRecepcaoPdf(data);
    setActasGeradas((prev) => [...prev, selectedFy.id]);

    // Upload acta PDF to storage
    const safeEntityName = selectedEntity.name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
    const filePath = `${selectedEntity.id}/${selectedFy.year}/${fileName}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("actas-recepcao")
        .upload(filePath, blob, { contentType: "application/pdf" });
      if (uploadError) console.error("Upload acta error:", uploadError);

      // Persist record
      const fiscalYearId = `${selectedFy.entityId}-${selectedFy.year}`;
      await supabase.from("actas_recepcao").insert({
        entity_id: selectedEntity.id,
        entity_name: selectedEntity.name,
        fiscal_year: String(selectedFy.year),
        fiscal_year_id: fiscalYearId,
        acta_numero: data.actaNumero,
        file_path: filePath,
        file_name: fileName,
      } as any);
    } catch (err) {
      console.error("Error persisting acta:", err);
    }

    // Update shared submission status to "recepcionado" with entity info for email
    const fiscalYearId = `${selectedFy.entityId}-${selectedFy.year}`;
    recepcionar(selectedFy.entityId, fiscalYearId, selectedEntity.name, `entidade@${selectedEntity.nif}.ao`);
    setConfirmDialogOpen(false);
    setSelectedId(null);
    setCheckedDocs({});
    toast.success(`Acta de recepção gerada e guardada — ${selectedFy.entityName} — ${selectedFy.year}`);
  };

  const handleConfirmRejeicao = () => {
    if (!selectedFy || !selectedEntity || !motivoRejeicao.trim()) return;
    const fiscalYearId = `${selectedFy.entityId}-${selectedFy.year}`;
    rejeitar(selectedFy.entityId, fiscalYearId, motivoRejeicao.trim(), selectedEntity.name, `entidade@${selectedEntity.nif}.ao`);
    setActasGeradas((prev) => [...prev, selectedFy.id]);
    setRejectDialogOpen(false);
    setMotivoRejeicao("");
    setSelectedId(null);
    setCheckedDocs({});
    toast.warning(`Submissão devolvida — ${selectedFy.entityName} — ${selectedFy.year}`);
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

  // Extra dashboard data
  const { notifications } = useSubmissions();
  const recentNotifications = notifications.slice(0, 5);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const totalEntidades = new Set(mockFiscalYears.map((fy) => fy.entityId)).size;
  const conformeCount = mockFiscalYears.filter((fy) => fy.status === "conforme").length;
  const naoConformeCount = mockFiscalYears.filter((fy) => fy.status === "nao_conforme").length;
  const rascunhoCount = mockFiscalYears.filter((fy) => fy.status === "rascunho").length;
  const comPedidosCount = mockFiscalYears.filter((fy) => fy.status === "com_pedidos").length;

  // Deadlines
  const deadlinesSoon = mockFiscalYears
    .filter((fy) => !["conforme", "nao_conforme"].includes(fy.status))
    .map((fy) => ({
      ...fy,
      daysLeft: Math.ceil((new Date(fy.deadline).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter((fy) => fy.daysLeft <= 30 && fy.daysLeft > -365)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // Status distribution for mini chart
  const statusDistribution = useMemo(() => {
    const counts = {
      rascunho: rascunhoCount,
      submetido: submetidos.length,
      em_analise: emAnalise,
      com_pedidos: comPedidosCount,
      conforme: conformeCount,
      nao_conforme: naoConformeCount,
    };
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return { counts, total };
  }, [rascunhoCount, submetidos.length, emAnalise, comPedidosCount, conformeCount, naoConformeCount]);

  const [activeMainTab, setActiveMainTab] = useState("dashboard");

  // Get uploaded docs for selected fiscal year
  const selectedUploadedDocs = useMemo(() => {
    if (!selectedFy) return [];
    const fiscalYearId = `${selectedFy.entityId}-${selectedFy.year}`;
    const fromContext = getUploadedDocs(selectedFy.entityId, fiscalYearId);
    // Mock data entries: assume all docs uploaded
    if (fromContext.length === 0 && mockFiscalYears.some(f => f.id === selectedFy.id && f.status === "submetido")) {
      return submissionChecklist.map(c => c.id);
    }
    return fromContext;
  }, [selectedFy, getUploadedDocs]);

  // Map EntidadeDocumentosTab doc IDs to submissionChecklist IDs
  const DOC_ID_MAP: Record<string, string> = {
    relatorio_gestao: "c1",
    balanco: "c2",
    dem_resultados: "c3",
    fluxo_caixa: "c4",
    balancete_analitico: "c5",
    parecer_fiscal: "c6",
    parecer_auditor: "c7",
    modelos: "c8",
    comprov_impostos: "c9",
    comprov_seguranca: "c10",
    inventario: "c11",
    acta_apreciacao: "c12",
    extractos: "c13",
    reconciliacoes: "c14",
    abates: "c15",
    emolumentos: "c16",
  };

  const isDocUploaded = (checklistId: string): boolean => {
    // Direct match (mock data uses checklist IDs)
    if (selectedUploadedDocs.includes(checklistId)) return true;
    // Match via mapping (portal uses doc IDs from EntidadeDocumentosTab)
    return Object.entries(DOC_ID_MAP).some(
      ([docId, cId]) => cId === checklistId && selectedUploadedDocs.includes(docId)
    );
  };

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
                const uploaded = isDocUploaded(item.id);
                return (
                  <TableRow
                    key={item.id}
                    className={
                      !uploaded
                        ? "bg-destructive/5 opacity-70"
                        : isChecked
                          ? "bg-green-50 dark:bg-green-950/10"
                          : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleDoc(item.id)}
                        disabled={!uploaded}
                      />
                    </TableCell>
                    <TableCell className={`text-sm ${!uploaded ? "text-muted-foreground line-through" : ""}`}>
                      {item.label}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.required ? (
                        <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!uploaded ? (
                        <span className="flex items-center justify-center gap-1 text-destructive text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Em Falta
                        </span>
                      ) : isChecked ? (
                        <span className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Verificado
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                          <Clock className="h-3.5 w-3.5" /> Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {uploaded ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={`Visualizar ${item.label}`}
                          onClick={handlePreviewPdf}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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
            variant="destructive"
            onClick={() => setRejectDialogOpen(true)}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Devolver
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
        title="Secretaria"
        description="Gestão de recepção de contas e processos de visto."
      />

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <Activity className="h-4 w-4" />
            Painel
          </TabsTrigger>
          <TabsTrigger value="contas" className="gap-2">
            <Inbox className="h-4 w-4" />
            Recepção de Contas
          </TabsTrigger>
          <TabsTrigger value="vistos" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Processos de Visto
          </TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD TAB ═══ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pendentes de Recepção"
              value={pendentesCount}
              subtitle="aguardam validação documental"
              icon={<Inbox className="h-5 w-5" />}
              variant={pendentesCount > 0 ? "warning" : "success"}
            />
            <StatCard
              title="Total Submetidos"
              value={totalSubmetidos}
              subtitle={`${submetidosEsteMes} este mês`}
              icon={<CalendarCheck className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="Em Análise (TCA)"
              value={emAnalise}
              subtitle="transitaram para técnico"
              icon={<BarChart3 className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Actas Emitidas"
              value={actasGeradas.length}
              subtitle="nesta sessão"
              icon={<Stamp className="h-5 w-5" />}
              variant="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Distribuição por Estado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Rascunho", count: statusDistribution.counts.rascunho, color: "bg-muted-foreground" },
                  { label: "Submetido", count: statusDistribution.counts.submetido, color: "bg-amber-500" },
                  { label: "Em Análise", count: statusDistribution.counts.em_analise, color: "bg-blue-500" },
                  { label: "Com Pedidos", count: statusDistribution.counts.com_pedidos, color: "bg-orange-500" },
                  { label: "Conforme", count: statusDistribution.counts.conforme, color: "bg-emerald-500" },
                  { label: "Não Conforme", count: statusDistribution.counts.nao_conforme, color: "bg-destructive" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${statusDistribution.total > 0 ? (item.count / statusDistribution.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                  <span>Total de processos</span>
                  <span className="font-bold text-foreground">{statusDistribution.total}</span>
                </div>
              </CardContent>
            </Card>

            {/* Deadlines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Prazos Próximos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deadlinesSoon.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem prazos próximos.</p>
                ) : (
                  deadlinesSoon.map((fy) => {
                    const isOverdue = fy.daysLeft < 0;
                    return (
                      <div
                        key={fy.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                          isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{fy.entityName}</p>
                          <p className="text-[10px] text-muted-foreground">Exercício {fy.year}</p>
                        </div>
                        <Badge
                          variant={isOverdue ? "destructive" : "secondary"}
                          className="text-[10px] shrink-0"
                        >
                          {isOverdue ? `${Math.abs(fy.daysLeft)}d atraso` : `${fy.daysLeft}d`}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Actividade Recente
                  </CardTitle>
                  {unreadNotifCount > 0 && (
                    <Badge variant="default" className="text-[10px]">
                      {unreadNotifCount} novas
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem actividade recente.</p>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs space-y-0.5 ${
                        !n.read ? "border-primary/30 bg-primary/5" : "border-border"
                      }`}
                    >
                      <p className="font-medium text-foreground line-clamp-1">{n.message}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {new Date(n.createdAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2 text-xs" onClick={() => setActiveMainTab("contas")}>
                  <Inbox className="h-4 w-4" />
                  Recepcionar Contas
                  {pendentesCount > 0 && (
                    <Badge variant="destructive" className="text-[9px] h-4 min-w-4 px-1">{pendentesCount}</Badge>
                  )}
                </Button>
                <Button variant="outline" className="gap-2 text-xs" onClick={() => setActiveMainTab("vistos")}>
                  <ShieldCheck className="h-4 w-4" />
                  Processos de Visto
                </Button>
                <Button variant="outline" className="gap-2 text-xs" asChild>
                  <a href="/actas-recepcao">
                    <Stamp className="h-4 w-4" />
                    Ver Actas de Recepção
                  </a>
                </Button>
                <Button variant="outline" className="gap-2 text-xs" asChild>
                  <a href="/entidades">
                    <Building2 className="h-4 w-4" />
                    Consultar Entidades
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ RECEPÇÃO DE CONTAS TAB ═══ */}
        <TabsContent value="contas" className="mt-6">
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

      {/* Dialog de Rejeição / Devolução */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Devolver Submissão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>A submissão será devolvida à entidade para correção. Indique o motivo da devolução.</p>
                {selectedFy && selectedEntity && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Entidade</span><span className="font-medium text-foreground">{selectedEntity.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Exercício</span><span className="font-medium text-foreground">{selectedFy.year}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Documentos verificados</span><span className="font-medium text-foreground">{checkedCount}/{submissionChecklist.length}</span></div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="motivo-rejeicao" className="text-sm font-medium text-foreground">
                    Motivo da devolução <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="motivo-rejeicao"
                    placeholder="Ex: Faltam os modelos de prestação de contas nº 1 a 10 e o inventário de bens patrimoniais..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{motivoRejeicao.length}/500</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotivoRejeicao("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRejeicao}
              disabled={!motivoRejeicao.trim()}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Undo2 className="h-4 w-4" />
              Confirmar Devolução
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        <TabsContent value="vistos" className="mt-6">
          <SecretariaVistoTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Secretaria;
