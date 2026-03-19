import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
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
import {
  ArrowLeft, FileSearch, FileText, FileSpreadsheet, FileImage,
  File, Eye, Download, Loader2,
  Send, RotateCcw, BarChart3, BookOpen, Calculator,
  Scale, TrendingUp, ClipboardList, FileCheck,
} from "lucide-react";

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
    const { data: fyData } = await supabase.from("fiscal_years").select("id").eq("entity_id", entityId).eq("year", year).limit(1);
    const fyId = fyData?.[0]?.id;
    if (fyId) {
      const { data: tb } = await supabase.from("trial_balance").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fyId).order("account_code");
      setBalancete((tb as BalanceteLine[]) || []);
      const { data: fi } = await supabase.from("financial_indicators").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fyId).limit(1);
      if (fi?.[0]) setIndicators(fi[0] as unknown as Record<string, number>);
    }
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

  // ─── Computed Financial Data ───
  const totalDebit = balancete.reduce((s, l) => s + l.debit, 0);
  const totalCredit = balancete.reduce((s, l) => s + l.credit, 0);

  // Balanço Patrimonial (derive from balancete by account classes)
  const balancoData = useMemo(() => {
    const sumByPrefix = (prefix: string) =>
      balancete.filter(l => l.account_code.startsWith(prefix)).reduce((s, l) => s + l.balance, 0);

    const activoNaoCorrente = sumByPrefix("1"); // Classe 1 — Meios Fixos
    const activoCorrente = sumByPrefix("3") + sumByPrefix("4"); // Existências + Terceiros
    const disponibilidades = sumByPrefix("5"); // Disponibilidades
    const totalActivo = activoNaoCorrente + activoCorrente + disponibilidades;

    const capitalProprio = sumByPrefix("6"); // Capital Próprio
    const passivoNaoCorrente = sumByPrefix("2"); // Investimentos Financeiros / Passivo LP
    const passivoCorrente = sumByPrefix("4").toString().startsWith("4") ? Math.abs(balancete.filter(l => l.account_code.startsWith("4") && l.balance < 0).reduce((s, l) => s + l.balance, 0)) : 0;
    const totalPassivoCP = capitalProprio + passivoNaoCorrente + passivoCorrente;

    return {
      activoNaoCorrente, activoCorrente, disponibilidades, totalActivo,
      capitalProprio, passivoNaoCorrente, passivoCorrente, totalPassivoCP,
    };
  }, [balancete]);

  // Demonstração de Resultados
  const drData = useMemo(() => {
    const sumByPrefix = (prefix: string) =>
      balancete.filter(l => l.account_code.startsWith(prefix)).reduce((s, l) => s + Math.abs(l.balance), 0);

    const proveitos = sumByPrefix("7"); // Classe 7 — Proveitos
    const custos = sumByPrefix("6").toString().startsWith("6") ? 0 : sumByPrefix("6"); // Avoid overlap with CP
    const custosOperacionais = sumByPrefix("61") + sumByPrefix("62") + sumByPrefix("63") + sumByPrefix("64") + sumByPrefix("65") + sumByPrefix("66");
    const resultadoOperacional = proveitos - custosOperacionais;
    const resultadosFinanceiros = sumByPrefix("78") - sumByPrefix("68");
    const resultadoAntesImpostos = resultadoOperacional + resultadosFinanceiros;
    const impostos = sumByPrefix("69");
    const resultadoLiquido = resultadoAntesImpostos - impostos;

    return {
      proveitos, custosOperacionais, resultadoOperacional,
      resultadosFinanceiros, resultadoAntesImpostos, impostos, resultadoLiquido,
    };
  }, [balancete]);

  // Indicadores
  const indicadorRows = useMemo(() => {
    const i = indicators;
    if (!i || Object.keys(i).length === 0) return [];
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
  }, [indicators]);

  const fmtIndicator = (row: { value: number; fmt?: string }) => {
    if (row.fmt === "kz") return `${formatKz(row.value)} Kz`;
    if (row.fmt === "pct") return `${(row.value * 100).toFixed(1)}%`;
    return row.value.toFixed(2);
  };

  // Separate docs by source
  const submissionDocs = documentos.filter(d => d._source === "submission");
  const processoDocs = documentos.filter(d => d._source !== "submission");

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

        {/* Main tabs - 6 tabs */}
        <Tabs defaultValue="documentos" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="documentos" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> Documentos</TabsTrigger>
            <TabsTrigger value="balanco" className="gap-1 text-xs"><Scale className="h-3.5 w-3.5" /> Balanço</TabsTrigger>
            <TabsTrigger value="dr" className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5" /> Dem. Resultados</TabsTrigger>
            <TabsTrigger value="indicadores" className="gap-1 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Indicadores</TabsTrigger>
            <TabsTrigger value="resumo" className="gap-1 text-xs"><ClipboardList className="h-3.5 w-3.5" /> Resumo</TabsTrigger>
            <TabsTrigger value="parecer" className="gap-1 text-xs"><FileCheck className="h-3.5 w-3.5" /> Parecer</TabsTrigger>
          </TabsList>

          {/* ── Tab: Documentos ── */}
          <TabsContent value="documentos">
            <div className="space-y-4">
              {/* Entity submission documents */}
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

              {/* Process generated documents */}
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

          {/* ── Tab: Balanço Patrimonial ── */}
          <TabsContent value="balanco">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">ACTIVO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BalancoRow label="Activo Não Corrente (Meios Fixos)" value={balancoData.activoNaoCorrente} />
                  <BalancoRow label="Activo Corrente (Existências + Terceiros)" value={balancoData.activoCorrente} />
                  <BalancoRow label="Disponibilidades" value={balancoData.disponibilidades} />
                  <div className="border-t pt-2">
                    <BalancoRow label="TOTAL DO ACTIVO" value={balancoData.totalActivo} bold />
                  </div>
                </CardContent>
              </Card>

              {/* Capital Próprio + Passivo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">CAPITAL PRÓPRIO E PASSIVO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BalancoRow label="Capital Próprio" value={balancoData.capitalProprio} />
                  <BalancoRow label="Passivo Não Corrente" value={balancoData.passivoNaoCorrente} />
                  <BalancoRow label="Passivo Corrente" value={balancoData.passivoCorrente} />
                  <div className="border-t pt-2">
                    <BalancoRow label="TOTAL CP + PASSIVO" value={balancoData.totalPassivoCP} bold />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Full balancete detail */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Balancete Analítico Detalhado</CardTitle>
                <CardDescription>Dados do balancete carregado pela entidade para o exercício {processo.ano_gerencia}.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBal ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : balancete.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Nenhum dado de balancete encontrado.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-auto max-h-[500px]">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Demonstração de Resultados ── */}
          <TabsContent value="dr">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Demonstração de Resultados — Exercício {processo.ano_gerencia}
                </CardTitle>
                <CardDescription>Estrutura de proveitos e custos derivada do balancete analítico.</CardDescription>
              </CardHeader>
              <CardContent>
                {balancete.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Sem dados de balancete para gerar a demonstração de resultados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Rubrica</TableHead>
                            <TableHead className="text-xs text-right">Valor (Kz)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <DRRow label="Proveitos Operacionais (Classe 7)" value={drData.proveitos} />
                          <DRRow label="Custos Operacionais (Classes 61-66)" value={-drData.custosOperacionais} />
                          <DRRow label="Resultado Operacional" value={drData.resultadoOperacional} bold highlight />
                          <DRRow label="Resultados Financeiros" value={drData.resultadosFinanceiros} />
                          <DRRow label="Resultado Antes de Impostos" value={drData.resultadoAntesImpostos} bold />
                          <DRRow label="Impostos s/ Rendimento (69)" value={-drData.impostos} />
                          <DRRow label="RESULTADO LÍQUIDO DO EXERCÍCIO" value={drData.resultadoLiquido} bold highlight />
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Indicadores Financeiros ── */}
          <TabsContent value="indicadores">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Indicadores Financeiros — Exercício {processo.ano_gerencia}
                </CardTitle>
                <CardDescription>Rácios e indicadores calculados a partir dos dados financeiros.</CardDescription>
              </CardHeader>
              <CardContent>
                {indicadorRows.length === 0 || indicadorRows.every(r => r.value === 0) ? (
                  <div className="text-center py-12 space-y-2">
                    <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Indicadores financeiros não disponíveis para este exercício.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {indicadorRows.map((row) => (
                      <div key={row.label} className="rounded-lg border p-4 space-y-1">
                        <p className="text-[11px] text-muted-foreground">{row.label}</p>
                        <p className="text-lg font-bold font-mono">{fmtIndicator(row)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <CardDescription>Visão geral consolidada do processo de prestação de contas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Total Documentos" value={String(documentos.length)} sub={`${submissionDocs.length} da entidade · ${processoDocs.length} do processo`} />
                    <SummaryCard label="Completude Documental" value={`${processo.completude_documental}%`} sub={processo.completude_documental >= 100 ? "Completo" : "Incompleto"} />
                    <SummaryCard label="Resultado Líquido" value={formatKz(drData.resultadoLiquido) + " Kz"} sub={drData.resultadoLiquido >= 0 ? "Positivo" : "Negativo"} />
                    <SummaryCard label="Total Activo" value={formatKz(balancoData.totalActivo) + " Kz"} sub="Balanço Patrimonial" />
                  </div>

                  {/* Process info */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <InfoTableRow label="Nº Processo" value={processo.numero_processo} />
                        <InfoTableRow label="Entidade" value={processo.entity_name} />
                        <InfoTableRow label="Exercício / Ano de Gerência" value={String(processo.ano_gerencia)} />
                        <InfoTableRow label="Categoria" value={processo.categoria_entidade.replace(/_/g, " ")} />
                        <InfoTableRow label="Divisão Competente" value={processo.divisao_competente || "—"} />
                        <InfoTableRow label="Secção Competente" value={processo.seccao_competente || "—"} />
                        <InfoTableRow label="Técnico de Análise" value={processo.tecnico_analise || "—"} />
                        <InfoTableRow label="Coordenador de Equipa" value={processo.coordenador_equipa || "—"} />
                        <InfoTableRow label="Data de Submissão" value={new Date(processo.data_submissao).toLocaleDateString("pt-AO")} />
                        <InfoTableRow label="Estado" value={processo.estado.replace(/_/g, " ")} />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Financial summary */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Síntese Financeira</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">Total Débito</span><p className="font-mono font-medium">{formatKz(totalDebit)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Total Crédito</span><p className="font-mono font-medium">{formatKz(totalCredit)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Diferença</span><p className="font-mono font-medium">{formatKz(totalDebit - totalCredit)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Proveitos</span><p className="font-mono font-medium">{formatKz(drData.proveitos)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Custos Operacionais</span><p className="font-mono font-medium">{formatKz(drData.custosOperacionais)} Kz</p></div>
                      <div><span className="text-muted-foreground text-xs">Resultado Líquido</span><p className={`font-mono font-bold ${drData.resultadoLiquido >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatKz(drData.resultadoLiquido)} Kz</p></div>
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

function BalancoRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`font-mono text-sm ${bold ? "font-bold" : ""}`}>{formatKz(value)} Kz</span>
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
