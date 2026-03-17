import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Archive } from "lucide-react";

export default function Arquivamento() {
  return (
    <WorkflowStagePage config={{
      etapa: 18,
      title: "Arquivamento",
      subtitle: "Confirme a conclusão do processo e proceda ao arquivamento definitivo.",
      icon: Archive,
      perfilExecutor: "Juiz Relator",
      actions: [
        { label: "Arquivar Processo", nextEtapa: 18, nextEstado: "arquivado", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
