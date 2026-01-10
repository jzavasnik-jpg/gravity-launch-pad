import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
  User
} from "firebase/auth";
// User record operations now go through Supabase (database-service)
import {
  createUserRecord as dbCreateUserRecord,
  getUserRecord as dbGetUserRecord,
  getUserRecordByEmail as dbGetUserRecordByEmail,
  updateUserRecord as dbUpdateUserRecord,
  UserRecord
} from "@/lib/database-service";

const IS_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const MOCK_USER: any = {
  uid: 'mock-user-id',
  email: 'mock@example.com',
  displayName: 'Mock User',
  emailVerified: true,
};

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

// Re-export UserRecord from database-service for consumers
export type { UserRecord } from "@/lib/database-service";

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

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user record in Firestore
    if (user) {
      await createUserRecord(user.uid, email, name);
    }

    return { user, error: null };
  } catch (error: any) {
    console.error("Sign up error:", error);
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

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return { user: null, error: { message: error.message } };
  }
}

/**
 * Sign in with Google OAuth
 */
// Store the OAuth credential for API access
let cachedGoogleCredential: { accessToken: string; expiresAt: number } | null = null;

// Track if we're currently refreshing the token
let isRefreshingToken = false;
let tokenRefreshPromise: Promise<string | null> | null = null;

export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const provider = new GoogleAuthProvider();
    // Add scopes for Google Slides integration
    provider.addScope('https://www.googleapis.com/auth/presentations');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    // Add YouTube scope for Market Radar
    provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Store the Google OAuth access token for API calls
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedGoogleCredential = {
        accessToken: credential.accessToken,
        expiresAt: Date.now() + 3600 * 1000, // Token typically valid for 1 hour
      };
      console.log('[Auth] Google OAuth access token cached for YouTube API');
    }

    // Check if user record exists, if not create it
    if (user) {
      const existingRecord = await getUserRecord(user.uid);
      if (!existingRecord && user.email) {
        await createUserRecord(user.uid, user.email, user.displayName || 'User');
      }
    }

    return { error: null };
  } catch (error: any) {
    console.error("Google sign in error:", error);
    return { error: { message: error.message } };
  }
}

/**
 * Silently refresh Google OAuth token using reauthentication
 * This tries to get a fresh token without user interaction when possible
 */
export async function refreshGoogleOAuthToken(): Promise<string | null> {
  // If already refreshing, wait for that to complete
  if (isRefreshingToken && tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  isRefreshingToken = true;

  tokenRefreshPromise = (async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('[Auth] No current user for token refresh');
        return null;
      }

      // Check if user signed in with Google
      const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
      if (!googleProvider) {
        console.warn('[Auth] User did not sign in with Google');
        return null;
      }

      // Try to silently reauthenticate with Google
      // This will use the existing session if available
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/presentations');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');

      // Use signInWithPopup - this will show a popup but Google may auto-select the account
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        cachedGoogleCredential = {
          accessToken: credential.accessToken,
          expiresAt: Date.now() + 3600 * 1000,
        };
        console.log('[Auth] Google OAuth token refreshed successfully');
        return credential.accessToken;
      }

      return null;
    } catch (error: any) {
      console.error('[Auth] Token refresh failed:', error.message);
      return null;
    } finally {
      isRefreshingToken = false;
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

/**
 * Get the Google OAuth access token for API calls (YouTube, etc.)
 * Returns null if not available - caller should handle gracefully
 */
export function getGoogleAccessToken(): string | null {
  if (!cachedGoogleCredential) {
    // Don't warn on every call - this is expected on fresh page loads
    return null;
  }

  // Check if token is expired
  if (Date.now() > cachedGoogleCredential.expiresAt) {
    cachedGoogleCredential = null;
    return null;
  }

  return cachedGoogleCredential.accessToken;
}

/**
 * Check if Google OAuth token is available
 */
export function hasGoogleOAuthToken(): boolean {
  return getGoogleAccessToken() !== null;
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
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error("Sign out error:", error);
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
    return auth.currentUser;
  } catch (error) {
    console.error("Get current user error:", error);
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
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();
    return {
      access_token: token,
      user: user
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return { error: { message: error.message } };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const user = auth.currentUser;
    if (user) {
      await firebaseUpdatePassword(user, newPassword);
      return { error: null };
    }
    return { error: { message: "No user logged in" } };
  } catch (error: any) {
    console.error("Update password error:", error);
    return { error: { message: error.message } };
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(email: string): Promise<{ error: AuthError | null }> {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
      return { error: null };
    }
    return { error: { message: "No user logged in" } };
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return { error: { message: error.message } };
  }
}

/**
 * Create user record in Supabase users table
 * Wraps the database-service function for backward compatibility
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
 * Wraps the database-service function for backward compatibility
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
 * Wraps the database-service function for backward compatibility
 */
export async function getUserRecordByEmail(email: string): Promise<UserRecord | null> {
  return dbGetUserRecordByEmail(email);
}

/**
 * Update user record in Supabase
 * Wraps the database-service function for backward compatibility
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
    // Note: We might want to store photo_url in UserRecord if we add it to the interface
    // For now, let's assume we might add it or just rely on Auth profile

    // Update Supabase user record
    await updateUserRecord(userId, updates);

    // Update Firebase Auth Profile
    const user = auth.currentUser;
    if (user) {
      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      if (data.name) profileUpdates.displayName = data.name;
      if (data.photo_url) profileUpdates.photoURL = data.photo_url;

      const { updateProfile } = await import("firebase/auth");
      await updateProfile(user, profileUpdates);
    }

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
}

/**
 * Check if user has PRO access
 */
export async function checkProAccess(email: string): Promise<boolean> {
  try {
    if (IS_MOCK) return true;

    // Fallback: check special email directly
    if (email === 'jzavasnik@gmail.com') return true;

    // Get user record from Supabase to check plan_type
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === email) {
      const record = await getUserRecord(currentUser.uid);
      return record?.plan_type === 'pro';
    }

    return false;
  } catch (error) {
    console.error("Error checking PRO access:", error);
    return email === 'jzavasnik@gmail.com';
  }
}

/**
 * Upload user photo to Firebase Storage
 */
export async function uploadUserPhoto(userId: string, file: File): Promise<string | null> {
  try {
    const { storage } = await import("@/lib/firebase");
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

    // Create a reference to 'user_photos/{userId}/{filename}'
    const fileRef = ref(storage, `user_photos/${userId}/${file.name}`);

    // Upload the file
    await uploadBytes(fileRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading user photo:", error);
    return null;
  }
}

/**
 * Mark user email as verified
 */
export async function markEmailVerified(userId: string): Promise<boolean> {
  return updateUserRecord(userId, { is_email_verified: true });
}
