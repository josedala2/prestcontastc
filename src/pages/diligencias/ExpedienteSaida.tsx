import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Truck } from "lucide-react";

export default function ExpedienteSaida() {
  return (
    <WorkflowStagePage config={{
      etapa: 17,
      title: "Expediente de Saída",
      subtitle: "Notifique presencialmente a entidade e emita a certidão de diligência.",
      icon: Truck,
      perfilExecutor: "Oficial de Diligências",
      actions: [
        { label: "Notificação Concluída — Avançar", nextEtapa: 18, nextEstado: "notificado", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
