import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useFiscalYears } from "@/hooks/useFiscalYears";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Eye, FileText, Download } from "lucide-react";

const PortalExercicios = () => {
  const navigate = useNavigate();
  const { entityId } = usePortalEntity();
  const { fiscalYears: entityExercicios, loading } = useFiscalYears(entityId);

  return (
    <PortalLayout>
      <PageHeader title="Exercícios Fiscais" description="Balancete e documentos submetidos por exercício" />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">A carregar exercícios...</div>
      ) : (
        <div className="space-y-6">
          {entityExercicios.map((fy) => (
            <Card key={fy.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Exercício {fy.year}</CardTitle>
                    <StatusBadge
                      status={STATUS_LABELS[fy.status].label}
                      variant={STATUS_LABELS[fy.status].color as any}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/portal/exercicios/${fy.id}`)}>
                    <Eye className="h-3.5 w-3.5" /> Ver Balancete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Período: {fy.startDate} a {fy.endDate} · Prazo: {fy.deadline}
                  {fy.submittedAt && ` · Submetido: ${fy.submittedAt}`}
                </p>
              </CardContent>
            </Card>
          ))}
          {entityExercicios.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Sem exercícios registados para esta entidade.</div>
          )}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalExercicios;
