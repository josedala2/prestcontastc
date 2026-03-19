import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatKz } from "@/lib/dataUtils";
import {
  ArrowLeft, Building2, FileSearch, FileText, FileSpreadsheet, FileImage,
  File, Eye, Download, Loader2, ShieldCheck, Clock, AlertCircle,
  Send, RotateCcw, BarChart3, BookOpen, Calculator,
} from "lucide-react";

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
  /** Source: "processo" or "submission" */
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

interface IndicadorRow {
  label: string;
  value: number;
  fmt?: "kz" | "pct" | "days";
}

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
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"concluir" | "elementos" | null>(null);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  useEffect(() => { if (id) loadData(id); }, [id]);
  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function loadData(processoId: string) {
    setLoading(true);
    const { data: p } = await supabase.from("processos").select("*").eq("id", processoId).single();
    if (!p) { setLoading(false); return; }
    setProcesso(p as unknown as Processo);

    // Docs
    const { data: docs } = await supabase.from("processo_documentos").select("*").eq("processo_id", processoId).order("created_at");
    setDocumentos((docs as DocItem[]) || []);

    // Balancete + indicators
    loadFinancialData(p.entity_id, p.ano_gerencia);
    setLoading(false);
  }

  async function loadFinancialData(entityId: string, year: number) {
    setLoadingBal(true);

    // Find fiscal year for this entity/year
    const { data: fyData } = await supabase.from("fiscal_years").select("id").eq("entity_id", entityId).eq("year", year).limit(1);
    const fyId = fyData?.[0]?.id;

    if (fyId) {
      // Trial balance
      const { data: tb } = await supabase.from("trial_balance").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fyId).order("account_code");
      setBalancete((tb as BalanceteLine[]) || []);

      // Financial indicators
      const { data: fi } = await supabase.from("financial_indicators").select("*").eq("entity_id", entityId).eq("fiscal_year_id", fyId).limit(1);
      if (fi?.[0]) {
        setIndicators(fi[0] as unknown as Record<string, number>);
      }
    }
    setLoadingBal(false);
  }

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

  const handlePreview = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      const { data, error } = await supabase.storage.from("processo-documentos").createSignedUrl(doc.caminho_ficheiro, 600, { download: false });
      if (error || !data?.signedUrl) throw error;
      setPreviewUrl(data.signedUrl);
      setPreviewName(doc.nome_ficheiro);
    } catch { toast.error("Não foi possível abrir o documento."); }
  };

  const handleDownload = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      const { data, error } = await supabase.storage.from("processo-documentos").download(doc.caminho_ficheiro);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = doc.nome_ficheiro; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error("Não foi possível descarregar."); }
  };

  const getDocIcon = (nome: string) => {
    const ext = nome.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-4 w-4 text-destructive" />;
    if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return <FileImage className="h-4 w-4 text-sky-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === "validado") return <Badge variant="default" className="bg-emerald-600 text-[10px]">Validado</Badge>;
    if (estado === "rejeitado") return <Badge variant="destructive" className="text-[10px]">Rejeitado</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Pendente</Badge>;
  };

  // Balancete totals
  const totalDebit = balancete.reduce((s, l) => s + l.debit, 0);
  const totalCredit = balancete.reduce((s, l) => s + l.credit, 0);

  const indicadorRows: IndicadorRow[] = indicators ? [
    { label: "Activo Total", value: Number(indicators.activo_total) || 0, fmt: "kz" },
    { label: "Capital Próprio", value: Number(indicators.capital_proprio) || 0, fmt: "kz" },
    { label: "Passivo Total", value: Number(indicators.passivo_total) || 0, fmt: "kz" },
    { label: "Resultado Líquido", value: Number(indicators.resultado_liquido) || 0, fmt: "kz" },
    { label: "Liquidez Corrente", value: Number(indicators.liquidez_corrente) || 0 },
    { label: "ROE", value: Number(indicators.roe) || 0, fmt: "pct" },
    { label: "ROA", value: Number(indicators.roa) || 0, fmt: "pct" },
    { label: "Endividamento Geral", value: Number(indicators.endividamento_geral) || 0, fmt: "pct" },
  ] : [];

  const fmtIndicator = (row: IndicadorRow) => {
    if (row.fmt === "kz") return `${formatKz(row.value)} Kz`;
    if (row.fmt === "pct") return `${(row.value * 100).toFixed(1)}%`;
    return row.value.toFixed(2);
  };

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!processo) {
    return <AppLayout><div className="text-center py-20"><p className="text-muted-foreground">Processo não encontrado.</p><Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">Entidade</span><p className="font-medium">{processo.entity_name}</p></div>
              <div><span className="text-muted-foreground text-xs">Exercício</span><p className="font-medium">{processo.ano_gerencia}</p></div>
              <div><span className="text-muted-foreground text-xs">Categoria</span><Badge variant="outline" className="text-[10px]">{processo.categoria_entidade.replace(/_/g, " ")}</Badge></div>
              <div><span className="text-muted-foreground text-xs">Divisão</span><p className="font-medium">{processo.divisao_competente || "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Completude</span><p className="font-medium">{processo.completude_documental}%</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Main tabs */}
        <Tabs defaultValue="documentos" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="documentos" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Documentos</TabsTrigger>
            <TabsTrigger value="balancete" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" /> Balancete</TabsTrigger>
            <TabsTrigger value="indicadores" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Indicadores</TabsTrigger>
            <TabsTrigger value="parecer" className="gap-1.5 text-xs"><Calculator className="h-3.5 w-3.5" /> Parecer</TabsTrigger>
          </TabsList>

          {/* ── Documentos ── */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Documentos do Processo ({documentos.length})</CardTitle>
                <CardDescription>Documentos submetidos pela entidade e gerados pelo sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                {documentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento associado.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-10">#</TableHead>
                          <TableHead className="text-xs">Documento</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Estado</TableHead>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs text-right">Acções</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentos.map((doc, idx) => (
                          <TableRow key={doc.id}>
                            <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getDocIcon(doc.nome_ficheiro)}
                                <span className="text-xs font-medium truncate max-w-[220px]">{doc.nome_ficheiro}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{doc.tipo_documento}</Badge></TableCell>
                            <TableCell>{getEstadoBadge(doc.estado)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("pt-AO")}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handlePreview(doc)}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(doc)}><Download className="h-3.5 w-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Balancete ── */}
          <TabsContent value="balancete">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Balancete Analítico — {processo.entity_name}</CardTitle>
                <CardDescription>Dados do balancete carregado pela entidade para o exercício {processo.ano_gerencia}.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBal ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : balancete.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Nenhum dado de balancete encontrado para esta entidade/exercício.</p>
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

          {/* ── Indicadores Financeiros ── */}
          <TabsContent value="indicadores">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Indicadores Financeiros</CardTitle>
                <CardDescription>Rácios e indicadores calculados para o exercício {processo.ano_gerencia}.</CardDescription>
              </CardHeader>
              <CardContent>
                {indicadorRows.every(r => r.value === 0) ? (
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

          {/* ── Parecer / Acções ── */}
          <TabsContent value="parecer">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Emissão de Parecer</CardTitle>
                <CardDescription>Conclua a análise ou solicite elementos adicionais à entidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Observações / Fundamentação</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva as conclusões da análise, pontos de atenção, irregularidades detectadas..."
                    rows={5}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setConfirmAction("elementos")}
                  >
                    <RotateCcw className="h-4 w-4" /> Solicitar Elementos
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => setConfirmAction("concluir")}
                  >
                    <Send className="h-4 w-4" /> Concluir Análise e Submeter
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
                {confirmAction === "concluir" ? "Concluir Análise?" : "Solicitar Elementos Adicionais?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === "concluir"
                  ? `O processo ${processo.numero_processo} será submetido para validação do Chefe de Secção/Divisão.`
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
