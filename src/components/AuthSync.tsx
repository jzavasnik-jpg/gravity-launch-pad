import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

/**
 * This component is responsible for synchronizing the AuthContext state
 * with the AppContext state. It ensures that AppContext always has
 * the correct user information, even on page reloads.
 */
export const AuthSync = () => {
    const { setUserInfo, setPlanType, initializeSession } = useApp();
    const { user, userRecord, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            console.log('[AuthSync] Loading user data...');
            return;
        }

        console.log('[AuthSync] Auth state:', { isAuthenticated, hasUser: !!user, hasRecord: !!userRecord });

        if (isAuthenticated && user) {
            console.log('[AuthSync] Syncing user to AppContext:', user.uid);

            // Use userRecord if available, otherwise fallback to Firebase user data
            const userName = userRecord?.name || user.displayName || user.email?.split('@')[0] || 'User';

            // Sync user info to AppContext
            setUserInfo(
                user.uid,
                userName,
                user.email || undefined
            );

            // Sync plan type if record exists
            if (userRecord?.plan_type === 'pro') {
                setPlanType('pro');
            }

            // Initialize session (create if not exists)
            initializeSession();
        }
    }, [isAuthenticated, user, userRecord, loading, setUserInfo, setPlanType, initializeSession]);

    return null; // This component renders nothing
};
