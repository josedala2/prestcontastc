-- Allow delete on entities table
CREATE POLICY "Allow admin delete on entities" ON public.entities FOR DELETE TO public USING (true);