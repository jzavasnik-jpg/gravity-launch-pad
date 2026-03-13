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
 * POST /api/b2/signed-urls
 * Generates multiple presigned URLs for downloading/accessing files from B2
 *
 * Request body:
 * - keys: string[] - Array of object keys (paths) in the bucket
 * - expiresIn?: number - URL expiration in seconds (default: 3600)
 *
 * Response:
 * - signedUrls: Array<{ key: string, signedUrl?: string, success: boolean, error?: string }>
 * - expiresIn: number - Expiration time in seconds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys, expiresIn = 3600 } = body;

    if (!keys || !Array.isArray(keys)) {
      return NextResponse.json(
        { error: "Missing 'keys' array parameter" },
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

    // Generate signed URLs in parallel
    const signedUrls = await Promise.all(
      keys.map(async (key: string) => {
        try {
          const command = new GetObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: key,
          });
          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
          return { key, signedUrl, success: true };
        } catch (err) {
          return {
            key,
            error: err instanceof Error ? err.message : 'Unknown error',
            success: false,
          };
        }
      })
    );

    const successCount = signedUrls.filter((u) => u.success).length;
    console.log(`✅ Generated ${successCount}/${keys.length} signed URLs`);

    return NextResponse.json({ signedUrls, expiresIn });
  } catch (error) {
    console.error('❌ Batch B2 Signed URLs Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
