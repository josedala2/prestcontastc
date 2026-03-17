import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Scale } from "lucide-react";

export default function DespachoMinisterioPublico() {
  return (
    <WorkflowStagePage config={{
      etapa: 14,
      title: "Despacho do Ministério Público",
      subtitle: "Analise o processo e emita o despacho de promoção do Ministério Público.",
      icon: Scale,
      perfilExecutor: "Ministério Público",
      actions: [
        { label: "Emitir Despacho e Devolver", nextEtapa: 15, nextEstado: "em_analise", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
