import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
 * POST /api/storage/presign
 * Generates a presigned URL for uploading a file to B2
 *
 * Request body:
 * - fileName: string - Original file name
 * - contentType: string - MIME type of the file
 * - assetType?: string - Type of asset (video, image, thumbnail, etc.)
 *
 * Headers:
 * - Authorization: Bearer <token> (optional, for user-scoped paths)
 *
 * Response:
 * - uploadUrl: string - The presigned URL for PUT upload
 * - key: string - The generated object key
 * - expiresIn: number - Expiration time in seconds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType, assetType = 'general' } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters: fileName, contentType' },
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

    // Try to get user ID from auth header for user-scoped paths
    let userId = 'anonymous';
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn('Auth verification failed, using anonymous path:', authError);
      }
    }

    // Generate a unique, user-scoped key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `assets/${userId}/${assetType}/${timestamp}_${randomId}_${sanitizedFileName}`;

    const expiresIn = 3600; // 1 hour

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    console.log(`✅ Upload presigned URL generated for: ${key}`);

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn,
      publicUrl: `${process.env.NEXT_PUBLIC_B2_PUBLIC_URL || ''}/${key}`,
    });
  } catch (error) {
    console.error('❌ Storage Presign Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
