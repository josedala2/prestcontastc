import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, Users, Send, Loader2, Search, UserCheck, Crown, ClipboardList,
  Building2, Calendar, GitBranch, CheckCircle2, FileSearch,
} from "lucide-react";

/* ── técnicos demo por divisão/secção ── */
/* Keys MUST match DIVISOES_ESTRUTURA seccoes exactly */
const TECNICOS_POR_SECCAO: Record<string, { nome: string; especialidade: string }[]> = {
  // 3ª Divisão — Órgãos de Soberania e Afins
  "Secção A — Presidência e Assembleia": [
    { nome: "Dr. Bruno Nogueira", especialidade: "Auditoria Institucional" },
    { nome: "Dra. Catarina Dias", especialidade: "Fiscalização" },
    { nome: "Dr. Fábio Santos", especialidade: "Análise Patrimonial" },
  ],
  "Secção B — Tribunais e MP": [
    { nome: "Dra. Diana Cunha", especialidade: "Contabilidade Pública" },
    { nome: "Dr. Marco Teixeira", especialidade: "Auditoria" },
  ],
  // 4ª Divisão — Administração Central e Institutos
  "Secção A — Ministérios": [
    { nome: "Dr. Pedro Gonçalves", especialidade: "Auditoria" },
    { nome: "Dra. Margarida Pinto", especialidade: "Contabilidade" },
    { nome: "Dr. Tiago Ramos", especialidade: "Análise Orçamental" },
  ],
  "Secção B — Institutos Públicos": [
    { nome: "Dr. Gustavo Reis", especialidade: "Auditoria" },
    { nome: "Dra. Inês Machado", especialidade: "Contabilidade" },
    { nome: "Dr. Vasco Pereira", especialidade: "Controlo Interno" },
  ],
  // 5ª Divisão — Administração Local (Municípios)
  "Secção A — Administrações Municipais I": [
    { nome: "Dr. João Martins", especialidade: "Auditoria" },
    { nome: "Dra. Teresa Rocha", especialidade: "Fiscalização" },
    { nome: "Dr. Rui Fernandes", especialidade: "Análise Financeira" },
  ],
  "Secção B — Administrações Municipais II": [
    { nome: "Dr. Manuel Sousa", especialidade: "Contabilidade" },
    { nome: "Dra. Beatriz Lopes", especialidade: "Gestão Pública" },
    { nome: "Dra. Maria Santos", especialidade: "Fiscalização" },
  ],
  // 6ª Divisão — Sector Empresarial Público
  "Secção A — Empresas Públicas": [
    { nome: "Dra. Ana Ferreira", especialidade: "Auditoria Empresarial" },
    { nome: "Dr. Carlos Mendes", especialidade: "Contabilidade Empresarial" },
    { nome: "Dra. Luísa Tavares", especialidade: "Controlo Interno" },
  ],
  "Secção B — Sociedades Comerciais do Estado": [
    { nome: "Dr. Ricardo Sousa", especialidade: "Análise Financeira" },
    { nome: "Dra. Isabel Fernandes", especialidade: "Gestão de Risco" },
  ],
  "Secção C — Fundos e Serviços Autónomos": [
    { nome: "Dr. Nuno Alves", especialidade: "Avaliação Patrimonial" },
    { nome: "Dra. Sofia Cardoso", especialidade: "Fiscalização" },
  ],
  // 7ª Divisão — Serviços no Estrangeiro
  "Secção A — Embaixadas e Consulados": [
    { nome: "Dr. André Oliveira", especialidade: "Fiscalização" },
    { nome: "Dra. Filipa Costa", especialidade: "Gestão Financeira" },
  ],
  "Secção B — Missões e Representações": [
    { nome: "Dra. Helena Vieira", especialidade: "Análise Financeira" },
    { nome: "Dr. Duarte Fonseca", especialidade: "Gestão Pública" },
  ],
  // 8ª Divisão — Contas Especiais
  "Secção A — Contas Especiais I": [
    { nome: "Dr. Luís Barros", especialidade: "Fiscalização" },
    { nome: "Dra. Patrícia Melo", especialidade: "Contabilidade" },
  ],
  "Secção B — Contas Especiais II": [
    { nome: "Dr. António Silva", especialidade: "Auditoria Financeira" },
    { nome: "Dra. Cláudia Neves", especialidade: "Contabilidade Pública" },
  ],
};

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
}

