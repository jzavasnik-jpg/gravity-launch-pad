import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createICPSession, updateICPSession, getLatestICPSession } from "@/lib/database-service";
import { vectorizeSession } from "@/lib/rag-service";

interface GravityICPData {
  answers: string[];
  currentQuestion: number;
  completed: boolean;
  currentSuggestions: string[];
}

interface CoreDesire {
  name: string;
  description: string;
}

interface SixS {
  name: string;
  description: string;
}

interface AppState {
  gravityICP: GravityICPData;
  selectedCoreDesire: CoreDesire | null;
  selectedSixS: SixS | null;
  avatarData: any | null;
  avatarDataList: any[];
  marketingStatements: any | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userUuid: string | null;
  planType: 'free' | 'pro';
  linkedPlatforms: string[];
  sessionId: string | null;
  // Content Studio data
  contentStudioPainSynopsis: any | null;
  contentStudioMarketIntel: any | null;
  contentStudioStrategy: any | null; // NEW: AI Strategy
  contentStudioPlatformContent: any[] | null; // NEW: Generated platform content
  currentScript?: string;
  selectedProductAssets?: Array<{ id: string; url: string; name: string }>;
  headerActions?: React.ReactNode; // NEW: Dynamic header actions
}

interface AppContextType {
  appState: AppState;
  updateICPAnswer: (questionIndex: number, answer: string) => void;
  setCurrentQuestion: (index: number) => void;
  setCompleted: (completed: boolean) => void;
  setSelectedCoreDesire: (desire: CoreDesire | null) => void;
  setSelectedSixS: (sixS: SixS | null) => void;
  setAvatarData: (data: any) => void;
  setAvatarDataList: (data: any[]) => void;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  setMarketingStatements: (data: any) => void;
  setUserInfo: (userId: string, userName: string, userEmail?: string) => void;
  setUserUuid: (uuid: string) => void;
  setPlanType: (planType: 'free' | 'pro') => void;
  setLinkedPlatforms: (platforms: string[]) => void;
  setSessionId: (id: string) => void;
  hydrateSessionData: (sessionData: any) => void;
  initializeSession: () => Promise<void>;
  resetState: () => void;
  hasProAccess: () => boolean;
  lastSaved: Date | null;
  saving: boolean;
  // Content Studio setters
  setContentStudioPainSynopsis: (data: any) => void;
  setContentStudioMarketIntel: (data: any) => void;
  setContentStudioStrategy: (data: any) => void;
  setContentStudioPlatformContent: (data: any[]) => void;
  setHeaderActions: (actions: React.ReactNode) => void; // NEW
}

