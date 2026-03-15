CREATE POLICY "Allow all delete access on actas"
ON public.actas_recepcao
FOR DELETE
TO public
USING (true);