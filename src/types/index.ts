export interface Entity {
  id: string;
  name: string;
  nif: string;
  tutela: string;
  contacto: string;
  morada: string;
  createdAt: string;
}

export interface FiscalYear {
  id: string;
  entityId: string;
  entityName: string;
  year: number;
  startDate: string;
  endDate: string;
  status: "em_preparacao" | "em_validacao" | "aprovado" | "submetido";
  totalDebito: number;
  totalCredito: number;
  errorsCount: number;
  warningsCount: number;
  checklistProgress: number;
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
  message: string;
  detail?: string;
  resolved: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  category: "inventario" | "reconciliacao" | "parecer" | "outro";
  size: number;
  uploadedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  detail: string;
}

export type StatusLabel = {
  [key in FiscalYear["status"]]: { label: string; color: string };
};

export const STATUS_LABELS: StatusLabel = {
  em_preparacao: { label: "Em Preparação", color: "warning" },
  em_validacao: { label: "Em Validação", color: "info" },
  aprovado: { label: "Aprovado", color: "success" },
  submetido: { label: "Submetido", color: "secondary" },
};
