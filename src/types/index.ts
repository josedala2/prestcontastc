export interface Entity {
  id: string;
  name: string;
  nif: string;
  tutela: string;
  contacto: string;
  morada: string;
  tipologia: EntityTipologia;
  provincia?: string;
  createdAt: string;
}

// ─── Tipologias agrupadas por Resolução ───
export type EntityTipologia =
  // Resolução 2/16 — Órgãos de Soberania e Afins
  | "orgao_soberania"
  // Resolução 4/16 — Administração Central/Local, Institutos Sector Administrativo
  | "admin_central"
  | "admin_local"
  | "instituto_admin"
  // Resolução 5/16 — Serviços Públicos no Estrangeiro
  | "servico_estrangeiro"
  // Resolução 1/17 — Órgãos Autónomos, Sector Empresarial Público (PGC)
  | "orgao_autonomo"
  | "instituto_publico"
  | "fundo_autonomo"
  | "servico_autonomo"
  | "empresa_publica";

export const TIPOLOGIA_LABELS: Record<EntityTipologia, string> = {
  orgao_soberania: "Órgão de Soberania e Afins",
  admin_central: "Administração Central do Estado",
  admin_local: "Administração Local do Estado",
  instituto_admin: "Instituto do Sector Administrativo",
  servico_estrangeiro: "Serviço Público no Estrangeiro",
  orgao_autonomo: "Órgão Autónomo",
  instituto_publico: "Instituto Público",
  fundo_autonomo: "Fundo Autónomo",
  servico_autonomo: "Serviço Autónomo",
  empresa_publica: "Empresa Pública",
};

// Agrupamento por Resolução
export type ResolucaoCategoria = "resolucao_2_16" | "resolucao_4_16" | "resolucao_5_16" | "resolucao_1_17";

export const TIPOLOGIA_RESOLUCAO: Record<EntityTipologia, ResolucaoCategoria> = {
  orgao_soberania: "resolucao_2_16",
  admin_central: "resolucao_4_16",
  admin_local: "resolucao_4_16",
  instituto_admin: "resolucao_4_16",
  servico_estrangeiro: "resolucao_5_16",
  orgao_autonomo: "resolucao_1_17",
  instituto_publico: "resolucao_1_17",
  fundo_autonomo: "resolucao_1_17",
  servico_autonomo: "resolucao_1_17",
  empresa_publica: "resolucao_1_17",
};

export const RESOLUCAO_LABELS: Record<ResolucaoCategoria, { label: string; descricao: string }> = {
  resolucao_2_16: { label: "Resolução nº 2/16", descricao: "Órgãos de Soberania e Afins" },
  resolucao_4_16: { label: "Resolução nº 4/16", descricao: "Administração Central e Local, Institutos do Sector Administrativo" },
  resolucao_5_16: { label: "Resolução nº 5/16", descricao: "Serviços Públicos no Estrangeiro" },
  resolucao_1_17: { label: "Resolução nº 1/17", descricao: "Órgãos Autónomos, Sector Empresarial Público (PGC)" },
};

export const TIPOLOGIA_GROUPS: Record<ResolucaoCategoria, EntityTipologia[]> = {
  resolucao_2_16: ["orgao_soberania"],
  resolucao_4_16: ["admin_central", "admin_local", "instituto_admin"],
  resolucao_5_16: ["servico_estrangeiro"],
  resolucao_1_17: ["orgao_autonomo", "instituto_publico", "fundo_autonomo", "servico_autonomo", "empresa_publica"],
};

export interface FiscalYear {
  id: string;
  entityId: string;
  entityName: string;
  year: number;
  startDate: string;
  endDate: string;
  status: "rascunho" | "em_validacao" | "submetido" | "em_analise" | "com_pedidos" | "conforme" | "nao_conforme";
  totalDebito: number;
  totalCredito: number;
  errorsCount: number;
  warningsCount: number;
  checklistProgress: number;
  deadline: string; // 30 de Junho do ano seguinte
  submittedAt?: string;
}

export interface Account {
  code: string;
  description: string;
  nature: "Devedora" | "Credora";
  level: number;
  parentCode?: string;
}

