'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug: Log what we're working with
if (typeof window !== 'undefined') {
  console.log('[Supabase] Initializing client with URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'EMPTY');
  console.log('[Supabase] Anon key:', supabaseAnonKey ? 'SET (' + supabaseAnonKey.length + ' chars)' : 'EMPTY');
}

// Only show warning if we're in the browser (not during build)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create browser client using @supabase/ssr for proper PKCE cookie storage
// This is required for OAuth flows in Next.js App Router
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

// Auth helpers
export const signUp = async (email: string, password: string, name?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      scopes: 'email profile',
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<{ user: SupabaseUser | null; error: any }> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async (): Promise<{ session: Session | null; error: any }> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const resendVerificationEmail = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: { message: 'No user email found' } };
  }

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
  });
  return { data, error };
};

// Extended User type with convenience properties used across the app
// These map to user_metadata fields populated by OAuth providers (e.g., Google)
export type User = SupabaseUser & {
  displayName?: string;
  photoURL?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
};

export type { Session };

export default supabase;
