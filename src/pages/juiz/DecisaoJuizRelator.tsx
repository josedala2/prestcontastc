import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Gavel } from "lucide-react";

export default function DecisaoJuizRelator() {
  return (
    <WorkflowStagePage config={{
      etapa: 12,
      title: "Decisão do Juiz Relator",
      subtitle: "Analise o processo e emita a decisão: Conta em Termos ou Conta Não em Termos.",
      icon: Gavel,
      perfilExecutor: "Juiz Relator",
      fields: [
        {
          key: "decisao", label: "Decisão", required: true,
          type: "select", options: ["Conta em Termos", "Conta Não em Termos", "Solicitar Diligências", "Ordenar Contraditório"],
        },
      ],
      actions: [
        { label: "Conta em Termos — Avançar para Emolumentos", nextEtapa: 13, nextEstado: "conta_em_termos", evento: "decisao_juiz" },
        { label: "Conta Não em Termos — Avançar para Emolumentos", nextEtapa: 13, nextEstado: "conta_nao_em_termos", evento: "decisao_juiz", variant: "destructive" },
        { label: "Solicitar Diligências", nextEtapa: 11, nextEstado: "pendente_correccao", evento: "diligencia", variant: "outline" },
      ],
    }} />
  );
}
