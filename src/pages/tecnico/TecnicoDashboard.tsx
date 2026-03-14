import { TecnicoLayout } from "@/components/TecnicoLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { mockFiscalYears, mockEntities } from "@/data/mockData";
import { FileBarChart, CheckCircle, Clock, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types";

const TecnicoDashboard = () => {
  const { entity } = usePortalEntity();

  const totalEntidades = mockEntities.length;
  const totalExercicios = mockFiscalYears.length;
  const pendentes = mockFiscalYears.filter((fy) => fy.status === "submetido" || fy.status === "em_analise").length;
  const conformes = mockFiscalYears.filter((fy) => fy.status === "conforme").length;

  return (
    <TecnicoLayout>
      <PageHeader
        title="Painel do Técnico Validador"
        description="Visão geral dos processos de prestação de contas atribuídos para análise."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Entidades" value={totalEntidades} subtitle="entidades no sistema" icon={<FileBarChart className="h-5 w-5" />} variant="primary" />
        <StatCard title="Exercícios" value={totalExercicios} subtitle="exercícios fiscais" icon={<BarChart3 className="h-5 w-5" />} variant="default" />
        <StatCard title="Pendentes de Análise" value={pendentes} subtitle="aguardam parecer" icon={<Clock className="h-5 w-5" />} variant="warning" />
        <StatCard title="Conformes" value={conformes} subtitle="aprovados" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Exercícios Pendentes de Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockFiscalYears
              .filter((fy) => fy.status === "submetido" || fy.status === "em_analise")
              .slice(0, 5)
              .map((fy) => {
                const ent = mockEntities.find((e) => e.id === fy.entityId);
                return (
                  <div key={fy.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{fy.entityName}</p>
                      <p className="text-xs text-muted-foreground">Exercício {fy.year} · {ent?.provincia}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {(STATUS_LABELS[fy.status] as { label: string; color: string })?.label || fy.status}
                      </Badge>
                      <Link to="/tecnico/prestacao-contas">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            {pendentes === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum exercício pendente de análise.</p>
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
