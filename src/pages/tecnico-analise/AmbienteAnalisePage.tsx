import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatKz } from "@/lib/dataUtils";
import { exportIndicadoresPdf } from "@/lib/exportUtils";
import {
  ArrowLeft, FileSearch, FileText, FileSpreadsheet, FileImage,
  File, Eye, Download, Loader2,
  Send, RotateCcw, BarChart3, BookOpen,
  Scale, TrendingUp, ClipboardList, FileCheck, Paperclip, Plus, Trash2, Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  type BalancoLine,
  activoNaoCorrente, activoCorrentes, capitalProprioLines,
  passivoNaoCorrenteLines, passivoCorrenteLines, proveitosLines, custosLines,
  allCC3Sections, sumEditable, mapBalanceteToCC3,
} from "@/lib/cc3Structures";

// ─── Types ───
interface Processo {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
  ano_gerencia: number;
  categoria_entidade: string;
  data_submissao: string;
  estado: string;
  etapa_atual: number;
  completude_documental: number;
  divisao_competente: string | null;
  seccao_competente: string | null;
  coordenador_equipa: string | null;
  tecnico_analise: string | null;
  urgencia: string;
  observacoes: string | null;
}

interface DocItem {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
  created_at: string;
  observacoes: string | null;
  _source?: "processo" | "submission";
  _storageBucket?: string;
}

interface BalanceteLine {
  id: string;
  account_code: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// ─── Main Component ───
export default function AmbienteAnalisePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [balancete, setBalancete] = useState<BalanceteLine[]>([]);
  const [indicators, setIndicators] = useState<Record<string, number>>({});
  const [loadingBal, setLoadingBal] = useState(false);

  const [observacoes, setObservacoes] = useState("");
  const [parecerTipo, setParecerTipo] = useState("favoravel");
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"concluir" | "elementos" | null>(null);

  // Attachments for parecer
  const [parecerAnexos, setParecerAnexos] = useState<{ name: string; file: File }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  useEffect(() => { if (id) loadData(id); }, [id]);
  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // ─── Data Loading ───
  async function loadData(processoId: string) {
    setLoading(true);
    const { data: p } = await supabase.from("processos").select("*").eq("id", processoId).single();
    if (!p) { setLoading(false); return; }
    setProcesso(p as unknown as Processo);

    const { data: docs } = await supabase.from("processo_documentos").select("*").eq("processo_id", processoId).order("created_at");
    const processoDocs: DocItem[] = (docs || []).map((d: any) => ({ ...d, _source: "processo" as const, _storageBucket: "processo-documentos" }));

    const { data: fyData } = await supabase.from("fiscal_years").select("id").eq("entity_id", p.entity_id).eq("year", p.ano_gerencia).limit(1);
    const fyId = fyData?.[0]?.id;
    let submissionDocs: DocItem[] = [];
    if (fyId) {
      const { data: subDocs } = await supabase.from("submission_documents").select("*").eq("entity_id", p.entity_id).eq("fiscal_year_id", fyId).order("created_at");
      submissionDocs = (subDocs || []).map((sd: any) => ({
        id: sd.id,
        tipo_documento: sd.doc_category || sd.doc_label,
        nome_ficheiro: sd.file_name,
        caminho_ficheiro: sd.file_path,
        estado: "submetido",
        created_at: sd.created_at,
        observacoes: sd.doc_label,
        _source: "submission" as const,
        _storageBucket: "submission-documents",
      }));
    }
    setDocumentos([...processoDocs, ...submissionDocs]);
    loadFinancialData(p.entity_id, p.ano_gerencia);
    setLoading(false);
  }

