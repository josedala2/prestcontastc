CREATE POLICY "Allow all delete on processo_documentos"
ON public.processo_documentos
FOR DELETE
TO public
USING (true);