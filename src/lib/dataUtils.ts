import { Entity, ValidationResult, Attachment, FinancialIndicators, TrialBalanceLine } from "@/types";

// ─── Formatação de moeda angolana ───
export const formatKz = (value: number): string => {
  return new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper: extract short name from entity full name
export const getEntityShortName = (entity: Entity): string => {
  const parts = entity.name.split(" - ");
  return parts.length > 1 ? parts[1].trim() : entity.name;
};

// Checklist obrigatório conforme Resolução 1/17
export const submissionChecklist = [
  { id: "c1", label: "Relatório de Gestão / Actividades", required: true, category: "relatorio_gestao" },
  { id: "c2", label: "Balanço Patrimonial", required: true, category: "demonstracoes" },
  { id: "c3", label: "Demonstração de Resultados", required: true, category: "demonstracoes" },
  { id: "c4", label: "Demonstração do Fluxo de Caixa", required: true, category: "demonstracoes" },
  { id: "c5", label: "Balancete Analítico e Sintético", required: true, category: "balancete" },
  { id: "c6", label: "Parecer do Conselho Fiscal / Órgão de Fiscalização", required: true, category: "parecer" },
  { id: "c7", label: "Relatório e Parecer do Auditor Externo", required: true, category: "parecer" },
  { id: "c8", label: "Modelos de Prestação de Contas (nº 1 a 10)", required: true, category: "outro" },
  { id: "c9", label: "Certidão de Regularidade Fiscal", required: false, category: "outro" },
  { id: "c10", label: "Certidão de Regularidade Segurança Social", required: false, category: "outro" },
  { id: "c11", label: "Inventário de Bens Patrimoniais", required: true, category: "inventario" },
  { id: "c12", label: "Conta de Gerência", required: true, category: "demonstracoes" },
  { id: "c13", label: "Mapa de Receitas e Despesas", required: true, category: "demonstracoes" },
];

// ─── Validações padrão (Resolução 1/17) ───
export const defaultValidations: ValidationResult[] = [
  { id: "v1", code: "COMP-001", level: "completude", type: "error", message: "Relatório de Gestão não carregado", detail: "Documento obrigatório para submissão — Art. 3º da Resolução 1/17", resolved: false },
  { id: "v2", code: "COMP-002", level: "completude", type: "error", message: "Parecer do Conselho Fiscal em falta", detail: "Obrigatório para todas as categorias — Art. 3º, nº 1, al. f)", resolved: false },
  { id: "v3", code: "COMP-003", level: "completude", type: "warning", message: "Certidão de Regularidade Fiscal não carregada", detail: "Documento opcional mas recomendado", resolved: false },
  { id: "v4", code: "COER-001", level: "consistencia", type: "error", message: "Activo ≠ Passivo + Capital Próprio", detail: "Diferença de 125.430,00 Kz detectada entre o total do Activo e o somatório do Passivo com Capital Próprio", resolved: false },
  { id: "v5", code: "COER-002", level: "consistencia", type: "warning", message: "Balanço N-1 difere do fecho do exercício anterior", detail: "Os saldos de abertura devem corresponder exactamente ao fecho do exercício anterior (Art. 15º)", resolved: false },
  { id: "v7", code: "CONF-001", level: "regras_tribunal", type: "warning", message: "Modelo 4 — Mapa de Pessoal sem validação OGE", detail: "Recomenda-se cruzamento com os dados do OGE para verificação de encargos salariais (Art. 7º)", resolved: false },
];

// ─── Anexos padrão ───
export const defaultAttachments: Attachment[] = [
  { id: "a1", name: "Inventário Patrimonial 2024.pdf", type: "application/pdf", category: "inventario", size: 2450000, uploadedAt: "2025-03-15", version: 1, required: true },
  { id: "a2", name: "Reconciliação Bancária - BFA.xlsx", type: "application/xlsx", category: "reconciliacao", size: 1200000, uploadedAt: "2025-03-18", version: 1, required: true },
  { id: "a3", name: "Extractos Bancários Jan-Dez 2024.pdf", type: "application/pdf", category: "outro", size: 8700000, uploadedAt: "2025-03-20", version: 1, required: true },
  { id: "a4", name: "Acta da Assembleia Geral 2024.pdf", type: "application/pdf", category: "outro", size: 1500000, uploadedAt: "2025-03-22", version: 1, required: false },
  { id: "a5", name: "Relatório do Auditor Externo 2024.pdf", type: "application/pdf", category: "parecer", size: 3200000, uploadedAt: "2025-04-01", version: 1, required: true },
];

// ─── Indicadores Financeiros placeholder ───
export const defaultFinancialIndicators: FinancialIndicators = {
  entityId: "", fiscalYearId: "", year: 2024,
  activoNaoCorrentes: 0, activoCorrentes: 0, activoTotal: 0,
  capitalProprio: 0, passivoNaoCorrente: 0, passivoCorrente: 0, passivoTotal: 0,
  proveitosOperacionais: 0, custosOperacionais: 0, resultadoOperacional: 0,
  resultadoFinanceiro: 0, resultadoNaoOperacional: 0, resultadoAntesImpostos: 0,
  impostoRendimento: 0, resultadoLiquido: 0,
  liquidezCorrente: 0, liquidezSeca: 0, liquidezGeral: 0,
  roe: 0, roa: 0, margemLiquida: 0, giroActivo: 0,
  prazoMedioRecebimento: 0, prazoMedioRenovacaoEstoque: 0, prazoMedioPagamento: 0,
  cicloFinanceiro: 0, cicloOperacional: 0,
  endividamentoGeral: 0, composicaoEndividamento: 0,
};
