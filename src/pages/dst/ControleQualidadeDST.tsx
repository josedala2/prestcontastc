import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Eye } from "lucide-react";

export default function ControleQualidadeDST() {
  return (
    <WorkflowStagePage config={{
      etapa: 11,
      title: "Controle de Qualidade (DST)",
      subtitle: "Revisão final pelo Director dos Serviços Técnicos antes da submissão ao Juiz Relator.",
      icon: Eye,
      perfilExecutor: "Diretor dos Serviços Técnicos",
      actions: [
        { label: "Aprovar e Submeter ao Juiz", nextEtapa: 12, nextEstado: "em_decisao", evento: "validacao_aprovada" },
        { label: "Devolver para Correcção", nextEtapa: 10, nextEstado: "pendente_correccao", evento: "validacao_reprovada", variant: "outline" },
      ],
    }} />
  );
}
