-- Allow anon to insert processos (needed for emolumento flow)
CREATE POLICY "anon_insert_processos"
ON public.processos
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert emolumentos
CREATE POLICY "anon_insert_emolumentos"
ON public.emolumentos
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert emolumento_guias
CREATE POLICY "anon_insert_guias"
ON public.emolumento_guias
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to select processos (needed to check existing)
CREATE POLICY "anon_select_processos"
ON public.processos
FOR SELECT
TO anon
USING (true);

-- Allow anon to update submission_notifications (mark as read)
CREATE POLICY "anon_update_sub_notif"
ON public.submission_notifications
FOR UPDATE
TO anon
USING (true);