export default function ChefeSeccaoDistribuicao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const divisao = user?.divisao || "3ª Divisão";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [search, setSearch] = useState("");

  // Team assignment state
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [chefeEquipa, setChefeEquipa] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Get the section for this chefe de secção from their user profile
  // For now, derive from the division's sections
  const seccoesDivisao = DIVISOES_ESTRUTURA[divisao]?.seccoes || [];

  // Get all technicians available in this division's sections
  const tecnicosDisponiveis = useMemo(() => {
    const all: { nome: string; especialidade: string; seccao: string }[] = [];
    for (const sec of seccoesDivisao) {
      const tecns = TECNICOS_POR_SECCAO[sec] || [];
      tecns.forEach(t => all.push({ ...t, seccao: sec }));
    }
    return all;
  }, [divisao]);

  useEffect(() => {
    fetchProcessos();
  }, [divisao]);

  async function fetchProcessos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 7)
      .eq("divisao_competente", DIVISOES_ESTRUTURA[divisao]?.nome || divisao)
      .order("data_submissao", { ascending: false });

    if (!error && data) {
      setProcessos(data as unknown as Processo[]);
    }
    setLoading(false);
  }

  function handleSelectProcesso(p: Processo) {
    setSelectedProcesso(p);
    setSelectedTecnicos([]);
    setChefeEquipa("");
    setPrioridade("normal");
    setObservacoes("");
  }

  function toggleTecnico(nome: string) {
    setSelectedTecnicos(prev => {
      const next = prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome];
      // If removing the chefe de equipa, clear it
      if (!next.includes(chefeEquipa)) setChefeEquipa("");
      return next;
    });
  }

  const canSubmit = selectedTecnicos.length >= 1 && chefeEquipa !== "";

  async function handleDistribuir() {
    if (!selectedProcesso || !user) return;
    setSubmitting(true);

    try {
      // Update processo with team info
      const { error: updErr } = await supabase
        .from("processos")
        .update({
          tecnico_analise: selectedTecnicos.join(", "),
          coordenador_equipa: chefeEquipa,
          urgencia: prioridade,
          seccao_competente: seccoesDivisao[0] || null,
        })
        .eq("id", selectedProcesso.id);

      if (updErr) throw updErr;

      const obsText = [
        `Equipa: ${selectedTecnicos.join(", ")}`,
        `Chefe de Equipa: ${chefeEquipa}`,
        `Prioridade: ${prioridade}`,
        observacoes ? `Obs: ${observacoes}` : "",
      ].filter(Boolean).join(" | ");

      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 8,
        novoEstado: "em_analise",
        executadoPor: user.displayName,
        perfilExecutor: "Chefe de Secção",
        observacoes: obsText,
      });

      await gerarAtividadesParaEvento("validacao_aprovada", selectedProcesso.id, {
        categoriaEntidade: selectedProcesso.categoria_entidade,
      });

      toast.success(`Processo ${selectedProcesso.numero_processo} distribuído à equipa com ${selectedTecnicos.length} técnico(s).`);
      setSelectedProcesso(null);
      setShowConfirm(false);
      fetchProcessos();
    } catch (err: any) {
      toast.error("Erro ao distribuir: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = processos.filter(p =>
    p.numero_processo.toLowerCase().includes(search.toLowerCase()) ||
    p.entity_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");

  const urgenciaColor = (u: string) => {
    if (u === "urgente") return "destructive";
    if (u === "alta") return "default";
    return "secondary";
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Secção — Distribuição de Processos
          </h1>
          <p className="text-muted-foreground mt-1">
            Forme a equipa de análise, seleccionando técnicos e nomeando o chefe de equipa.
          </p>
        </div>

        {selectedProcesso ? (
          /* ── DETAIL VIEW ── */
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelectedProcesso(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista
            </Button>

            {/* Process info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {selectedProcesso.numero_processo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entidade</span>
                    <p className="font-medium">{selectedProcesso.entity_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exercício</span>
                    <p className="font-medium">{selectedProcesso.ano_gerencia}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria</span>
                    <Badge variant="outline">{selectedProcesso.categoria_entidade.replace(/_/g, " ")}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Divisão</span>
                    <p className="font-medium">{selectedProcesso.divisao_competente || divisao}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Composição da Equipa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Seleccione os técnicos que integrarão a equipa de análise e indique quem será o <strong>Chefe de Equipa</strong> (obrigatório).
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Incluir</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Secção</TableHead>
                      <TableHead className="w-32 text-center">Chefe de Equipa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tecnicosDisponiveis.map((t) => {
                      const isSelected = selectedTecnicos.includes(t.nome);
                      const isChefeEquipa = chefeEquipa === t.nome;
                      return (
                        <TableRow key={t.nome} className={isSelected ? "bg-primary/5" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTecnico(t.nome)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{t.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{t.especialidade}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.seccao}</TableCell>
                          <TableCell className="text-center">
                            {isSelected && (
                              <Button
                                size="sm"
                                variant={isChefeEquipa ? "default" : "outline"}
                                className="h-7 text-xs gap-1"
                                onClick={() => setChefeEquipa(t.nome)}
                              >
                                <Crown className="h-3 w-3" />
                                {isChefeEquipa ? "Nomeado" : "Nomear"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {selectedTecnicos.length > 0 && (
                  <div className="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
                    <p><strong>Equipa ({selectedTecnicos.length}):</strong> {selectedTecnicos.join(", ")}</p>
                    {chefeEquipa && (
                      <p className="flex items-center gap-1 text-primary">
                        <Crown className="h-4 w-4" /> Chefe de Equipa: <strong>{chefeEquipa}</strong>
                      </p>
                    )}
                    {!chefeEquipa && (
                      <p className="text-destructive flex items-center gap-1">
                        ⚠ Deve nomear um chefe de equipa.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority & Observations */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade *</Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Instruções para a equipa, pontos de atenção..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelectedProcesso(null)}>Cancelar</Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={async () => {
                      if (!selectedProcesso || !user) return;
                      setSubmitting(true);
                      try {
                        await supabase.from("processos").update({
                          tecnico_analise: user.displayName,
                          coordenador_equipa: user.displayName,
                          responsavel_atual: user.displayName,
                        }).eq("id", selectedProcesso.id);
                        await avancarEtapaProcesso({
                          processoId: selectedProcesso.id,
                          novaEtapa: 8,
                          novoEstado: "em_analise",
                          executadoPor: user.displayName,
                          perfilExecutor: "Chefe de Secção",
                          observacoes: "Chefe de Secção assume como técnico de análise.",
                        });
                        await gerarAtividadesParaEvento("validacao_aprovada", selectedProcesso.id, {
                          categoriaEntidade: selectedProcesso.categoria_entidade,
                        });
                        toast.success(`Processo ${selectedProcesso.numero_processo} assumido.`);
                        navigate(`/analise-tecnica/${selectedProcesso.id}`);
                      } catch (err: any) {
                        toast.error(`Erro: ${err.message}`);
                      } finally { setSubmitting(false); }
                    }}
                  >
                    <FileSearch className="h-4 w-4" /> Trabalhar como Técnico
                  </Button>
                  <Button disabled={!canSubmit} onClick={() => setShowConfirm(true)}>
                    <Send className="h-4 w-4 mr-2" /> Distribuir à Equipa
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Confirm dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" /> Confirmar Distribuição
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm">
                      <p>Confirma a distribuição do processo <strong>{selectedProcesso.numero_processo}</strong>?</p>
                      <div className="rounded border p-3 bg-muted/50 space-y-1">
                        <p><strong>Equipa:</strong> {selectedTecnicos.join(", ")}</p>
                        <p className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-primary" />
                          <strong>Chefe de Equipa:</strong> {chefeEquipa}
                        </p>
                        <p><strong>Prioridade:</strong> {prioridade}</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDistribuir} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirmar e Distribuir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Aguardam Equipa</p>
                    <p className="text-3xl font-bold">{processos.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Técnicos Disponíveis</p>
                    <p className="text-3xl font-bold">{tecnicosDisponiveis.length}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground/40" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Perfil</p>
                    <p className="text-lg font-semibold">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">Chefe de Secção · {divisao}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nº processo ou entidade..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Não existem processos pendentes de distribuição.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Processo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Exercício</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Urgência</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Acção</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-medium">{p.numero_processo}</TableCell>
                          <TableCell>{p.entity_name}</TableCell>
                          <TableCell>{p.ano_gerencia}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{p.categoria_entidade.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={urgenciaColor(p.urgencia) as any}>{p.urgencia}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(p.data_submissao)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleSelectProcesso(p)}>
                              <Users className="h-4 w-4 mr-1" /> Formar Equipa
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
        )}
      </div>
    </AppLayout>
  );
}
