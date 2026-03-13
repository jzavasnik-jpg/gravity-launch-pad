import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;
    console.log('[Home API] User ID:', userId);
    const adminClient = createAdminClient();

    // Get all sessions for this user
    const { data: allSessions, error: sessError } = await adminClient
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (sessError) {
      console.error('[Home API] Error fetching sessions:', sessError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const hasAnySessions = allSessions && allSessions.length > 0;

    // Find incomplete session
    let incompleteSession = null;
    if (allSessions) {
      incompleteSession = allSessions.find((s: any) => !s.completed) || null;
    }

    // Find session with real answers for latest session info
    let latestSession = null;
    if (allSessions && allSessions.length > 0) {
      for (const session of allSessions) {
        const hasRealAnswers = session.answers &&
          Array.isArray(session.answers) &&
          session.answers.some((a: string) => a && a.trim());

        if (hasRealAnswers) {
          latestSession = session;
          break;
        }
      }
    }

    // Get avatars - try from latest session first, then search previous sessions
    let avatars: any[] = [];

    if (latestSession) {
      const { data: avatarData, error: avatarError } = await adminClient
        .from('avatars')
        .select('*')
        .eq('icp_session_id', latestSession.id)
        .is('deleted_at', null);

      if (!avatarError && avatarData && avatarData.length > 0) {
        avatars = avatarData;
      }
    }

    // If no avatars in latest, check previous sessions
    if (avatars.length === 0 && allSessions && allSessions.length > 0) {
      for (const session of allSessions) {
        if (latestSession && session.id === latestSession.id) continue;

        const { data: sessionAvatars } = await adminClient
          .from('avatars')
          .select('*')
          .eq('icp_session_id', session.id)
          .is('deleted_at', null);

        if (sessionAvatars && sessionAvatars.length > 0) {
          avatars = sessionAvatars;
          break;
        }
      }
    }

    console.log('[Home API] Returning data:', {
      hasAnySessions,
      hasIncompleteSession: !!incompleteSession,
      avatarCount: avatars.length
    });

    return NextResponse.json({
      hasAnySessions,
      incompleteSession,
      latestSession,
      avatars,
      userId
    });

  } catch (error) {
    console.error('[Home API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
