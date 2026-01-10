import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface ICPSession {
  id: string;
  user_id: string | null;
  user_name: string | null;
  answers: any;
  current_question: number | null;
  completed: boolean | null;
  core_desire: any;
  six_s: any;
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

// Helper to remove undefined values recursively (Firestore doesn't like them)
const cleanUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => cleanUndefined(v)).filter(v => v !== undefined);
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = cleanUndefined(obj[key]);
    if (value !== undefined) {
      newObj[key] = value;
    }
  });
  return newObj;
};

export async function createICPSession(
  userId: string,
  userName: string,
  answers: string[],
  currentQuestion: number
): Promise<ICPSession | null> {
  try {
    console.log('[Firestore] Creating ICP session for user:', userId);
    const sessionData = cleanUndefined({
      user_id: userId,
      user_name: userName,
      answers,
      current_question: currentQuestion,
      completed: false,
      core_desire: null,
      six_s: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, "icp_sessions"), sessionData);
    console.log('[Firestore] ✅ Session created successfully:', docRef.id);

    // Return with ID and ISO strings (approximate for immediate UI use)
    return {
      id: docRef.id,
      ...sessionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ICPSession;
  } catch (error: any) {
    console.error("[Firestore] ❌ Error creating ICP session:", error);
    console.error("[Firestore] Error code:", error.code);
    console.error("[Firestore] Error message:", error.message);
    if (error.code === 'permission-denied') {
      console.error("[Firestore] 🔒 PERMISSION DENIED - Firestore security rules need to be configured!");
      console.error("[Firestore] Go to Firebase Console > Firestore Database > Rules");
    }
    return null;
  }
}

export async function updateICPSession(
  sessionId: string,
  updates: Partial<ICPSession>
): Promise<ICPSession | null> {
  try {
    console.log('[Firestore] Updating ICP session:', sessionId);
    const docRef = doc(db, "icp_sessions", sessionId);

    const updateData = {
      ...cleanUndefined(updates),
      updated_at: serverTimestamp(),
    };

    console.log('[Firestore] Update data:', updateData);
    await updateDoc(docRef, updateData);
    console.log('[Firestore] ✅ Session updated successfully');

    // Return updated object (optimistic)
    return {
      id: sessionId,
      ...updates,
      updated_at: new Date().toISOString(),
    } as ICPSession;
  } catch (error: any) {
    console.error("[Firestore] ❌ Error updating ICP session:", error);
    console.error("[Firestore] Error code:", error.code);
    console.error("[Firestore] Error message:", error.message);
    if (error.code === 'permission-denied') {
      console.error("[Firestore] 🔒 PERMISSION DENIED - Check Firestore security rules!");
    } else if (error.code === 'not-found') {
      console.error("[Firestore] 📄 Document not found - Session may have been deleted");
    }
    return null;
  }
}

export async function getICPSession(sessionId: string): Promise<ICPSession | null> {
  try {
    const docRef = doc(db, "icp_sessions", sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as ICPSession;
    }
    return null;
  } catch (error) {
    console.error("Error getting ICP session:", error);
    return null;
  }
}

export async function getLatestICPSession(userId: string): Promise<ICPSession | null> {
  try {
    const q = query(
      collection(db, "icp_sessions"),
      where("user_id", "==", userId),
      orderBy("updated_at", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamp(doc.data()) } as ICPSession;
    }
    return null;
  } catch (error) {
    console.error("Error getting latest ICP session:", error);
    return null;
  }
}

export async function getIncompleteICPSession(userId: string): Promise<ICPSession | null> {
  try {
    const q = query(
      collection(db, "icp_sessions"),
      where("user_id", "==", userId),
      where("completed", "==", false),
      orderBy("updated_at", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamp(doc.data()) } as ICPSession;
    }
    return null;
  } catch (error) {
    console.error("Error getting incomplete ICP session:", error);
    return null;
  }
}

export async function getAllUserSessions(userId: string): Promise<ICPSession[] | null> {
  try {
    const q = query(
      collection(db, "icp_sessions"),
      where("user_id", "==", userId),
      // TODO: Add back after creating Firestore index: where("deleted_at", "==", null)
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    // Filter out deleted sessions in JavaScript for now
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data())
      }))
      .filter(session => !session.deleted_at) as ICPSession[];
  } catch (error) {
    console.error("Error getting all user sessions:", error);
    return [];
  }
}

// Avatar functions
export async function saveAvatar(
  icpSessionId: string,
  avatarData: Omit<Avatar, "id" | "created_at" | "icp_session_id">
): Promise<Avatar | null> {
  try {
    const data = {
      icp_session_id: icpSessionId,
      ...avatarData,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "avatars"), data);

    return {
      id: docRef.id,
      ...data,
      created_at: new Date().toISOString(),
    } as Avatar;
  } catch (error) {
    console.error("Error saving avatar:", error);
    return null;
  }
}

export async function getAvatar(avatarId: string): Promise<Avatar | null> {
  try {
    const docRef = doc(db, "avatars", avatarId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Avatar;
    }
    return null;
  } catch (error) {
    console.error("Error getting avatar:", error);
    return null;
  }
}

