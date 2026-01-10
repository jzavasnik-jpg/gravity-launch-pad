// Database Service
// Replaces Firebase/Firestore with Supabase PostgreSQL
// All data operations go through this service

import { supabase } from './supabase';

// ============================================
// B2 SIGNED URL UTILITIES
// ============================================

const BACKEND_URL = 'http://localhost:3001';
const B2_URL_PATTERN = /backblazeb2\.com/;

// Cache for signed URLs to avoid repeated API calls
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Extract the object key from a B2 URL
 */
function extractB2Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.slice(1);
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Backblaze B2 URL that needs signing
 */
export function isB2Url(url: string): boolean {
  return B2_URL_PATTERN.test(url);
}

/**
 * Get a signed URL for a B2 object
 */
export async function getSignedB2Url(originalUrl: string): Promise<string> {
  // If not a B2 URL, return as-is
  if (!isB2Url(originalUrl)) {
    return originalUrl;
  }

  // Check cache first
  const cached = signedUrlCache.get(originalUrl);
  if (cached && cached.expiresAt > Date.now() + CACHE_BUFFER_MS) {
    return cached.url;
  }

  const key = extractB2Key(originalUrl);
  if (!key) {
    console.warn('[B2] Could not extract key from URL:', originalUrl);
    return originalUrl;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/b2/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, expiresIn: 3600 }) // 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const { signedUrl, expiresIn } = await response.json();

    // Cache the result
    signedUrlCache.set(originalUrl, {
      url: signedUrl,
      expiresAt: Date.now() + (expiresIn * 1000)
    });

    return signedUrl;
  } catch (error) {
    console.error('[B2] Error getting signed URL:', error);
    return originalUrl; // Fallback to original URL
  }
}

/**
 * Get signed URLs for multiple B2 objects (batch)
 */
export async function getSignedB2Urls(originalUrls: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const urlsToSign: { originalUrl: string; key: string }[] = [];

  // Check cache and identify URLs that need signing
  for (const url of originalUrls) {
    if (!isB2Url(url)) {
      result.set(url, url);
      continue;
    }

    const cached = signedUrlCache.get(url);
    if (cached && cached.expiresAt > Date.now() + CACHE_BUFFER_MS) {
      result.set(url, cached.url);
      continue;
    }

    const key = extractB2Key(url);
    if (key) {
      urlsToSign.push({ originalUrl: url, key });
    } else {
      result.set(url, url);
    }
  }

  // Batch request for uncached URLs
  if (urlsToSign.length > 0) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/b2/signed-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: urlsToSign.map(u => u.key),
          expiresIn: 3600
        })
      });

      if (response.ok) {
        const { signedUrls, expiresIn } = await response.json();
        const expiresAt = Date.now() + (expiresIn * 1000);

        for (const signedResult of signedUrls) {
          const original = urlsToSign.find(u => u.key === signedResult.key);
          if (original && signedResult.success) {
            result.set(original.originalUrl, signedResult.signedUrl);
            signedUrlCache.set(original.originalUrl, {
              url: signedResult.signedUrl,
              expiresAt
            });
          } else if (original) {
            result.set(original.originalUrl, original.originalUrl);
          }
        }
      }
    } catch (error) {
      console.error('[B2] Error getting batch signed URLs:', error);
      // Fallback to original URLs
      for (const { originalUrl } of urlsToSign) {
        result.set(originalUrl, originalUrl);
      }
    }
  }

  return result;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ICPSession {
  id: string;
  user_id: string | null;
  user_name: string | null;
  answers: any;
  current_question: number | null;
  completed: boolean | null;
  core_desire: any;
  six_s: any;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Avatar {
  id: string;
  icp_session_id: string | null;
  name: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  photo_url: string | null;
  pain_points: any;
  pain_points_matrix: any;
  dreams: any;
  daily_challenges: any;
  six_s_scores: any;
  buying_triggers: any;
  deleted_at: string | null;
  created_at: string | null;
}

export interface MarketingStatement {
  id: string;
  avatar_id: string | null;
  solution_statement: string | null;
  usp_statement: string | null;
  transformation_statement: string | null;
  product_name: string | null;
  created_at: string | null;
}

export interface GeneratedAsset {
  id: string;
  asset_type: string;
  title: string | null;
  content: any;
  metadata: any;
  parent_id: string | null;
  version: number | null;
  created_at: string | null;
}

export interface ProductAsset {
  id: string;
  user_id: string;
  session_id: string | null;
  asset_type: string;
  title: string;
  description: string | null;
  storage_provider: string;
  storage_path: string;
  storage_url: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  status: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;  // Firebase Auth UID (TEXT in Supabase)
  email: string;
  name: string | null;
  plan_type: 'free' | 'pro';
  linked_platforms: Record<string, any>;
  is_email_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// USER RECORD FUNCTIONS
// ============================================

export async function createUserRecord(
  authUserId: string,
  email: string,
  name: string
): Promise<UserRecord | null> {
  try {
    // Check for special PRO access
    const planType = email === 'jzavasnik@gmail.com' ? 'pro' : 'free';

    const userData = {
      id: authUserId,
      email,
      name,
      plan_type: planType,
      linked_platforms: {},
      is_email_verified: false,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating user record:', error);
      return null;
    }

    return data as UserRecord;
  } catch (error) {
    console.error('[Supabase] Error creating user record:', error);
    return null;
  }
}

export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) {
      console.error('[Supabase] Error getting user record:', error);
      return null;
    }

    return (data && data.length > 0) ? data[0] as UserRecord : null;
  } catch (error) {
    console.error('[Supabase] Error getting user record:', error);
    return null;
  }
}

