import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { FileSearch } from "lucide-react";

export default function AnaliseTecnicaPage() {
  return (
    <WorkflowStagePage config={{
      etapa: 8,
      title: "Análise Técnica",
      subtitle: "Analise os documentos do processo, solicite elementos adicionais e emita o parecer técnico.",
      icon: FileSearch,
      perfilExecutor: "Técnico de Análise",
      detailRoute: "/analise-tecnica",
      actions: [
        { label: "Concluir Análise e Submeter", nextEtapa: 9, nextEstado: "em_validacao", evento: "analise_concluida" },
        { label: "Solicitar Elementos", nextEtapa: 8, nextEstado: "aguardando_elementos", evento: "falta_elementos", variant: "outline" },
      ],
    }} />
  );
}
