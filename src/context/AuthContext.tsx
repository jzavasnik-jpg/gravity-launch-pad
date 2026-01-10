import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type { UserRecord } from "@/lib/auth-service";
import { getUserRecord } from "@/lib/auth-service";

interface AuthContextType {
  user: FirebaseUser | null;
  userRecord: UserRecord | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasProAccess: boolean;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Setting up Firebase auth listener');

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', firebaseUser?.uid);

      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user record from Firestore
        console.log('[AuthContext] Fetching user record for:', firebaseUser.uid);
        const record = await getUserRecord(firebaseUser.uid);
        console.log('[AuthContext] User record:', record);
        setUserRecord(record);
      } else {
        setUserRecord(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Founder always has PRO access
  const hasProAccess = user?.email === 'jzavasnik@gmail.com' || userRecord?.plan_type === 'pro' || false;

  const value = {
    user,
    userRecord,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || userRecord?.is_email_verified || false,
    hasProAccess,
    checkEmailVerification: async () => {
      if (user) {
        try {
          await user.reload();
          console.log('[AuthContext] Reloaded user, emailVerified:', user.emailVerified);

          if (user.emailVerified) {
            // Update Firestore if needed
            if (userRecord && !userRecord.is_email_verified) {
              const { markEmailVerified } = await import("@/lib/auth-service");
              await markEmailVerified(user.uid);

              // Refresh user record
              const { getUserRecord } = await import("@/lib/auth-service");
              const updatedRecord = await getUserRecord(user.uid);
              setUserRecord(updatedRecord);
            }

            // Force update user state to trigger re-renders
            setUser({ ...user });
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
