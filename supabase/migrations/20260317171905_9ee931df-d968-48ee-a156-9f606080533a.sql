-- Create storage bucket for submission documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-documents', 'submission-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for submission documents
CREATE POLICY "Allow public read on submission-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'submission-documents');

CREATE POLICY "Allow public insert on submission-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submission-documents');

CREATE POLICY "Allow public update on submission-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submission-documents');

CREATE POLICY "Allow public delete on submission-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'submission-documents');

-- Table to track individual uploaded documents per submission
CREATE TABLE public.submission_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id TEXT NOT NULL,
  fiscal_year_id TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  doc_label TEXT NOT NULL,
  doc_category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_id, fiscal_year_id, doc_id)
);

ALTER TABLE public.submission_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on submission_documents"
ON public.submission_documents FOR SELECT
USING (true);

CREATE POLICY "Allow all insert on submission_documents"
ON public.submission_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all update on submission_documents"
ON public.submission_documents FOR UPDATE
USING (true);

CREATE POLICY "Allow all delete on submission_documents"
ON public.submission_documents FOR DELETE
USING (true);