-- Enable pgvector for semantic search over analyses
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding + source text columns to analyses
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS embed_text text,
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast cosine similarity (supports up to 2000 dims)
CREATE INDEX IF NOT EXISTS analyses_embedding_idx
  ON public.analyses
  USING hnsw (embedding vector_cosine_ops);

-- Similarity search function, scoped to a session_id to enforce
-- per-user isolation (anon clients never call this — only the
-- service-role server fn does).
CREATE OR REPLACE FUNCTION public.match_analyses(
  query_embedding vector(1536),
  match_session_id text,
  match_count int DEFAULT 10,
  min_similarity float DEFAULT 0.2
)
RETURNS TABLE (
  id uuid,
  filename text,
  category text,
  score_total int,
  result jsonb,
  extracted jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.filename,
    a.category,
    a.score_total,
    a.result,
    a.extracted,
    a.created_at,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.analyses a
  WHERE a.session_id = match_session_id
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) >= min_similarity
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_analyses(vector, text, int, float) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_analyses(vector, text, int, float) TO service_role;