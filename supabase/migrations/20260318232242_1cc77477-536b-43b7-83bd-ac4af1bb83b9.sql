
-- =============================================
-- SECURITY FIX: Replace all permissive public RLS policies
-- with authenticated-only access
-- =============================================

-- ACCOUNTS
DROP POLICY IF EXISTS "Allow all delete on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow all insert on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow all read on accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow all update on accounts" ON public.accounts;
CREATE POLICY "auth_select_accounts" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_accounts" ON public.accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_accounts" ON public.accounts FOR DELETE TO authenticated USING (true);

-- ACTAS_RECEPCAO
DROP POLICY IF EXISTS "Allow all delete access on actas" ON public.actas_recepcao;
DROP POLICY IF EXISTS "Allow all insert access on actas" ON public.actas_recepcao;
DROP POLICY IF EXISTS "Allow all read access on actas" ON public.actas_recepcao;
CREATE POLICY "auth_select_actas" ON public.actas_recepcao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_actas" ON public.actas_recepcao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_actas" ON public.actas_recepcao FOR DELETE TO authenticated USING (true);

-- ATIVIDADE_HISTORICO
DROP POLICY IF EXISTS "Allow all insert on atividade_historico" ON public.atividade_historico;
DROP POLICY IF EXISTS "Allow all read on atividade_historico" ON public.atividade_historico;
CREATE POLICY "auth_select_atividade_hist" ON public.atividade_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_atividade_hist" ON public.atividade_historico FOR INSERT TO authenticated WITH CHECK (true);

-- ATIVIDADES
DROP POLICY IF EXISTS "Allow all delete on atividades" ON public.atividades;
DROP POLICY IF EXISTS "Allow all insert on atividades" ON public.atividades;
DROP POLICY IF EXISTS "Allow all read on atividades" ON public.atividades;
DROP POLICY IF EXISTS "Allow all update on atividades" ON public.atividades;
CREATE POLICY "auth_select_atividades" ON public.atividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_atividades" ON public.atividades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_atividades" ON public.atividades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_atividades" ON public.atividades FOR DELETE TO authenticated USING (true);

-- AUDIT_LOG
DROP POLICY IF EXISTS "Allow all insert on audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Allow all read on audit_log" ON public.audit_log;
CREATE POLICY "auth_select_audit_log" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_audit_log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- COMPLIANCE_QUESTIONS
DROP POLICY IF EXISTS "Allow all insert on compliance_questions" ON public.compliance_questions;
DROP POLICY IF EXISTS "Allow all read on compliance_questions" ON public.compliance_questions;
CREATE POLICY "auth_select_compliance" ON public.compliance_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_compliance" ON public.compliance_questions FOR INSERT TO authenticated WITH CHECK (true);

-- DOCUMENTOS_TRIBUNAL
DROP POLICY IF EXISTS "Allow all delete on documentos_tribunal" ON public.documentos_tribunal;
DROP POLICY IF EXISTS "Allow all insert on documentos_tribunal" ON public.documentos_tribunal;
DROP POLICY IF EXISTS "Allow all read on documentos_tribunal" ON public.documentos_tribunal;
DROP POLICY IF EXISTS "Allow all update on documentos_tribunal" ON public.documentos_tribunal;
CREATE POLICY "auth_select_docs_tribunal" ON public.documentos_tribunal FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_docs_tribunal" ON public.documentos_tribunal FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_docs_tribunal" ON public.documentos_tribunal FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_docs_tribunal" ON public.documentos_tribunal FOR DELETE TO authenticated USING (true);

-- ELEMENT_REQUEST_FILES
DROP POLICY IF EXISTS "Allow all insert access on files" ON public.element_request_files;
DROP POLICY IF EXISTS "Allow all read access on files" ON public.element_request_files;
CREATE POLICY "auth_select_elem_files" ON public.element_request_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_elem_files" ON public.element_request_files FOR INSERT TO authenticated WITH CHECK (true);

-- ELEMENT_REQUEST_RESPONSES
DROP POLICY IF EXISTS "Allow all insert access on responses" ON public.element_request_responses;
DROP POLICY IF EXISTS "Allow all read access on responses" ON public.element_request_responses;
DROP POLICY IF EXISTS "Allow all update access on responses" ON public.element_request_responses;
CREATE POLICY "auth_select_elem_resp" ON public.element_request_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_elem_resp" ON public.element_request_responses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_elem_resp" ON public.element_request_responses FOR UPDATE TO authenticated USING (true);

-- ENTITIES
DROP POLICY IF EXISTS "Allow admin delete on entities" ON public.entities;
DROP POLICY IF EXISTS "Allow admin insert on entities" ON public.entities;
DROP POLICY IF EXISTS "Allow admin update on entities" ON public.entities;
DROP POLICY IF EXISTS "Allow all read on entities" ON public.entities;
CREATE POLICY "auth_select_entities" ON public.entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_entities" ON public.entities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_entities" ON public.entities FOR DELETE TO authenticated USING (true);

-- FINANCIAL_INDICATORS
DROP POLICY IF EXISTS "Allow all insert on financial_indicators" ON public.financial_indicators;
DROP POLICY IF EXISTS "Allow all read on financial_indicators" ON public.financial_indicators;
DROP POLICY IF EXISTS "Allow all update on financial_indicators" ON public.financial_indicators;
CREATE POLICY "auth_select_fin_ind" ON public.financial_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_fin_ind" ON public.financial_indicators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_fin_ind" ON public.financial_indicators FOR UPDATE TO authenticated USING (true);

