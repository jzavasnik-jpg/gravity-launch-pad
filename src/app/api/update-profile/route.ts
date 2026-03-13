import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[Update Profile] Starting...');

  try {
    // Create server client to get user from cookies
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Get user from session
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      console.error('[Update Profile] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Update Profile] User:', user.id);

    // Get update data from request body
    const body = await request.json();
    const { name } = body;

    // Allow empty string but ensure it's a string type
    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const trimmedName = name.trim();
    console.log('[Update Profile] Updating name to:', trimmedName || '(empty)');

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Update user record in database
    const { error: updateError } = await adminClient
      .from('users')
      .update({ name: trimmedName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Update Profile] Database error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('[Update Profile] Success');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Update Profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