export async function getAvatarBySessionId(sessionId: string): Promise<Avatar | null> {
  try {
    const q = query(
      collection(db, "avatars"),
      where("icp_session_id", "==", sessionId),
      orderBy("created_at", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...convertTimestamp(doc.data()) } as Avatar;
    }
    return null;
  } catch (error) {
    console.error("Error getting avatar by session ID:", error);
    return null;
  }
}

export async function getAvatarsForSession(sessionId: string): Promise<Avatar[]> {
  try {
    const q = query(
      collection(db, "avatars"),
      where("icp_session_id", "==", sessionId),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    const allAvatars = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    }));

    // Filter out deleted avatars
    const activeAvatars = allAvatars.filter(avatar => !avatar.deleted_at);

    // Debug logging for deleted avatars
    const deletedAvatars = allAvatars.filter(avatar => avatar.deleted_at);
    if (deletedAvatars.length > 0) {
      console.log('[getAvatarsForSession] Filtered out deleted avatars:',
        deletedAvatars.map(a => ({ name: a.name, deleted_at: a.deleted_at })));
    }

    return activeAvatars as Avatar[];
  } catch (error) {
    console.error("Error getting avatars for session:", error);
    return [];
  }
}

export async function getAllAvatarsBySessionId(sessionId: string): Promise<Avatar[] | null> {
  return getAvatarsForSession(sessionId);
}

// Update avatar's icp_session_id (for repairing corrupted data)
export async function updateAvatarSessionId(avatarId: string, sessionId: string): Promise<boolean> {
  try {
    const avatarRef = doc(db, "avatars", avatarId);
    await updateDoc(avatarRef, {
      icp_session_id: sessionId
    });
    console.log(`[supabase-service] Updated avatar ${avatarId} with session ${sessionId}`);
    return true;
  } catch (error) {
    console.error("Error updating avatar session ID:", error);
    return false;
  }
}

// Get avatar by ID
export async function getAvatarById(avatarId: string): Promise<Avatar | null> {
  try {
    const avatarRef = doc(db, "avatars", avatarId);
    const avatarDoc = await getDoc(avatarRef);
    if (avatarDoc.exists()) {
      return { id: avatarDoc.id, ...convertTimestamp(avatarDoc.data()) } as Avatar;
    }
    return null;
  } catch (error) {
    console.error("Error getting avatar by ID:", error);
    return null;
  }
}

// Marketing Statement functions
export async function saveMarketingStatements(
  avatarId: string,
  statements: Omit<MarketingStatement, "id" | "created_at" | "avatar_id">
): Promise<MarketingStatement[] | null> {
  try {
    const data = {
      avatar_id: avatarId,
      ...statements,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "marketing_statements"), data);

    // Return as array to match interface, though we typically save one set at a time
    return [{
      id: docRef.id,
      ...data,
      created_at: new Date().toISOString(),
    }] as MarketingStatement[];
  } catch (error) {
    console.error("Error saving marketing statements:", error);
    return null;
  }
}

export async function getMarketingStatementsForAvatar(avatarId: string): Promise<MarketingStatement[] | null> {
  try {
    const q = query(
      collection(db, "marketing_statements"),
      where("avatar_id", "==", avatarId),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    })) as MarketingStatement[];
  } catch (error) {
    console.error("Error getting marketing statements:", error);
    return [];
  }
}

export async function getMarketingStatementsByAvatarId(avatarId: string): Promise<MarketingStatement[] | null> {
  try {
    console.log('[getMarketingStatementsByAvatarId] Fetching for avatar:', avatarId);
    const q = query(
      collection(db, "marketing_statements"),
      where("avatar_id", "==", avatarId),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    console.log('[getMarketingStatementsByAvatarId] Found documents:', querySnapshot.docs.length);

    const statements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    })) as MarketingStatement[];

    console.log('[getMarketingStatementsByAvatarId] Returning statements:', statements.length);
    return statements;
  } catch (error) {
    console.error("[getMarketingStatementsByAvatarId] Error:", error);
    return [];
  }
}

// Generated Asset functions
export async function saveGeneratedAsset(
  assetData: Omit<GeneratedAsset, "id" | "created_at">
): Promise<GeneratedAsset | null> {
  try {
    const data = {
      ...assetData,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "generated_assets"), data);

    return {
      id: docRef.id,
      ...data,
      created_at: new Date().toISOString(),
    } as GeneratedAsset;
  } catch (error) {
    console.error("Error saving generated asset:", error);
    return null;
  }
}

export async function deleteICPSession(sessionId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "icp_sessions", sessionId), {
      deleted_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error deleting ICP session:", error);
    return false;
  }
}

export async function saveSessionAsset(
  sessionId: string,
  asset: any
): Promise<boolean> {
  try {
    console.log('[Firestore] Saving session asset:', asset.name);
    const data = {
      session_id: sessionId,
      ...asset,
      created_at: serverTimestamp(),
    };

    // Remove undefined values
    const cleanData = cleanUndefined(data);

    await addDoc(collection(db, "session_assets"), cleanData);
    console.log('[Firestore] ✅ Session asset saved');
    return true;
  } catch (error) {
    console.error("Error saving session asset:", error);
    return false;
  }
}

export async function getSessionAssets(sessionId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, "session_assets"),
      where("session_id", "==", sessionId),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    }));
  } catch (error) {
    console.error("Error getting session assets:", error);
    return [];
  }
}


