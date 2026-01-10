'use client';

import { uploadToB2 } from './storage-service';
import { supabase } from './supabase';

/**
 * Converts base64 string to Blob
 */
function base64ToBlob(base64: string, contentType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Saves a generated slide image to Backblaze B2 Storage
 * Returns the public download URL
 */
export async function saveSlideImage(
  base64Image: string,
  sceneNumber: number,
  presentationId: string
): Promise<string> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Convert base64 to blob
  const blob = base64ToBlob(base64Image);
  const fileName = `slide_${sceneNumber.toString().padStart(2, '0')}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  // Upload to B2
  const result = await uploadToB2(file, user.id, `presentations/${presentationId}`);

  if (!result.success || !result.url) {
    throw new Error(result.error || 'Failed to upload slide image');
  }

  return result.url;
}

/**
 * Saves a generic generated asset to Backblaze B2 Storage
 * Returns the public download URL
 */
export async function saveGeneratedAsset(
  base64Image: string,
  prefix: string = 'generated'
): Promise<string> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const blob = base64ToBlob(base64Image);
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileName = `${prefix}_${timestamp}_${randomId}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  // Upload to B2
  const result = await uploadToB2(file, user.id, 'assets');

  if (!result.success || !result.url) {
    throw new Error(result.error || 'Failed to upload asset');
  }

  return result.url;
}

/**
 * Generated slide data
 */
export interface GeneratedSlide {
  sceneNumber: number;
  imageUrl: string;
  scriptText: string;
  visualDescription: string;
}
