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
    const adminClient = createAdminClient();

    // Get all ICP sessions
    const { data: sessions, error: sessError } = await adminClient
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (sessError) {
      console.error('Error fetching sessions:', sessError);
    }

    // Get session IDs for related queries
    const sessionIds = sessions?.map(s => s.id) || [];

    // Get all avatars for user's sessions
    let avatars: any[] = [];
    if (sessionIds.length > 0) {
      const { data: avatarData, error: avatarError } = await adminClient
        .from('avatars')
        .select('*')
        .in('icp_session_id', sessionIds);

      if (!avatarError && avatarData) {
        avatars = avatarData;
      }
    }

    // Get avatar IDs for marketing statements
    const avatarIds = avatars.map(a => a.id);

    // Get marketing statements for user's avatars
    let marketingStatements: any[] = [];
    if (avatarIds.length > 0) {
      const { data: marketingData, error: marketingError } = await adminClient
        .from('marketing_statements')
        .select('*')
        .in('avatar_id', avatarIds);

      if (!marketingError && marketingData) {
        marketingStatements = marketingData;
      }
    }

    // Get product assets
    const { data: assets, error: assetError } = await adminClient
      .from('product_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user record
    const { data: userRecord, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Find the best session (completed with answers)
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
      // If no session with answers, use the most recent completed one
      if (!latestSession) {
        latestSession = sessions.find(s => s.completed) || sessions[0];
      }
    }

    return NextResponse.json({
      userId,
      userRecord,
      sessions: sessions || [],
      latestSession,
      avatars,
      marketingStatements,
      assets: assets || [],
    });

  } catch (error) {
    console.error('User data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
