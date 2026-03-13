'use client';

import { supabase, User } from '@/lib/supabase';
import {
  createUserRecord as dbCreateUserRecord,
  getUserRecord as dbGetUserRecord,
  getUserRecordByEmail as dbGetUserRecordByEmail,
  updateUserRecord as dbUpdateUserRecord,
  UserRecord
} from '@/lib/database-service';

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'mock@example.com',
  app_metadata: {},
  user_metadata: { name: 'Mock User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

// Re-export UserRecord from database-service for consumers
export type { UserRecord } from '@/lib/database-service';

export interface AuthError {
  message: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    if (IS_MOCK) {
      console.log('Mock signUpWithEmail called');
      return { user: MOCK_USER, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    const user = data.user;

    // Create user record in Supabase users table
    if (user) {
      await createUserRecord(user.id, email, name);

      // Send branded verification email via Resend
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            confirmationUrl: `${window.location.origin}/auth/callback`,
          }),
        });
      } catch (resendErr) {
        console.warn('[auth] Failed to send Resend verification email:', resendErr);
        // Don't block signup if Resend fails — Supabase may send its own
      }
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { user: null, error: { message: error.message } };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    if (IS_MOCK) {
      console.log('Mock signInWithEmail called');
      return { user: MOCK_USER, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: error.message } };
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { user: null, error: { message: error.message } };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile',
      },
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return { error: { message: error.message } };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    if (IS_MOCK) {
      console.log('Mock signOut called');
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error: { message: error.message } };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    if (IS_MOCK) {
      return MOCK_USER;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    if (IS_MOCK) {
      return {
        access_token: 'mock-token',
        user: MOCK_USER
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    return {
      access_token: session.access_token,
      user: session.user
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error: { message: error.message } };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (error: any) {
    console.error('Update password error:', error);
    return { error: { message: error.message } };
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return { error: { message: error.message } };
  }
}

/**
 * Create user record in Supabase users table
 */
export async function createUserRecord(
  authUserId: string,
  email: string,
  name: string
): Promise<UserRecord | null> {
  return dbCreateUserRecord(authUserId, email, name);
}

/**
 * Get user record from Supabase users table
 */
export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  if (IS_MOCK) {
    return {
      id: userId,
      email: 'mock@example.com',
      name: 'Mock User',
      plan_type: 'pro',
      linked_platforms: {},
      is_email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as UserRecord;
  }
  return dbGetUserRecord(userId);
}

/**
 * Get user record by email from Supabase
 */
export async function getUserRecordByEmail(email: string): Promise<UserRecord | null> {
  return dbGetUserRecordByEmail(email);
}

/**
 * Update user record in Supabase
 */
export async function updateUserRecord(
  userId: string,
  updates: Partial<UserRecord>
): Promise<boolean> {
  return dbUpdateUserRecord(userId, updates);
}

/**
 * Update user profile (name, photo)
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; photo_url?: string }
): Promise<boolean> {
  try {
    const updates: Partial<UserRecord> = {};
    if (data.name) updates.name = data.name;
    if (data.photo_url) updates.avatar_url = data.photo_url;

    // Update Supabase user record (database) - this is the important one
    await updateUserRecord(userId, updates);
    console.log('[updateUserProfile] Database updated successfully');

    // Skip updating Supabase Auth metadata - it hangs and isn't needed
    // The avatar_url in the users table is what we display
    // supabase.auth.updateUser() has issues with hanging

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

/**
 * Check if user has PRO access
 */
export async function checkProAccess(email: string): Promise<boolean> {
  try {
    if (IS_MOCK) return true;

    // Founder always has PRO access
    if (email === 'jzavasnik@gmail.com') return true;

    // Get user record from Supabase to check plan_type
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === email) {
      const record = await getUserRecord(user.id);
      return record?.plan_type === 'pro';
    }

    return false;
  } catch (error) {
    console.error('Error checking PRO access:', error);
    return email === 'jzavasnik@gmail.com';
  }
}

/**
 * Mark user email as verified
 */
export async function markEmailVerified(userId: string): Promise<boolean> {
  return updateUserRecord(userId, { is_email_verified: true });
}

/**
 * Upload user profile photo via API route
 * @param userId - The user's ID
 * @param file - The file to upload
 * @param accessToken - The user's access token (pass from component to avoid getSession() hanging)
 */
export async function uploadUserPhoto(userId: string, file: File, accessToken?: string): Promise<string | null> {
  console.log('[uploadUserPhoto] Starting upload for user:', userId, 'file:', file.name);

  try {
    let token = accessToken;

    // If no token provided, try to get it (with timeout)
    if (!token) {
      console.log('[uploadUserPhoto] No token provided, trying getSession...');
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;
        token = session?.access_token;
      } catch (e) {
        console.error('[uploadUserPhoto] getSession failed:', e);
      }
    }

    if (!token) {
      console.error('[uploadUserPhoto] No auth token available');
      return null;
    }

    console.log('[uploadUserPhoto] Got auth token, creating form data...');

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    console.log('[uploadUserPhoto] Uploading via API...');

    // Upload via API route with timeout
    const controller = new AbortController();
    const uploadTimeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for upload

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(uploadTimeout);

      if (!response.ok) {
        const error = await response.json();
        console.error('[uploadUserPhoto] API error:', error);
        return null;
      }

      const { url } = await response.json();
      console.log('[uploadUserPhoto] Upload successful, URL:', url);
      return url;
    } catch (fetchError: any) {
      clearTimeout(uploadTimeout);
      if (fetchError.name === 'AbortError') {
        console.error('[uploadUserPhoto] Upload timed out');
      } else {
        console.error('[uploadUserPhoto] Fetch error:', fetchError);
      }
      return null;
    }
  } catch (error) {
    console.error('[uploadUserPhoto] Error uploading user photo:', error);
    return null;
  }
}
