import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { FileText } from "lucide-react";

export default function CumprimentoDespachos() {
  return (
    <WorkflowStagePage config={{
      etapa: 15,
      title: "Cumprimento de Despachos",
      subtitle: "Execute os despachos emitidos, gere os termos necessários e junte documentos ao processo.",
      icon: FileText,
      perfilExecutor: "Escrivão dos Autos",
      actions: [
        { label: "Despachos Cumpridos — Avançar", nextEtapa: 16, nextEstado: "notificado", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
