'use client';

import { supabase } from './supabase';
import { uploadToB2, deleteFromB2, generateAssetPath } from './storage-service';
import { Asset, AssetType, CreateAssetRequest, AssetSearchParams } from './asset-types';
import { v4 as uuidv4 } from 'uuid';

const ASSETS_TABLE = 'product_assets';

/**
 * Uploads a file to Backblaze B2 and creates an asset record in Supabase
 */
export async function uploadAsset(
  userId: string,
  request: CreateAssetRequest,
  onProgress?: (progress: number) => void
): Promise<Asset> {
  if (!request.file) {
    console.error('uploadAsset: No file provided');
    throw new Error('No file provided');
  }

  console.log('uploadAsset: Starting upload for', request.title);
  const file = request.file as File;

  // Upload to B2 storage
  const uploadResult = await uploadToB2(
    file,
    userId,
    request.asset_type,
    onProgress ? (p) => onProgress(p.percent) : undefined
  );

  if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
    throw new Error(uploadResult.error || 'Upload failed');
  }

  // Create asset record in Supabase
  const assetData = {
    id: uuidv4(),
    user_uuid: userId,
    session_id: request.session_id,
    asset_type: request.asset_type,
    title: request.title,
    description: request.description || '',
    storage_provider: 'backblaze',
    storage_path: uploadResult.path,
    storage_url: uploadResult.url,
    thumbnail_url: request.asset_type !== 'video' ? uploadResult.url : undefined,
    file_size_bytes: file.size,
    mime_type: file.type,
    status: 'ready',
    tags: request.tags || [],
    metadata: request.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(ASSETS_TABLE)
    .insert(assetData)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    // Try to clean up the uploaded file
    await deleteFromB2(uploadResult.path, userId);
    throw error;
  }

  return data as Asset;
}

/**
 * Retrieves assets for a user with optional filtering
 */
export async function searchAssets(
  userId: string,
  params: AssetSearchParams = {}
): Promise<Asset[]> {
  try {
    let query = supabase
      .from(ASSETS_TABLE)
      .select('*')
      .eq('user_uuid', userId);

    if (params.asset_type) {
      query = query.eq('asset_type', params.asset_type);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.session_id) {
      query = query.eq('session_id', params.session_id);
    }

    // Handle sorting
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order === 'asc' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    const { data, error } = await query;

    if (error) {
      console.error('Error searching assets:', error);
      throw error;
    }

    let assets = data as Asset[];

    // In-memory filtering for tags and search query
    if (params.tags && params.tags.length > 0) {
      assets = assets.filter(asset =>
        params.tags!.some(tag => asset.tags.includes(tag))
      );
    }

    if (params.search_query) {
      const searchQuery = params.search_query.toLowerCase();
      assets = assets.filter(asset =>
        asset.title.toLowerCase().includes(searchQuery) ||
        asset.description?.toLowerCase().includes(searchQuery)
      );
    }

    return assets;
  } catch (error) {
    console.error('Error searching assets:', error);
    throw error;
  }
}

/**
 * Get a single asset by ID
 */
export async function getAsset(assetId: string): Promise<Asset | null> {
  try {
    const { data, error } = await supabase
      .from(ASSETS_TABLE)
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('Error getting asset:', error);
      return null;
    }

    return data as Asset;
  } catch (error) {
    console.error('Error getting asset:', error);
    return null;
  }
}

/**
 * Deletes an asset from Supabase and B2 Storage
 */
export async function deleteAsset(assetId: string, userId: string): Promise<boolean> {
  try {
    // First get the asset to find the storage path
    const asset = await getAsset(assetId);
    if (!asset) {
      console.error('Asset not found');
      return false;
    }

    // Delete from B2 storage
    if (asset.storage_path) {
      await deleteFromB2(asset.storage_path, userId);
    }

    // Delete from Supabase
    const { error } = await supabase
      .from(ASSETS_TABLE)
      .delete()
      .eq('id', assetId);

    if (error) {
      console.error('Error deleting asset from Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
}

/**
 * Updates an asset's metadata
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<Asset>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(ASSETS_TABLE)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId);

    if (error) {
      console.error('Error updating asset:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating asset:', error);
    return false;
  }
}

/**
 * Get all assets for a session
 */
export async function getAssetsBySession(
  userId: string,
  sessionId: string
): Promise<Asset[]> {
  return searchAssets(userId, { session_id: sessionId });
}

/**
 * Get all assets of a specific type
 */
export async function getAssetsByType(
  userId: string,
  assetType: AssetType
): Promise<Asset[]> {
  return searchAssets(userId, { asset_type: assetType });
}
