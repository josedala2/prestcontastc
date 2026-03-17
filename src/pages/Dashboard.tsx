import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES, WORKFLOW_ESTADOS, CATEGORIAS_ENTIDADE } from "@/types/workflow";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from "recharts";
import {
  Building2, FileText, Clock, AlertTriangle, CheckCircle2, Send,
  TrendingUp, GitBranch, Bell, Eye, ArrowRight, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, roleStagePermissions } from "@/contexts/AuthContext";
import { DashboardNotificacoesPanel } from "@/components/DashboardNotificacoesPanel";

// Chart colors using HSL from design system
const COLORS = [
  "hsl(213, 100%, 18%)",  // primary
  "hsl(37, 56%, 52%)",    // accent/warning
  "hsl(152, 56%, 38%)",   // success
  "hsl(0, 72%, 50%)",     // destructive
  "hsl(213, 80%, 45%)",   // info
  "hsl(243, 31%, 22%)",   // secondary
  "hsl(280, 60%, 50%)",   // purple
  "hsl(180, 50%, 40%)",   // teal
];

interface ProcessoDB {
  id: string;
  numero_processo: string;
  entity_name: string;
  categoria_entidade: string;
  ano_gerencia: number;
  canal_entrada: string;
  urgencia: string;
  etapa_atual: number;
  estado: string;
  data_submissao: string;
  completude_documental: number;
}

interface HistoricoDB {
  id: string;
  processo_id: string;
  acao: string;
  executado_por: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { notifications } = useSubmissions();
  const [processos, setProcessos] = useState<ProcessoDB[]>([]);
  const [historico, setHistorico] = useState<HistoricoDB[]>([]);
  const [actas, setActas] = useState<any[]>([]);
  const [pareceres, setPareceres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [procRes, histRes, actasRes, parecRes] = await Promise.all([
        supabase.from("processos").select("*").order("created_at", { ascending: false }),
        supabase.from("processo_historico").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("actas_recepcao").select("*"),
        supabase.from("pareceres").select("*"),
      ]);
      setProcessos((procRes.data as any[]) || []);
      setHistorico((histRes.data as any[]) || []);
      setActas(actasRes.data || []);
      setPareceres(parecRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  // === Computed Stats ===
  const stats = useMemo(() => {
    const total = processos.length;
    const emTramitacao = processos.filter(p => !["arquivado"].includes(p.estado)).length;
    const urgentes = processos.filter(p => p.urgencia === "urgente").length;
    const arquivados = processos.filter(p => p.estado === "arquivado").length;
    const contaEmTermos = processos.filter(p => p.estado === "conta_em_termos").length;
    const contaNaoEmTermos = processos.filter(p => p.estado === "conta_nao_em_termos").length;
    const unreadNotifs = notifications.filter(n => !n.read).length;
    return { total, emTramitacao, urgentes, arquivados, contaEmTermos, contaNaoEmTermos, unreadNotifs };
  }, [processos, notifications]);

  // === Chart Data ===

  // Processos por etapa
  const etapaData = useMemo(() => {
    const counts: Record<number, number> = {};
    processos.forEach(p => { counts[p.etapa_atual] = (counts[p.etapa_atual] || 0) + 1; });
    return WORKFLOW_STAGES.map(s => ({
      name: `${s.id}`,
      fullName: s.nome,
      value: counts[s.id] || 0,
    })).filter(d => d.value > 0 || d.name <= "5");
  }, [processos]);

  // Processos por estado
  const estadoData = useMemo(() => {
    const counts: Record<string, number> = {};
    processos.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; });
    return WORKFLOW_ESTADOS
      .map(e => ({ name: e.label, value: counts[e.value] || 0 }))
      .filter(d => d.value > 0);
  }, [processos]);

  // Processos por categoria
  const categoriaData = useMemo(() => {
    const counts: Record<string, number> = {};
    processos.forEach(p => { counts[p.categoria_entidade] = (counts[p.categoria_entidade] || 0) + 1; });
    return CATEGORIAS_ENTIDADE.map((c, i) => ({
      name: `Cat. ${i + 1}`,
      fullName: c.nome,
      value: counts[c.id] || 0,
    })).filter(d => d.value > 0);
  }, [processos]);

  // Canal de entrada
  const canalData = useMemo(() => {
    const portal = processos.filter(p => p.canal_entrada === "portal").length;
    const presencial = processos.filter(p => p.canal_entrada === "presencial").length;
    return [
      { name: "Portal", value: portal },
      { name: "Presencial", value: presencial },
    ].filter(d => d.value > 0);
  }, [processos]);