  async function loadFinancialData(entityId: string, year: number) {
    setLoadingBal(true);
    // Try fiscal_years table first, then fallback to portal format "${entityId}-${year}"
    const { data: fyData } = await supabase.from("fiscal_years").select("id").eq("entity_id", entityId).eq("year", year).limit(1);
    const fyId = fyData?.[0]?.id;
    const portalFyId = `${entityId}-${year}`;
    
    // Try both fiscal_year_id formats
    const fyIds = fyId ? [fyId, portalFyId] : [portalFyId];
    const uniqueFyIds = [...new Set(fyIds)];
    
    let allTb: BalanceteLine[] = [];
    let allFi: any = null;
    
    for (const fid of uniqueFyIds) {
      if (allTb.length === 0) {
        const { data: tb } = await supabase.from("trial_balance").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fid).order("account_code");
        if (tb && tb.length > 0) allTb = tb as BalanceteLine[];
      }
      if (!allFi) {
        const { data: fi } = await supabase.from("financial_indicators").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fid).limit(1);
        if (fi?.[0]) allFi = fi[0];
      }
    }
    
    setBalancete(allTb);
    if (allFi) setIndicators(allFi as unknown as Record<string, number>);
    setLoadingBal(false);
  }

  // ─── Actions ───
  async function handleAction(tipo: "concluir" | "elementos") {
    if (!processo || !user) return;
    setActing(true);
    try {
      const nextEtapa = tipo === "concluir" ? 9 : 8;
      const nextEstado = tipo === "concluir" ? "em_validacao" : "aguardando_elementos";
      const evento = tipo === "concluir" ? "analise_concluida" : "falta_elementos";

      await avancarEtapaProcesso({
        processoId: processo.id,
        novaEtapa: nextEtapa,
        novoEstado: nextEstado,
        executadoPor: user.displayName,
        perfilExecutor: user.role || "Técnico de Análise",
        observacoes: observacoes || undefined,
      });

      await gerarAtividadesParaEvento(evento as any, processo.id, {
        categoriaEntidade: processo.categoria_entidade,
      });

      toast.success(
        tipo === "concluir"
          ? `Análise do processo ${processo.numero_processo} concluída e submetida.`
          : `Pedido de elementos adicionais enviado para ${processo.entity_name}.`
      );
      navigate(-1);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  }

  // ─── Document Handlers ───
  const handlePreview = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      const bucket = doc._storageBucket || "processo-documentos";
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.caminho_ficheiro, 600, { download: false });
      if (error || !data?.signedUrl) throw error;
      setPreviewUrl(data.signedUrl);
      setPreviewName(doc.nome_ficheiro);
    } catch { toast.error("Não foi possível abrir o documento."); }
  };

  const handleDownload = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      const bucket = doc._storageBucket || "processo-documentos";
      const { data, error } = await supabase.storage.from(bucket).download(doc.caminho_ficheiro);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = doc.nome_ficheiro; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error("Não foi possível descarregar."); }
  };

  // ─── Helpers ───
  const getDocIcon = (nome: string) => {
    const ext = nome.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-4 w-4 text-destructive" />;
    if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return <FileImage className="h-4 w-4 text-sky-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === "validado") return <Badge variant="default" className="bg-primary text-[10px]">Validado</Badge>;
    if (estado === "rejeitado") return <Badge variant="destructive" className="text-[10px]">Rejeitado</Badge>;
    if (estado === "submetido") return <Badge className="bg-sky-600 text-[10px] text-primary-foreground">Submetido</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Pendente</Badge>;
  };

  // ─── Map balancete to CC3 structure ───
  const cc3Data = useMemo(() => mapBalanceteToCC3(balancete), [balancete]);

  const totalAtivoNaoCorrente = sumEditable(activoNaoCorrente, cc3Data.ativNaoCorr);
  const totalAtivoCorrentes = sumEditable(activoCorrentes, cc3Data.ativCorr);
  const totalActivo = totalAtivoNaoCorrente + totalAtivoCorrentes;
  const totalCapProprio = sumEditable(capitalProprioLines, cc3Data.capProprio);
  const totalPassNaoCorrente = sumEditable(passivoNaoCorrenteLines, cc3Data.passNaoCorr);
  const totalPassCorrente = sumEditable(passivoCorrenteLines, cc3Data.passCorr);
  const totalPassivo = totalPassNaoCorrente + totalPassCorrente;
  const totalCapPassivo = totalCapProprio + totalPassivo;
  const totalProveitos = sumEditable(proveitosLines, cc3Data.proveitos);
  const totalCustos = sumEditable(custosLines, cc3Data.custos);
  const resultadoExercicio = totalProveitos - totalCustos;

  // Indicadores from DB or computed
  const indicadorRows = useMemo(() => {
    const i = indicators;
    const hasDbIndicators = i && Object.keys(i).length > 0 && Object.values(i).some(v => typeof v === 'number' && v !== 0);
    
    if (hasDbIndicators) {
      return [
        { label: "Activo Total", value: Number(i.activo_total) || 0, fmt: "kz" as const },
        { label: "Capital Próprio", value: Number(i.capital_proprio) || 0, fmt: "kz" as const },
        { label: "Passivo Total", value: Number(i.passivo_total) || 0, fmt: "kz" as const },
        { label: "Resultado Líquido", value: Number(i.resultado_liquido) || 0, fmt: "kz" as const },
        { label: "Proveitos Operacionais", value: Number(i.proveitos_operacionais) || 0, fmt: "kz" as const },
        { label: "Custos Operacionais", value: Number(i.custos_operacionais) || 0, fmt: "kz" as const },
        { label: "Liquidez Corrente", value: Number(i.liquidez_corrente) || 0 },
        { label: "Liquidez Geral", value: Number(i.liquidez_geral) || 0 },
        { label: "ROE", value: Number(i.roe) || 0, fmt: "pct" as const },
        { label: "ROA", value: Number(i.roa) || 0, fmt: "pct" as const },
        { label: "Endividamento Geral", value: Number(i.endividamento_geral) || 0, fmt: "pct" as const },
        { label: "Margem Líquida", value: Number(i.margem_liquida) || 0, fmt: "pct" as const },
      ];
    }

    // Compute from CC3 data
    if (totalActivo === 0 && totalProveitos === 0) return [];

    const liqCorrente = totalPassCorrente !== 0 ? totalAtivoCorrentes / totalPassCorrente : 0;
    const liqGeral = totalPassivo !== 0 ? totalActivo / totalPassivo : 0;
    const roe = totalCapProprio !== 0 ? resultadoExercicio / totalCapProprio : 0;
    const roa = totalActivo !== 0 ? resultadoExercicio / totalActivo : 0;
    const endiv = totalActivo !== 0 ? totalPassivo / totalActivo : 0;
    const margem = totalProveitos !== 0 ? resultadoExercicio / totalProveitos : 0;

    return [
      { label: "Activo Total", value: totalActivo, fmt: "kz" as const },
      { label: "Capital Próprio", value: totalCapProprio, fmt: "kz" as const },
      { label: "Passivo Total", value: totalPassivo, fmt: "kz" as const },
      { label: "Resultado Líquido", value: resultadoExercicio, fmt: "kz" as const },
      { label: "Proveitos", value: totalProveitos, fmt: "kz" as const },
      { label: "Custos", value: totalCustos, fmt: "kz" as const },
      { label: "Liquidez Corrente", value: liqCorrente },
      { label: "Liquidez Geral", value: liqGeral },
      { label: "ROE", value: roe, fmt: "pct" as const },
      { label: "ROA", value: roa, fmt: "pct" as const },
      { label: "Endividamento Geral", value: endiv, fmt: "pct" as const },
      { label: "Margem Líquida", value: margem, fmt: "pct" as const },
    ];
  }, [indicators, totalActivo, totalCapProprio, totalPassivo, totalProveitos, totalCustos, resultadoExercicio, totalAtivoCorrentes, totalPassCorrente]);

  const fmtIndicator = (row: { value: number; fmt?: string }) => {
    if (row.fmt === "kz") return `${formatKz(row.value)} Kz`;
    if (row.fmt === "pct") return `${(row.value * 100).toFixed(1)}%`;
    return row.value.toFixed(2);
  };

  // Separate docs by source
  const submissionDocs = documentos.filter(d => d._source === "submission");
  const processoDocs = documentos.filter(d => d._source !== "submission");

  const totalDebit = balancete.reduce((s, l) => s + l.debit, 0);
  const totalCredit = balancete.reduce((s, l) => s + l.credit, 0);

  // ─── Render ───
  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!processo) {
    return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Processo não encontrado.</p><Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Análise Técnica — {processo.numero_processo}
              </h1>
              <p className="text-sm text-muted-foreground">{processo.entity_name} · Exercício {processo.ano_gerencia}</p>
            </div>
          </div>
          <Badge variant={processo.urgencia === "urgente" ? "destructive" : processo.urgencia === "alta" ? "default" : "secondary"}>
            {processo.urgencia}
          </Badge>
        </div>

        {/* Process summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">Entidade</span><p className="font-medium">{processo.entity_name}</p></div>
              <div><span className="text-muted-foreground text-xs">Exercício</span><p className="font-medium">{processo.ano_gerencia}</p></div>
              <div><span className="text-muted-foreground text-xs">Categoria</span><Badge variant="outline" className="text-[10px]">{processo.categoria_entidade.replace(/_/g, " ")}</Badge></div>
              <div><span className="text-muted-foreground text-xs">Divisão</span><p className="font-medium">{processo.divisao_competente || "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Técnico</span><p className="font-medium">{processo.tecnico_analise || "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Completude</span><p className="font-medium">{processo.completude_documental}%</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Main tabs */}
        <Tabs defaultValue="documentos" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="documentos" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> Documentos</TabsTrigger>
            <TabsTrigger value="balanco" className="gap-1 text-xs"><Scale className="h-3.5 w-3.5" /> Balanço (CC-2)</TabsTrigger>
            <TabsTrigger value="dr" className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5" /> Dem. Resultados</TabsTrigger>
            <TabsTrigger value="indicadores" className="gap-1 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Indicadores</TabsTrigger>
            <TabsTrigger value="resumo" className="gap-1 text-xs"><ClipboardList className="h-3.5 w-3.5" /> Resumo</TabsTrigger>
            <TabsTrigger value="parecer" className="gap-1 text-xs"><FileCheck className="h-3.5 w-3.5" /> Parecer</TabsTrigger>
          </TabsList>

          {/* ── Tab: Documentos ── */}
          <TabsContent value="documentos">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Documentos Submetidos pela Entidade ({submissionDocs.length})
                  </CardTitle>
                  <CardDescription>Documentos da prestação de contas carregados pela entidade no portal.</CardDescription>
                </CardHeader>
                <CardContent>
                  {submissionDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento submetido pela entidade.</p>
                  ) : (
                    <DocTable docs={submissionDocs} getDocIcon={getDocIcon} getEstadoBadge={getEstadoBadge} onPreview={handlePreview} onDownload={handleDownload} />
                  )}
                </CardContent>
              </Card>

              {processoDocs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Documentos do Processo ({processoDocs.length})
                    </CardTitle>
                    <CardDescription>Documentos gerados pelo sistema durante a tramitação.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocTable docs={processoDocs} getDocIcon={getDocIcon} getEstadoBadge={getEstadoBadge} onPreview={handlePreview} onDownload={handleDownload} />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Balanço Patrimonial — Modelo CC-2 ── */}
          <TabsContent value="balanco">
            {loadingBal ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : balancete.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum dado de balancete encontrado para este exercício.</p>
                <p className="text-xs text-muted-foreground">Os dados do Modelo CC-2 serão preenchidos automaticamente quando a entidade submeter o balancete analítico.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* CC-2 Auto-fill banner */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Scale className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Análise de Contas — Modelo CC-2 <Badge variant="outline" className="text-[10px] ml-2">Preenchimento Automático</Badge></p>
                    <p className="text-xs text-muted-foreground">Dados carregados automaticamente a partir do balancete analítico submetido pela entidade ({balancete.length} contas PGC mapeadas).</p>
                  </div>
                </div>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryCard label="Total Activo" value={`${formatKz(totalActivo)} Kz`} sub={`Não Corrente: ${formatKz(totalAtivoNaoCorrente)} Kz`} />
                  <SummaryCard label="Capital Próprio" value={`${formatKz(totalCapProprio)} Kz`} sub={`${totalActivo ? ((totalCapProprio / totalActivo) * 100).toFixed(1) : 0}% do activo`} />
                  <SummaryCard label="Total Passivo" value={`${formatKz(totalPassivo)} Kz`} sub={`Corrente: ${formatKz(totalPassCorrente)} Kz`} />
                  <SummaryCard label="Equilíbrio" value={`${formatKz(totalCapPassivo)} Kz`} sub={Math.abs(totalActivo - totalCapPassivo) < 1 ? "✓ Equilibrado" : "⚠ Desequilíbrio"} />
                </div>

                {/* Activo */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">ACTIVO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ReadOnlyCC3Table lines={activoNaoCorrente} values={cc3Data.ativNaoCorr} sectionTitle="Activo Não Corrente" />
                    <ReadOnlyCC3Table lines={activoCorrentes} values={cc3Data.ativCorr} sectionTitle="Activo Corrente" />
                    <div className="border-t pt-2 flex justify-between items-center px-2">
                      <span className="text-sm font-bold">TOTAL DO ACTIVO</span>
                      <span className="font-mono text-sm font-bold">{formatKz(totalActivo)} Kz</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Capital Próprio + Passivo */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CAPITAL PRÓPRIO E PASSIVO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ReadOnlyCC3Table lines={capitalProprioLines} values={cc3Data.capProprio} sectionTitle="Capital Próprio" />
                    <ReadOnlyCC3Table lines={passivoNaoCorrenteLines} values={cc3Data.passNaoCorr} sectionTitle="Passivo Não Corrente" />
                    <ReadOnlyCC3Table lines={passivoCorrenteLines} values={cc3Data.passCorr} sectionTitle="Passivo Corrente" />
                    <div className="border-t pt-2 flex justify-between items-center px-2">
                      <span className="text-sm font-bold">TOTAL CAPITAL PRÓPRIO + PASSIVO</span>
                      <span className="font-mono text-sm font-bold">{formatKz(totalCapPassivo)} Kz</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw balancete */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Balancete Analítico (Dados Brutos)</CardTitle>
                    <CardDescription>{balancete.length} contas carregadas pela entidade.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead className="text-xs font-mono w-24">Conta</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                            <TableHead className="text-xs text-right">Débito</TableHead>
                            <TableHead className="text-xs text-right">Crédito</TableHead>
                            <TableHead className="text-xs text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balancete.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell className="text-xs font-mono">{line.account_code}</TableCell>
                              <TableCell className="text-xs">{line.description}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{formatKz(line.debit)}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{formatKz(line.credit)}</TableCell>
                              <TableCell className="text-xs text-right font-mono font-semibold">{formatKz(line.balance)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell colSpan={2} className="text-xs">TOTAIS</TableCell>
                            <TableCell className="text-xs text-right font-mono">{formatKz(totalDebit)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{formatKz(totalCredit)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{formatKz(totalDebit - totalCredit)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Demonstração de Resultados ── */}
          <TabsContent value="dr">
            {balancete.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sem dados de balancete para gerar a demonstração de resultados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* CC-2 DRE banner */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Demonstração de Resultados — Modelo CC-2 <Badge variant="outline" className="text-[10px] ml-2">Preenchimento Automático</Badge></p>
                    <p className="text-xs text-muted-foreground">Proveitos (Classe 6) e Custos (Classe 7) extraídos automaticamente do balancete da entidade.</p>
                  </div>
                </div>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryCard label="Total Proveitos" value={`${formatKz(totalProveitos)} Kz`} sub="Classe 6 PGC" />
                  <SummaryCard label="Total Custos" value={`${formatKz(totalCustos)} Kz`} sub="Classe 7 PGC" />
                  <SummaryCard label="Resultado do Exercício" value={`${formatKz(resultadoExercicio)} Kz`} sub={resultadoExercicio >= 0 ? "Positivo" : "Negativo"} />
                  <SummaryCard label="Margem" value={totalProveitos > 0 ? `${((resultadoExercicio / totalProveitos) * 100).toFixed(1)}%` : "—"} sub="Resultado / Proveitos" />
                </div>

                {/* Proveitos detail */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Proveitos e Ganhos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReadOnlyCC3Table lines={proveitosLines} values={cc3Data.proveitos} sectionTitle="Proveitos" />
                  </CardContent>
                </Card>

                {/* Custos detail */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      Custos e Perdas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReadOnlyCC3Table lines={custosLines} values={cc3Data.custos} sectionTitle="Custos" />
                  </CardContent>
                </Card>

                {/* Result summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableBody>
                          <DRRow label="Total de Proveitos e Ganhos" value={totalProveitos} bold />
                          <DRRow label="Total de Custos e Perdas" value={-totalCustos} bold />
                          <DRRow label="RESULTADO LÍQUIDO DO EXERCÍCIO" value={resultadoExercicio} bold highlight />
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Indicadores Financeiros ── */}
          <TabsContent value="indicadores">
            <div className="space-y-4">
              {/* Banner */}
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Indicadores Financeiros — Exercício {processo.ano_gerencia} <Badge variant="outline" className="text-[10px] ml-2">Cálculo Automático</Badge></p>
                  <p className="text-xs text-muted-foreground">Rácios calculados automaticamente a partir dos dados do Modelo CC-2 submetidos pela entidade.</p>
                </div>
              </div>

              {balancete.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Sem dados do CC-2 para calcular indicadores.</p>
                </div>
              ) : (
                <>
                  {/* ── Gráficos Visuais ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pie: Composição do Activo */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Composição do Activo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Não Corrente", value: Math.abs(totalAtivoNaoCorrente) },
                                { name: "Corrente", value: Math.abs(totalAtivoCorrentes) },
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                              paddingAngle={3} dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              <Cell fill="hsl(var(--primary))" />
                              <Cell fill="hsl(var(--primary) / 0.5)" />
                            </Pie>
                            <Tooltip formatter={(v: number) => formatKz(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Pie: Estrutura de Financiamento */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Estrutura de Financiamento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Capital Próprio", value: Math.abs(totalCapProprio) },
                                { name: "Passivo NC", value: Math.abs(totalPassNaoCorrente) },
                                { name: "Passivo Corrente", value: Math.abs(totalPassCorrente) },
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                              paddingAngle={3} dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              <Cell fill="hsl(var(--primary))" />
                              <Cell fill="hsl(var(--accent))" />
                              <Cell fill="hsl(var(--destructive))" />
                            </Pie>
                            <Tooltip formatter={(v: number) => formatKz(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estrutura Patrimonial cards */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Estrutura Patrimonial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <IndicadorCard label="Activo Total" value={formatKz(totalActivo)} sub="Não Corrente + Corrente" />
                        <IndicadorCard label="Activo Não Corrente" value={formatKz(totalAtivoNaoCorrente)} sub={totalActivo ? `${((totalAtivoNaoCorrente / totalActivo) * 100).toFixed(1)}% do activo` : "—"} />
                        <IndicadorCard label="Activo Corrente" value={formatKz(totalAtivoCorrentes)} sub={totalActivo ? `${((totalAtivoCorrentes / totalActivo) * 100).toFixed(1)}% do activo` : "—"} />
                        <IndicadorCard label="Capital Próprio" value={formatKz(totalCapProprio)} sub={totalActivo ? `${((totalCapProprio / totalActivo) * 100).toFixed(1)}% do activo` : "—"} />
                        <IndicadorCard label="Passivo Não Corrente" value={formatKz(totalPassNaoCorrente)} sub={totalPassivo ? `${((totalPassNaoCorrente / totalPassivo) * 100).toFixed(1)}% do passivo` : "—"} />
                        <IndicadorCard label="Passivo Corrente" value={formatKz(totalPassCorrente)} sub={totalPassivo ? `${((totalPassCorrente / totalPassivo) * 100).toFixed(1)}% do passivo` : "—"} />
                        <IndicadorCard label="Passivo Total" value={formatKz(totalPassivo)} sub="Não Corrente + Corrente" />
                        <IndicadorCard 
                          label="Equilíbrio Patrimonial" 
                          value={Math.abs(totalActivo - totalCapPassivo) < 1 ? "✓ Equilibrado" : `Δ ${formatKz(Math.abs(totalActivo - totalCapPassivo))}`}
                          sub={Math.abs(totalActivo - totalCapPassivo) < 1 ? "Activo = Cap. Próprio + Passivo" : "⚠ Desequilíbrio detectado"}
                          alert={Math.abs(totalActivo - totalCapPassivo) >= 1}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bar chart: Proveitos vs Custos */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Proveitos vs Custos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={[
                          { name: "Proveitos", valor: totalProveitos },
                          { name: "Custos", valor: totalCustos },
                          { name: "Resultado", valor: resultadoExercicio },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                          <Tooltip formatter={(v: number) => formatKz(v)} />
                          <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="hsl(var(--destructive))" />
                            <Cell fill={resultadoExercicio >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Resultados cards */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Resultados do Exercício</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <IndicadorCard label="Total Proveitos" value={formatKz(totalProveitos)} sub="Ganhos operacionais e outros" />
                        <IndicadorCard label="Total Custos" value={formatKz(totalCustos)} sub="Perdas operacionais e outros" />
                        <IndicadorCard 
                          label="Resultado Líquido" 
                          value={formatKz(resultadoExercicio)} 
                          sub={resultadoExercicio >= 0 ? "Resultado positivo" : "Resultado negativo"}
                          alert={resultadoExercicio < 0}
                          positive={resultadoExercicio > 0}
                        />
                        <IndicadorCard 
                          label="Margem Líquida" 
                          value={totalProveitos > 0 ? `${((resultadoExercicio / totalProveitos) * 100).toFixed(2)}%` : "—"} 
                          sub="Resultado / Proveitos"
                          alert={totalProveitos > 0 && resultadoExercicio / totalProveitos < 0}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Radar: Rácios Financeiros */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Radar de Rácios Financeiros</CardTitle>
                      <CardDescription>Visão geral dos principais rácios (valores normalizados 0–100).</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <RadarChart data={(() => {
                          const liqCorr = totalPassCorrente > 0 ? totalAtivoCorrentes / totalPassCorrente : 0;
                          const liqGeral = totalPassivo > 0 ? totalActivo / totalPassivo : 0;
                          const roe = totalCapProprio !== 0 ? (resultadoExercicio / totalCapProprio) : 0;
                          const roa = totalActivo !== 0 ? (resultadoExercicio / totalActivo) : 0;
                          const autoFin = totalActivo !== 0 ? totalCapProprio / totalActivo : 0;
                          const solvab = totalPassivo !== 0 ? totalCapProprio / totalPassivo : 0;
                          // Normalize to 0-100 scale
                          return [
                            { subject: "Liq. Corrente", value: Math.min(liqCorr * 50, 100), full: 100 },
                            { subject: "Liq. Geral", value: Math.min(liqGeral * 50, 100), full: 100 },
                            { subject: "ROE", value: Math.min(Math.max(roe * 500 + 50, 0), 100), full: 100 },
                            { subject: "ROA", value: Math.min(Math.max(roa * 1000 + 50, 0), 100), full: 100 },
                            { subject: "Aut. Financeira", value: Math.min(autoFin * 100, 100), full: 100 },
                            { subject: "Solvabilidade", value: Math.min(solvab * 50, 100), full: 100 },
                          ];
                        })()}>
                          <PolarGrid className="stroke-muted" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar name="Rácios" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Rácios de Liquidez */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rácios de Liquidez</CardTitle>
                      <CardDescription>Capacidade de cumprir obrigações de curto prazo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <IndicadorCard 
                          label="Liquidez Corrente" 
                          value={totalPassCorrente > 0 ? (totalAtivoCorrentes / totalPassCorrente).toFixed(2) : "—"} 
                          sub="Activo Corrente / Passivo Corrente"
                          alert={totalPassCorrente > 0 && totalAtivoCorrentes / totalPassCorrente < 1}
                          positive={totalPassCorrente > 0 && totalAtivoCorrentes / totalPassCorrente >= 1.5}
                        />
                        <IndicadorCard 
                          label="Liquidez Geral" 
                          value={totalPassivo > 0 ? (totalActivo / totalPassivo).toFixed(2) : "—"} 
                          sub="Activo Total / Passivo Total"
                          alert={totalPassivo > 0 && totalActivo / totalPassivo < 1}
                          positive={totalPassivo > 0 && totalActivo / totalPassivo >= 1.5}
                        />
                        <IndicadorCard 
                          label="Fundo de Maneio" 
                          value={formatKz(totalAtivoCorrentes - totalPassCorrente)} 
                          sub={totalAtivoCorrentes - totalPassCorrente >= 0 ? "Positivo — boa capacidade" : "Negativo — risco de liquidez"}
                          alert={totalAtivoCorrentes - totalPassCorrente < 0}
                          positive={totalAtivoCorrentes - totalPassCorrente > 0}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rácios de Rentabilidade */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rácios de Rentabilidade</CardTitle>
                      <CardDescription>Eficiência na geração de resultados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <IndicadorCard 
                          label="ROE — Rent. Cap. Próprio" 
                          value={totalCapProprio !== 0 ? `${((resultadoExercicio / totalCapProprio) * 100).toFixed(2)}%` : "—"} 
                          sub="Resultado / Capital Próprio"
                          alert={totalCapProprio !== 0 && resultadoExercicio / totalCapProprio < 0}
                          positive={totalCapProprio !== 0 && resultadoExercicio / totalCapProprio > 0.05}
                        />
                        <IndicadorCard 
                          label="ROA — Rent. do Activo" 
                          value={totalActivo !== 0 ? `${((resultadoExercicio / totalActivo) * 100).toFixed(2)}%` : "—"} 
                          sub="Resultado / Activo Total"
                          alert={totalActivo !== 0 && resultadoExercicio / totalActivo < 0}
                          positive={totalActivo !== 0 && resultadoExercicio / totalActivo > 0.03}
                        />
                        <IndicadorCard 
                          label="Giro do Activo" 
                          value={totalActivo !== 0 ? (totalProveitos / totalActivo).toFixed(2) : "—"} 
                          sub="Proveitos / Activo Total"
                        />
                        <IndicadorCard 
                          label="Margem Operacional" 
                          value={totalProveitos > 0 ? `${(((totalProveitos - totalCustos) / totalProveitos) * 100).toFixed(2)}%` : "—"} 
                          sub="(Proveitos - Custos) / Proveitos"
                          alert={totalProveitos > 0 && (totalProveitos - totalCustos) / totalProveitos < 0}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rácios de Endividamento */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rácios de Endividamento</CardTitle>
                      <CardDescription>Estrutura de financiamento e alavancagem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <IndicadorCard 
                          label="Endividamento Geral" 
                          value={totalActivo !== 0 ? `${((totalPassivo / totalActivo) * 100).toFixed(2)}%` : "—"} 
                          sub="Passivo / Activo Total"
                          alert={totalActivo !== 0 && totalPassivo / totalActivo > 0.7}
                        />
                        <IndicadorCard 
                          label="Autonomia Financeira" 
                          value={totalActivo !== 0 ? `${((totalCapProprio / totalActivo) * 100).toFixed(2)}%` : "—"} 
                          sub="Capital Próprio / Activo Total"
                          positive={totalActivo !== 0 && totalCapProprio / totalActivo > 0.3}
                          alert={totalActivo !== 0 && totalCapProprio / totalActivo < 0.2}
                        />
                        <IndicadorCard 
                          label="Solvabilidade" 
                          value={totalPassivo !== 0 ? `${((totalCapProprio / totalPassivo) * 100).toFixed(2)}%` : "—"} 
                          sub="Capital Próprio / Passivo Total"
                          positive={totalPassivo !== 0 && totalCapProprio / totalPassivo > 0.5}
                          alert={totalPassivo !== 0 && totalCapProprio / totalPassivo < 0.25}
                        />
                        <IndicadorCard 
                          label="Composição Endivid." 
                          value={totalPassivo !== 0 ? `${((totalPassCorrente / totalPassivo) * 100).toFixed(2)}%` : "—"} 
                          sub="Passivo Corrente / Passivo Total"
                          alert={totalPassivo !== 0 && totalPassCorrente / totalPassivo > 0.8}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Resumo ── */}
          <TabsContent value="resumo">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Resumo da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Total Documentos" value={String(documentos.length)} sub={`${submissionDocs.length} da entidade · ${processoDocs.length} do processo`} />
                    <SummaryCard label="Completude" value={`${processo.completude_documental}%`} sub={processo.completude_documental >= 100 ? "Completo" : "Incompleto"} />
                    <SummaryCard label="Resultado Líquido" value={`${formatKz(resultadoExercicio)} Kz`} sub={resultadoExercicio >= 0 ? "Positivo" : "Negativo"} />
                    <SummaryCard label="Total Activo" value={`${formatKz(totalActivo)} Kz`} sub="Balanço Patrimonial" />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <InfoTableRow label="Nº Processo" value={processo.numero_processo} />
                        <InfoTableRow label="Entidade" value={processo.entity_name} />
                        <InfoTableRow label="Exercício" value={String(processo.ano_gerencia)} />
                        <InfoTableRow label="Categoria" value={processo.categoria_entidade.replace(/_/g, " ")} />
                        <InfoTableRow label="Divisão" value={processo.divisao_competente || "—"} />
                        <InfoTableRow label="Técnico" value={processo.tecnico_analise || "—"} />
                        <InfoTableRow label="Data de Submissão" value={new Date(processo.data_submissao).toLocaleDateString("pt-AO")} />
                        <InfoTableRow label="Estado" value={processo.estado.replace(/_/g, " ")} />
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Síntese Financeira</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">Total Activo</span><p className="font-mono font-medium">{formatKz(totalActivo)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Capital Próprio</span><p className="font-mono font-medium">{formatKz(totalCapProprio)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Total Passivo</span><p className="font-mono font-medium">{formatKz(totalPassivo)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Proveitos</span><p className="font-mono font-medium">{formatKz(totalProveitos)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Custos</span><p className="font-mono font-medium">{formatKz(totalCustos)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Resultado Líquido</span><p className={`font-mono font-bold ${resultadoExercicio >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatKz(resultadoExercicio)} Kz</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Parecer ── */}
          <TabsContent value="parecer">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Emissão de Parecer Técnico
                </CardTitle>
                <CardDescription>Conclua a análise emitindo parecer ou solicite elementos adicionais à entidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Tipo de Parecer</Label>
                    <Select value={parecerTipo} onValueChange={setParecerTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="favoravel">Favorável</SelectItem>
                        <SelectItem value="favoravel_reservas">Favorável com Reservas</SelectItem>
                        <SelectItem value="desfavoravel">Desfavorável</SelectItem>
                        <SelectItem value="impossibilidade">Impossibilidade de Pronunciar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Observações / Fundamentação do Parecer</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva as conclusões da análise, pontos de atenção, irregularidades detectadas, fundamentação legal..."
                    rows={6}
                  />
                </div>

                {/* Anexos do Parecer */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Anexos do Parecer
                  </Label>
                  
                  {parecerAnexos.length > 0 && (
                    <div className="space-y-2">
                      {parecerAnexos.map((anexo, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                          <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{anexo.name}</span>
                          <span className="text-xs text-muted-foreground">{(anexo.file.size / 1024).toFixed(0)} KB</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setParecerAnexos(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label htmlFor="parecer-anexo-input">
                      <div className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Adicionar anexo</span>
                      </div>
                    </label>
                    <input
                      id="parecer-anexo-input"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          const newAnexos = Array.from(files).map(f => ({ name: f.name, file: f }));
                          setParecerAnexos(prev => [...prev, ...newAnexos]);
                        }
                        e.target.value = "";
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, Excel, Word, imagens ou ZIP (máx. 20MB por ficheiro)</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" className="gap-2" onClick={() => setConfirmAction("elementos")}>
                    <RotateCcw className="h-4 w-4" /> Solicitar Elementos
                  </Button>
                  <Button className="gap-2" onClick={() => setConfirmAction("concluir")}>
                    <Send className="h-4 w-4" /> Concluir Análise e Submeter Parecer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirm dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === "concluir" ? "Concluir Análise e Emitir Parecer?" : "Solicitar Elementos Adicionais?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === "concluir"
                  ? `O parecer técnico (${parecerTipo.replace(/_/g, " ")}) será submetido para validação superior. Processo: ${processo.numero_processo}.`
                  : `Será enviado um pedido de elementos adicionais à entidade ${processo.entity_name}.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={acting} onClick={() => confirmAction && handleAction(confirmAction)}>
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Document preview */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogTitle className="text-sm truncate">{previewName}</DialogTitle>
            {previewUrl && (
              <iframe src={previewUrl} className="w-full h-full rounded border" title={previewName} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// ─── Sub-components ───

function ReadOnlyCC3Table({ lines, values, sectionTitle }: {
  lines: BalancoLine[];
  values: Record<string, number>;
  sectionTitle: string;
}) {
  const total = sumEditable(lines, values);
  const hasData = Object.values(values).some(v => v !== 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-2 py-1.5 text-left border border-border w-20">Código</th>
            <th className="px-2 py-1.5 text-left border border-border">Designação</th>
            <th className="px-2 py-1.5 text-right border border-border w-32">Valor (Kz)</th>
            <th className="px-2 py-1.5 text-right border border-border w-20">%</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const val = line.editable
              ? (values[line.code] || 0)
              : sumEditable(lines.filter(l => l.code.startsWith(line.code + ".") && l.editable), values);

            if (!hasData && !line.isHeader && val === 0) return null;

            return (
              <tr key={line.code} className={line.isHeader ? "bg-muted/30 font-medium" : "hover:bg-muted/10"}>
                <td className="px-2 py-1 border border-border text-muted-foreground">{line.code}</td>
                <td className="px-2 py-1 border border-border" style={{ paddingLeft: `${line.level * 12 + 8}px` }}>
                  {line.label}
                </td>
                <td className="px-2 py-1 border border-border text-right font-mono">
                  {val !== 0 ? formatKz(val) : "—"}
                </td>
                <td className="px-2 py-1 border border-border text-right text-muted-foreground">
                  {total > 0 && val !== 0 ? `${((val / total) * 100).toFixed(1)}%` : ""}
                </td>
              </tr>
            );
          })}
          <tr className="bg-primary/10 font-semibold">
            <td className="px-2 py-1.5 border border-border" colSpan={2}>Total {sectionTitle}</td>
            <td className="px-2 py-1.5 border border-border text-right font-mono">{formatKz(total)}</td>
            <td className="px-2 py-1.5 border border-border text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DocTable({ docs, getDocIcon, getEstadoBadge, onPreview, onDownload }: {
  docs: DocItem[];
  getDocIcon: (n: string) => React.ReactNode;
  getEstadoBadge: (e: string) => React.ReactNode;
  onPreview: (d: DocItem) => void;
  onDownload: (d: DocItem) => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-10">#</TableHead>
            <TableHead className="text-xs">Documento</TableHead>
            <TableHead className="text-xs">Tipo / Categoria</TableHead>
            <TableHead className="text-xs">Estado</TableHead>
            <TableHead className="text-xs">Data</TableHead>
            <TableHead className="text-xs text-right">Acções</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((doc, idx) => (
            <TableRow key={doc.id}>
              <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocIcon(doc.nome_ficheiro)}
                  <div>
                    <span className="text-xs font-medium truncate max-w-[220px] block">{doc.nome_ficheiro}</span>
                    {doc.observacoes && doc.observacoes !== doc.tipo_documento && (
                      <span className="text-[10px] text-muted-foreground block">{doc.observacoes}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{doc.tipo_documento}</Badge></TableCell>
              <TableCell>{getEstadoBadge(doc.estado)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("pt-AO")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPreview(doc)} title="Visualizar">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDownload(doc)} title="Descarregar">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DRRow({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <TableRow className={highlight ? "bg-muted/30" : ""}>
      <TableCell className={`text-xs ${bold ? "font-bold" : ""}`}>{label}</TableCell>
      <TableCell className={`text-xs text-right font-mono ${bold ? "font-bold" : ""} ${value < 0 ? "text-destructive" : ""}`}>
        {formatKz(value)} Kz
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-1">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold font-mono">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function InfoTableRow({ label, value }: { label: string; value: string }) {
  return (
    <TableRow>
      <TableCell className="text-xs font-semibold text-muted-foreground w-48">{label}</TableCell>
      <TableCell className="text-sm">{value}</TableCell>
    </TableRow>
  );
}

function IndicadorCard({ label, value, sub, alert, positive }: { label: string; value: string; sub: string; alert?: boolean; positive?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 space-y-1 ${alert ? "border-destructive/40 bg-destructive/5" : positive ? "border-primary/40 bg-primary/5" : ""}`}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold font-mono ${alert ? "text-destructive" : positive ? "text-primary" : ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
