
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  fiscal_year_id text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  submitted_at timestamptz,
  recepcionado_at timestamptz,
  rejeitado_at timestamptz,
  motivo_rejeicao text,
  uploaded_doc_ids text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, fiscal_year_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow all insert on submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on submissions" ON public.submissions FOR UPDATE USING (true);
