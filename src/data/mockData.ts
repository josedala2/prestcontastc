import { Entity, FiscalYear, TrialBalanceLine, ValidationResult, Account, Attachment, AuditLogEntry } from "@/types";

export const mockEntities: Entity[] = [
  {
    id: "1",
    name: "Empresa Nacional de Distribuição de Electricidade - ENDE, E.P.",
    nif: "5417183920",
    tutela: "Ministério da Energia e Águas",
    contacto: "+244 222 310 000",
    morada: "Rua Rainha Ginga, Luanda",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Instituto Nacional de Estradas de Angola - INEA",
    nif: "5401028734",
    tutela: "Ministério das Obras Públicas",
    contacto: "+244 222 330 500",
    morada: "Av. 4 de Fevereiro, Luanda",
    createdAt: "2024-02-10",
  },
];

export const mockFiscalYears: FiscalYear[] = [
  {
    id: "fy1",
    entityId: "1",
    entityName: "ENDE, E.P.",
    year: 2024,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "em_preparacao",
    totalDebito: 15834567890,
    totalCredito: 15834567890,
    errorsCount: 3,
    warningsCount: 5,
    checklistProgress: 45,
  },
  {
    id: "fy2",
    entityId: "2",
    entityName: "INEA",
    year: 2024,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "em_validacao",
    totalDebito: 8921345000,
    totalCredito: 8921345000,
    errorsCount: 0,
    warningsCount: 2,
    checklistProgress: 78,
  },
];

export const mockAccounts: Account[] = [
  { code: "11", description: "Imobilizações corpóreas", nature: "Devedora", level: 2 },
  { code: "11.1", description: "Terrenos e recursos naturais", nature: "Devedora", level: 3, parentCode: "11" },
  { code: "11.2", description: "Edifícios e outras construções", nature: "Devedora", level: 3, parentCode: "11" },
  { code: "11.3", description: "Equipamento básico", nature: "Devedora", level: 3, parentCode: "11" },
  { code: "11.4", description: "Equipamento de transporte", nature: "Devedora", level: 3, parentCode: "11" },
  { code: "11.5", description: "Equipamento administrativo", nature: "Devedora", level: 3, parentCode: "11" },
  { code: "12", description: "Imobilizações incorpóreas", nature: "Devedora", level: 2 },
  { code: "13", description: "Investimentos financeiros", nature: "Devedora", level: 2 },
  { code: "18", description: "Amortizações acumuladas", nature: "Credora", level: 2 },
  { code: "22", description: "Matérias-primas, subsidiárias e de consumo", nature: "Devedora", level: 2 },
  { code: "26", description: "Mercadorias", nature: "Devedora", level: 2 },
  { code: "31", description: "Clientes", nature: "Devedora", level: 2 },
  { code: "32", description: "Fornecedores", nature: "Credora", level: 2 },
  { code: "34", description: "Estado", nature: "Devedora", level: 2 },
  { code: "43", description: "Depósitos à ordem", nature: "Devedora", level: 2 },
  { code: "45", description: "Caixa", nature: "Devedora", level: 2 },
  { code: "51", description: "Capital", nature: "Credora", level: 2 },
  { code: "55", description: "Reserva legal", nature: "Credora", level: 2 },
  { code: "61", description: "Custo das mercadorias vendidas", nature: "Devedora", level: 2 },
  { code: "62", description: "Fornecimentos e serviços externos", nature: "Devedora", level: 2 },
  { code: "63", description: "Despesas com o pessoal", nature: "Devedora", level: 2 },
  { code: "66", description: "Amortizações do exercício", nature: "Devedora", level: 2 },
  { code: "71", description: "Vendas", nature: "Credora", level: 2 },
  { code: "72", description: "Prestações de serviços", nature: "Credora", level: 2 },
  { code: "78", description: "Proveitos financeiros", nature: "Credora", level: 2 },
  { code: "88", description: "Resultado líquido do exercício", nature: "Credora", level: 2 },
];

