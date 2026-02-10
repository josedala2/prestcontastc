export interface Entity {
  id: string;
  name: string;
  nif: string;
  tutela: string;
  contacto: string;
  morada: string;
  tipologia: "orgao_autonomo" | "instituto_publico" | "fundo_autonomo" | "servico_autonomo" | "empresa_publica";
  provincia?: string;
  createdAt: string;
}

export const TIPOLOGIA_LABELS: Record<Entity["tipologia"], string> = {
  orgao_autonomo: "Órgão Autónomo",
  instituto_publico: "Instituto Público",
  fundo_autonomo: "Fundo Autónomo",
  servico_autonomo: "Serviço Autónomo",
  empresa_publica: "Empresa Pública",
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
  deadline: string; // 30 de Abril do ano seguinte
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
