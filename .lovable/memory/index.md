Design system, architecture constraints, and key decisions for TCA app.

## Architecture
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Supabase)
- Auth: Session-based mock auth (AuthContext) with 18 roles
- Language: Portuguese (Angola)

## DB Tables
- entities: Reference data (62 Angolan entities) — NEW, migrated from mockData
- fiscal_years: Fiscal year tracking per entity — NEW
- processos: Main workflow table with 18-stage tramitação
- processo_historico: Audit trail for stage transitions
- processo_documentos, atividades, atividade_historico
- profiles, user_roles, submissions, submission_notifications
- pareceres, actas_recepcao, submission_documents
- element_request_responses, element_request_files

## Entity Data Migration
- mockEntities migrated to DB `entities` table
- useEntities hook (src/hooks/useEntities.ts) with caching
- PortalEntityContext now loads from DB via useEntities
- Key pages updated: Entidades, Exercicios, GestaoProcessos, Secretaria, SubmissaoDetalhe, SubmissaoManual, TecnicoDashboard, PortalLayout, TecnicoLayout, DocumentosTribunal
- Remaining mockData imports (formatKz, submissionChecklist, mockTrialBalance, etc.) are config/utility data — OK as static

## Workflow Pages (ALL 18 STAGES IMPLEMENTED)
- Generic component: src/components/workflow/WorkflowStagePage.tsx
- Etapa 1-3: Secretaria pages
- Etapa 4: ContadoriaVerificacao
- Etapa 5: EscrivaoRegistoAutuacao
- Etapa 6: ChefeDivisaoProcessos
- Etapa 7: ChefeSeccaoDistribuicao
- Etapa 8: AnaliseTecnicaPage
- Etapa 9: ValidacaoChefeSeccao
- Etapa 10: ValidacaoChefeDivisao
- Etapa 11: ControleQualidadeDST
- Etapa 12: DecisaoJuizRelator
- Etapa 13: CobrancaEmolumentos
- Etapa 14: DespachoMinisterioPublico
- Etapa 15: CumprimentoDespachos
- Etapa 16: OficioRemessa
- Etapa 17: ExpedienteSaida
- Etapa 18: Arquivamento

## Design
- Institutional/governmental style
- Gold accent gradients on sidebar
- serif fonts for headings
- Logo: /logo-tca.png and brasão de Angola
