CREATE POLICY "auth_delete_pareceres" ON public.pareceres FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_delete_atividade_hist" ON public.atividade_historico FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_delete_proc_hist" ON public.processo_historico FOR DELETE TO authenticated USING (true);