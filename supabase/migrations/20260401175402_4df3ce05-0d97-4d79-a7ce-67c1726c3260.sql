-- Allow anon role to insert notifications (portal entities use anon key)
CREATE POLICY "anon_insert_sub_notif"
ON public.submission_notifications
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to select notifications
CREATE POLICY "anon_select_sub_notif"
ON public.submission_notifications
FOR SELECT
TO anon
USING (true);

-- Allow anon role to insert audit log entries
CREATE POLICY "anon_insert_audit_log"
ON public.audit_log
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to select emolumentos
CREATE POLICY "anon_select_emolumentos"
ON public.emolumentos
FOR SELECT
TO anon
USING (true);

-- Allow anon role to update emolumentos (for status changes from portal)
CREATE POLICY "anon_update_emolumentos"
ON public.emolumentos
FOR UPDATE
TO anon
USING (true);

-- Allow anon role to select emolumento_guias
CREATE POLICY "anon_select_guias"
ON public.emolumento_guias
FOR SELECT
TO anon
USING (true);

-- Allow anon role to insert emolumento_historico
CREATE POLICY "anon_insert_emol_hist"
ON public.emolumento_historico
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to select emolumento_historico
CREATE POLICY "anon_select_emol_hist"
ON public.emolumento_historico
FOR SELECT
TO anon
USING (true);