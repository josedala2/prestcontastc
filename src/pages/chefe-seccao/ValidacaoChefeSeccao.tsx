import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DIVISOES_ESTRUTURA } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  CheckSquare, ArrowLeft, Search, Send, RotateCcw, Loader2, Eye,
  Download, FileText, Building2, Calendar, ClipboardList, FileSearch,
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

interface ProcessoDoc {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
}

interface HistoricoEntry {
  id: string;
  acao: string;
  executado_por: string;
  perfil_executor: string | null;
  observacoes: string | null;
  created_at: string;
  etapa_anterior: number | null;
  etapa_seguinte: number | null;
}

export default function ValidacaoChefeSeccao() {
  const { user } = useAuth();
  const divisao = user?.divisao || "3ª Divisão";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Processo | null>(null);
  const [documentos, setDocumentos] = useState<ProcessoDoc[]>([]);
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"aprovar" | "devolver" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  useEffect(() => {
    fetchProcessos();
  }, [divisao]);

  async function fetchProcessos() {
    setLoading(true);
    const divNome = DIVISOES_ESTRUTURA[divisao]?.nome || divisao;
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 9)
      .eq("divisao_competente", divNome)
      .order("data_submissao", { ascending: false });

    if (!error && data) setProcessos(data as unknown as Processo[]);
    setLoading(false);
  }

  async function handleSelect(p: Processo) {
    setSelected(p);
    setObservacoes("");

    // Load documents & history in parallel
    const [docsRes, histRes] = await Promise.all([
      supabase.from("processo_documentos").select("*").eq("processo_id", p.id),
      supabase.from("processo_historico").select("*").eq("processo_id", p.id).order("created_at", { ascending: false }),
    ]);
    if (docsRes.data) setDocumentos(docsRes.data as unknown as ProcessoDoc[]);
    if (histRes.data) setHistorico(histRes.data as unknown as HistoricoEntry[]);
  }

  async function handlePreview(doc: ProcessoDoc) {
    if (!doc.caminho_ficheiro) return;
    const { data } = await supabase.storage.from("processo-documentos").createSignedUrl(doc.caminho_ficheiro, 300);
    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setPreviewName(doc.nome_ficheiro);
    }
  }

  async function handleDownload(doc: ProcessoDoc) {
    if (!doc.caminho_ficheiro) return;
    const { data } = await supabase.storage.from("processo-documentos").download(doc.caminho_ficheiro);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nome_ficheiro;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function executeAction() {
    if (!selected || !user || !confirmAction) return;
    setSubmitting(true);
    try {
      if (confirmAction === "aprovar") {
        await avancarEtapaProcesso({
          processoId: selected.id,
          novaEtapa: 10,
          novoEstado: "em_validacao",
          executadoPor: user.displayName,
          perfilExecutor: "Chefe de Secção",
          observacoes: observacoes || "Validado pelo Chefe de Secção — encaminhado ao Chefe de Divisão.",
        });
        await gerarAtividadesParaEvento("validacao_aprovada", selected.id, {
          categoriaEntidade: selected.categoria_entidade,
        });
        toast.success(`Processo ${selected.numero_processo} aprovado e encaminhado ao Chefe de Divisão.`);
      } else {
        await avancarEtapaProcesso({
          processoId: selected.id,
          novaEtapa: 8,
          novoEstado: "pendente_correccao",
          executadoPor: user.displayName,
          perfilExecutor: "Chefe de Secção",
          observacoes: observacoes || "Devolvido para aperfeiçoamento pela equipa técnica.",
        });
        await gerarAtividadesParaEvento("validacao_reprovada", selected.id, {
          categoriaEntidade: selected.categoria_entidade,
        });
        toast.success(`Processo ${selected.numero_processo} devolvido para aperfeiçoamento.`);
      }
      setSelected(null);
      setConfirmAction(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = processos.filter(p =>
    p.numero_processo.toLowerCase().includes(search.toLowerCase()) ||
    p.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");

  const estadoBadge = (e: string) => {
    const map: Record<string, string> = {
      pendente: "secondary", validado: "default", rejeitado: "destructive",
    };
    return <Badge variant={(map[e] || "outline") as any} className="text-xs">{e}</Badge>;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Validação do Chefe de Secção
          </h1>
          <p className="text-muted-foreground mt-1">
            Revise os processos analisados pela equipa técnica. Aprove e encaminhe ao Chefe de Divisão ou devolva para aperfeiçoamento.
          </p>
        </div>

        {selected ? (
          /* ── DETAIL VIEW ── */
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista
            </Button>

            {/* Process info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {selected.numero_processo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entidade</span>
                    <p className="font-medium">{selected.entity_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exercício</span>
                    <p className="font-medium">{selected.ano_gerencia}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Equipa</span>
                    <p className="font-medium">{selected.tecnico_analise || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coord. Equipa</span>
                    <p className="font-medium">{selected.coordenador_equipa || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Documentos / Histórico */}
            <Tabs defaultValue="documentos">
              <TabsList>
                <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
                <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="documentos">
                <Card>
                  <CardContent className="pt-6">
                    {documentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento anexado.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Documento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acções</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documentos.map(doc => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium text-sm">{doc.nome_ficheiro}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{doc.tipo_documento}</Badge></TableCell>
                              <TableCell>{estadoBadge(doc.estado)}</TableCell>
                              <TableCell className="text-right space-x-1">
                                {doc.caminho_ficheiro && (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePreview(doc)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card>
                  <CardContent className="pt-6">
                    {historico.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem histórico.</p>
                    ) : (
                      <div className="space-y-3">
                        {historico.map(h => (
                          <div key={h.id} className="border rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{h.acao}</p>
                                <p className="text-muted-foreground text-xs mt-0.5">
                                  por {h.executado_por} {h.perfil_executor ? `(${h.perfil_executor})` : ""}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                            </div>
                            {h.observacoes && <p className="mt-1 text-muted-foreground">{h.observacoes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Decision */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Observações / Justificação</Label>
                  <Textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Justifique a sua decisão ou indique pontos a melhorar..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setConfirmAction("devolver")}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Devolver para Aperfeiçoamento
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => setConfirmAction("aprovar")}
                  >
                    <Send className="h-4 w-4" />
                    Aprovar e Encaminhar ao Chefe de Divisão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Processos Analisados
                  <Badge variant="secondary">{processos.length}</Badge>
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum processo aguarda validação.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Exercício</TableHead>
                      <TableHead>Equipa</TableHead>
                      <TableHead>Urgência</TableHead>
                      <TableHead>Data Submissão</TableHead>
                      <TableHead className="text-right">Acção</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.numero_processo}</TableCell>
                        <TableCell>{p.entity_name}</TableCell>
                        <TableCell>{p.ano_gerencia}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {p.tecnico_analise || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.urgencia === "urgente" ? "destructive" : p.urgencia === "alta" ? "default" : "secondary"} className="text-xs">
                            {p.urgencia}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(p.data_submissao)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSelect(p)}>
                            <Eye className="h-3.5 w-3.5" /> Analisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirm dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === "aprovar" ? "Aprovar e Encaminhar?" : "Devolver para Aperfeiçoamento?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === "aprovar"
                  ? `O processo ${selected?.numero_processo} será encaminhado para o Chefe de Divisão (Etapa 10).`
                  : `O processo ${selected?.numero_processo} será devolvido à equipa técnica para aperfeiçoamento (Etapa 8).`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={executeAction} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Document preview dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>{previewName}</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded border" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
