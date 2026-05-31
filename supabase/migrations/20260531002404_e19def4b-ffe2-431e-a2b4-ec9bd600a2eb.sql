
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  filename TEXT,
  category TEXT,
  score_total INTEGER,
  result JSONB NOT NULL,
  extracted JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analyses_session_created_idx ON public.analyses (session_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.analyses TO anon;
GRANT SELECT, INSERT, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- No-auth app: rows are scoped by client-generated session_id in queries.
-- Allow anyone to insert / read / delete; the app filters by session_id.
CREATE POLICY "Anyone can insert analyses"
  ON public.analyses FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read analyses"
  ON public.analyses FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete analyses"
  ON public.analyses FOR DELETE TO anon, authenticated
  USING (true);
