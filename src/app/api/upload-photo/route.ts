import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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
    console.log('[Upload Photo API] User ID:', userId);

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Upload Photo API] File:', file.name, file.type, file.size);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile_photos/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using admin client
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('[Upload Photo API] Storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Upload Photo API] Upload successful:', data);

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('[Upload Photo API] Public URL:', urlData.publicUrl);

    return NextResponse.json({ url: urlData.publicUrl });

  } catch (error) {
    console.error('[Upload Photo API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
