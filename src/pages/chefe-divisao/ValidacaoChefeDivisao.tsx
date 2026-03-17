import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { ShieldCheck } from "lucide-react";

export default function ValidacaoChefeDivisao() {
  return (
    <WorkflowStagePage config={{
      etapa: 10,
      title: "Validação do Chefe de Divisão",
      subtitle: "Revise e valide o relatório consolidado antes de submeter ao Controle de Qualidade.",
      icon: ShieldCheck,
      perfilExecutor: "Chefe de Divisão",
      actions: [
        { label: "Aprovar e Encaminhar ao DST", nextEtapa: 11, nextEstado: "em_validacao", evento: "validacao_aprovada" },
        { label: "Devolver para Correcção", nextEtapa: 9, nextEstado: "pendente_correccao", evento: "validacao_reprovada", variant: "outline" },
      ],
    }} />
  );
}
