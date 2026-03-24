import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DIVISOES_ESTRUTURA } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { CATEGORIA_DIVISAO_ROUTING } from "@/types/workflow";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Send, CheckCircle2, Loader2, FolderOpen,
  Search, FileText, Eye, Download, GitBranch, ShieldCheck, ClipboardList,
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
  canal_entrada: string;
  urgencia: string;
  divisao_competente: string | null;
}

interface DocItem {
  id: string;
  tipo_documento: string;
  nome_ficheiro: string;
  caminho_ficheiro: string | null;
  estado: string;
  created_at: string;
}

const DIVISOES = Object.keys(DIVISOES_ESTRUTURA);

export default function ContadoriaTriagem() {
  const { user } = useAuth();
  const executadoPor = user?.displayName || "Contadoria Geral";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");

  // Assignment form
  const [divisaoDestino, setDivisaoDestino] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Documents
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [allDocsVerified, setAllDocsVerified] = useState(false);

  useEffect(() => { fetchProcessos(); }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    // Fetch processes at stage 5 (after Escrivão autuação) or stage 6 waiting for Contadoria routing
    const { data } = await supabase
      .from("processos")
      .select("*")
      .in("etapa_atual", [5, 6])
      .is("divisao_competente", null)
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
    setDocumentos(docs);
    setAllDocsVerified(docs.length > 0 && docs.every(d => d.estado === "validado"));
    setLoadingDocs(false);
  };

  const handleSelectProcesso = (p: Processo) => {
    setSelectedProcesso(p);
    setDivisaoDestino("");
    setObservacoes("");
    fetchDocumentos(p.id);
  };

  const handleEncaminhar = async () => {
    if (!selectedProcesso || !divisaoDestino) return;
    setActing(true);
    try {
      const divInfo = DIVISOES_ESTRUTURA[divisaoDestino];

      // Update processo with divisão competente
      const { error: updateErr } = await supabase
        .from("processos")
        .update({
          divisao_competente: divInfo.nome,
          responsavel_atual: `Chefe da ${divisaoDestino}`,
        })
        .eq("id", selectedProcesso.id);

      if (updateErr) throw updateErr;

      // Advance to stage 6 (Divisão Competente) if not already there
      if (selectedProcesso.etapa_atual < 6) {
        await avancarEtapaProcesso({
          processoId: selectedProcesso.id,
          novaEtapa: 6,
          novoEstado: "em_analise",
          executadoPor,
          perfilExecutor: "Contadoria Geral",
          observacoes: `Processo verificado pela Contadoria e encaminhado à ${divInfo.nome}. ${observacoes}`.trim(),
          documentosGerados: ["Despacho de Encaminhamento"],
        });
      } else {
        // Just log the routing if already at stage 6
        await supabase.from("processo_historico").insert({
          processo_id: selectedProcesso.id,
          etapa_anterior: 6,
          etapa_seguinte: 6,
          estado_anterior: selectedProcesso.estado,
          estado_seguinte: "em_analise",
          acao: `Processo encaminhado pela Contadoria Geral à ${divInfo.nome}`,
          executado_por: executadoPor,
          perfil_executor: "Contadoria Geral",
          observacoes: observacoes || null,
          documentos_gerados: ["Despacho de Encaminhamento"],
        });
      }

      // Create notification
      await supabase.from("submission_notifications").insert({
        entity_id: selectedProcesso.entity_id,
        entity_name: selectedProcesso.entity_name,
        fiscal_year_id: `${selectedProcesso.entity_id}-${selectedProcesso.ano_gerencia}`,
        fiscal_year: String(selectedProcesso.ano_gerencia),
        type: "encaminhamento_divisao",
        message: `Processo ${selectedProcesso.numero_processo} encaminhado à ${divInfo.nome}`,
        detail: `A Contadoria Geral verificou a documentação e encaminhou o processo para análise pela ${divInfo.nome}.`,
      });

      toast.success(`Processo ${selectedProcesso.numero_processo} encaminhado à ${divInfo.nome}.`);
      setSelectedProcesso(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setConfirmDialogOpen(false);
    }
  };

  const filteredProcessos = processos.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.numero_processo.toLowerCase().includes(q) || p.entity_name.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");

  // ─── Detail view ───
  if (selectedProcesso) {
    const divInfo = divisaoDestino ? DIVISOES_ESTRUTURA[divisaoDestino] : null;

    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => setSelectedProcesso(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Button>

          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Triagem — {selectedProcesso.numero_processo}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verifique a documentação e encaminhe à divisão competente (3ª–8ª Divisão).
            </p>
          </div>

          {/* Process Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Dados do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Entidade</span>
                  <p className="font-medium">{selectedProcesso.entity_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Exercício</span>
                  <p className="font-medium">{selectedProcesso.ano_gerencia}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Categoria</span>
                  <p className="font-medium capitalize">{selectedProcesso.categoria_entidade.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Completude</span>
                  <p className="font-medium">{selectedProcesso.completude_documental}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documentos ({documentos.length})
                {allDocsVerified && (
                  <Badge className="ml-2 text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20" variant="outline">
                    ✓ Todos verificados
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentos.map((doc, idx) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="text-xs font-medium truncate max-w-[200px]">{doc.nome_ficheiro}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{doc.tipo_documento}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {doc.estado === "validado" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-400" />
                              )}
                              <span className="text-[10px] capitalize">{doc.estado}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Routing Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Encaminhamento à Divisão Competente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Divisão de Destino *</Label>
                  <Select value={divisaoDestino} onValueChange={setDivisaoDestino}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar divisão (3ª–8ª)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISOES.map(d => (
                        <SelectItem key={d} value={d}>
                          {DIVISOES_ESTRUTURA[d].nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {divInfo && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Secções disponíveis</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {divInfo.seccoes.map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Observações</Label>
                <Textarea
                  placeholder="Notas sobre a triagem ou instruções para a divisão..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              {divisaoDestino && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Resumo
                  </h4>
                  <p className="text-sm">
                    <strong>Destino:</strong> {DIVISOES_ESTRUTURA[divisaoDestino].nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O processo será encaminhado ao Chefe da {divisaoDestino} para análise e distribuição.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedProcesso(null)}>Cancelar</Button>
                <Button
                  disabled={!divisaoDestino || acting}
                  className="gap-2"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Encaminhar à Divisão
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Confirmar Encaminhamento
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Confirma o encaminhamento do processo <strong>{selectedProcesso?.numero_processo}</strong>?</p>
                <div className="mt-3 rounded bg-muted/50 p-3 text-sm">
                  <p><strong>Divisão:</strong> {divisaoDestino && DIVISOES_ESTRUTURA[divisaoDestino]?.nome}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEncaminhar} disabled={acting}>
                {acting ? "A processar..." : "Confirmar e Encaminhar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    );
  }

  // ─── List view ───
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Contadoria Geral — Triagem de Processos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique os processos recebidos do Escrivão dos Autos e encaminhe à divisão competente (3ª–8ª).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Aguardam Triagem</p>
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
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Perfil</p>
                  <p className="text-sm font-medium mt-1">{executadoPor}</p>
                  <p className="text-[10px] text-muted-foreground">Contadoria Geral</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProcessos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400/40 mb-3" />
              <p className="text-sm text-muted-foreground">Não existem processos pendentes de triagem.</p>
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
                    <TableHead className="text-xs">Etapa</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-right">Acção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcessos.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectProcesso(p)}>
                      <TableCell className="font-mono text-xs font-medium">{p.numero_processo}</TableCell>
                      <TableCell className="text-sm">{p.entity_name}</TableCell>
                      <TableCell className="text-sm">{p.ano_gerencia}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{p.categoria_entidade.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-[10px] bg-primary">Etapa {p.etapa_atual}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.data_submissao)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <GitBranch className="h-3 w-3" /> Triar
                        </Button>
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