-- FISCAL_YEARS
DROP POLICY IF EXISTS "Allow all insert on fiscal_years" ON public.fiscal_years;
DROP POLICY IF EXISTS "Allow all read on fiscal_years" ON public.fiscal_years;
DROP POLICY IF EXISTS "Allow all update on fiscal_years" ON public.fiscal_years;
CREATE POLICY "auth_select_fiscal_years" ON public.fiscal_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_fiscal_years" ON public.fiscal_years FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_fiscal_years" ON public.fiscal_years FOR UPDATE TO authenticated USING (true);

-- PARECERES
DROP POLICY IF EXISTS "Allow all insert access on pareceres" ON public.pareceres;
DROP POLICY IF EXISTS "Allow all read access on pareceres" ON public.pareceres;
CREATE POLICY "auth_select_pareceres" ON public.pareceres FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_pareceres" ON public.pareceres FOR INSERT TO authenticated WITH CHECK (true);

-- PROCESSO_DOCUMENTOS
DROP POLICY IF EXISTS "Allow all delete on processo_documentos" ON public.processo_documentos;
DROP POLICY IF EXISTS "Allow all insert on processo_documentos" ON public.processo_documentos;
DROP POLICY IF EXISTS "Allow all select on processo_documentos" ON public.processo_documentos;
DROP POLICY IF EXISTS "Allow all update on processo_documentos" ON public.processo_documentos;
CREATE POLICY "auth_select_proc_docs" ON public.processo_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_proc_docs" ON public.processo_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_proc_docs" ON public.processo_documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_proc_docs" ON public.processo_documentos FOR DELETE TO authenticated USING (true);

-- PROCESSO_HISTORICO
DROP POLICY IF EXISTS "Allow all insert on processo_historico" ON public.processo_historico;
DROP POLICY IF EXISTS "Allow all select on processo_historico" ON public.processo_historico;
CREATE POLICY "auth_select_proc_hist" ON public.processo_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_proc_hist" ON public.processo_historico FOR INSERT TO authenticated WITH CHECK (true);

-- PROCESSOS
DROP POLICY IF EXISTS "Allow all delete on processos" ON public.processos;
DROP POLICY IF EXISTS "Allow all insert on processos" ON public.processos;
DROP POLICY IF EXISTS "Allow all select on processos" ON public.processos;
DROP POLICY IF EXISTS "Allow all update on processos" ON public.processos;
CREATE POLICY "auth_select_processos" ON public.processos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_processos" ON public.processos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_processos" ON public.processos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_processos" ON public.processos FOR DELETE TO authenticated USING (true);

-- PROFILES (scoped to own user for write)
DROP POLICY IF EXISTS "Allow all insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all read on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all update on profiles" ON public.profiles;
CREATE POLICY "auth_select_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "auth_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- SUBMISSION_DOCUMENTS
DROP POLICY IF EXISTS "Allow all delete on submission_documents" ON public.submission_documents;
DROP POLICY IF EXISTS "Allow all insert on submission_documents" ON public.submission_documents;
DROP POLICY IF EXISTS "Allow all read on submission_documents" ON public.submission_documents;
DROP POLICY IF EXISTS "Allow all update on submission_documents" ON public.submission_documents;
CREATE POLICY "auth_select_sub_docs" ON public.submission_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sub_docs" ON public.submission_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sub_docs" ON public.submission_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_sub_docs" ON public.submission_documents FOR DELETE TO authenticated USING (true);

-- SUBMISSION_NOTIFICATIONS
DROP POLICY IF EXISTS "Allow all insert access" ON public.submission_notifications;
DROP POLICY IF EXISTS "Allow all read access" ON public.submission_notifications;
DROP POLICY IF EXISTS "Allow all update access" ON public.submission_notifications;
CREATE POLICY "auth_select_sub_notif" ON public.submission_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sub_notif" ON public.submission_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sub_notif" ON public.submission_notifications FOR UPDATE TO authenticated USING (true);

-- SUBMISSIONS
DROP POLICY IF EXISTS "Allow all insert on submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow all select on submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow all update on submissions" ON public.submissions;
CREATE POLICY "auth_select_submissions" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_submissions" ON public.submissions FOR UPDATE TO authenticated USING (true);

-- TRIAL_BALANCE
DROP POLICY IF EXISTS "Allow all delete on trial_balance" ON public.trial_balance;
DROP POLICY IF EXISTS "Allow all insert on trial_balance" ON public.trial_balance;
DROP POLICY IF EXISTS "Allow all read on trial_balance" ON public.trial_balance;
DROP POLICY IF EXISTS "Allow all update on trial_balance" ON public.trial_balance;
CREATE POLICY "auth_select_trial_bal" ON public.trial_balance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_trial_bal" ON public.trial_balance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_trial_bal" ON public.trial_balance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_trial_bal" ON public.trial_balance FOR DELETE TO authenticated USING (true);

-- USER_ROLES (read for all authenticated, write for admins only)
DROP POLICY IF EXISTS "Allow all delete on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all read on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all update on user_roles" ON public.user_roles;
CREATE POLICY "auth_select_user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid()::text, 'admin'));
CREATE POLICY "admin_update_user_roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid()::text, 'admin'));
CREATE POLICY "admin_delete_user_roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid()::text, 'admin'));
