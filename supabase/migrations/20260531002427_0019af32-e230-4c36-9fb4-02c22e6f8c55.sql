
DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can read analyses" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can delete analyses" ON public.analyses;

REVOKE SELECT, INSERT, DELETE ON public.analyses FROM anon;
REVOKE SELECT, INSERT, DELETE ON public.analyses FROM authenticated;
-- service_role keeps GRANT ALL; RLS doesn't apply to service_role.
-- No policies = no client-side access. All reads/writes go through server functions.
