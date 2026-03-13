// Next.js API Route: composite-images
// Image compositing using Sharp library
// Ported from gravity-product-launcher backend/server.js

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface Overlay {
  imageUrl: string;
  relativePosition: {
    left: number;
    top: number;
  };
  relativeDimensions: {
    width: number;
    height: number;
  };
}

interface BaseImageTransform {
  x: number;
  y: number;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface CompositeRequest {
  baseImage: string;
  overlays: Overlay[];
  baseImageTransform?: BaseImageTransform;
}

// Helper to get buffer from URL or Base64
async function getImageBuffer(input: string): Promise<Buffer> {
  if (!input) throw new Error("Image input missing");

  if (input.startsWith('http')) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Assume Base64
  return Buffer.from(input.replace(/^data:image\/\w+;base64,/, ""), 'base64');
}

export async function POST(request: NextRequest) {
  console.log("🧩 Compositing Images (Strict Integer Mode)...");

  try {
    const body: CompositeRequest = await request.json();
    const { baseImage, overlays, baseImageTransform } = body;

    if (!baseImage || !overlays || !Array.isArray(overlays)) {
      return NextResponse.json(
        { error: 'Missing baseImage or overlays array' },
        { status: 400 }
      );
    }

    let baseBuffer = await getImageBuffer(baseImage);

    // --- APPLY BASE IMAGE REPOSITIONING (PAN/ZOOM) ---
    if (baseImageTransform) {
      console.log("   - Applying Pan/Zoom Transform:", baseImageTransform);
      const { x, y, scale, canvasWidth, canvasHeight } = baseImageTransform;

      const metadata = await sharp(baseBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Could not get base image metadata");
      }

      const imageRatio = metadata.width / metadata.height;
      const canvasRatio = canvasWidth / canvasHeight;

      let coveredWidth: number, coveredHeight: number;

      if (imageRatio > canvasRatio) {
        coveredHeight = canvasHeight;
        coveredWidth = coveredHeight * imageRatio;
      } else {
        coveredWidth = canvasWidth;
        coveredHeight = coveredWidth / imageRatio;
      }

      // 1. Resize base image
      const zoomedWidth = Math.round(coveredWidth * scale);
      const zoomedHeight = Math.round(coveredHeight * scale);

      baseBuffer = await sharp(baseBuffer)
        .resize(zoomedWidth, zoomedHeight)
        .toBuffer();

      // 2. Crop
      const centerX = zoomedWidth / 2;
      const centerY = zoomedHeight / 2;
      const viewCenterX = canvasWidth / 2;
      const viewCenterY = canvasHeight / 2;

      // Strict rounding for extract
      let left = Math.round((centerX - viewCenterX) - x);
      let top = Math.round((centerY - viewCenterY) - y);
      const extractWidth = Math.round(canvasWidth);
      const extractHeight = Math.round(canvasHeight);

      // Bounds checking
      left = Math.max(0, Math.min(left, zoomedWidth - extractWidth));
      top = Math.max(0, Math.min(top, zoomedHeight - extractHeight));

      // Log for debugging
      console.log(`   - Cropping Base: left=${left}, top=${top}, w=${extractWidth}, h=${extractHeight}`);

      baseBuffer = await sharp(baseBuffer)
        .extract({
          left: Math.floor(left),
          top: Math.floor(top),
          width: Math.floor(extractWidth),
          height: Math.floor(extractHeight)
        })
        .toBuffer();
    }

    const baseMetadata = await sharp(baseBuffer).metadata();
    const baseWidth = baseMetadata.width || 0;
    const baseHeight = baseMetadata.height || 0;

    const compositeOperations: sharp.OverlayOptions[] = [];

    for (const overlay of overlays) {
      if (!overlay.imageUrl) continue;

      const overlayBuffer = await getImageBuffer(overlay.imageUrl);

      // Calculate absolute dimensions (Strict Ints)
      let targetWidth = Math.round(overlay.relativeDimensions.width * baseWidth);
      let targetHeight = Math.round(overlay.relativeDimensions.height * baseHeight);
      const targetLeft = Math.round(overlay.relativePosition.left * baseWidth);
      const targetTop = Math.round(overlay.relativePosition.top * baseHeight);

      // Safety Check: Ensure dimensions are at least 1px to prevent Sharp crash
      if (targetWidth < 1) targetWidth = 1;
      if (targetHeight < 1) targetHeight = 1;

      // Resize overlay
      const resizedOverlay = await sharp(overlayBuffer)
        .resize(Math.floor(targetWidth), Math.floor(targetHeight), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      console.log(`   - Overlay: top=${targetTop}, left=${targetLeft}, w=${targetWidth}, h=${targetHeight}`);

      compositeOperations.push({
        input: resizedOverlay,
        top: Math.floor(targetTop),
        left: Math.floor(targetLeft)
      });
    }

    const finalImageBuffer = await sharp(baseBuffer)
      .composite(compositeOperations)
      .png()
      .toBuffer();

    const finalImageBase64 = `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

    console.log(`✅ Image compositing complete`);

    return NextResponse.json({ imageUrl: finalImageBase64 });

  } catch (error) {
    console.error("❌ Compositing error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to composite images',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
