import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Initialize S3 client for Backblaze B2
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  region: process.env.B2_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
});

const B2_BUCKET_NAME = process.env.NEXT_PUBLIC_B2_BUCKET_NAME || 'gravity-assets';

// Initialize Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/storage/delete
 * Deletes a file from B2 storage
 *
 * Request body:
 * - key: string - The object key (path) to delete
 *
 * Headers:
 * - Authorization: Bearer <token> (required for user-scoped deletion)
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing 'key' parameter" },
        { status: 400 }
      );
    }

    // Validate B2 credentials are configured
    if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      console.error('B2 credentials not configured');
      return NextResponse.json(
        { error: 'B2 credentials not configured on server' },
        { status: 500 }
      );
    }

    // Verify user authentication and ownership
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Security check: User can only delete files in their own directory
    // Key format: assets/{userId}/{assetType}/{filename}
    const userPrefix = `assets/${user.id}/`;
    if (!key.startsWith(userPrefix)) {
      console.warn(`❌ Unauthorized delete attempt: User ${user.id} tried to delete ${key}`);
      return NextResponse.json(
        { error: 'You can only delete your own files' },
        { status: 403 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    console.log(`✅ File deleted: ${key} (by user ${user.id})`);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('❌ Storage Delete Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
