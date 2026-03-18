import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Users, Send, CheckCircle2, Loader2, FolderOpen,
  Calendar, GitBranch, UserCheck, ClipboardList, Search, FileText, Eye,
  Download, File, FileSpreadsheet, FileImage,
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

const DIVISOES = [
  "1.ª Divisão — Órgãos de Soberania",
  "2.ª Divisão — Administração Central",
  "3.ª Divisão — Administração Local",
  "4.ª Divisão — Sector Empresarial Público",
];

const SECCOES: Record<string, string[]> = {
  "1.ª Divisão — Órgãos de Soberania": ["Secção A — Presidência e Assembleia", "Secção B — Ministérios I", "Secção C — Ministérios II"],
  "2.ª Divisão — Administração Central": ["Secção A — Institutos Públicos", "Secção B — Fundos Autónomos", "Secção C — Serviços Integrados"],
  "3.ª Divisão — Administração Local": ["Secção A — Governos Provinciais", "Secção B — Administrações Municipais"],
  "4.ª Divisão — Sector Empresarial Público": ["Secção A — Empresas Públicas", "Secção B — Sociedades Comerciais do Estado"],
};

const COORDENADORES = [
  "Dr. Carlos Mendes",
  "Dra. Isabel Fernandes",
  "Dr. Ricardo Sousa",
  "Dra. Marta Oliveira",
  "Dr. José Tavares",
];

export default function ChefeDivisaoProcessos() {
  const { user } = useAuth();
  const executadoPor = user?.displayName || "Chefe de Divisão";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");

  // Assignment form
  const [divisao, setDivisao] = useState("");
  const [seccao, setSeccao] = useState("");
  const [coordenador, setCoordenador] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 6)
      .order("created_at", { ascending: false });
    setProcessos((data as any[]) || []);
    setLoading(false);
  };

  const handleSelectProcesso = (p: Processo) => {
    setSelectedProcesso(p);
    setDivisao(p.divisao_competente || "");
    setSeccao(p.seccao_competente || "");
    setCoordenador(p.coordenador_equipa || "");
    setObservacoes("");
  };

  const handleEncaminhar = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      // 1. Update processo with divisão, secção, coordenador
      const { error: updateErr } = await supabase
        .from("processos")
        .update({
          divisao_competente: divisao,
          seccao_competente: seccao,
          coordenador_equipa: coordenador,
          responsavel_atual: coordenador || executadoPor,
        })
        .eq("id", selectedProcesso.id);

      if (updateErr) throw updateErr;

      // 2. Advance to stage 7 (Secção Competente)
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 7,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Chefe de Divisão",
        observacoes: `Processo encaminhado à ${divisao} / ${seccao}. Coordenador: ${coordenador}. ${observacoes}`.trim(),
      });

      // 3. Generate activities for the next stage
      await gerarAtividadesParaEvento(
        "validacao_aprovada",
        selectedProcesso.id,
        { categoriaEntidade: selectedProcesso.categoria_entidade }
      );

      toast.success(`Processo ${selectedProcesso.numero_processo} encaminhado à secção competente.`);
      setSelectedProcesso(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setConfirmDialogOpen(false);
    }
  };

  const canEncaminhar = divisao && seccao && coordenador;

  const filteredProcessos = processos.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.numero_processo.toLowerCase().includes(q) || p.entity_name.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");

  const urgenciaColor = (u: string) => {
    if (u === "urgente") return "destructive";
    if (u === "alta") return "default";
    return "secondary";
  };

  // ──── Detail View ────
  if (selectedProcesso) {
    const availableSeccoes = SECCOES[divisao] || [];

    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => setSelectedProcesso(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Encaminhamento — {selectedProcesso.numero_processo}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Receba o processo e encaminhe à secção competente, nomeando o coordenador de equipa.
              </p>
            </div>
            <Badge variant={urgenciaColor(selectedProcesso.urgencia)} className="text-xs">
              {selectedProcesso.urgencia === "urgente" ? "URGENTE" : selectedProcesso.urgencia === "alta" ? "Alta Prioridade" : "Normal"}
            </Badge>
          </div>

          {/* Process Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Dados do Processo
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
                  <span className="text-muted-foreground text-xs">Data Submissão</span>
                  <p className="font-medium">{formatDate(selectedProcesso.data_submissao)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Completude</span>
                  <p className="font-medium">{selectedProcesso.completude_documental}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Canal</span>
                  <p className="font-medium capitalize">{selectedProcesso.canal_entrada}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Categoria</span>
                  <p className="font-medium">{selectedProcesso.categoria_entidade.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Estado</span>
                  <Badge variant="outline" className="text-[10px]">{selectedProcesso.estado}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Etapa</span>
                  <Badge className="text-[10px] bg-primary">Etapa 6 — Divisão Competente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Encaminhamento e Nomeação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Divisão Competente *</Label>
                  <Select value={divisao} onValueChange={(v) => { setDivisao(v); setSeccao(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar divisão" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISOES.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Secção Competente *</Label>
                  <Select value={seccao} onValueChange={setSeccao} disabled={!divisao}>
                    <SelectTrigger>
                      <SelectValue placeholder={divisao ? "Seleccionar secção" : "Seleccione uma divisão"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeccoes.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Coordenador de Equipa *</Label>
                  <Select value={coordenador} onValueChange={setCoordenador}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nomear coordenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {COORDENADORES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Observações</Label>
                <Textarea
                  placeholder="Instruções adicionais para o coordenador de equipa..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Summary */}
              {canEncaminhar && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Resumo do Encaminhamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-[10px]">Divisão</span>
                      <p className="font-medium text-xs">{divisao}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Secção</span>
                      <p className="font-medium text-xs">{seccao}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Coordenador</span>
                      <p className="font-medium text-xs">{coordenador}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedProcesso(null)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!canEncaminhar || acting}
                  className="gap-2"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Encaminhar à Secção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Confirmar Encaminhamento
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Confirma o encaminhamento do processo <strong>{selectedProcesso?.numero_processo}</strong>?</p>
                <div className="mt-3 rounded bg-muted/50 p-3 text-sm space-y-1">
                  <p><strong>Divisão:</strong> {divisao}</p>
                  <p><strong>Secção:</strong> {seccao}</p>
                  <p><strong>Coordenador:</strong> {coordenador}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O processo avançará para a Etapa 7 — Secção Competente.
                </p>
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

  // ──── List View ────
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Divisão Competente — Etapa 6
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receba os processos autuados e encaminhe à secção competente, nomeando o coordenador de equipa.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Aguardam Encaminhamento</p>
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
                  <p className="text-[10px] text-muted-foreground">Chefe de Divisão</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nº processo ou entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProcessos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-success/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum processo encontrado." : "Não existem processos pendentes de encaminhamento."}
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
                    <TableHead className="text-xs">Data Submissão</TableHead>
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
                        <Badge variant="outline" className="text-[10px]">
                          {p.categoria_entidade.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={urgenciaColor(p.urgencia)} className="text-[10px]">
                          {p.urgencia}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.data_submissao)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <GitBranch className="h-3 w-3" /> Encaminhar
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
