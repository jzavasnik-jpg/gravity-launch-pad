import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[Upload Avatar] Starting...');

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
      console.error('[Upload Avatar] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Upload Avatar] User:', user.id);

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Upload Avatar] File:', file.name, file.type, file.size);

    // Convert File to Buffer (required for Supabase Storage)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `profile_photos/${fileName}`;

    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload Avatar] Storage error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    console.log('[Upload Avatar] Upload successful');

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;
    console.log('[Upload Avatar] Public URL:', avatarUrl);

    // Update user record in database using admin client
    const { error: updateError } = await adminClient
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Upload Avatar] Database update error:', updateError);
      // Don't fail - file was uploaded successfully
    } else {
      console.log('[Upload Avatar] Database updated');
    }

    return NextResponse.json({ url: avatarUrl, success: true });

  } catch (error) {
    console.error('[Upload Avatar] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