export const mockTrialBalance: TrialBalanceLine[] = [
  { id: "tb1", accountCode: "11.1", description: "Terrenos e recursos naturais", debit: 2500000000, credit: 0, balance: 2500000000 },
  { id: "tb2", accountCode: "11.2", description: "Edifícios e outras construções", debit: 4200000000, credit: 0, balance: 4200000000 },
  { id: "tb3", accountCode: "11.3", description: "Equipamento básico", debit: 1800000000, credit: 0, balance: 1800000000 },
  { id: "tb4", accountCode: "18", description: "Amortizações acumuladas", debit: 0, credit: 1200000000, balance: -1200000000 },
  { id: "tb5", accountCode: "22", description: "Matérias-primas", debit: 350000000, credit: 0, balance: 350000000 },
  { id: "tb6", accountCode: "31", description: "Clientes", debit: 890000000, credit: 0, balance: 890000000 },
  { id: "tb7", accountCode: "32", description: "Fornecedores", debit: 0, credit: 780000000, balance: -780000000 },
  { id: "tb8", accountCode: "43", description: "Depósitos à ordem", debit: 1234567890, credit: 0, balance: 1234567890 },
  { id: "tb9", accountCode: "45", description: "Caixa", debit: 60000000, credit: 0, balance: 60000000 },
  { id: "tb10", accountCode: "51", description: "Capital", debit: 0, credit: 5000000000, balance: -5000000000 },
  { id: "tb11", accountCode: "55", description: "Reserva legal", debit: 0, credit: 500000000, balance: -500000000 },
  { id: "tb12", accountCode: "61", description: "Custo merc. vendidas", debit: 2100000000, credit: 0, balance: 2100000000 },
  { id: "tb13", accountCode: "62", description: "FSE", debit: 450000000, credit: 0, balance: 450000000 },
  { id: "tb14", accountCode: "63", description: "Despesas com pessoal", debit: 1200000000, credit: 0, balance: 1200000000 },
  { id: "tb15", accountCode: "66", description: "Amortizações exercício", debit: 350000000, credit: 0, balance: 350000000 },
  { id: "tb16", accountCode: "71", description: "Vendas", debit: 0, credit: 5200000000, balance: -5200000000 },
  { id: "tb17", accountCode: "72", description: "Prestações de serviços", debit: 0, credit: 1800000000, balance: -1800000000 },
  { id: "tb18", accountCode: "78", description: "Proveitos financeiros", debit: 0, credit: 154567890, balance: -154567890 },
  { id: "tb19", accountCode: "88", description: "Resultado líquido", debit: 0, credit: 1200000000, balance: -1200000000 },
];

export const mockValidations: ValidationResult[] = [
  { id: "v1", code: "TB-001", type: "error", message: "Soma dos Débitos ≠ Soma dos Créditos", detail: "Diferença de 0 Kz — OK após reimportação", resolved: true },
  { id: "v2", code: "FS-001", type: "error", message: "Ativo ≠ Passivo + Capital Próprio", detail: "Desequilíbrio de 234.500 Kz no Balanço", resolved: false },
  { id: "v3", code: "ACC-001", type: "warning", message: "Conta 32 (Fornecedores) com saldo devedor", detail: "Natureza da conta é Credora mas saldo é devedor", resolved: false },
  { id: "v4", code: "MAP-REQ", type: "error", message: "Modelo nº 3 — Mapa de Despesas com o Pessoal não preenchido", detail: "Campo obrigatório para prestação de contas", resolved: false },
  { id: "v5", code: "ACC-001", type: "warning", message: "Conta 34 (Estado) com saldo credor", detail: "Verificar natureza da conta", resolved: false },
  { id: "v6", code: "MAP-REQ", type: "error", message: "Modelo nº 5 — Mapa de Investimentos incompleto", detail: "Faltam colunas de financiamento", resolved: false },
];

export const mockAttachments: Attachment[] = [
  { id: "a1", name: "Inventário Patrimonial 2024.pdf", type: "application/pdf", category: "inventario", size: 2450000, uploadedAt: "2025-03-15" },
  { id: "a2", name: "Reconciliação Bancária - BFA.xlsx", type: "application/xlsx", category: "reconciliacao", size: 1200000, uploadedAt: "2025-03-18" },
  { id: "a3", name: "Parecer Conselho Fiscal.pdf", type: "application/pdf", category: "parecer", size: 890000, uploadedAt: "2025-04-02" },
];

export const mockAuditLog: AuditLogEntry[] = [
  { id: "al1", action: "Importação de Balancete", user: "João Silva", timestamp: "2025-03-15 10:30", detail: "18 linhas importadas" },
  { id: "al2", action: "Validação executada", user: "João Silva", timestamp: "2025-03-15 10:35", detail: "3 erros, 2 avisos encontrados" },
  { id: "al3", action: "Upload de Anexo", user: "Maria Santos", timestamp: "2025-03-18 14:20", detail: "Reconciliação Bancária - BFA.xlsx" },
  { id: "al4", action: "Edição de Entidade", user: "Admin", timestamp: "2025-03-20 09:00", detail: "Atualização de contacto" },
  { id: "al5", action: "Mudança de Estado", user: "Dr. António", timestamp: "2025-04-01 16:00", detail: "Em Preparação → Em Validação" },
];

export const formatKz = (value: number): string => {
  return new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
