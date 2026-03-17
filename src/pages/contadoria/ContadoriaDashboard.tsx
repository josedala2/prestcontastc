import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ContadoriaLayout } from "@/components/ContadoriaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  FileSearch, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Inbox, Send, Bell, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { obterEstatisticasDashboard, obterEstatisticasPorPerfil } from "@/hooks/useBackendFunctions";

interface ProcessoPendente {
  id: string;
  numero_processo: string;
  entity_name: string;
  categoria_entidade: string;
  ano_gerencia: number;
  etapa_atual: number;
  estado: string;
  data_submissao: string;
  completude_documental: number;
  responsavel_atual: string | null;
}

interface Notificacao {
  id: string;
  message: string;
  detail: string | null;
  type: string;
  created_at: string;
  read: boolean;
  entity_name: string;
  fiscal_year: string;
}

const ContadoriaDashboard = () => {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<ProcessoPendente[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [perfilStats, setPerfilStats] = useState<any>(null);

  const unreadCount = useMemo(() => notificacoes.filter((n) => !n.read).length, [notificacoes]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProcessos(),
        fetchNotificacoes(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessos = async () => {
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 4)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProcessos(data as ProcessoPendente[]);
    }
  };

  const fetchNotificacoes = async () => {
    const { data, error } = await supabase
      .from("submission_notifications")
      .select("*")
      .in("type", ["encaminhamento_validacao", "encaminhamento_contadoria", "submissao"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotificacoes(data as Notificacao[]);
    }
  };

  const fetchStats = async () => {
    try {
      const [dashStats, pStats] = await Promise.all([
        obterEstatisticasDashboard(),
        obterEstatisticasPorPerfil("Técnico da Contadoria Geral"),
      ]);
      setStats(dashStats);
      setPerfilStats(pStats);
    } catch (e) {
      console.error("Stats error:", e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("submission_notifications").update({ read: true }).eq("id", id);
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const pendentes = processos.filter((p) => p.estado === "em_validacao" || p.estado === "em_verificacao");
  const concluidos = processos.filter((p) => p.estado === "verificado");

  return (
    <ContadoriaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Painel da Contadoria Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verificação documental detalhada dos processos encaminhados pela Secretaria (Etapa 4)
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{processos.length}</p>
                  <p className="text-[11px] text-muted-foreground">Processos na Etapa 4</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendentes.length}</p>
                  <p className="text-[11px] text-muted-foreground">Pendentes Verificação</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{concluidos.length}</p>
                  <p className="text-[11px] text-muted-foreground">Verificados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{perfilStats?.atrasadas || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Atrasadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {unreadCount > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notificações Recentes
                <Badge variant="destructive" className="text-[10px] h-5 ml-1">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              {notificacoes.filter((n) => !n.read).slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className="flex items-start gap-3 p-2.5 rounded-md bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  <Send className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.message}</p>
                    {n.detail && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{n.detail}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Processos Table */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Processos Encaminhados para Verificação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : processos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum processo pendente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os processos encaminhados pela Secretaria aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nº Processo</TableHead>
                      <TableHead className="text-xs">Entidade</TableHead>
                      <TableHead className="text-xs">Ano</TableHead>
                      <TableHead className="text-xs">Completude</TableHead>
                      <TableHead className="text-xs">Estado</TableHead>
                      <TableHead className="text-xs">Data Submissão</TableHead>
                      <TableHead className="text-xs w-[100px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processos.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-mono font-medium">{p.numero_processo}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{p.entity_name}</TableCell>
                        <TableCell className="text-xs">{p.ano_gerencia}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={p.completude_documental >= 100 ? "default" : "secondary"} className="text-[10px]">
                            {p.completude_documental}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              p.estado === "verificado"
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50 text-[10px]"
                                : "border-amber-500 text-amber-700 bg-amber-50 text-[10px]"
                            }
                          >
                            {p.estado === "verificado" ? "Verificado" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(p.data_submissao), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => navigate(`/gestao-processos/${p.id}`)}
                          >
                            <ArrowRight className="h-3 w-3" />
                            Verificar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ContadoriaLayout>
  );
};

export default ContadoriaDashboard;
