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
    console.log('[Product Assets API] User ID:', userId);

    const adminClient = createAdminClient();

    // Get filters from query params
    const searchParams = request.nextUrl.searchParams;
    const assetType = searchParams.get('asset_type');
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session_id');

    // Build query
    let query = adminClient
      .from('product_assets')
      .select('*')
      .eq('user_id', userId);

    if (assetType) {
      query = query.eq('asset_type', assetType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: assets, error: assetsError } = await query.order('created_at', { ascending: false });

    if (assetsError) {
      console.error('[Product Assets API] Error fetching assets:', assetsError);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    console.log('[Product Assets API] Returning', assets?.length || 0, 'assets');

    return NextResponse.json({
      assets: assets || [],
      userId: userId
    });

  } catch (error) {
    console.error('[Product Assets API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get asset ID from body
    const body = await request.json();
    const assetId = body.assetId;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Delete the asset (only if it belongs to this user)
    const { error: deleteError } = await adminClient
      .from('product_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Product Assets API] Error deleting asset:', deleteError);
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Product Assets API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
