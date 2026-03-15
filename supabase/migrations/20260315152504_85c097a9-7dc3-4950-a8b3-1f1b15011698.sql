
-- Table to track generated actas
CREATE TABLE public.actas_recepcao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  fiscal_year text NOT NULL,
  fiscal_year_id text NOT NULL,
  acta_numero text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT 'Secretaria'
);

ALTER TABLE public.actas_recepcao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access on actas" ON public.actas_recepcao
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow all insert access on actas" ON public.actas_recepcao
  FOR INSERT TO public WITH CHECK (true);

-- Storage bucket for acta PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('actas-recepcao', 'actas-recepcao', true);

CREATE POLICY "Allow public read on actas-recepcao" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'actas-recepcao');

CREATE POLICY "Allow public insert on actas-recepcao" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'actas-recepcao');
