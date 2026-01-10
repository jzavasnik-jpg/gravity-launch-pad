import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";

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
    created_at?: any;
    updated_at?: any;
}

// Helper to convert Firestore timestamp to ISO string
const convertTimestamp = (data: any) => {
    if (!data) return data;
    const result = { ...data };
    if (result.created_at instanceof Timestamp) {
        result.created_at = result.created_at.toDate().toISOString();
    }
    if (result.updated_at instanceof Timestamp) {
        result.updated_at = result.updated_at.toDate().toISOString();
    }
    return result;
};

/**
 * Create new content studio session for a user
 */
export async function createContentStudioSession(userId: string): Promise<string | null> {
    try {
        console.log('[ContentStudio] Creating new session for user:', userId);
        const docRef = await addDoc(collection(db, "content_studio_sessions"), {
            user_id: userId,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        console.log('[ContentStudio] ✅ Session created:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error('[ContentStudio] ❌ Error creating session:', error);
        if (error.code === 'permission-denied') {
            console.error('[ContentStudio] 🔒 PERMISSION DENIED - Check Firestore security rules!');
        }
        return null;
    }
}

/**
 * Update content studio session with new data
 */
/**
 * Removes properties from an object whose value is undefined.
 * This prevents Firebase/Firestore errors during update operations.
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

export async function updateContentStudioSession(sessionId: string, data: Partial<ContentStudioSession>) {
    try {
        const sessionRef = doc(db, "content_studio_sessions", sessionId);

        // Clean data to remove undefined values
        const cleanedData = removeUndefined(data);

        await updateDoc(sessionRef, {
            ...cleanedData,
            updated_at: serverTimestamp()
        });
        console.log('[ContentStudio] Session updated:', sessionId);
    } catch (error: any) {
        console.error('[ContentStudio] ❌ Error updating session:', error);
        if (error.code === 'permission-denied') {
            console.error('[ContentStudio] 🔒 PERMISSION DENIED - Check Firestore security rules!');
        }
    }
}

/**
 * Get latest content studio session for a user
 */
export async function getLatestContentStudioSession(userId: string): Promise<ContentStudioSession | null> {
    try {
        console.log('[ContentStudio] Loading latest session for user:', userId);
        const q = query(
            collection(db, "content_studio_sessions"),
            where("user_id", "==", userId),
            orderBy("updated_at", "desc"),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = { id: doc.id, ...convertTimestamp(doc.data()) } as ContentStudioSession;
            console.log('[ContentStudio] ✅ Session loaded:', doc.id);
            return data;
        }
        console.log('[ContentStudio] No existing session found');
        return null;
    } catch (error: any) {
        console.error('[ContentStudio] ❌ Error loading session:', error);
        if (error.code === 'permission-denied') {
            console.error('[ContentStudio] 🔒 PERMISSION DENIED - Check Firestore security rules!');
        }
        return null;
    }
}

/**
 * Get all content studio sessions for a user
 */
export async function getAllContentStudioSessions(userId: string): Promise<ContentStudioSession[]> {
    try {
        const q = query(
            collection(db, "content_studio_sessions"),
            where("user_id", "==", userId),
            orderBy("updated_at", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamp(doc.data())
        })) as ContentStudioSession[];
    } catch (error) {
        console.error('[ContentStudio] Error loading all sessions:', error);
        return [];
    }
}
/**
 * Save a media asset to Media Lab collection
 * This is used to persist generated thumbnails/videos when "Pushed" to Media Lab.
 * Storing them individually avoids the 1MB Firestore limit on the main session doc.
 */
export async function saveMediaLabAsset(userId: string, assetData: any): Promise<string | null> {
    try {
        console.log('[ContentStudio] Saving asset to Media Lab:', assetData.title);
        const docRef = await addDoc(collection(db, "media_lab_assets"), {
            user_id: userId,
            ...assetData,
            created_at: serverTimestamp(),
        });
        console.log('[ContentStudio] ✅ Asset saved to Media Lab:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error('[ContentStudio] ❌ Error saving asset to Media Lab:', error);
        return null;
    }
}
