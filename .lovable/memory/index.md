Sistema de Prestação de Contas do Tribunal de Contas de Angola (TCA)

## Architecture
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Supabase)
- Auth: Session-based mock auth (AuthContext) with 18+ roles
- Language: Portuguese (Angola)

## Key Tables
- entities: Managed entities (CRUD persisted to DB)
- processos: Main workflow table with 18-stage tramitação
- processo_historico: Audit trail for all stage transitions
- processo_documentos: Documents attached to processes
- submissions: Entity submission tracking (unique constraint on entity_id+fiscal_year_id)
- submission_notifications: Notification system
- actas_recepcao: Reception acts
- pareceres: Technical opinions
- fiscal_years: Annual fiscal exercises per entity
- atividades: Workflow activities/tasks
- profiles / user_roles: User management
- trial_balance: Balancete analítico per entity/fiscal year
- accounts: Plano Geral de Contas (PGC)
- financial_indicators: KPIs per entity/year
- audit_log: System audit trail
- compliance_questions: 27 conformity questions
- documentos_tribunal: TCA official documents

## Data Sources
- All data now from Supabase backend (mockData.ts deleted)
- Static reference data in src/lib/dataUtils.ts: submissionChecklist, defaultValidations, defaultAttachments, defaultFinancialIndicators
- Hooks: useTrialBalance, useAccounts, useAuditLog, useFinancialIndicators, useComplianceQuestions, useDocumentosTribunal

## Workflow
- 18 stages defined in src/types/workflow.ts
- 4 entity categories with distinct document checklists
- Stages from "Registo de Entrada" to "Arquivamento"

## Design
- Institutional/governmental style
- Gold accent gradients on sidebar
- serif fonts for headings
- Logo: /logo-tca.png and brasão de Angola
