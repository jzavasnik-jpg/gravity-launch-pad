/**
 * Browser-side Supabase Client using @supabase/ssr
 * Uses cookies for PKCE code verifier storage (required for OAuth in Next.js)
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
