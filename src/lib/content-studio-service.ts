'use client';

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ContentStudioSession {
  id?: string;
  user_id: string;
  icp_session_id?: string;
  icp_data?: any;
  avatar_data?: any;
  marketing_statements?: any;
  pain_synopsis?: any;
  market_intel?: any;
  ai_strategy?: any;
  selected_assets?: any[];
  platform_content?: any[];
  created_at?: string;
  updated_at?: string;
}

const SESSIONS_TABLE = 'content_studio_sessions';
const ASSETS_TABLE = 'media_lab_assets';

/**
 * Removes properties from an object whose value is undefined.
 */
function removeUndefined(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => removeUndefined(v));
  }

  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = removeUndefined(obj[key]);
    }
  }
  return newObj;
}

/**
 * Create new content studio session for a user
 */
export async function createContentStudioSession(userId: string): Promise<string | null> {
  try {
    console.log('[ContentStudio] Creating new session for user:', userId);
    const id = uuidv4();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(SESSIONS_TABLE)
      .insert({
        id,
        user_id: userId,
        created_at: now,
        updated_at: now,
      });

    if (error) {
      console.error('[ContentStudio] ❌ Error creating session:', error);
      return null;
    }

    console.log('[ContentStudio] ✅ Session created:', id);
    return id;
  } catch (error: any) {
    console.error('[ContentStudio] ❌ Error creating session:', error);
    return null;
  }
}

/**
 * Update content studio session with new data
 */
export async function updateContentStudioSession(sessionId: string, data: Partial<ContentStudioSession>) {
  try {
    // Clean data to remove undefined values
    const cleanedData = removeUndefined(data);

    const { error } = await supabase
      .from(SESSIONS_TABLE)
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[ContentStudio] ❌ Error updating session:', error);
      return;
    }

    console.log('[ContentStudio] Session updated:', sessionId);
  } catch (error: any) {
    console.error('[ContentStudio] ❌ Error updating session:', error);
  }
}

/**
 * Get latest content studio session for a user
 */
export async function getLatestContentStudioSession(userId: string): Promise<ContentStudioSession | null> {
  try {
    console.log('[ContentStudio] Loading latest session for user:', userId);

    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('[ContentStudio] No existing session found');
        return null;
      }
      console.error('[ContentStudio] ❌ Error loading session:', error);
      return null;
    }

    console.log('[ContentStudio] ✅ Session loaded:', data.id);
    return data as ContentStudioSession;
  } catch (error: any) {
    console.error('[ContentStudio] ❌ Error loading session:', error);
    return null;
  }
}

/**
 * Get all content studio sessions for a user
 */
export async function getAllContentStudioSessions(userId: string): Promise<ContentStudioSession[]> {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ContentStudio] Error loading all sessions:', error);
      return [];
    }

    return data as ContentStudioSession[];
  } catch (error) {
    console.error('[ContentStudio] Error loading all sessions:', error);
    return [];
  }
}

/**
 * Save a media asset to Media Lab collection
 */
export async function saveMediaLabAsset(userId: string, assetData: any): Promise<string | null> {
  try {
    console.log('[ContentStudio] Saving asset to Media Lab:', assetData.title);
    const id = uuidv4();

    const { error } = await supabase
      .from(ASSETS_TABLE)
      .insert({
        id,
        user_id: userId,
        ...assetData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[ContentStudio] ❌ Error saving asset to Media Lab:', error);
      return null;
    }

    console.log('[ContentStudio] ✅ Asset saved to Media Lab:', id);
    return id;
  } catch (error: any) {
    console.error('[ContentStudio] ❌ Error saving asset to Media Lab:', error);
    return null;
  }
}

/**
 * Get all media lab assets for a user
 */
export async function getMediaLabAssets(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(ASSETS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ContentStudio] Error loading media lab assets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[ContentStudio] Error loading media lab assets:', error);
    return [];
  }
}
