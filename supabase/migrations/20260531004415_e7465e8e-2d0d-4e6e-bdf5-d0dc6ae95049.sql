DROP INDEX IF EXISTS public.analyses_embedding_hnsw_idx;
DROP INDEX IF EXISTS public.analyses_embedding_idx;
DROP FUNCTION IF EXISTS public.match_analyses(extensions.vector, text, integer, double precision);

ALTER TABLE public.analyses DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.analyses ADD COLUMN embedding extensions.vector(4096);

CREATE OR REPLACE FUNCTION public.match_analyses(
  query_embedding extensions.vector(4096),
  match_session_id text,
  match_count integer DEFAULT 10,
  min_similarity double precision DEFAULT 0.2
)
RETURNS TABLE (
  id uuid,
  filename text,
  category text,
  score_total integer,
  result jsonb,
  extracted jsonb,
  created_at timestamptz,
  similarity double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    a.id,
    a.filename,
    a.category,
    a.score_total,
    a.result,
    a.extracted,
    a.created_at,
    1 - (a.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.analyses a
  WHERE a.session_id = match_session_id
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding OPERATOR(extensions.<=>) query_embedding) >= min_similarity
  ORDER BY a.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$$;
