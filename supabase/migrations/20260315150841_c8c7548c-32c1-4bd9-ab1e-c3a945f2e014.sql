
-- Table for persisting emitted pareceres with version history
CREATE TABLE public.pareceres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  fiscal_year text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  tipo_parecer_index integer NOT NULL DEFAULT 0,
  parecer_final text NOT NULL,
  total_activo numeric NOT NULL DEFAULT 0,
  total_passivo numeric NOT NULL DEFAULT 0,
  total_cap_proprio numeric NOT NULL DEFAULT 0,
  resultado_exercicio numeric NOT NULL DEFAULT 0,
  total_proveitos numeric NOT NULL DEFAULT 0,
  total_custos numeric NOT NULL DEFAULT 0,
  comentarios text,
  tecnico_nome text NOT NULL,
  file_path text,
  file_name text,
  integrity_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pareceres ENABLE ROW LEVEL SECURITY;

-- Public read/insert for now (no auth yet)
CREATE POLICY "Allow all read access on pareceres" ON public.pareceres FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access on pareceres" ON public.pareceres FOR INSERT TO public WITH CHECK (true);

-- Storage bucket for parecer DOCX files
INSERT INTO storage.buckets (id, name, public) VALUES ('pareceres', 'pareceres', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public read on pareceres bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pareceres');
CREATE POLICY "Allow public insert on pareceres bucket" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'pareceres');
