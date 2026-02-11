-- =============================================================================
-- SECURITY FIX: Resolve Supabase Security Advisor Vulnerabilities
-- Project: hnuhqczspijtrmzsactt
-- Date: 2026-02-10
-- =============================================================================
-- Fixes:
--   1. SECURITY DEFINER functions missing SET search_path (search_path mutable)
--   2. Overly permissive RLS policies (USING true for non-service_role)
--   3. Add service_role access policies where missing
-- =============================================================================


-- =============================================================================
-- FIX 1: handle_new_user() — SECURITY DEFINER without SET search_path
-- =============================================================================
-- This function fires on auth.users INSERT to auto-create a public.users row.
-- The previous version (from production_schema migration) was missing search_path.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    plan_type,
    is_email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'free',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- FIX 2: increment_api_key_usage() — SECURITY DEFINER without SET search_path
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_api_key_usage(p_key_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.api_keys
  SET
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE key_hash = p_key_hash AND is_active = TRUE;
END;
$$;


-- =============================================================================
-- FIX 3: has_pro_access() — Upgrade search_path from 'public' to ''
-- =============================================================================
-- Previously SET search_path = public, which is better than nothing but
-- '' (empty) is the recommended secure default per Supabase Security Advisor.

CREATE OR REPLACE FUNCTION public.has_pro_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Grant permanent PRO access to specific email
  IF user_email = 'jzavasnik@gmail.com' THEN
    RETURN true;
  END IF;

  -- Check plan_type for other users
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE email = user_email
    AND plan_type = 'pro'
  );
END;
$$;


-- =============================================================================
-- FIX 4: update_updated_at_column() — Secure the search_path
-- =============================================================================
-- This trigger function was SECURITY DEFINER SET search_path = public.
-- Upgrade to search_path = '' for consistency.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- FIX 5: update_updated_at() — Make consistent (not SECURITY DEFINER, but
-- set search_path defensively in case it's ever changed to DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- FIX 6: handle_api_keys_updated_at() — Defensive search_path
-- =============================================================================
-- Not SECURITY DEFINER currently, but set search_path defensively.

CREATE OR REPLACE FUNCTION public.handle_api_keys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- FIX 7: Avatar RLS — Replace overly permissive USING(true) policies
-- =============================================================================
-- The simpler_avatar_rls migration set USING(true) for all authenticated users.
-- This allows any authenticated user to read/insert ALL avatars.
-- Fix: scope to user's own sessions + grant service_role full access.

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated read avatars" ON public.avatars;
DROP POLICY IF EXISTS "Allow authenticated insert avatars" ON public.avatars;

-- Drop any leftover policies from earlier migrations
DROP POLICY IF EXISTS "Users can view avatars from their sessions" ON public.avatars;
DROP POLICY IF EXISTS "Users can insert avatars to their sessions" ON public.avatars;
DROP POLICY IF EXISTS "Users can manage avatars in own sessions" ON public.avatars;
DROP POLICY IF EXISTS "Service role full access to avatars" ON public.avatars;
DROP POLICY IF EXISTS "Anon cannot access avatars" ON public.avatars;
DROP POLICY IF EXISTS "Authenticated cannot access avatars directly" ON public.avatars;

-- Service role: full access (for backend/API operations)
CREATE POLICY "service_role_full_access_avatars" ON public.avatars
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read avatars from their own sessions
CREATE POLICY "authenticated_select_own_avatars" ON public.avatars
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.icp_sessions
      WHERE public.icp_sessions.id = public.avatars.icp_session_id
      AND public.icp_sessions.user_id = auth.uid()::text
    )
  );

-- Authenticated users: insert avatars into their own sessions
CREATE POLICY "authenticated_insert_own_avatars" ON public.avatars
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.icp_sessions
      WHERE public.icp_sessions.id = public.avatars.icp_session_id
      AND public.icp_sessions.user_id = auth.uid()::text
    )
  );

-- Authenticated users: update avatars in their own sessions
CREATE POLICY "authenticated_update_own_avatars" ON public.avatars
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.icp_sessions
      WHERE public.icp_sessions.id = public.avatars.icp_session_id
      AND public.icp_sessions.user_id = auth.uid()::text
    )
  );

-- Anon: no access
CREATE POLICY "anon_no_access_avatars" ON public.avatars
  FOR ALL
  TO anon
  USING (false);


-- =============================================================================
-- FIX 8: Ensure service_role access on all tables
-- =============================================================================
-- Some tables may only have user-scoped policies but no service_role policy,
-- which means backend operations using the service role key could be blocked.

-- api_keys: add service_role access (currently only has user-scoped policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_keys' AND policyname = 'service_role_full_access_api_keys'
  ) THEN
    CREATE POLICY "service_role_full_access_api_keys" ON public.api_keys
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- icp_sessions: ensure service_role access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'icp_sessions' AND policyname = 'service_role_full_access_icp_sessions'
  ) THEN
    CREATE POLICY "service_role_full_access_icp_sessions" ON public.icp_sessions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- marketing_statements: ensure service_role access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marketing_statements' AND policyname = 'service_role_full_access_marketing_statements'
  ) THEN
    CREATE POLICY "service_role_full_access_marketing_statements" ON public.marketing_statements
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- users: ensure service_role access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'service_role_full_access_users'
  ) THEN
    CREATE POLICY "service_role_full_access_users" ON public.users
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- product_assets: ensure service_role access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_assets' AND policyname = 'service_role_full_access_product_assets'
  ) THEN
    CREATE POLICY "service_role_full_access_product_assets" ON public.product_assets
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;


-- =============================================================================
-- VERIFICATION: Check for any remaining SECURITY DEFINER without search_path
-- =============================================================================
-- Run this query in the SQL Editor to verify all functions are fixed:
--
-- SELECT
--   n.nspname AS schema,
--   p.proname AS function_name,
--   p.prosecdef AS security_definer,
--   p.proconfig AS config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prosecdef = true
-- ORDER BY p.proname;
--
-- All SECURITY DEFINER functions should show search_path='' in config.
-- =============================================================================
