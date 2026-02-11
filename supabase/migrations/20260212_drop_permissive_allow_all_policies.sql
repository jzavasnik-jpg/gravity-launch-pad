-- =============================================================================
-- CRITICAL SECURITY FIX: Drop "Allow all" policies that bypass RLS
-- Project: hnuhqczspijtrmzsactt
-- Date: 2026-02-10
-- =============================================================================
-- PROBLEM: Legacy "Allow all" policies have no role restriction (apply to all
-- roles including anon). Because PostgreSQL RLS uses OR logic for permissive
-- policies, these override all deny policies:
--
--   "Allow all ICP sessions" USING(true)  ← applies to anon, authenticated, etc.
--   + "Anon cannot access" USING(false)   ← only applies to anon
--   = true OR false = true                ← anon CAN access!
--
-- FIX: Drop all "Allow all" policies. After removal:
--   - service_role: granted by "Service role full access" policies
--   - authenticated: granted by "Users can view/insert/update..." policies
--   - anon: denied (no permissive policy exists → default deny)
-- =============================================================================


-- =============================================================================
-- Drop the dangerously permissive "Allow all" policies
-- These apply to ALL roles (no TO clause) and override all deny policies
-- =============================================================================

DROP POLICY IF EXISTS "Allow all ICP sessions" ON public.icp_sessions;
DROP POLICY IF EXISTS "Allow all access to product_assets" ON public.product_assets;
DROP POLICY IF EXISTS "Allow all product assets" ON public.product_assets;
DROP POLICY IF EXISTS "Allow all asset voiceovers" ON public.asset_voiceovers;
DROP POLICY IF EXISTS "Allow all processing jobs" ON public.asset_processing_jobs;
DROP POLICY IF EXISTS "Allow all session vectors" ON public.session_vectors;
DROP POLICY IF EXISTS "Allow all users" ON public.users;
DROP POLICY IF EXISTS "Allow all walkthrough assets" ON public.walkthrough_assets;


-- =============================================================================
-- Drop conflicting "Authenticated cannot access" deny policies for tables
-- where Launch Pad needs authenticated user access via user-scoped policies.
-- These don't actually block access (OR with false = no-op), but they're
-- misleading and create confusion about the intended security model.
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated cannot access icp_sessions directly" ON public.icp_sessions;
DROP POLICY IF EXISTS "Authenticated cannot access product_assets directly" ON public.product_assets;
DROP POLICY IF EXISTS "Authenticated cannot access marketing_statements directly" ON public.marketing_statements;
DROP POLICY IF EXISTS "Authenticated cannot access users directly" ON public.users;


-- =============================================================================
-- Ensure session_vectors has proper RLS (no user-scoped policies exist for it)
-- Only service_role should access session_vectors
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_vectors' AND policyname = 'service_role_full_access_session_vectors'
  ) THEN
    CREATE POLICY "service_role_full_access_session_vectors" ON public.session_vectors
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_vectors' AND policyname = 'anon_no_access_session_vectors'
  ) THEN
    CREATE POLICY "anon_no_access_session_vectors" ON public.session_vectors
      FOR ALL TO anon USING (false);
  END IF;
END $$;


-- =============================================================================
-- Also drop any remaining "Allow all operations on ..." from the earliest
-- migration (20251114040149) in case they weren't caught above
-- =============================================================================

DROP POLICY IF EXISTS "Allow all operations on icp_sessions" ON public.icp_sessions;
DROP POLICY IF EXISTS "Allow all operations on avatars" ON public.avatars;
DROP POLICY IF EXISTS "Allow all operations on marketing_statements" ON public.marketing_statements;
DROP POLICY IF EXISTS "Allow all operations on generated_assets" ON public.generated_assets;