export interface TrialBalanceLine {
  id: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ValidationResult {
  id: string;
  code: string;
  type: "error" | "warning";
  level: "completude" | "consistencia" | "regras_tribunal";
  message: string;
  detail?: string;
  resolved: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  category: "inventario" | "reconciliacao" | "parecer" | "balancete" | "relatorio_gestao" | "demonstracoes" | "outro";
  size: number;
  uploadedAt: string;
  version?: number;
  required?: boolean;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  detail: string;
  actionType?: "importacao" | "edicao" | "aprovacao" | "submissao" | "exportacao" | "validacao" | "upload";
}

export interface ClarificationRequest {
  id: string;
  exercicioId: string;
  entityId: string;
  entityName: string;
  subject: string;
  message: string;
  status: "pendente" | "respondido" | "encerrado";
  createdAt: string;
  deadline: string;
  responses?: { user: string; message: string; date: string }[];
}

export type StatusLabel = {
  [key in FiscalYear["status"]]: { label: string; color: string };
};

export const STATUS_LABELS: StatusLabel = {
  rascunho: { label: "Rascunho", color: "default" },
  em_validacao: { label: "Em Validação", color: "warning" },
  submetido: { label: "Submetido", color: "info" },
  em_analise: { label: "Em Análise", color: "info" },
  com_pedidos: { label: "Com Pedidos", color: "warning" },
  conforme: { label: "Conforme", color: "success" },
  nao_conforme: { label: "Não Conforme", color: "destructive" },
};

export const VALIDATION_LEVEL_LABELS: Record<ValidationResult["level"], { label: string; description: string }> = {
  completude: { label: "Nível 1 — Completude", description: "Verifica se todos os documentos e mapas obrigatórios estão presentes" },
  consistencia: { label: "Nível 2 — Consistência", description: "Verifica coerência contabilística (saldos, totais, equações)" },
  regras_tribunal: { label: "Nível 3 — Regras do Tribunal", description: "Regras parametrizáveis do Tribunal de Contas" },
};

// ─── Indicadores Financeiros (Modelo CC-3) ───
export interface FinancialIndicators {
  entityId: string;
  fiscalYearId: string;
  year: number;
  // Balanço Patrimonial
  activoNaoCorrentes: number;
  activoCorrentes: number;
  activoTotal: number;
  capitalProprio: number;
  passivoNaoCorrente: number;
  passivoCorrente: number;
  passivoTotal: number;
  // Demonstração de Resultados
  proveitosOperacionais: number;
  custosOperacionais: number;
  resultadoOperacional: number;
  resultadoFinanceiro: number;
  resultadoNaoOperacional: number;
  resultadoAntesImpostos: number;
  impostoRendimento: number;
  resultadoLiquido: number;
  // Indicadores de Liquidez
  liquidezCorrente: number;
  liquidezSeca: number;
  liquidezGeral: number;
  // Indicadores de Rentabilidade
  roe: number;
  roa: number;
  margemLiquida: number;
  giroActivo: number;
  // Indicadores de Actividade
  prazoMedioRecebimento: number;
  prazoMedioRenovacaoEstoque: number;
  prazoMedioPagamento: number;
  cicloFinanceiro: number;
  cicloOperacional: number;
  // Endividamento
  endividamentoGeral: number;
  composicaoEndividamento: number;
}

// ─── Avaliação da Conta (Modelo CC-3) ───
export interface ComplianceQuestion {
  id: string;
  question: string;
  norma: string;
  classification: "sem_gravidade" | "grave" | "muito_grave";
  score: 1 | 2 | 3;
  responsabilidade?: string;
}

export interface ComplianceEvaluation {
  entityId: string;
  fiscalYearId: string;
  nivel: 1 | 2 | 3;
  nivelLabel: string;
  totalQuestoes: number;
  questoesPorNivel: { nivel1: number; nivel2: number; nivel3: number };
  percentagemPorNivel: { nivel1: number; nivel2: number; nivel3: number };
  questionResults: { questionId: string; applicable: boolean; resolved: boolean }[];
}

export const COMPLIANCE_NIVEL_LABELS: Record<1 | 2 | 3, { label: string; description: string }> = {
  1: { label: "Em Termos", description: "Deverá ser devolvida aos Gestores da Entidade." },
  2: { label: "Em Termos com Recomendações", description: "A Conta poderá ser considerada em Termos, contudo, deverão ser feitas recomendações para a melhoria." },
  3: { label: "Não em Termos", description: "A Conta não está em Termos e deve constar do programa de auditorias para o ano seguinte." },
};

// ─── Documentos do Tribunal ───
export type DocumentoTribunalTipo = "notificacao" | "diligencia" | "relatorio_analise" | "acordao" | "notif_acordao";
export type DocumentoTribunalEstado = "rascunho" | "em_revisao" | "aprovado" | "emitido" | "anulado";

export interface DocumentoTribunal {
  id: string;
  processoId: string;
  exercicioId: string;
  entidadeId: string;
  tipo: DocumentoTribunalTipo;
  numeroDocumento: string;
  assunto: string;
  conteudo: string;
  estado: DocumentoTribunalEstado;
  versao: number;
  imutavel: boolean;
  hashSha256?: string;
  seloTemporal?: string;
  criadoPor: string;
  aprovadoPor?: string;
  emitidoAt?: string;
  prazoResposta?: string; // for diligencias
  resultadoAcordao?: "em_termos" | "com_recomendacoes" | "nao_em_termos"; // for acordaos
  juizRelator?: string; // for acordaos
  createdAt: string;
  updatedAt: string;
  historico?: DocumentoVersao[];
}

export interface DocumentoVersao {
  versao: number;
  alteradoPor: string;
  alteradoAt: string;
  resumoAlteracao: string;
  hashSha256: string;
}

export const DOCUMENTO_TIPO_LABELS: Record<DocumentoTribunalTipo, { label: string; icon: string }> = {
  notificacao: { label: "Notificação", icon: "Bell" },
  diligencia: { label: "Pedido de Esclarecimento / Diligência", icon: "HelpCircle" },
  relatorio_analise: { label: "Relatório de Análise / Verificação", icon: "FileSearch" },
  acordao: { label: "Acórdão", icon: "Gavel" },
  notif_acordao: { label: "Notificação do Acórdão", icon: "Mail" },
};

export const DOCUMENTO_ESTADO_LABELS: Record<DocumentoTribunalEstado, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "default" },
  em_revisao: { label: "Em Revisão", color: "warning" },
  aprovado: { label: "Aprovado", color: "info" },
  emitido: { label: "Emitido", color: "success" },
  anulado: { label: "Anulado", color: "destructive" },
};
