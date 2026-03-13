/**
 * Server-side Supabase Client
 * For use in API routes and server components
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Create an admin client with service role key
 * Use for operations that need to bypass RLS
 */
export function createAdminClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create a regular client for server-side operations
 * Respects RLS policies
 */
export function createServerClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Validate an API key and return the associated user
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean
  userId?: string
  user?: { id: string; email: string; plan: string }
  scopes?: string[]
  error?: string
}> {
  try {
    const { hashApiKey, isValidKeyFormat } = await import('./api-keys')

    if (!isValidKeyFormat(apiKey)) {
      return { valid: false, error: 'Invalid API key format' }
    }

    const keyHash = hashApiKey(apiKey)
    const adminClient = createAdminClient()

    // Find the API key
    const { data: keyData, error: keyError } = await adminClient
      .from('api_keys')
      .select('id, user_id, scopes, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single()

    if (keyError || !keyData) {
      return { valid: false, error: 'API key not found' }
    }

    if (!keyData.is_active) {
      return { valid: false, error: 'API key is revoked' }
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Get user info
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, email, plan_type')
      .eq('id', keyData.user_id)
      .single()

    if (userError || !userData) {
      return { valid: false, error: 'User not found' }
    }

    // Increment usage count
    await adminClient.rpc('increment_api_key_usage', { p_key_hash: keyHash })

    return {
      valid: true,
      userId: keyData.user_id,
      user: {
        id: userData.id,
        email: userData.email,
        plan: userData.plan_type,
      },
      scopes: keyData.scopes,
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { valid: false, error: 'Internal error validating API key' }
  }
}