export async function getUserRecordByEmail(email: string): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('[Supabase] Error getting user record by email:', error);
      return null;
    }

    return (data && data.length > 0) ? data[0] as UserRecord : null;
  } catch (error) {
    console.error('[Supabase] Error getting user record by email:', error);
    return null;
  }
}

export async function updateUserRecord(
  userId: string,
  updates: Partial<UserRecord>
): Promise<boolean> {
  try {
    const { id, created_at, ...updateData } = updates as any;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[Supabase] Error updating user record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error updating user record:', error);
    return false;
  }
}

// ============================================
// ICP SESSION FUNCTIONS
// ============================================

export async function createICPSession(
  userId: string,
  userName: string,
  answers: string[],
  currentQuestion: number
): Promise<ICPSession | null> {
  try {
    console.log('[Supabase] Creating ICP session for user:', userId);

    const { data, error } = await supabase
      .from('icp_sessions')
      .insert({
        user_id: userId,
        user_name: userName,
        answers,
        current_question: currentQuestion,
        completed: false,
        core_desire: null,
        six_s: null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating ICP session:', error);
      return null;
    }

    console.log('[Supabase] ✅ Session created successfully:', data.id);
    return data as ICPSession;
  } catch (error) {
    console.error('[Supabase] Error creating ICP session:', error);
    return null;
  }
}

export async function updateICPSession(
  sessionId: string,
  updates: Partial<ICPSession>
): Promise<ICPSession | null> {
  try {
    console.log('[Supabase] Updating ICP session:', sessionId);

    // Remove id from updates if present
    const { id, created_at, ...updateData } = updates as any;

    const { data, error } = await supabase
      .from('icp_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error updating ICP session:', error);
      return null;
    }

    console.log('[Supabase] ✅ Session updated successfully');
    return data as ICPSession;
  } catch (error) {
    console.error('[Supabase] Error updating ICP session:', error);
    return null;
  }
}

export async function getICPSession(sessionId: string): Promise<ICPSession | null> {
  try {
    const { data, error } = await supabase
      .from('icp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[Supabase] Error getting ICP session:', error);
      return null;
    }

    return data as ICPSession;
  } catch (error) {
    console.error('[Supabase] Error getting ICP session:', error);
    return null;
  }
}

