/**
 * API Route: Get ICPs (ICP Sessions)
 * GET /api/v1/icps
 *
 * Returns all completed ICP sessions for the authenticated user (via API key).
 * Used by external apps (YouTube Content Creator) to import ICP data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, createAdminClient } from '@/lib/supabase-server'
import { API_SCOPES } from '@/lib/api-keys'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-launchpad-api-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-launchpad-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required', icps: [] },
        { status: 401, headers: corsHeaders }
      )
    }

    // Validate the API key
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, icps: [] },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check scope
    if (!validation.scopes?.includes(API_SCOPES.ICPS_READ)) {
      return NextResponse.json(
        { error: 'API key does not have icps:read scope', icps: [] },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get user's ICP sessions
    const adminClient = createAdminClient()

    const { data: sessions, error: sessionsError } = await adminClient
      .from('icp_sessions')
      .select('id, answers, core_desire, six_s, completed, created_at, updated_at')
      .eq('user_id', validation.userId)
      .eq('completed', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching ICP sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch ICPs', icps: [] },
        { status: 500, headers: corsHeaders }
      )
    }

    // Transform for external consumption
    const formattedIcps = (sessions || []).map(session => ({
      id: session.id,
      answers: session.answers || [],
      core_desire: session.core_desire,
      six_s: session.six_s,
      created_at: session.created_at,
      updated_at: session.updated_at,
    }))

    return NextResponse.json(
      { icps: formattedIcps },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error fetching ICPs:', error)
    return NextResponse.json(
      { error: 'Internal server error', icps: [] },
      { status: 500, headers: corsHeaders }
    )
  }
}
