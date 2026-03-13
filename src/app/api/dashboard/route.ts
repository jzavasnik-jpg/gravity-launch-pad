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

    // Handle rate limiting - return 429 so client can retry
    if (authError?.status === 429 || authError?.message?.includes('rate limit')) {
      console.warn('[Dashboard API] Rate limited by Supabase');
      return NextResponse.json({ error: 'Rate limited, please retry' }, { status: 429 });
    }

    if (authError || !user) {
      console.log('[Dashboard API] Auth error:', authError?.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;
    console.log('[Dashboard API] User ID:', userId);
    const adminClient = createAdminClient();

    // Get latest ICP session with real answers
    const { data: sessions, error: sessError } = await adminClient
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (sessError) {
      console.error('Error fetching sessions:', sessError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Find session with real answers
    let latestSession = null;
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const hasRealAnswers = session.answers &&
          Array.isArray(session.answers) &&
          session.answers.some((a: string) => a && a.trim());

        if (hasRealAnswers) {
          latestSession = session;
          break;
        }
      }
    }

    // Get avatars for the session
    let avatars: any[] = [];
    if (latestSession) {
      const { data: avatarData, error: avatarError } = await adminClient
        .from('avatars')
        .select('*')
        .eq('icp_session_id', latestSession.id);

      if (!avatarError && avatarData) {
        avatars = avatarData;
      }
    }

    return NextResponse.json({
      session: latestSession,
      avatars: avatars,
      userId: userId
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
