import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ListChecks, Kanban, BarChart3, Clock, AlertTriangle, CheckCircle, XCircle,
  Play, Pause, RotateCcw, Lock, Search, Filter, ChevronRight, CalendarDays,
  User, FileText, ArrowRight, Send, Eye, MessageSquare,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import {
  ESTADO_LABELS, PRIORIDADE_LABELS, atualizarEstadoAtividade,
  type AtividadeEstado, type AtividadePrioridade,
} from "@/lib/atividadeEngine";
import { WORKFLOW_STAGES } from "@/types/workflow";
import { toast } from "sonner";

interface Atividade {
  id: string;
  processo_id: string;
  etapa_fluxo: number;
  titulo: string;
  descricao: string;
  perfil_responsavel: string;
  utilizador_responsavel: string | null;
  prioridade: AtividadePrioridade;
  prazo: string | null;
  data_criacao: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  estado: AtividadeEstado;
  acao_esperada: string | null;
  documentos_necessarios: string[] | null;
  documentos_gerados: string[] | null;
  observacoes: string | null;
  canal_submissao: string | null;
  tipo_evento: string | null;
  categoria_entidade: string | null;
  ordem: number;
  created_at: string;
  // joined
  processo_numero?: string;
  entity_name?: string;
}

const estadoIcons: Record<string, typeof Clock> = {
  pendente: Clock,
  em_curso: Play,
  concluida: CheckCircle,
  devolvida: RotateCcw,
  bloqueada: Lock,
  cancelada: XCircle,
  aguardando_resposta: MessageSquare,
  aguardando_documentos: FileText,
  aguardando_validacao: Eye,
};

const KANBAN_COLUMNS: AtividadeEstado[] = [
  "pendente", "em_curso", "aguardando_resposta", "aguardando_documentos",
  "aguardando_validacao", "devolvida", "bloqueada", "concluida",
];

