'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, Session } from '@/lib/supabase';
import type { UserRecord } from '@/lib/auth-service';
import { getUserRecord } from '@/lib/auth-service';

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

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession?.user) {
          console.log('[AuthContext] Initial session found:', initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);

          // Fetch user record from database
          const record = await getUserRecord(initialSession.user.id);
          console.log('[AuthContext] User record:', record);
          setUserRecord(record);
        }

        setLoading(false);
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event, currentSession?.user?.id);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Fetch user record from database
          console.log('[AuthContext] Fetching user record for:', currentSession.user.id);
          const record = await getUserRecord(currentSession.user.id);
          console.log('[AuthContext] User record:', record);
          setUserRecord(record);
        } else {
          setUserRecord(null);
        }

        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
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
