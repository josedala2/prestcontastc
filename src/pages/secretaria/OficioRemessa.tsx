import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Mail } from "lucide-react";

export default function OficioRemessa() {
  return (
    <WorkflowStagePage config={{
      etapa: 16,
      title: "Ofício de Remessa",
      subtitle: "Prepare e envie o ofício de remessa à entidade com a decisão do Tribunal.",
      icon: Mail,
      perfilExecutor: "Técnico da Secretaria-Geral",
      actions: [
        { label: "Ofício Enviado — Avançar", nextEtapa: 17, nextEstado: "notificado", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