export async function getLatestICPSession(userId: string): Promise<ICPSession | null> {
  try {
    console.log('[Supabase] getLatestICPSession for user:', userId);
    // Get all sessions for this user, ordered by most recent
    const { data, error } = await supabase
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting latest ICP session:', error);
      return null;
    }

    console.log('[Supabase] getLatestICPSession found sessions:', data?.length || 0);

    // Find the first session that has actual non-empty answers
    if (data && data.length > 0) {
      for (const session of data) {
        const hasRealAnswers = session.answers &&
          Array.isArray(session.answers) &&
          session.answers.some((a: string) => a && a.trim());

        console.log('[Supabase] Checking session:', session.id, 'hasRealAnswers:', hasRealAnswers);

        if (hasRealAnswers) {
          console.log('[Supabase] Found session with real answers:', session.id);
          return session as ICPSession;
        }
      }

      // If no session has real answers, return the most recent one
      console.log('[Supabase] No session with real answers, returning most recent:', data[0].id);
      return data[0] as ICPSession;
    }

    return null;
  } catch (error) {
    console.error('[Supabase] Error getting latest ICP session:', error);
    return null;
  }
}

export async function getIncompleteICPSession(userId: string): Promise<ICPSession | null> {
  try {
    // Don't use .single() to avoid 406 errors - use .limit(1) and get first item
    const { data, error } = await supabase
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Supabase] Error getting incomplete ICP session:', error);
      return null;
    }

    // Return first item or null
    return (data && data.length > 0) ? data[0] as ICPSession : null;
  } catch (error) {
    console.error('[Supabase] Error getting incomplete ICP session:', error);
    return null;
  }
}

export async function getAllUserSessions(userId: string): Promise<ICPSession[]> {
  try {
    const { data, error } = await supabase
      .from('icp_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting all user sessions:', error);
      return [];
    }

    return (data || []) as ICPSession[];
  } catch (error) {
    console.error('[Supabase] Error getting all user sessions:', error);
    return [];
  }
}

export async function deleteICPSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('icp_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('[Supabase] Error deleting ICP session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error deleting ICP session:', error);
    return false;
  }
}

// ============================================
// AVATAR FUNCTIONS
// ============================================

export async function saveAvatar(
  icpSessionId: string,
  avatarData: Omit<Avatar, 'id' | 'created_at' | 'icp_session_id' | 'deleted_at'>
): Promise<Avatar | null> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .insert({
        icp_session_id: icpSessionId,
        ...avatarData,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error saving avatar:', error);
      return null;
    }

    return data as Avatar;
  } catch (error) {
    console.error('[Supabase] Error saving avatar:', error);
    return null;
  }
}

export async function getAvatar(avatarId: string): Promise<Avatar | null> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('id', avatarId)
      .single();

    if (error) {
      console.error('[Supabase] Error getting avatar:', error);
      return null;
    }

    return data as Avatar;
  } catch (error) {
    console.error('[Supabase] Error getting avatar:', error);
    return null;
  }
}

export async function getAvatarBySessionId(sessionId: string): Promise<Avatar | null> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('icp_session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Error getting avatar by session ID:', error);
      return null;
    }

    return data as Avatar || null;
  } catch (error) {
    console.error('[Supabase] Error getting avatar by session ID:', error);
    return null;
  }
}

export async function getAvatarsForSession(sessionId: string): Promise<Avatar[]> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('icp_session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting avatars for session:', error);
      return [];
    }

    return (data || []) as Avatar[];
  } catch (error) {
    console.error('[Supabase] Error getting avatars for session:', error);
    return [];
  }
}

export async function getAllAvatarsBySessionId(sessionId: string): Promise<Avatar[]> {
  return getAvatarsForSession(sessionId);
}

/**
 * Get all avatars for a user (across all sessions)
 * This is useful for the Landing Pad avatar selector which needs to show ALL avatars
 */
export async function getAllAvatarsForUser(userId: string): Promise<Avatar[]> {
  try {
    // First get all sessions for this user
    const sessions = await getAllUserSessions(userId);
    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) {
      console.log('[Supabase] No sessions found for user:', userId);
      return [];
    }

    // Get avatars that belong to any of the user's sessions
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .in('icp_session_id', sessionIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting all avatars for user:', error);
      return [];
    }

    console.log('[Supabase] getAllAvatarsForUser found:', data?.length || 0, 'avatars');
    return (data || []) as Avatar[];
  } catch (error) {
    console.error('[Supabase] Error getting all avatars for user:', error);
    return [];
  }
}

