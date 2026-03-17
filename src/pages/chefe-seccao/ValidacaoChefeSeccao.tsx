import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { CheckSquare } from "lucide-react";

export default function ValidacaoChefeSeccao() {
  return (
    <WorkflowStagePage config={{
      etapa: 9,
      title: "Validação do Chefe de Secção",
      subtitle: "Revise e valide o parecer técnico antes de encaminhar ao Chefe de Divisão.",
      icon: CheckSquare,
      perfilExecutor: "Chefe de Secção",
      actions: [
        { label: "Aprovar e Encaminhar", nextEtapa: 10, nextEstado: "em_validacao", evento: "validacao_aprovada" },
        { label: "Devolver para Aperfeiçoamento", nextEtapa: 8, nextEstado: "pendente_correccao", evento: "validacao_reprovada", variant: "outline" },
      ],
    }} />
  );
}
