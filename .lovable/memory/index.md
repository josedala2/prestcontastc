Sistema de Prestação de Contas do Tribunal de Contas de Angola (TCA)

## Architecture
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Supabase)
- Auth: Session-based demo auth (AuthContext) with 18 roles
- Language: Portuguese (Angola)

## 18 User Roles (mapped to workflow stages)
1. Representante da Entidade → Portal
2. Técnico da Secretaria-Geral → Etapas 1, 2, 16
3. Chefe da Secretaria-Geral → Etapa 3
4. Técnico da Contadoria Geral → Etapa 4
5. Escrivão dos Autos → Etapas 5, 15
6. Chefe de Divisão → Etapas 6, 10
7. Chefe de Secção → Etapas 7, 9
8. Técnico de Análise → Etapa 8
9. Coordenador de Equipa → Etapas 6–10
10. Diretor dos Serviços Técnicos → Etapa 11
11. Juiz Relator → Etapas 12, 18
12. Juiz Adjunto → Etapa 12
13. Ministério Público → Etapa 14
14. Técnico da Secção de Custas e Emolumentos → Etapa 13
15. Oficial de Diligências → Etapa 17
16. Presidente da Câmara → Supervisão
17. Presidente do Tribunal de Contas → Acesso total
18. Administrador do Sistema → Acesso total

## Key Tables
- processos, processo_historico, processo_documentos
- submissions, submission_notifications
- actas_recepcao, pareceres

## Design
- Institutional/governmental style
- Gold accent gradients on sidebar
- serif fonts for headings
- Logo: /logo-tca.png and brasão de Angola
