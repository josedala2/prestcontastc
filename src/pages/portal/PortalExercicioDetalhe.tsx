import { useParams, useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears } from "@/data/mockData";
import { STATUS_LABELS } from "@/types";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { BalancoPatrimonial } from "@/components/BalancoPatrimonial";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const PortalExercicioDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entityId } = usePortalEntity();

  const entityExercicios = mockFiscalYears.filter((fy) => fy.entityId === entityId);
  const fy = entityExercicios.find((f) => f.id === id);

  if (!fy) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Exercício não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/portal/exercicios")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const daysLeft = Math.ceil((new Date(fy.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0 && !["conforme", "nao_conforme", "submetido", "em_analise", "com_pedidos"].includes(fy.status);

  return (
    <PortalLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-3" onClick={() => navigate("/portal/exercicios")}>
          <ArrowLeft className="h-4 w-4" /> Voltar aos Exercícios
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">Exercício {fy.year}</h1>
              <StatusBadge status={STATUS_LABELS[fy.status].label} variant={STATUS_LABELS[fy.status].color as any} />
            </div>
            <p className="text-sm text-muted-foreground">Período: {fy.startDate} a {fy.endDate}</p>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Prazo: {fy.deadline}
            </div>
            {isOverdue && (
              <span className="text-destructive font-semibold flex items-center gap-1 justify-end mt-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {Math.abs(daysLeft)} dias em atraso
              </span>
            )}
            {fy.submittedAt && (
              <span className="text-success flex items-center gap-1 justify-end mt-1">
                <CheckCircle className="h-3.5 w-3.5" /> Submetido: {fy.submittedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balancete submetido */}
      <BalancoPatrimonial entityId={fy.entityId} fiscalYearId={fy.id} year={fy.year} />
    </PortalLayout>
  );
};

export default PortalExercicioDetalhe;