  // Processos por mês (últimos 6 meses)
  const mensalData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }
    processos.forEach(p => {
      const d = new Date(p.data_submissao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([key, value]) => {
      const [y, m] = key.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return { name: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`, value };
    });
  }, [processos]);

  // Recent processes for list
  const recentProcessos = processos.slice(0, 8);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold text-foreground">{payload[0]?.payload?.fullName || label}</p>
          <p className="text-sm text-primary font-bold">{payload[0].value} processo(s)</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">A carregar dashboard...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Painel de Fiscalização — Tribunal de Contas de Angola"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard icon={<FileText />} label="Total Processos" value={stats.total} color="text-primary" bg="bg-primary/10" />
        <KPICard icon={<GitBranch />} label="Em Tramitação" value={stats.emTramitacao} color="text-purple-600" bg="bg-purple-100" />
        <KPICard icon={<AlertTriangle />} label="Urgentes" value={stats.urgentes} color="text-orange-600" bg="bg-orange-100" />
        <KPICard icon={<CheckCircle2 />} label="Conta em Termos" value={stats.contaEmTermos} color="text-green-600" bg="bg-green-100" />
        <KPICard icon={<Bell />} label="Notificações" value={stats.unreadNotifs} color="text-blue-600" bg="bg-blue-100" />
        <KPICard icon={<Activity />} label="Actas Emitidas" value={actas.length} color="text-amber-600" bg="bg-amber-100" />
      </div>

      {/* Row 1: Bar chart + Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Processos por etapa */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" /> Processos por Etapa do Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {etapaData.length === 0 ? (
              <EmptyState message="Sem processos registados" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={etapaData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 15%, 85%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(213, 20%, 45%)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(213, 20%, 45%)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="hsl(213, 100%, 18%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estado dos processos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Estado dos Processos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadoData.length === 0 ? (
              <EmptyState message="Sem dados" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {estadoData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Area chart + Canal + Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Evolução mensal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mensalData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 15%, 85%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(213, 20%, 45%)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(213, 20%, 45%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="hsl(213, 100%, 18%)" fill="hsl(213, 100%, 18%)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Canal de entrada */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Canal de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canalData.length === 0 ? (
              <EmptyState message="Sem dados" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={canalData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="hsl(213, 80%, 45%)" />
                    <Cell fill="hsl(37, 56%, 52%)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por categoria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaData.length === 0 ? (
              <EmptyState message="Sem dados" />
            ) : (
              <div className="space-y-3 pt-2">
                {categoriaData.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{c.name}</span>
                      <span className="text-xs font-bold text-primary">{c.value}</span>
                    </div>
                    <Progress value={stats.total > 0 ? (c.value / stats.total) * 100 : 0} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.fullName}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent processes + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos processos */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Últimos Processos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/gestao-processos")}>
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProcessos.length === 0 ? (
              <EmptyState message="Nenhum processo registado" />
            ) : (
              <div className="space-y-2">
                {recentProcessos.map(p => {
                  const etapa = WORKFLOW_STAGES.find(s => s.id === p.etapa_atual);
                  const estado = WORKFLOW_ESTADOS.find(e => e.value === p.estado);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/gestao-processos/${p.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{p.numero_processo}</span>
                          <span className="text-xs text-muted-foreground truncate">{p.entity_name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Etapa {p.etapa_atual}: {etapa?.nome}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]", estado?.color)}>
                        {estado?.label || p.estado}
                      </Badge>
                      {p.urgencia === "urgente" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividade recente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Actividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historico.length === 0 && notifications.length === 0 ? (
              <EmptyState message="Sem actividade recente" />
            ) : (
              <div className="space-y-2">
                {/* Mix historico + notifications, sorted by date */}
                {[
                  ...historico.slice(0, 8).map(h => ({
                    id: h.id,
                    text: h.acao,
                    by: h.executado_por,
                    date: h.created_at,
                    type: "historico" as const,
                  })),
                  ...notifications.slice(0, 5).map(n => ({
                    id: n.id,
                    text: n.message,
                    by: n.entityId,
                    date: n.createdAt,
                    type: "notif" as const,
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map(item => (
                    <div key={item.id} className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        item.type === "historico" ? "bg-primary/10" : "bg-amber-100"
                      )}>
                        {item.type === "historico"
                          ? <GitBranch className="h-3 w-3 text-primary" />
                          : <Bell className="h-3 w-3 text-amber-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-tight">{item.text}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{item.by}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Pareceres + Actas summary */}
      {(pareceres.length > 0 || actas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {pareceres.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">📋 Pareceres Emitidos ({pareceres.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pareceres.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div>
                        <p className="text-xs font-medium">{p.entity_name}</p>
                        <p className="text-[10px] text-muted-foreground">Exercício {p.fiscal_year} — {p.tecnico_nome}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]",
                        p.parecer_final?.includes("Termos") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {p.parecer_final}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {actas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">📄 Actas de Recepção ({actas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {actas.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div>
                        <p className="text-xs font-medium">{a.entity_name}</p>
                        <p className="text-[10px] text-muted-foreground">{a.acta_numero} — {a.fiscal_year}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("pt-AO")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  );
};

// Sub-components
const KPICard = ({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) => (
  <Card>
    <CardContent className="pt-4 pb-3 px-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bg)}>
          <div className={cn("h-5 w-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">{message}</div>
);

export default Dashboard;
