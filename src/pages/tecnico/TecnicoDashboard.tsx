import { useState, useEffect } from "react";
import { TecnicoLayout } from "@/components/TecnicoLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEntities } from "@/hooks/useEntities";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { obterEstatisticasDashboard, obterEstatisticasPorPerfil } from "@/hooks/useBackendFunctions";
import { FileBarChart, CheckCircle, Clock, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Processo {
  id: string;
  numero_processo: string;
  entity_id: string;
  entity_name: string;
  ano_gerencia: number;
  categoria_entidade: string;
  estado: string;
  etapa_atual: number;
  urgencia: string;
  data_submissao: string;
}

const TecnicoDashboard = () => {
  const { entities: allEntities } = useEntities();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const prefix = location.startsWith("/contadoria") ? "/contadoria" : "/tecnico";
  const isContadoria = prefix === "/contadoria";
  const [rpcStats, setRpcStats] = useState<any>(null);
  const [perfilStats, setPerfilStats] = useState<any>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loadingProcessos, setLoadingProcessos] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, perfil] = await Promise.all([
          obterEstatisticasDashboard(),
          obterEstatisticasPorPerfil("Técnico de Análise"),
        ]);
        setRpcStats(dashboard);
        setPerfilStats(perfil);
      } catch (err) {
        console.error("[TecnicoDashboard] Erro RPC:", err);
      }
    };
    load();
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoadingProcessos(true);
    const { data, error } = await supabase
      .from("processos")
      .select("id, numero_processo, entity_id, entity_name, ano_gerencia, categoria_entidade, estado, etapa_atual, urgencia, data_submissao")
      .eq("etapa_atual", 8)
      .order("data_submissao", { ascending: false });
    if (!error && data) {
      setProcessos(data as Processo[]);
    }
    setLoadingProcessos(false);
  };

  return (
    <TecnicoLayout>
      <PageHeader
        title={isContadoria ? "Painel da Contadoria Geral" : "Painel do Técnico Validador"}
        description={isContadoria
          ? "Verificação documental detalhada dos processos encaminhados pela Secretaria (Etapa 4)."
          : "Visão geral dos processos de prestação de contas atribuídos para análise."}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Em Análise" value={processos.length} subtitle="processos atribuídos" icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard title="Total Processos" value={rpcStats?.total_processos ?? 0} subtitle="no sistema" icon={<FileBarChart className="h-5 w-5" />} variant="primary" />
        <StatCard title="Concluídas" value={perfilStats?.concluidas ?? 0} subtitle="atividades do perfil" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
        <StatCard title="Atrasadas" value={perfilStats?.atrasadas ?? 0} subtitle="atividades atrasadas" icon={<AlertTriangle className="h-5 w-5" />} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Processos Atribuídos para Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingProcessos ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">A carregar processos...</p>
              </div>
            ) : processos.length > 0 ? (
              processos.map((p) => {
                const ent = allEntities.find((e) => e.id === p.entity_id);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/analise-tecnica/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.entity_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Proc. {p.numero_processo} · Exercício {p.ano_gerencia} · {ent?.provincia || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Em Análise</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum processo pendente de análise.</p>
                <p className="text-xs mt-1">Os processos aparecerão aqui quando a Secretaria os remeter para validação técnica.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem alertas pendentes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TecnicoLayout>
  );
};

export default TecnicoDashboard;
