import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DIVISOES_ESTRUTURA } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Users, Send, CheckCircle2, Loader2, FolderOpen,
  Calendar, GitBranch, UserCheck, ClipboardList, Search, FileText, Eye,
  Download, File, FileSpreadsheet, FileImage, ShieldCheck, Clock, AlertCircle,
  Wrench, Forward,
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
  responsavel_atual: string | null;
  divisao_competente: string | null;
  seccao_competente: string | null;
  coordenador_equipa: string | null;
  canal_entrada: string;
  urgencia: string;
}

interface DocItem {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
  created_at: string;
  observacoes: string | null;
}

type ActionMode = "seccao" | "tecnico" | null;

export default function ChefeDivisaoProcessos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const divisao = user?.divisao || "3ª Divisão";
  const divisaoNome = DIVISOES_ESTRUTURA[divisao]?.nome || divisao;
  const seccoesDivisao = DIVISOES_ESTRUTURA[divisao]?.seccoes || [];
  const executadoPor = user?.displayName || "Chefe de Divisão";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");

  // Action mode
  const [actionMode, setActionMode] = useState<ActionMode>(null);

  // Send to Secção form
  const [seccao, setSeccao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Work as Técnico form
  const [tecnicoObs, setTecnicoObs] = useState("");
  const [confirmTecnico, setConfirmTecnico] = useState(false);

  // Documents
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewMime, setPreviewMime] = useState<string | null>(null);

  useEffect(() => { fetchProcessos(); }, [divisao]);

  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 6)
      .eq("divisao_competente", divisaoNome)
      .order("created_at", { ascending: false });
    setProcessos((data as any[]) || []);
    setLoading(false);
  };

  const fetchDocumentos = async (processoId: string) => {
    setLoadingDocs(true);
    const { data } = await supabase
      .from("processo_documentos")
      .select("*")
      .eq("processo_id", processoId)
      .order("created_at", { ascending: true });
    const docs = (data as DocItem[]) || [];
    const capaIdx = docs.findIndex(d => d.tipo_documento === "Capa do Processo");
    if (capaIdx > 0) { const [capa] = docs.splice(capaIdx, 1); docs.unshift(capa); }
    setDocumentos(docs);
    setLoadingDocs(false);
  };

  const handlePreview = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      const ext = doc.nome_ficheiro.split(".").pop()?.toLowerCase();
      const mime = ext === "pdf" ? "application/pdf" : "application/octet-stream";
      const { data, error } = await supabase.storage
        .from("processo-documentos")
        .createSignedUrl(doc.caminho_ficheiro, 600, { download: false });
      if (error || !data?.signedUrl) throw error || new Error("URL não gerada.");
      setPreviewMime(mime);
      setPreviewUrl(data.signedUrl);
      setPreviewName(doc.nome_ficheiro);
    } catch {
      toast.error("Não foi possível abrir o documento.");
    }
  };

  const handleDownload = async (doc: DocItem) => {
    if (!doc.caminho_ficheiro) return;
    try {
      const { data, error } = await supabase.storage.from("processo-documentos").download(doc.caminho_ficheiro);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = doc.nome_ficheiro; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Não foi possível descarregar o documento.");
    }
  };

  const handleSelectProcesso = (p: Processo) => {
    setSelectedProcesso(p);
    setActionMode(null);
    setSeccao("");
    setObservacoes("");
    setTecnicoObs("");
    fetchDocumentos(p.id);
  };

  /* ── Action: Send to Chefe de Secção ── */
  const handleEnviarSeccao = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      await supabase.from("processos").update({
        seccao_competente: seccao,
        responsavel_atual: `Chefe de Secção — ${divisao}`,
      }).eq("id", selectedProcesso.id);

      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 7,
        novoEstado: "em_distribuicao",
        executadoPor,
        perfilExecutor: "Chefe de Divisão",
        observacoes: `Encaminhado à secção: ${seccao}. ${observacoes}`.trim(),
      });

      await gerarAtividadesParaEvento("encaminhamento_seccao", selectedProcesso.id, {
        categoriaEntidade: selectedProcesso.categoria_entidade,
      });

      toast.success(`Processo ${selectedProcesso.numero_processo} encaminhado ao Chefe de Secção.`);
      setSelectedProcesso(null);
      setConfirmDialogOpen(false);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  /* ── Action: Work as Técnico (self-assign, advance to analysis) ── */
  const handleTrabalharComoTecnico = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      await supabase.from("processos").update({
        tecnico_analise: executadoPor,
        coordenador_equipa: executadoPor,
        responsavel_atual: executadoPor,
      }).eq("id", selectedProcesso.id);

      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 8,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Chefe de Divisão",
        observacoes: `Chefe de Divisão assume como técnico. ${tecnicoObs}`.trim(),
      });

      await gerarAtividadesParaEvento("analise_iniciada", selectedProcesso.id, {
        categoriaEntidade: selectedProcesso.categoria_entidade,
      });

      toast.success(`Processo ${selectedProcesso.numero_processo} assumido como técnico.`);
      navigate(`/analise-tecnica/${selectedProcesso.id}`);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const filteredProcessos = processos.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.numero_processo.toLowerCase().includes(q) || p.entity_name.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");
  const urgenciaColor = (u: string) => u === "urgente" ? "destructive" : u === "alta" ? "default" : "secondary";

  const getDocIcon = (nome: string) => {
    const ext = nome.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-5 w-5 text-destructive" />;
    if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return <FileImage className="h-5 w-5 text-sky-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const getExtLabel = (nome: string) => {
    const ext = nome.split(".").pop()?.toUpperCase() || "???";
    const colors: Record<string, string> = {
      PDF: "bg-destructive/10 text-destructive border-destructive/20",
      XLSX: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      XLS: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      PNG: "bg-sky-500/10 text-sky-700 border-sky-500/20",
      JPG: "bg-sky-500/10 text-sky-700 border-sky-500/20",
    };
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold border ${colors[ext] || "bg-muted text-muted-foreground border-border"}`}>
        {ext}
      </span>
    );
  };

  const getEstadoIndicator = (estado: string) => {
    if (estado === "validado") return <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /><span className="text-[10px] font-semibold text-emerald-700">Validado</span></div>;
    if (estado === "pendente") return <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /><span className="text-[10px] font-semibold text-amber-600">Pendente</span></div>;
    if (estado === "rejeitado") return <div className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] font-semibold text-destructive">Rejeitado</span></div>;
    return <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-semibold text-muted-foreground capitalize">{estado}</span></div>;
  };

  // ──── Detail View ────
  if (selectedProcesso) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => setSelectedProcesso(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                {selectedProcesso.numero_processo}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{divisaoNome}</p>
            </div>
            <Badge variant={urgenciaColor(selectedProcesso.urgencia) as any}>
              {selectedProcesso.urgencia}
            </Badge>
          </div>

          {/* Process Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Dados do Processo</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">Entidade</span><p className="font-medium">{selectedProcesso.entity_name}</p></div>
                <div><span className="text-muted-foreground text-xs">Exercício</span><p className="font-medium">{selectedProcesso.ano_gerencia}</p></div>
                <div><span className="text-muted-foreground text-xs">Categoria</span><Badge variant="outline" className="text-[10px]">{selectedProcesso.categoria_entidade.replace(/_/g, " ")}</Badge></div>
                <div><span className="text-muted-foreground text-xs">Completude</span><p className="font-medium">{selectedProcesso.completude_documental}%</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documentos ({documentos.length})</CardTitle></CardHeader>
            <CardContent>
              {loadingDocs ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento.</p>
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
                        <TableRow key={doc.id} className="group">
                          <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              {getDocIcon(doc.nome_ficheiro)}
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-xs font-medium truncate max-w-[220px]">{doc.nome_ficheiro}</span>
                                <div className="flex items-center gap-1.5">
                                  {getExtLabel(doc.nome_ficheiro)}
                                  {idx === 0 && doc.tipo_documento === "Capa do Processo" && (
                                    <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 px-1 py-0" variant="outline">CAPA</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{doc.tipo_documento}</Badge></TableCell>
                          <TableCell>{getEstadoIndicator(doc.estado)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("pt-AO")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-70 group-hover:opacity-100" onClick={() => handlePreview(doc)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-70 group-hover:opacity-100" onClick={() => handleDownload(doc)}><Download className="h-3.5 w-3.5" /></Button>
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

          {/* Action Choice */}
          {!actionMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Decidir Acção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha como proceder com este processo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActionMode("seccao")}
                    className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center group"
                  >
                    <Forward className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="font-semibold text-sm">Enviar ao Chefe de Secção</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Encaminhe à secção competente para distribuição e formação de equipa.
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActionMode("tecnico")}
                    className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center group"
                  >
                    <Wrench className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="font-semibold text-sm">Trabalhar como Técnico</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assuma o processo directamente para análise técnica.
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode: Send to Secção */}
          {actionMode === "seccao" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Forward className="h-4 w-4 text-primary" /> Encaminhar ao Chefe de Secção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Secção Competente *</Label>
                  <Select value={seccao} onValueChange={setSeccao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar secção" />
                    </SelectTrigger>
                    <SelectContent>
                      {seccoesDivisao.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Observações</Label>
                  <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Instruções para o Chefe de Secção..." rows={3} />
                </div>

                {seccao && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                    <p className="text-xs font-semibold text-primary mb-1">Resumo</p>
                    <p>Secção: <strong>{seccao}</strong></p>
                    <p className="text-xs text-muted-foreground mt-1">O processo será encaminhado ao Chefe de Secção para formação de equipa (Etapa 7).</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setActionMode(null)}>Voltar</Button>
                  <Button disabled={!seccao || acting} onClick={() => setConfirmDialogOpen(true)}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Encaminhar à Secção
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode: Work as Técnico */}
          {actionMode === "tecnico" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" /> Assumir como Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm">
                  <p className="font-semibold text-amber-700 text-xs mb-1">Atenção</p>
                  <p className="text-xs text-amber-700">Ao assumir como técnico, o processo avança directamente para a Etapa 8 — Análise Técnica, sob sua responsabilidade.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Observações</Label>
                  <Textarea value={tecnicoObs} onChange={e => setTecnicoObs(e.target.value)} placeholder="Justificação ou notas..." rows={3} />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setActionMode(null)}>Voltar</Button>
                  <Button onClick={() => setConfirmTecnico(true)} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                    Assumir Processo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confirm: Send to Secção */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Confirmar Encaminhamento</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  <p>Confirma o encaminhamento de <strong>{selectedProcesso?.numero_processo}</strong>?</p>
                  <div className="rounded bg-muted/50 p-3 space-y-1">
                    <p><strong>Secção:</strong> {seccao}</p>
                    <p><strong>Divisão:</strong> {divisaoNome}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Avançará para Etapa 7 — Secção Competente.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEnviarSeccao} disabled={acting}>
                {acting ? "A processar..." : "Confirmar e Encaminhar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm: Work as Técnico */}
        <AlertDialog open={confirmTecnico} onOpenChange={setConfirmTecnico}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Confirmar Assunção</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  <p>Confirma que assume o processo <strong>{selectedProcesso?.numero_processo}</strong> como técnico?</p>
                  <p className="text-xs text-muted-foreground">Avançará directamente para Etapa 8 — Análise Técnica.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleTrabalharComoTecnico} disabled={acting}>
                {acting ? "A processar..." : "Confirmar e Assumir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Document Preview */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => {
          if (!open) { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewName(""); setPreviewMime(null); }
        }}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <div className="space-y-1.5"><DialogTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> {previewName}</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Pré-visualização do documento.</DialogDescription></div>
            <div className="flex-1 overflow-hidden rounded-lg border h-full flex flex-col bg-muted/20">
              {previewUrl && previewMime === "application/pdf" ? (
                <object key={previewUrl} data={previewUrl} type="application/pdf" className="w-full flex-1 min-h-[55vh]">
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm font-medium">O navegador não suporta PDF embutido</p>
                    <Button variant="default" size="sm" onClick={() => previewUrl && window.open(previewUrl, "_blank")}><Download className="h-3.5 w-3.5 mr-1" /> Abrir em nova aba</Button>
                  </div>
                </object>
              ) : previewUrl ? <iframe key={previewUrl} src={previewUrl} className="w-full flex-1 min-h-[55vh]" title={previewName} style={{ border: "none" }} /> : null}
            </div>
            <div className="flex justify-end gap-2 border-t px-3 py-2">
              <Button variant="outline" size="sm" onClick={() => previewUrl && window.open(previewUrl, "_blank")} disabled={!previewUrl}><Download className="h-3.5 w-3.5 mr-1" /> Abrir em nova aba</Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  // ──── List View ────
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Divisão Competente — {divisaoNome}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receba os processos e decida: trabalhar como técnico ou encaminhar ao Chefe de Secção.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Aguardam Decisão</p>
                  <p className="text-2xl font-bold text-primary mt-1">{processos.length}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Urgentes</p>
                  <p className="text-2xl font-bold text-destructive mt-1">
                    {processos.filter(p => p.urgencia === "urgente" || p.urgencia === "alta").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Perfil</p>
                  <p className="text-sm font-medium mt-1">{executadoPor}</p>
                  <p className="text-[10px] text-muted-foreground">Chefe de Divisão · {divisao}</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filteredProcessos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum processo encontrado." : "Não existem processos pendentes nesta divisão."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nº Processo</TableHead>
                    <TableHead className="text-xs">Entidade</TableHead>
                    <TableHead className="text-xs">Exercício</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Urgência</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-right">Acção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcessos.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectProcesso(p)}>
                      <TableCell className="font-mono text-xs font-medium">{p.numero_processo}</TableCell>
                      <TableCell className="text-sm">{p.entity_name}</TableCell>
                      <TableCell className="text-sm">{p.ano_gerencia}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{p.categoria_entidade.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell><Badge variant={urgenciaColor(p.urgencia) as any} className="text-[10px]">{p.urgencia}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.data_submissao)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><GitBranch className="h-3 w-3" /> Abrir</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
