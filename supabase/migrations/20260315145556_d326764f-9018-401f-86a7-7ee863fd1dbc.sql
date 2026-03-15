-- Table to store responses to element requests
CREATE TABLE public.element_request_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id text NOT NULL,
  entity_id text NOT NULL,
  fiscal_year_id text NOT NULL,
  response_message text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.element_request_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access on responses" ON public.element_request_responses FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access on responses" ON public.element_request_responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update access on responses" ON public.element_request_responses FOR UPDATE TO public USING (true);

-- Table to store uploaded files for responses
CREATE TABLE public.element_request_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.element_request_responses(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.element_request_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access on files" ON public.element_request_files FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access on files" ON public.element_request_files FOR INSERT TO public WITH CHECK (true);

-- Storage bucket for element request documents
INSERT INTO storage.buckets (id, name, public) VALUES ('element-requests', 'element-requests', true);

CREATE POLICY "Allow public upload to element-requests" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'element-requests');
CREATE POLICY "Allow public read from element-requests" ON storage.objects FOR SELECT TO public USING (bucket_id = 'element-requests');