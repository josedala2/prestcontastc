
-- Create submission_notifications table
CREATE TABLE public.submission_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_email TEXT,
  fiscal_year_id TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recepcionado', 'rejeitado')),
  message TEXT NOT NULL,
  detail TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_notifications ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth in this demo app)
CREATE POLICY "Allow all read access" ON public.submission_notifications
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON public.submission_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON public.submission_notifications
  FOR UPDATE USING (true);

-- Index for entity lookup
CREATE INDEX idx_notifications_entity ON public.submission_notifications(entity_id);
CREATE INDEX idx_notifications_read ON public.submission_notifications(entity_id, read);
