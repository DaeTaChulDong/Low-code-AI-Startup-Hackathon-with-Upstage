-- Move vector extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Explicitly revoke from anon + authenticated; only service_role may call.
REVOKE EXECUTE ON FUNCTION public.match_analyses(extensions.vector, text, int, float) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_analyses(extensions.vector, text, int, float) TO service_role;