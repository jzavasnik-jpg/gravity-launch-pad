import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client to bypass RLS
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Avatar API] Fetching avatar:', id);

    // Verify auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      console.error('[Avatar API] Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch the avatar
    const { data: avatar, error: avatarError } = await adminClient
      .from('avatars')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (avatarError) {
      console.error('[Avatar API] Avatar fetch error:', avatarError);
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    // Fetch marketing statements for this avatar
    const { data: marketingStatements, error: statementsError } = await adminClient
      .from('marketing_statements')
      .select('*')
      .eq('avatar_id', id)
      .order('created_at', { ascending: false });

    if (statementsError) {
      console.error('[Avatar API] Marketing statements error:', statementsError);
    }

    // Fetch the associated ICP session for additional context
    let sessionData = null;
    if (avatar.icp_session_id) {
      const { data: session, error: sessionError } = await adminClient
        .from('icp_sessions')
        .select('*')
        .eq('id', avatar.icp_session_id)
        .single();

      if (!sessionError && session) {
        sessionData = session;
      }
    }

    console.log('[Avatar API] Successfully fetched avatar:', avatar.name);

    return NextResponse.json({
      avatar,
      marketingStatements: marketingStatements || [],
      session: sessionData,
    });

  } catch (error) {
    console.error('[Avatar API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
