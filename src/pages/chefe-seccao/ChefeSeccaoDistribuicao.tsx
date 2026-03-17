import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Users } from "lucide-react";

const TECNICOS = [
  "Dr. António Silva", "Dra. Maria Santos", "Dr. Paulo Costa",
  "Dra. Ana Ferreira", "Dr. João Martins", "Dra. Teresa Rocha",
];

export default function ChefeSeccaoDistribuicao() {
  return (
    <WorkflowStagePage config={{
      etapa: 7,
      title: "Secção Competente",
      subtitle: "Distribua o processo ao técnico de análise e defina a prioridade.",
      icon: Users,
      perfilExecutor: "Chefe de Secção",
      fields: [
        {
          key: "tecnico", label: "Técnico de Análise", required: true,
          type: "select", options: TECNICOS, dbColumn: "tecnico_analise",
          placeholder: "Seleccionar técnico",
        },
        {
          key: "prioridade", label: "Prioridade", required: true,
          type: "select", options: ["normal", "alta", "urgente"], dbColumn: "urgencia",
        },
      ],
      actions: [
        { label: "Distribuir a Técnico", nextEtapa: 8, nextEstado: "em_analise", evento: "validacao_aprovada" },
      ],
    }} />
  );
}
