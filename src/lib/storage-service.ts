// Storage Service
// Handles file uploads to Backblaze B2 via secure backend endpoints
// SECURITY: All B2 operations go through Vercel API routes - credentials never exposed to frontend

'use client';

import { supabase } from './supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
  size?: number;
}

// API base URL - uses relative paths for API routes in Next.js
const API_BASE = '';

/**
 * Get the current user's auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Upload file to Backblaze B2 using presigned URL from backend
 * SECURITY: B2 credentials are never exposed to the frontend
 */
export async function uploadToB2(
  file: File | Blob,
  userId: string,
  assetType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get file name
    const fileName = file instanceof File ? file.name : `upload_${Date.now()}.bin`;
    const contentType = file.type || 'application/octet-stream';

    // Step 1: Get presigned URL from backend
    const presignResponse = await fetch(`${API_BASE}/api/storage/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName,
        contentType,
        userId,
        assetType,
      }),
    });

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      return { success: false, error: error.error || 'Failed to get upload URL' };
    }

    const { presignedUrl, key, publicUrl } = await presignResponse.json();

    // Step 2: Upload directly to B2 using presigned URL
    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            path: key,
            url: publicUrl,
            size: file.size,
          });
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      };

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error uploading to B2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Generate a signed URL for secure asset access
 * SECURITY: Calls backend endpoint to generate signed URLs
 */
export async function generateSignedUrl(
  key: string,
  userId: string,
  expirationSeconds: number = 3600
): Promise<string | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('Not authenticated');
      return null;
    }

    const response = await fetch(`${API_BASE}/api/storage/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        key,
        userId,
        expiresIn: expirationSeconds,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get signed URL');
      return null;
    }

    const { signedUrl } = await response.json();
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Delete file from B2 storage via backend
 * SECURITY: Calls backend endpoint to delete files
 */
export async function deleteFromB2(key: string, userId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('Not authenticated');
      return false;
    }

    const response = await fetch(`${API_BASE}/api/storage/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ key, userId }),
    });

    if (!response.ok) {
      console.error('Failed to delete file');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from B2:', error);
    return false;
  }
}

/**
 * Generate a unique file path for asset storage
 */
export function generateAssetPath(
  userId: string,
  assetType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const extension = fileName.split('.').pop();
  const sanitizedName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);

  return `assets/${userId}/${assetType}/${timestamp}_${randomId}_${sanitizedName}.${extension}`;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    acceptedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSizeMB = options.maxSizeMB || 100; // Default 100MB
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (options.acceptedTypes && options.acceptedTypes.length > 0) {
    const fileType = file.type;
    const isAccepted = options.acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isAccepted) {
      return {
        valid: false,
        error: `File type ${fileType} is not accepted`,
      };
    }
  }

  return { valid: true };
}

/**
 * Compress image using Canvas API
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        options.quality || 0.8
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress media before upload (browser-side)
 */
export async function compressMedia(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  // For images
  if (file.type.startsWith('image/')) {
    return compressImage(file, options);
  }

  // For videos, return as-is (compression requires ffmpeg.wasm)
  return file;
}
