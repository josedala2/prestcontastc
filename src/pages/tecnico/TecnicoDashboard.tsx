import { TecnicoLayout } from "@/components/TecnicoLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { mockEntities } from "@/data/mockData";
import { FileBarChart, CheckCircle, Clock, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const { submissions } = useSubmissions();

  const emAnalise = submissions.filter((s) => s.status === "em_analise");

  return (
    <TecnicoLayout>
      <PageHeader
        title="Painel do Técnico Validador"
        description="Visão geral dos processos de prestação de contas atribuídos para análise."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Em Análise" value={emAnalise.length} subtitle="processos atribuídos" icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard title="Entidades" value={mockEntities.length} subtitle="entidades no sistema" icon={<FileBarChart className="h-5 w-5" />} variant="primary" />
        <StatCard title="Concluídos" value={0} subtitle="pareceres emitidos" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
        <StatCard title="Alertas" value={0} subtitle="pendentes" icon={<AlertTriangle className="h-5 w-5" />} variant="default" />
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
            {emAnalise.length > 0 ? (
              emAnalise.map((s) => {
                const ent = mockEntities.find((e) => e.id === s.entityId);
                const year = s.fiscalYearId.split("-").pop() || "";
                return (
                  <div key={s.fiscalYearId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{ent?.name || s.entityId}</p>
                      <p className="text-xs text-muted-foreground">Exercício {year} · {ent?.provincia}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Em Análise</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => navigate(`/tecnico/prestacao-contas?entityId=${s.entityId}&exercicio=${year}`)}
                      >
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
