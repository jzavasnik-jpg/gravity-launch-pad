/**
 * API Route: Get Avatars
 * GET /api/v1/avatars
 *
 * Returns all avatars for the authenticated user (via API key).
 * Used by external apps (YouTube Content Creator) to import avatars.
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
        { error: 'API key is required', avatars: [] },
        { status: 401, headers: corsHeaders }
      )
    }

    // Validate the API key
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, avatars: [] },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check scope
    if (!validation.scopes?.includes(API_SCOPES.AVATARS_READ)) {
      return NextResponse.json(
        { error: 'API key does not have avatars:read scope', avatars: [] },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get user's avatars
    const adminClient = createAdminClient()

    // First get all ICP sessions for this user
    const { data: sessions, error: sessionsError } = await adminClient
      .from('icp_sessions')
      .select('id')
      .eq('user_id', validation.userId)
      .is('deleted_at', null)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions', avatars: [] },
        { status: 500, headers: corsHeaders }
      )
    }

    const sessionIds = sessions?.map(s => s.id) || []

    if (sessionIds.length === 0) {
      return NextResponse.json({ avatars: [] }, { headers: corsHeaders })
    }

    // Get avatars for those sessions
    const { data: avatars, error: avatarsError } = await adminClient
      .from('avatars')
      .select('id, name, age, gender, occupation, photo_url, pain_points, pain_points_matrix, dreams, daily_challenges, six_s_scores, buying_triggers, created_at')
      .in('icp_session_id', sessionIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (avatarsError) {
      console.error('Error fetching avatars:', avatarsError)
      return NextResponse.json(
        { error: 'Failed to fetch avatars', avatars: [] },
        { status: 500, headers: corsHeaders }
      )
    }

    // Transform for external consumption
    const formattedAvatars = (avatars || []).map(avatar => ({
      id: avatar.id,
      name: avatar.name,
      age: avatar.age,
      gender: avatar.gender,
      occupation: avatar.occupation,
      photo_url: avatar.photo_url,
      thumbnail_url: avatar.photo_url, // Use same URL for thumbnail
      pain_points_matrix: avatar.pain_points_matrix || avatar.pain_points,
      dreams: avatar.dreams,
      daily_challenges: avatar.daily_challenges,
      six_s_scores: avatar.six_s_scores,
      buying_triggers: avatar.buying_triggers,
      created_at: avatar.created_at,
    }))

    return NextResponse.json(
      { avatars: formattedAvatars },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error fetching avatars:', error)
    return NextResponse.json(
      { error: 'Internal server error', avatars: [] },
      { status: 500, headers: corsHeaders }
    )
  }
}