export default function Atividades() {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPerfil, setFiltroPerfil] = useState<string>(user?.role || "todos");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todas");
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [actionObs, setActionObs] = useState("");
  const [tab, setTab] = useState("fila");

  const fetchAtividades = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("atividades")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Enrich with process info
    const procIds = [...new Set((data || []).map((a: any) => a.processo_id).filter(Boolean))];
    let procMap: Record<string, { numero_processo: string; entity_name: string }> = {};
    if (procIds.length > 0) {
      const { data: procs } = await supabase
        .from("processos")
        .select("id, numero_processo, entity_name")
        .in("id", procIds);
      if (procs) {
        procs.forEach((p: any) => { procMap[p.id] = { numero_processo: p.numero_processo, entity_name: p.entity_name }; });
      }
    }

    const enriched = (data || []).map((a: any) => ({
      ...a,
      processo_numero: procMap[a.processo_id]?.numero_processo || "—",
      entity_name: procMap[a.processo_id]?.entity_name || "—",
    }));

    setAtividades(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAtividades(); }, [fetchAtividades]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("atividades-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "atividades" }, () => {
        fetchAtividades();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAtividades]);

  const perfis = useMemo(() => {
    const set = new Set(atividades.map(a => a.perfil_responsavel));
    return Array.from(set).sort();
  }, [atividades]);

  const filtered = useMemo(() => {
    return atividades.filter(a => {
      if (search && !a.titulo.toLowerCase().includes(search.toLowerCase()) && !a.descricao?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filtroEstado !== "todos" && a.estado !== filtroEstado) return false;
      if (filtroPerfil !== "todos" && a.perfil_responsavel !== filtroPerfil) return false;
      if (filtroEtapa !== "todas" && String(a.etapa_fluxo) !== filtroEtapa) return false;
      if (filtroPrioridade !== "todas" && a.prioridade !== filtroPrioridade) return false;
      return true;
    });
  }, [atividades, search, filtroEstado, filtroPerfil, filtroEtapa, filtroPrioridade]);

  // KPIs
  const kpis = useMemo(() => {
    const myAtividades = filtroPerfil !== "todos"
      ? atividades.filter(a => a.perfil_responsavel === filtroPerfil)
      : atividades;
    const total = myAtividades.length;
    const pendentes = myAtividades.filter(a => a.estado === "pendente").length;
    const emCurso = myAtividades.filter(a => a.estado === "em_curso").length;
    const concluidas = myAtividades.filter(a => a.estado === "concluida").length;
    const atrasadas = myAtividades.filter(a => a.prazo && new Date(a.prazo) < new Date() && !["concluida", "cancelada"].includes(a.estado)).length;
    const devolvidas = myAtividades.filter(a => a.estado === "devolvida").length;
    return { total, pendentes, emCurso, concluidas, atrasadas, devolvidas };
  }, [atividades, filtroPerfil]);

  const handleEstadoChange = async (atividade: Atividade, novoEstado: AtividadeEstado) => {
    const ok = await atualizarEstadoAtividade(
      atividade.id,
      novoEstado,
      user?.displayName || "Sistema",
      user?.role,
      actionObs || undefined
    );
    if (ok) {
      toast.success(`Atividade atualizada para "${ESTADO_LABELS[novoEstado].label}"`);
      setSelectedAtividade(null);
      setActionObs("");
      fetchAtividades();
    } else {
      toast.error("Erro ao atualizar atividade.");
    }
  };

  const isOverdue = (a: Atividade) => a.prazo && new Date(a.prazo) < new Date() && !["concluida", "cancelada"].includes(a.estado);
  const stageName = (id: number) => WORKFLOW_STAGES.find(s => s.id === id)?.nome || `Etapa ${id}`;

  const AtividadeCard = ({ a, compact = false }: { a: Atividade; compact?: boolean }) => {
    const Icon = estadoIcons[a.estado] || Clock;
    const est = ESTADO_LABELS[a.estado];
    const pri = PRIORIDADE_LABELS[a.prioridade];
    const overdue = isOverdue(a);

    return (
      <div
        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
          overdue ? "border-destructive/50 bg-destructive/5" : "hover:bg-muted/30"
        }`}
        onClick={() => setSelectedAtividade(a)}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-md ${est.bgColor}`}>
            <Icon className={`h-3.5 w-3.5 ${est.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{a.titulo}</p>
            {!compact && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.descricao}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.perfil_responsavel}</Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pri.color}`}>
                {pri.label}
              </Badge>
              {!compact && (
                <span className="text-[10px] text-muted-foreground">Etapa {a.etapa_fluxo}: {stageName(a.etapa_fluxo)}</span>
              )}
            </div>
            {a.prazo && (
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                <CalendarDays className="h-3 w-3" />
                {overdue && <AlertTriangle className="h-3 w-3" />}
                Prazo: {new Date(a.prazo).toLocaleDateString("pt-AO")}
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gestão de Atividades"
        description="Fila de trabalho, tarefas e pendências por perfil"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total", value: kpis.total, icon: ListChecks, color: "text-primary" },
          { label: "Pendentes", value: kpis.pendentes, icon: Clock, color: "text-amber-600" },
          { label: "Em Curso", value: kpis.emCurso, icon: Play, color: "text-blue-600" },
          { label: "Concluídas", value: kpis.concluidas, icon: CheckCircle, color: "text-green-600" },
          { label: "Atrasadas", value: kpis.atrasadas, icon: AlertTriangle, color: "text-destructive" },
          { label: "Devolvidas", value: kpis.devolvidas, icon: RotateCcw, color: "text-orange-600" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar atividades..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            {perfis.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            {WORKFLOW_STAGES.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.id}. {s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="fila" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Fila de Trabalho</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5"><Kanban className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
          <TabsTrigger value="kpis" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Dashboard KPIs</TabsTrigger>
        </TabsList>

        {/* FILA DE TRABALHO */}
        <TabsContent value="fila">
          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">A carregar atividades...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma atividade encontrada.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(a => <AtividadeCard key={a.id} a={a} />)}
            </div>
          )}
        </TabsContent>

        {/* KANBAN */}
        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map(col => {
              const colAtividades = filtered.filter(a => a.estado === col);
              const est = ESTADO_LABELS[col];
              const Icon = estadoIcons[col] || Clock;
              return (
                <div key={col} className="min-w-[280px] w-[280px] shrink-0">
                  <div className={`flex items-center gap-2 p-2.5 rounded-t-lg ${est.bgColor}`}>
                    <Icon className={`h-4 w-4 ${est.color}`} />
                    <span className={`text-sm font-semibold ${est.color}`}>{est.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{colAtividades.length}</Badge>
                  </div>
                  <div className="space-y-2 p-2 bg-muted/20 rounded-b-lg border border-t-0 min-h-[200px]">
                    {colAtividades.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">Sem atividades</p>
                    ) : (
                      colAtividades.map(a => <AtividadeCard key={a.id} a={a} compact />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* KPIs DASHBOARD */}
        <TabsContent value="kpis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Por perfil */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Atividades por Perfil</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {perfis.map(p => {
                  const count = atividades.filter(a => a.perfil_responsavel === p && !["concluida", "cancelada"].includes(a.estado)).length;
                  const atrasadas = atividades.filter(a => a.perfil_responsavel === p && isOverdue(a)).length;
                  return (
                    <div key={p} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setFiltroPerfil(p)}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{p}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {atrasadas > 0 && (
                          <Badge variant="destructive" className="text-[10px]">{atrasadas} atrasada{atrasadas > 1 ? "s" : ""}</Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">{count} pendente{count !== 1 ? "s" : ""}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Por etapa */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Atividades por Etapa</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {WORKFLOW_STAGES.filter(s => atividades.some(a => a.etapa_fluxo === s.id)).map(s => {
                  const count = atividades.filter(a => a.etapa_fluxo === s.id && !["concluida", "cancelada"].includes(a.estado)).length;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setFiltroEtapa(String(s.id))}>
                      <span className="text-sm">{s.id}. {s.nome}</span>
                      <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Por estado */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Kanban className="h-4 w-4 text-primary" /> Distribuição por Estado</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ESTADO_LABELS).map(([key, val]) => {
                  const count = atividades.filter(a => a.estado === key).length;
                  if (count === 0) return null;
                  const Icon = estadoIcons[key] || Clock;
                  return (
                    <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${val.color}`} />
                        <span className="text-sm">{val.label}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Atrasadas */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Atividades Atrasadas</CardTitle></CardHeader>
              <CardContent>
                {atividades.filter(a => isOverdue(a)).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem atividades atrasadas</p>
                ) : (
                  <div className="space-y-2">
                    {atividades.filter(a => isOverdue(a)).slice(0, 10).map(a => (
                      <AtividadeCard key={a.id} a={a} compact />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAtividade} onOpenChange={() => setSelectedAtividade(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAtividade && (() => {
            const a = selectedAtividade;
            const est = ESTADO_LABELS[a.estado];
            const pri = PRIORIDADE_LABELS[a.prioridade];
            const Icon = estadoIcons[a.estado] || Clock;
            const overdue = isOverdue(a);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${est.color}`} />
                    {a.titulo}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{a.descricao}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground mb-1">Estado</p>
                      <Badge className={`${est.bgColor} ${est.color} border-0`}>{est.label}</Badge>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground mb-1">Prioridade</p>
                      <span className={`text-sm font-semibold ${pri.color}`}>{pri.label}</span>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground mb-1">Perfil Responsável</p>
                      <span className="text-sm">{a.perfil_responsavel}</span>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground mb-1">Etapa</p>
                      <span className="text-sm">{a.etapa_fluxo}. {stageName(a.etapa_fluxo)}</span>
                    </div>
                    {a.prazo && (
                      <div className={`p-3 rounded-lg border ${overdue ? "border-destructive bg-destructive/5" : ""}`}>
                        <p className="text-[10px] text-muted-foreground mb-1">Prazo</p>
                        <span className={`text-sm ${overdue ? "text-destructive font-semibold" : ""}`}>
                          {new Date(a.prazo).toLocaleDateString("pt-AO")}
                          {overdue && " (ATRASADO)"}
                        </span>
                      </div>
                    )}
                    {a.processo_numero && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-[10px] text-muted-foreground mb-1">Processo</p>
                        <span className="text-sm font-mono">{a.processo_numero}</span>
                      </div>
                    )}
                  </div>

                  {a.acao_esperada && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-[10px] text-muted-foreground mb-1">Ação Esperada</p>
                      <p className="text-sm font-medium">{a.acao_esperada}</p>
                    </div>
                  )}

                  {a.documentos_gerados && a.documentos_gerados.length > 0 && (
                    <div className="p-3 rounded-lg border">
                      <p className="text-[10px] text-muted-foreground mb-1">Documentos a Gerar</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.documentos_gerados.map((d, i) => <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>)}
                      </div>
                    </div>
                  )}

                  {a.canal_submissao && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Send className="h-3 w-3" /> Canal: {a.canal_submissao === "presencial" ? "Presencial" : "Portal"}
                      {a.tipo_evento && <> · Evento: {a.tipo_evento}</>}
                    </div>
                  )}

                  {/* Actions */}
                  {!["concluida", "cancelada"].includes(a.estado) && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-xs">Observações (opcional)</Label>
                      <Textarea rows={2} value={actionObs} onChange={e => setActionObs(e.target.value)} placeholder="Notas sobre a ação..." />
                      <div className="flex flex-wrap gap-2">
                        {a.estado === "pendente" && (
                          <Button size="sm" className="gap-1.5" onClick={() => handleEstadoChange(a, "em_curso")}>
                            <Play className="h-3.5 w-3.5" /> Iniciar
                          </Button>
                        )}
                        {a.estado === "em_curso" && (
                          <Button size="sm" className="gap-1.5" onClick={() => handleEstadoChange(a, "concluida")}>
                            <CheckCircle className="h-3.5 w-3.5" /> Concluir
                          </Button>
                        )}
                        {!["concluida", "cancelada", "devolvida"].includes(a.estado) && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleEstadoChange(a, "devolvida")}>
                              <RotateCcw className="h-3.5 w-3.5" /> Devolver
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleEstadoChange(a, "bloqueada")}>
                              <Lock className="h-3.5 w-3.5" /> Bloquear
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleEstadoChange(a, "aguardando_documentos")}>
                              <FileText className="h-3.5 w-3.5" /> Aguardar Docs
                            </Button>
                          </>
                        )}
                        {a.estado === "devolvida" && (
                          <Button size="sm" className="gap-1.5" onClick={() => handleEstadoChange(a, "pendente")}>
                            <Play className="h-3.5 w-3.5" /> Reabrir
                          </Button>
                        )}
                        {a.estado === "bloqueada" && (
                          <Button size="sm" className="gap-1.5" onClick={() => handleEstadoChange(a, "pendente")}>
                            <Play className="h-3.5 w-3.5" /> Desbloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
