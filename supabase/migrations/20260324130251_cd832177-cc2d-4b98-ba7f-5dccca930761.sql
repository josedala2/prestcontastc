-- Allow authenticated users to delete from tables needed for cleanup (only missing policies)
CREATE POLICY "auth_delete_fiscal_years" ON public.fiscal_years FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete_submissions" ON public.submissions FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete_sub_notif" ON public.submission_notifications FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete_fin_ind" ON public.financial_indicators FOR DELETE TO authenticated USING (true);