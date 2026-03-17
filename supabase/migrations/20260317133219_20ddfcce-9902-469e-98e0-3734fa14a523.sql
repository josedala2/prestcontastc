
-- Create storage bucket for processo documents
INSERT INTO storage.buckets (id, name, public) VALUES ('processo-documentos', 'processo-documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for processo-documentos bucket
CREATE POLICY "Allow public upload on processo-documentos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'processo-documentos');

CREATE POLICY "Allow public read on processo-documentos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'processo-documentos');

CREATE POLICY "Allow public delete on processo-documentos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'processo-documentos');
