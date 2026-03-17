
-- Create entities table
CREATE TABLE public.entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  tutela TEXT,
  contacto TEXT,
  morada TEXT,
  tipologia TEXT NOT NULL DEFAULT 'orgao_soberania',
  provincia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Allow all read access (public reference data)
CREATE POLICY "Allow all read on entities" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Allow admin insert on entities" ON public.entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin update on entities" ON public.entities FOR UPDATE USING (true);

-- Create fiscal_years table
CREATE TABLE public.fiscal_years (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES public.entities(id),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  deadline TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  total_receita NUMERIC DEFAULT 0,
  total_despesa NUMERIC DEFAULT 0,
  completude NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on fiscal_years" ON public.fiscal_years FOR SELECT USING (true);
CREATE POLICY "Allow all insert on fiscal_years" ON public.fiscal_years FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on fiscal_years" ON public.fiscal_years FOR UPDATE USING (true);
