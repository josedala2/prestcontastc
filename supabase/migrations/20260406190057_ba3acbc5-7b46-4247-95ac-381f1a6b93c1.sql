
CREATE POLICY "Allow authenticated insert on fiscal_years"
ON public.fiscal_years
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated select on fiscal_years"
ON public.fiscal_years
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update on fiscal_years"
ON public.fiscal_years
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on fiscal_years"
ON public.fiscal_years
FOR DELETE
TO authenticated
USING (true);
