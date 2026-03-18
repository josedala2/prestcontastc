# Memory: index.md
Updated: now

Sistema de Prestação de Contas do Tribunal de Contas de Angola (TCA)

## Architecture
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Supabase)
- Auth: Session-based mock auth (AuthContext) with 18 roles
- Language: Portuguese (Angola)

## Key Tables
- processos: Main workflow table with 18-stage tramitação (18 test processes inserted)
- processo_historico: Audit trail for all stage transitions
- processo_documentos: Documents attached to processes
- submission_notifications: Notification system
- actas_recepcao: Reception acts
- pareceres: Technical opinions
- entities: 90 real Angolan entities
- fiscal_years: Real fiscal year data from DB
- submissions: Submission tracking

## Data Sources
- Entities: loaded from DB via useEntities hook (cached)
- Fiscal Years: loaded from DB via useFiscalYears hook (cached)
- Submissions: loaded from DB via SubmissionContext
- Clarifications: placeholder (empty, to be migrated to DB)
- Mock data kept for: accounts, validations, attachments, audit log, checklist, financial indicators

## Workflow
- 18 stages defined in src/types/workflow.ts
- 4 entity categories with distinct document checklists
- Stages from "Registo de Entrada" to "Arquivamento"
- WorkflowStagePage generic component for all stages

## Design
- Institutional/governmental style
- Gold accent gradients on sidebar
- serif fonts for headings
- Logo: /logo-tca.png and brasão de Angola
