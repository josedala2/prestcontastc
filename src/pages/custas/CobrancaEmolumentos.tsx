import WorkflowStagePage from "@/components/workflow/WorkflowStagePage";
import { Receipt } from "lucide-react";

export default function CobrancaEmolumentos() {
  return (
    <WorkflowStagePage config={{
      etapa: 13,
      title: "Cobrança de Emolumentos",
      subtitle: "Calcule o valor dos emolumentos, emita a guia de cobrança e controle o pagamento.",
      icon: Receipt,
      perfilExecutor: "Técnico da Secção de Custas e Emolumentos",
      fields: [
        { key: "valor", label: "Valor dos Emolumentos (Kz)", type: "text", placeholder: "Ex: 150.000,00" },
        { key: "guia", label: "Nº da Guia", type: "text", placeholder: "GC-2024/0001" },
      ],
      actions: [
        { label: "Confirmar Pagamento e Avançar", nextEtapa: 14, nextEstado: "em_analise", evento: "pagamento" },
        { label: "Aguardar Pagamento", nextEtapa: 13, nextEstado: "aguardando_pagamento", evento: "pagamento", variant: "outline" },
      ],
    }} />
  );
}
