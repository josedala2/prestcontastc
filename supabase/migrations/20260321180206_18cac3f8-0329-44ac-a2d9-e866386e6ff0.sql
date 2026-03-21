CREATE POLICY "anon_select_entities"
ON public.entities
FOR SELECT
TO anon
USING (true);