const initialState: AppState = {
  gravityICP: {
    answers: Array(14).fill(""),
    currentQuestion: 0,
    completed: false,
    currentSuggestions: [],
  },
  selectedCoreDesire: null,
  selectedSixS: null,
  avatarData: null,
  avatarDataList: [],
  marketingStatements: null,
  userId: null,
  userName: null,
  userEmail: null,
  userUuid: null,
  planType: 'free',
  linkedPlatforms: [],
  sessionId: null,
  contentStudioPainSynopsis: null,
  contentStudioMarketIntel: null,
  contentStudioStrategy: null,
  contentStudioPlatformContent: null,
  currentScript: "",
  selectedProductAssets: [],
  headerActions: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "gravity_app_state";
const STORAGE_VERSION = "v3"; // Increment to invalidate old cache
const AUTOSAVE_DELAY = 3000; // 3 seconds

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check version - if old version, clear it
        if (parsed.version !== STORAGE_VERSION) {
          localStorage.removeItem(STORAGE_KEY);
          console.log("Old cache version detected, clearing...");
        } else {
          // SANITIZE: Explicitly remove UI components (headerActions) that might be corrupted in storage
          // This fixes the "Objects are not valid as a React child" crash if bad data exists
          const safeState = { ...parsed.state, headerActions: null };
          setAppState(safeState);
          setLastSaved(new Date(parsed.timestamp));
        }
      }
    } catch (error) {
      console.error("Failed to load saved state:", error);
    }
  }, []);

  // Autosave with debounce
  const saveToStorage = useCallback(() => {
    setSaving(true);
    try {
      // Exclude ephemeral UI state (headerActions) from persistence manually
      // This prevents "Objects are not valid as a React child" error on reload
      const { headerActions, ...stateToSave } = appState;

      const dataToSave = {
        version: STORAGE_VERSION,
        state: stateToSave,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save state:", error);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  }, [appState]);

  // Trigger autosave on state changes
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(() => {
      saveToStorage();
    }, AUTOSAVE_DELAY);
    setSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [appState, saveToStorage]);

  const updateICPAnswer = useCallback((questionIndex: number, answer: string) => {
    setAppState((prev) => ({
      ...prev,
      gravityICP: {
        ...prev.gravityICP,
        answers: prev.gravityICP.answers.map((a, i) => (i === questionIndex ? answer : a)),
      },
    }));
  }, []);

  const setCurrentQuestion = useCallback((index: number) => {
    setAppState((prev) => ({
      ...prev,
      gravityICP: {
        ...prev.gravityICP,
        currentQuestion: index,
      },
    }));
  }, []);

  const setCompleted = useCallback((completed: boolean) => {
    setAppState((prev) => ({
      ...prev,
      gravityICP: {
        ...prev.gravityICP,
        completed,
      },
    }));
  }, []);

  const setSelectedCoreDesire = useCallback((desire: CoreDesire | null) => {
    setAppState((prev) => ({
      ...prev,
      selectedCoreDesire: desire,
    }));
  }, []);

  const setSelectedSixS = useCallback((sixS: SixS | null) => {
    setAppState((prev) => ({
      ...prev,
      selectedSixS: sixS,
    }));
  }, []);

  const setAvatarData = useCallback((data: any) => {
    setAppState((prev) => ({
      ...prev,
      avatarData: data,
    }));
  }, []);

  const setAvatarDataList = useCallback((data: any[]) => {
    setAppState((prev) => ({
      ...prev,
      avatarDataList: data,
      avatarData: data.length > 0 ? data[0] : null,
    }));
  }, []);

  const setMarketingStatements = useCallback((data: any) => {
    setAppState((prev) => ({
      ...prev,
      marketingStatements: data,
    }));
  }, []);

  const setUserInfo = useCallback((userId: string, userName: string, userEmail?: string) => {
    setAppState((prev) => ({
      ...prev,
      userId,
      userName,
      userEmail: userEmail || prev.userEmail,
    }));
  }, []);

  const setUserUuid = useCallback((uuid: string) => {
    setAppState((prev) => ({
      ...prev,
      userUuid: uuid,
    }));
  }, []);

  const setPlanType = useCallback((planType: 'free' | 'pro') => {
    setAppState((prev) => ({
      ...prev,
      planType,
    }));
  }, []);

  const setLinkedPlatforms = useCallback((platforms: string[]) => {
    setAppState((prev) => ({
      ...prev,
      linkedPlatforms: platforms,
    }));
  }, []);

  const setSessionId = useCallback((id: string) => {
    setAppState((prev) => ({
      ...prev,
      sessionId: id,
    }));
  }, []);

  const initializeSession = useCallback(async () => {
    console.log('[AppContext] initializeSession called', {
      hasUserId: !!appState.userId,
      hasUserName: !!appState.userName,
      hasSessionId: !!appState.sessionId
    });

    if (!appState.userId || !appState.userName) {
      console.warn('[AppContext] Cannot initialize session: Missing user info');
      return;
    }

    // Check if we already have a session ID
    if (appState.sessionId) {
      console.log('[AppContext] Session already exists:', appState.sessionId);
      return;
    }

    console.log('[AppContext] Creating new session...');
    // Create new session in database
    const session = await createICPSession(
      appState.userId,
      appState.userName,
      appState.gravityICP.answers,
      appState.gravityICP.currentQuestion
    );

    if (session) {
      console.log('[AppContext] Session created successfully:', session.id);
      setSessionId(session.id);
    } else {
      console.error('[AppContext] Failed to create session');
    }
  }, [appState.userId, appState.userName, appState.sessionId, appState.gravityICP]);

  const hydrateSessionData = useCallback((sessionData: any) => {
    setAppState((prev) => ({
      ...prev,
      sessionId: sessionData.id,
      gravityICP: {
        ...prev.gravityICP,
        answers: sessionData.answers || prev.gravityICP.answers,
        currentQuestion: sessionData.current_question || 0,
      },
      selectedCoreDesire: sessionData.core_desire || prev.selectedCoreDesire,
      selectedSixS: sessionData.six_s || prev.selectedSixS,
    }));
  }, []);

  const resetState = useCallback(() => {
    setAppState(initialState);
    localStorage.removeItem(STORAGE_KEY);
    setLastSaved(null);
  }, []);

  const hasProAccess = useCallback(() => {
    // This function is deprecated - use AuthContext.hasProAccess instead
    // Kept for backward compatibility
    if (appState.userEmail === 'jzavasnik@gmail.com') {
      return true;
    }
    return appState.planType === 'pro';
  }, [appState.userEmail, appState.planType]);

  const setContentStudioPainSynopsis = useCallback((data: any) => {
    setAppState((prev) => ({
      ...prev,
      contentStudioPainSynopsis: data,
    }));
  }, []);

  const setContentStudioMarketIntel = useCallback((data: any) => {
    setAppState((prev) => ({
      ...prev,
      contentStudioMarketIntel: data,
    }));
  }, []);

  const setContentStudioStrategy = useCallback((data: any) => {
    setAppState((prev) => ({
      ...prev,
      contentStudioStrategy: data,
    }));
  }, []);

  const setContentStudioPlatformContent = useCallback((data: any[]) => {
    setAppState((prev) => ({
      ...prev,
      contentStudioPlatformContent: data,
    }));
  }, []);

  const setHeaderActions = useCallback((actions: React.ReactNode) => {
    setAppState((prev) => ({
      ...prev,
      headerActions: actions,
    }));
  }, []);

  // Sync with database when session data changes
  useEffect(() => {
    const syncWithDatabase = async () => {
      if (!appState.sessionId || !appState.userId) return;

      await updateICPSession(appState.sessionId, {
        answers: appState.gravityICP.answers,
        current_question: appState.gravityICP.currentQuestion,
        completed: appState.gravityICP.completed,
        core_desire: appState.selectedCoreDesire,
        six_s: appState.selectedSixS,
      } as any);

      // Trigger RAG Vectorization (Debounced or async)
      vectorizeSession(appState.sessionId, {
        icp_answers: appState.gravityICP.answers,
        avatar: appState.avatarData,
        marketing_statements: appState.marketingStatements,
        pain_synopsis: appState.contentStudioPainSynopsis,
        market_intel: appState.contentStudioMarketIntel,
        strategy: appState.contentStudioStrategy
      });
    };

    syncWithDatabase();
  }, [
    appState.gravityICP,
    appState.selectedCoreDesire,
    appState.selectedSixS,
    appState.sessionId,
    appState.userId,
  ]);

  const value: AppContextType = {
    appState,
    updateICPAnswer,
    setCurrentQuestion,
    setCompleted,
    setSelectedCoreDesire,
    setSelectedSixS,
    setAvatarData,
    setAvatarDataList,
    setAppState,
    setMarketingStatements,
    setUserInfo,
    setUserUuid,
    setPlanType,
    setLinkedPlatforms,
    setSessionId,
    hydrateSessionData,
    initializeSession,
    resetState,
    hasProAccess,
    lastSaved,
    saving,
    setContentStudioPainSynopsis,
    setContentStudioMarketIntel,
    setContentStudioStrategy,
    setContentStudioPlatformContent,
    setHeaderActions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
