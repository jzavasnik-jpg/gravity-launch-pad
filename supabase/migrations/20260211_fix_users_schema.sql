-- =============================================================================
-- SCHEMA FIX: Add missing columns to users table + fix handle_new_user()
-- Project: hnuhqczspijtrmzsactt
-- Date: 2026-02-10
-- =============================================================================
-- The users table was created by the production_schema migration with:
--   id (text), email, display_name, avatar_url, created_at, updated_at, name
--
-- Launch Pad expects additional columns:
--   plan_type, linked_platforms, is_email_verified
--
-- The handle_new_user() trigger was inserting into non-existent columns,
-- causing silent failures on new user signups.
-- =============================================================================


-- =============================================================================
-- Add missing columns
-- =============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linked_platforms JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;

-- Add index for plan_type lookups (used by has_pro_access)
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);


-- =============================================================================
-- Fix handle_new_user() to match actual table schema
-- =============================================================================
-- The table has both display_name (from GPL) and name (from launch-pad).
-- Populate both for compatibility with both apps.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.users (
    id,
    email,
    name,
    display_name,
    avatar_url,
    plan_type,
    is_email_verified
  ) VALUES (
    NEW.id::text,
    NEW.email,
    user_name,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;
