import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

/**
 * POST /api/b2/signed-url
 * Generates a presigned URL for downloading/accessing a file from B2
 *
 * Request body:
 * - key: string - The object key (path) in the bucket
 * - expiresIn?: number - URL expiration in seconds (default: 3600)
 *
 * Response:
 * - signedUrl: string - The presigned URL
 * - expiresIn: number - Expiration time in seconds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, expiresIn = 3600 } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing 'key' parameter (object path in bucket)" },
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

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    console.log(`✅ Signed URL generated for: ${key} (expires in ${expiresIn}s)`);

    return NextResponse.json({ signedUrl, expiresIn });
  } catch (error) {
    console.error('❌ B2 Signed URL Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