/**
 * Get orphaned avatars (those with NULL icp_session_id)
 * These avatars need to be linked to a session to be fully functional
 */
export async function getOrphanedAvatars(): Promise<Avatar[]> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .is('icp_session_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting orphaned avatars:', error);
      return [];
    }

    console.log('[Supabase] getOrphanedAvatars found:', data?.length || 0, 'orphaned avatars');
    return (data || []) as Avatar[];
  } catch (error) {
    console.error('[Supabase] Error getting orphaned avatars:', error);
    return [];
  }
}

export async function getAvatarById(avatarId: string): Promise<Avatar | null> {
  return getAvatar(avatarId);
}

export async function updateAvatarSessionId(avatarId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('avatars')
      .update({ icp_session_id: sessionId })
      .eq('id', avatarId);

    if (error) {
      console.error('[Supabase] Error updating avatar session ID:', error);
      return false;
    }

    console.log(`[Supabase] Updated avatar ${avatarId} with session ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[Supabase] Error updating avatar session ID:', error);
    return false;
  }
}

export async function deleteAvatar(avatarId: string): Promise<boolean> {
  try {
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('avatars')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', avatarId);

    if (error) {
      console.error('[Supabase] Error deleting avatar:', error);
      return false;
    }

    console.log(`[Supabase] ✅ Avatar ${avatarId} soft deleted`);
    return true;
  } catch (error) {
    console.error('[Supabase] Error deleting avatar:', error);
    return false;
  }
}

// ============================================
// MARKETING STATEMENTS FUNCTIONS
// ============================================

export async function saveMarketingStatements(
  avatarId: string,
  statements: Omit<MarketingStatement, 'id' | 'created_at' | 'avatar_id'>
): Promise<MarketingStatement[] | null> {
  try {
    const { data, error } = await supabase
      .from('marketing_statements')
      .insert({
        avatar_id: avatarId,
        ...statements,
      })
      .select();

    if (error) {
      console.error('[Supabase] Error saving marketing statements:', error);
      return null;
    }

    return data as MarketingStatement[];
  } catch (error) {
    console.error('[Supabase] Error saving marketing statements:', error);
    return null;
  }
}

export async function getMarketingStatementsForAvatar(avatarId: string): Promise<MarketingStatement[]> {
  try {
    const { data, error } = await supabase
      .from('marketing_statements')
      .select('*')
      .eq('avatar_id', avatarId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting marketing statements:', error);
      return [];
    }

    return (data || []) as MarketingStatement[];
  } catch (error) {
    console.error('[Supabase] Error getting marketing statements:', error);
    return [];
  }
}

export async function getMarketingStatementsByAvatarId(avatarId: string): Promise<MarketingStatement[]> {
  console.log('[getMarketingStatementsByAvatarId] Fetching for avatar:', avatarId);
  const statements = await getMarketingStatementsForAvatar(avatarId);
  console.log('[getMarketingStatementsByAvatarId] Returning statements:', statements.length);
  return statements;
}

// ============================================
// GENERATED ASSETS FUNCTIONS
// ============================================

export async function saveGeneratedAsset(
  assetData: Omit<GeneratedAsset, 'id' | 'created_at'>
): Promise<GeneratedAsset | null> {
  try {
    const { data, error } = await supabase
      .from('generated_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error saving generated asset:', error);
      return null;
    }

    return data as GeneratedAsset;
  } catch (error) {
    console.error('[Supabase] Error saving generated asset:', error);
    return null;
  }
}

// ============================================
// SESSION ASSETS FUNCTIONS
// ============================================

export async function saveSessionAsset(
  sessionId: string,
  asset: any
): Promise<boolean> {
  try {
    console.log('[Supabase] Saving session asset:', asset.name);

    const { error } = await supabase
      .from('session_assets')
      .insert({
        session_id: sessionId,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        metadata: asset.metadata || {},
      });

    if (error) {
      console.error('[Supabase] Error saving session asset:', error);
      return false;
    }

    console.log('[Supabase] ✅ Session asset saved');
    return true;
  } catch (error) {
    console.error('[Supabase] Error saving session asset:', error);
    return false;
  }
}

export async function getSessionAssets(sessionId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('session_assets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting session assets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Supabase] Error getting session assets:', error);
    return [];
  }
}

// ============================================
// PRODUCT ASSETS FUNCTIONS
// ============================================

export async function createProductAsset(
  userId: string,
  assetData: Partial<ProductAsset>
): Promise<ProductAsset | null> {
  try {
    const { data, error } = await supabase
      .from('product_assets')
      .insert({
        user_id: userId,
        ...assetData,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating product asset:', error);
      return null;
    }

    return data as ProductAsset;
  } catch (error) {
    console.error('[Supabase] Error creating product asset:', error);
    return null;
  }
}

export async function getProductAssets(
  userId: string,
  filters?: {
    asset_type?: string;
    status?: string;
    session_id?: string;
  }
): Promise<ProductAsset[]> {
  try {
    console.log('[Supabase] getProductAssets called with userId:', userId);

    // First, try to get all assets to debug (remove in production)
    const debugQuery = await supabase
      .from('product_assets')
      .select('id, user_id, title')
      .limit(5);
    console.log('[Supabase] DEBUG - Sample assets in table:', debugQuery.data);
    if (debugQuery.error) {
      console.log('[Supabase] DEBUG - Error fetching sample:', debugQuery.error);
    }

    let query = supabase
      .from('product_assets')
      .select('*')
      .eq('user_id', userId);

    if (filters?.asset_type) {
      query = query.eq('asset_type', filters.asset_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.session_id) {
      query = query.eq('session_id', filters.session_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting product assets:', error);
      console.error('[Supabase] Error details:', JSON.stringify(error));
      return [];
    }

    console.log('[Supabase] getProductAssets returned:', data?.length || 0, 'assets');
    return (data || []) as ProductAsset[];
  } catch (error) {
    console.error('[Supabase] Error getting product assets:', error);
    return [];
  }
}

export async function updateProductAsset(
  assetId: string,
  updates: Partial<ProductAsset>
): Promise<boolean> {
  try {
    const { id, user_id, created_at, ...updateData } = updates as any;

    const { error } = await supabase
      .from('product_assets')
      .update(updateData)
      .eq('id', assetId);

    if (error) {
      console.error('[Supabase] Error updating product asset:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error updating product asset:', error);
    return false;
  }
}

export async function deleteProductAsset(assetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_assets')
      .delete()
      .eq('id', assetId);

    if (error) {
      console.error('[Supabase] Error deleting product asset:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error deleting product asset:', error);
    return false;
  }
}

// ============================================
// SESSION VECTORS FUNCTIONS (RAG)
// ============================================

export interface SessionVector {
  id: string;
  session_id: string;
  vector: number[];
  context_summary: string;
  created_at: string | null;
  updated_at: string | null;
}

export async function saveSessionVector(
  sessionId: string,
  vector: number[],
  contextSummary: string
): Promise<boolean> {
  try {
    // Use upsert to update if exists, insert if not
    const { error } = await supabase
      .from('session_vectors')
      .upsert({
        session_id: sessionId,
        vector: vector,
        context_summary: contextSummary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });

    if (error) {
      // If table doesn't exist, log warning but don't crash
      if (error.code === '42P01') {
        console.warn('[Supabase] session_vectors table does not exist - skipping vector storage');
        return false;
      }
      console.error('[Supabase] Error saving session vector:', error);
      return false;
    }

    console.log(`[Supabase] ✅ Session vector saved for ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[Supabase] Error saving session vector:', error);
    return false;
  }
}

export async function getSessionVector(sessionId: string): Promise<SessionVector | null> {
  try {
    const { data, error } = await supabase
      .from('session_vectors')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1);

    if (error) {
      // If table doesn't exist, return null silently
      if (error.code === '42P01') {
        return null;
      }
      console.error('[Supabase] Error getting session vector:', error);
      return null;
    }

    return (data && data.length > 0) ? data[0] as SessionVector : null;
  } catch (error) {
    console.error('[Supabase] Error getting session vector:', error);
    return null;
  }
}
