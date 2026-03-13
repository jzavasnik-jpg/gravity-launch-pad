'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, Session } from '@/lib/supabase';
import type { UserRecord } from '@/lib/auth-service';
import { getUserRecord } from '@/lib/auth-service';

// Timeout wrapper to prevent hanging promises from freezing the UI
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Auth timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

const AUTH_TIMEOUT_MS = 3000; // 3 seconds max for auth initialization

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRecord: UserRecord | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasProAccess: boolean;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRecord: null,
  loading: true,
  isAuthenticated: false,
  isEmailVerified: false,
  hasProAccess: false,
  checkEmailVerification: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Setting up Supabase auth listener');

    // Track if this effect instance is still active (handles React Strict Mode double-mount)
    let isActive = true;

    // With @supabase/ssr, sessions are stored in cookies, not localStorage
    // We rely on getSession() to read from cookies properly

    // Get initial auth state from cookies via getSession()
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Checking for existing session...');

        // getSession() reads from cookies with @supabase/ssr
        const { data: { session: cachedSession }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthContext] getSession result:', { hasSession: !!cachedSession, error: sessionError?.message });

        if (!isActive) return;

        // Handle rate limit error from getSession
        if (sessionError?.status === 429 || sessionError?.message?.includes('rate limit')) {
          console.warn('[AuthContext] getSession rate limited, retrying in 2 seconds...');
          setTimeout(() => {
            if (isActive) initializeAuth();
          }, 2000);
          return;
        }

        if (cachedSession?.user) {
          console.log('[AuthContext] Found cached session for:', cachedSession.user.id);
          // Immediately set user from cached session (fast path)
          setSession(cachedSession);
          setUser(cachedSession.user);
          setLoading(false);

          // Background validation is informational only - never clear auth based on it
          // The cached session from getSession() is authoritative (set by server cookies)
          supabase.auth.getUser().then(({ data: { user: validatedUser }, error }) => {
            if (!isActive) return;
            if (error) {
              // Log but don't clear auth - cached session is valid
              console.log('[AuthContext] Background getUser check:', error.message);
            } else if (validatedUser) {
              console.log('[AuthContext] Session validated for:', validatedUser.id);
            }
          });

          // Fetch user record
          try {
            const record = await getUserRecord(cachedSession.user.id);
            if (isActive) {
              setUserRecord(record);
            }
          } catch (recordError) {
            console.warn('[AuthContext] Failed to fetch user record:', recordError);
          }
          return;
        }

        // No cached session, try getUser() as fallback
        console.log('[AuthContext] No cached session, trying getUser...');
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (!isActive) return;

        if (currentUser) {
          console.log('[AuthContext] User found via getUser:', currentUser.id);
          setUser(currentUser);

          try {
            const record = await getUserRecord(currentUser.id);
            if (isActive) setUserRecord(record);
          } catch (e) {
            console.warn('[AuthContext] Failed to fetch user record:', e);
          }
        } else {
          console.log('[AuthContext] No user found');
        }

        if (isActive) setLoading(false);
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          console.log('[AuthContext] Request aborted, will retry');
          return;
        }

        // Handle rate limiting with retry
        if (error?.status === 429 || error?.message?.includes('rate limit')) {
          console.warn('[AuthContext] Rate limited, retrying in 2 seconds...');
          setTimeout(() => {
            if (isActive) initializeAuth();
          }, 2000);
          return;
        }

        console.error('[AuthContext] Error initializing auth:', error);
        if (isActive) setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isActive) return; // Don't update state if unmounted

        console.log('[AuthContext] Auth state changed:', event, currentSession?.user?.id);

        // Only clear auth on explicit SIGNED_OUT event
        // Other events with null session should not clear existing auth
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing auth');
          setSession(null);
          setUser(null);
          setUserRecord(null);
          setLoading(false);
          return;
        }

        // For other events, only update if we have a valid session
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch user record from database
          console.log('[AuthContext] Fetching user record for:', currentSession.user.id);
          try {
            const record = await getUserRecord(currentSession.user.id);
            if (isActive) {
              console.log('[AuthContext] User record:', record);
              setUserRecord(record);
            }
          } catch (err) {
            console.warn('[AuthContext] Failed to fetch user record:', err);
          }
        }

        if (isActive) {
          setLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      isActive = false; // Prevent state updates after unmount
      subscription.unsubscribe();
    };
  }, []);

  // Founder always has PRO access
  const hasProAccess = user?.email === 'jzavasnik@gmail.com' || userRecord?.plan_type === 'pro' || false;

  // Supabase handles email verification differently - check user metadata
  const isEmailVerified = user?.email_confirmed_at !== null || userRecord?.is_email_verified || false;

  const value = {
    user,
    session,
    userRecord,
    loading,
    isAuthenticated: !!user,
    isEmailVerified,
    hasProAccess,
    checkEmailVerification: async () => {
      if (user) {
        try {
          // Refresh user data from Supabase
          const { data: { user: refreshedUser } } = await supabase.auth.getUser();
          console.log('[AuthContext] Refreshed user, email_confirmed_at:', refreshedUser?.email_confirmed_at);

          if (refreshedUser?.email_confirmed_at) {
            // Update user record if needed
            if (userRecord && !userRecord.is_email_verified) {
              const { markEmailVerified } = await import('@/lib/auth-service');
              await markEmailVerified(user.id);

              // Refresh user record
              const { getUserRecord } = await import('@/lib/auth-service');
              const updatedRecord = await getUserRecord(user.id);
              setUserRecord(updatedRecord);
            }

            setUser(refreshedUser);
            return true;
          }
        } catch (error) {
          console.error('[AuthContext] Error checking verification:', error);
        }
      }
      return false;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
