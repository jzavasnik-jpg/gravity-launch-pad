import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateScriptAndHooks, generateHooksOnly, generateScriptOnly, generateScenesFromHook, GeneratedContent, GeneratedScene } from '@/lib/content-composer-api';
import { toast } from 'sonner';
import { ThumbnailConcept } from '@/types/thumbnail';
import type { SixS, Temperature, DesireMarket, ContentFrameworkId, PsychologicalTriggerId } from '@/lib/six-s-constants';

export interface Asset {
    id: string;
    url: string;
    name: string;
    role?: 'hero' | 'before' | 'after' | 'social_proof' | 'product_element' | 'brand_element';
    characterTag?: 'guide' | 'mentee' | 'both' | 'product';
    tags?: string[];
}

// Data from previous phases
export interface StrategyContext {
    avatarId: string;
    avatarName: string;
    strategySummary: string; // e.g., "Target burnout with humor"
    selectedAssets: Asset[];
    painPoints: string[];
    marketingStatements: any;
    // Full avatar context for grounding hook generation
    avatarContext?: {
        occupation?: string;
        age?: number;
        gender?: string;
        pain_points?: any;
        dreams?: any;
        daily_challenges?: any;
        buying_triggers?: any;
    };
    // AI Strategy page selections (flow through to Hook Lab)
    selectedStrategyCandidate?: {
        name: string;
        primarySixS: string;
        secondarySixS: string;
        angle: string;
        hookPreview: string;
    };
    selectedTemperatureStrategy?: {
        temperature: string;
        hooks: Array<{ text: string; angle: string }>;
        toneGuidance: string;
    };
    selectedPsychologicalTrigger?: {
        id: string;
        name: string;
        hookTemplate: string;
    };
    // Story Strategy (new flow - includes basedOn context showing HOW it was generated)
    selectedStoryStrategy?: {
        id: string;
        name: string;
        primarySixS: string;
        secondarySixS: string;
        angle: string;
        hookPreview: string;
        whyItWorks?: string;
        basedOn?: {
            framework: string;
            trigger: string;
            temperature: string;
        };
    };
    // Six S Gap Analysis (for emotional targeting in hooks)
    sixSGaps?: Array<{
        category: string;
        label: string;
        gapScore: number;
        priority: string;
        voiceOfCustomer?: string[];
    }>;
    // Pain Synopsis (psychological profile + story beats)
    painSynopsis?: {
        psychologicalProfile?: {
            coreDesire?: string;
            primaryEmotion?: string;
            currentState?: string;
            blockers?: string[];
            idealOutcome?: string;
        };
        storyBeats?: {
            struggle?: string;
            insight?: string;
            transformation?: string;
        };
    };
    // Market Intelligence
    marketIntelligence?: {
        urgencyLevel?: string;
    };
}

export interface Hook {
    id: string;
    text: string;
    score: number;
}

export interface VisualMessengerState {
    mode: 'avatar' | 'user' | 'custom';
    currentUrl: string;
    customUrl?: string;
}

export type CampaignMode = 'direct_authority' | 'transformation_narrative';

export interface HookLayer {
    id: string;
    url: string;
    x: number;
    y: number;
    scale: number;
    text?: string;
}

export interface ThumbnailState {
    concepts: ThumbnailConcept[];
    selectedConcept: ThumbnailConcept | null;
    bgImage: string;
    hooks: HookLayer[]; // New: Multiple hook layers
    hookText: string;
}

// ============================================
// CONTENT STRATEGY STATE (Six S + Temperature)
// ============================================

export interface SixSGap {
    category: SixS;
    label: string;
    question: string;
    gapScore: number; // 0-100
    marketEvidence: string[];
    voiceOfCustomer: string[];
    priority: 'critical' | 'strong' | 'baseline' | 'delivery' | 'outcome';
}

export interface MarketingStatements {
    solution: string;
    usp: string;
    transformation: string;
}

export interface TemperatureStrategy {
    temperature: Temperature;
    strategyName: string;
    strategyDescription: string;
    communicationFocus: string;
    hookDirection: string;
    ctaStyle: string;
    ctaExamples: string[];
    psychologicalTriggers: string[];
    generatedHooks: Hook[];
    generatedScript: string | null;
    isSelected: boolean;
}

// DEPRECATED: Use StoryStrategy instead
export interface StrategyCandidate {
    name: string;
    score: number;
    status: 'recommended' | 'runner-up' | 'rejected';
    whyConsidered: string;
    whyNotWinner?: string;
    sixSAlignment: {
        category: SixS;
        aligned: boolean;
    }[];
}

// NEW: Story Strategy (replaces StrategyCandidate)
export interface StoryStrategy {
    id: string;
    name: string;
    primarySixS: SixS;
    secondarySixS: SixS;
    angle: string;
    hookPreview: string;
    whyItWorks: string;
    confidenceScore: number;
    recommendation: 'recommended' | 'runner_up' | 'alternative';
    // Shows what inputs created this strategy
    basedOn: {
        framework: string;
        trigger: string;
        temperature: string;
    };
}

// Inputs that were used to generate the current story strategies
export interface StoryStrategyInputs {
    frameworkId: ContentFrameworkId;
    triggerId: PsychologicalTriggerId;
    temperature: Temperature;
}

export interface ContentStrategyState {
    // CONSTANTS (established in ICP + Market Radar)
    desireMarket: DesireMarket | null;
    sixSGaps: SixSGap[];
    dominantSixS: {
        primary: SixS | null;
        primaryGapScore: number;
        secondary: SixS | null;
        secondaryGapScore: number;
        tertiary: SixS | null;
        tertiaryGapScore: number;
    };
    marketingStatements: MarketingStatements | null;

    // === FOUNDATIONAL SELECTIONS (user picks these first) ===
    selectedFrameworkId: ContentFrameworkId | null;  // NEW: Persist framework selection
    selectedPsychologicalTriggerId: PsychologicalTriggerId | null;  // Persist trigger selection
    selectedTemperature: Temperature | null;

    // === STORY STRATEGIES (AI-generated from foundational selections) ===
    storyStrategies: StoryStrategy[];  // NEW: Replaces strategyCandidates
    selectedStoryStrategyId: string | null;  // NEW: Replaces selectedCandidateId
    storyStrategyInputs: StoryStrategyInputs | null;  // NEW: Track what inputs created current strategies

    // === DEPRECATED (kept for migration compatibility) ===
    strategyCandidates: StrategyCandidate[];  // DEPRECATED: Use storyStrategies
    selectedCandidateId: string | null;  // DEPRECATED: Use selectedStoryStrategyId

    // Generated Strategies Per Temperature (may be removed in future)
    temperatureStrategies: {
        cold: TemperatureStrategy | null;
        warm: TemperatureStrategy | null;
        hot: TemperatureStrategy | null;
    };
}

const initialContentStrategyState: ContentStrategyState = {
    desireMarket: null,
    sixSGaps: [],
    dominantSixS: {
        primary: null,
        primaryGapScore: 0,
        secondary: null,
        secondaryGapScore: 0,
        tertiary: null,
        tertiaryGapScore: 0,
    },
    marketingStatements: null,
    // Foundational selections
    selectedFrameworkId: null,
    selectedPsychologicalTriggerId: null,
    selectedTemperature: null,
    // Story strategies (new)
    storyStrategies: [],
    selectedStoryStrategyId: null,
    storyStrategyInputs: null,
    // Deprecated (kept for migration)
    strategyCandidates: [],
    selectedCandidateId: null,
    // Temperature strategies (may be removed)
    temperatureStrategies: {
        cold: null,
        warm: null,
        hot: null,
    },
};

interface ProjectState {
    // Context from previous steps (Read-Only here)
    strategyContext: StrategyContext | null;

    // Content Composer State
    toneValue: number; // 0 (Serious) to 100 (Humorous)
    generatedHooks: Hook[];
    selectedHookId: string | null;
    customHookText: string; // New: For user-written hook
    scriptBody: string;
    isRegenerating: boolean;

    // GPL New State
    visualMessengerState: VisualMessengerState;
    campaignMode: CampaignMode;

    // Thumbnail State
    thumbnailState: ThumbnailState;

    // Actions
    setStrategyContext: (ctx: StrategyContext) => void;
    setToneValue: (val: number) => void;
    setGeneratedHooks: (hooks: Hook[]) => void;
    setSelectedHookId: (id: string | null) => Promise<void>;
    setCustomHookText: (text: string) => void; // New action
    setScriptBody: (text: string) => void;
    setVisualMessengerState: (state: Partial<VisualMessengerState>) => void;
    setCampaignMode: (mode: CampaignMode) => void;
    setThumbnailState: (state: Partial<ThumbnailState>) => void;
    addAsset: (asset: Asset) => void;
    updateAsset: (id: string, updates: Partial<Asset>) => void;

    // The Main Action for this page
    regenerateContent: (mode?: 'full' | 'script_only') => Promise<void>;
    regenerateHooks: (clearScenes?: boolean) => Promise<void>; // Updated: optionally clear scenes
    regenerateScenes: () => Promise<void>; // New: regenerate scenes with current hook

    // Director's Cut
    directorsCutState: DirectorsCutState;
    setDirectorsCutState: (updates: Partial<DirectorsCutState>) => void;
    resetDirectorsCutState: () => void;
    syncScenesFromScript: () => void; // New action

    // Content Strategy State (Six S + Temperature)
    contentStrategyState: ContentStrategyState;
    setDesireMarket: (market: DesireMarket) => void;
    setSixSGaps: (gaps: SixSGap[]) => void;
    setMarketingStatementsStrategy: (statements: MarketingStatements) => void;
    setSelectedTemperature: (temp: Temperature | null) => void;
    // NEW: Foundational selection actions
    setSelectedFrameworkId: (id: ContentFrameworkId | null) => void;
    setSelectedPsychologicalTriggerId: (id: PsychologicalTriggerId | null) => void;
    // NEW: Story strategy actions
    setStoryStrategies: (strategies: StoryStrategy[], inputs: StoryStrategyInputs) => void;
    setSelectedStoryStrategyId: (id: string | null) => void;
    // DEPRECATED: Keep for backward compatibility during migration
    setStrategyCandidates: (candidates: StrategyCandidate[]) => void;
    setSelectedCandidateId: (id: string | null) => void;
    setTemperatureStrategy: (temp: Temperature, strategy: TemperatureStrategy) => void;
    resetContentStrategy: () => void;
}

export interface DirectorsCutState {
    activeSceneId: string | null;
    selectedLayerId: string | null;
    cameraState: {
        pan: { x: number; y: number };
        zoom: number;
    };
    layers: Layer[];
    scenes: Scene[];
    // New fields for storyboard pipeline
    visualStyle: 'cinematic' | 'bold' | 'minimal' | 'documentary';
    thumbnailSourceSceneIds: string[]; // Scenes selected for thumbnail
}

export type SceneLabel = 'HOOK' | 'PAIN' | 'SOLUTION' | 'CTA' | 'TRANSITION';
export type SceneStatus = 'draft' | 'image_generating' | 'image_ready' | 'video_generating' | 'video_ready';

export interface SceneReferenceImage {
    id: string;
    url: string;
    name: string;
    assetId?: string; // Links back to Asset in strategyContext.selectedAssets
}

export interface Scene {
    id: string;
    label: SceneLabel;
    script: string;
    speaker?: 'guide' | 'mentee'; // Only for transformation_narrative mode
    durationEstimate: number; // seconds (auto-calculated ~2.5 words/second)
    // Reference images from asset library (user-selected for this scene)
    referenceImages?: SceneReferenceImage[];
    // Director's Cut image/video generation fields
    imagePrompt?: string;
    generatedImageUrl?: string;
    generatedVideoUrl?: string;
    thumbnailCandidate?: boolean;
    status: SceneStatus;
    // CTA URL for the final CTA scene
    ctaUrl?: string;
    // Legacy fields for backward compatibility
    thumbnail?: string;
    duration?: string;
}

export interface Layer {
    id: string;
    type: 'subject' | 'product' | 'background' | 'guide' | 'mentee';
    name: string;
    isLocked: boolean;
    isVisible: boolean;
    zIndex: number;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            strategyContext: null,
            toneValue: 50,
            generatedHooks: [],
            selectedHookId: null,
            customHookText: "",
            scriptBody: "",
            isRegenerating: false,
            visualMessengerState: {
                mode: 'avatar',
                currentUrl: ''
            },
            campaignMode: 'direct_authority', // Default
            thumbnailState: {
                concepts: [],
                selectedConcept: null,
                bgImage: "https://placehold.co/1280x720/1a1a1a/FFFFFF.png?text=Select+a+Concept+to+Start&font=roboto",
                hooks: [],
                hookText: "THE $10K\nTRAP!"
            },

            setStrategyContext: (ctx) => {
                // Initialize visual messenger with avatar photo if not set
                const current = get().visualMessengerState;
                if (!current.currentUrl && ctx.selectedAssets.length > 0) {
                    // This logic might need refinement, usually avatar photo is in appState.avatarData
                    // We'll handle initialization in ContentComposer
                }
                set({ strategyContext: ctx });
            },
            setToneValue: (val) => set({ toneValue: val }),
            setGeneratedHooks: (hooks) => set({ generatedHooks: hooks }),
            setCustomHookText: (text) => set({ customHookText: text }),
            // New Actions for Sequential Flow
            regenerateHooks: async (clearScenes = true) => {
                const { strategyContext, toneValue, contentStrategyState, directorsCutState } = get();
                if (!strategyContext) return;

                set({ isRegenerating: true });

                // Clear scenes when regenerating hooks (user is starting fresh with new hooks)
                if (clearScenes && directorsCutState.scenes.length > 0) {
                    set({
                        selectedHookId: null,
                        scriptBody: '',
                        directorsCutState: {
                            ...directorsCutState,
                            scenes: [],
                            activeSceneId: null,
                            thumbnailSourceSceneIds: []
                        }
                    });
                    console.log('[regenerateHooks] Cleared existing scenes since hooks are being regenerated');
                }

                try {
                    // Get temperature and Six S context for Gravity Culture-aligned hooks
                    const selectedTemperature = contentStrategyState.selectedTemperature || 'cold';
                    const primarySixS = contentStrategyState.dominantSixS.primary || undefined;
                    const marketingStatements = contentStrategyState.marketingStatements || strategyContext.marketingStatements;

                    // Get strategy selections from AI Strategy page (if set in context)
                    const selectedCandidate = strategyContext.selectedStrategyCandidate;
                    const selectedTempStrategy = strategyContext.selectedTemperatureStrategy;
                    const selectedTrigger = strategyContext.selectedPsychologicalTrigger;
                    const selectedStoryStrategy = strategyContext.selectedStoryStrategy;

                    // Get Six S gaps from contentStrategyState (sorted by score for priority)
                    const sixSGaps = contentStrategyState.sixSGaps
                        ? [...contentStrategyState.sixSGaps]
                            .sort((a, b) => b.gapScore - a.gapScore)
                            .slice(0, 3) // Top 3 gaps
                            .map(g => ({
                                category: g.category,
                                label: g.label,
                                gapScore: g.gapScore,
                                priority: g.priority,
                                voiceOfCustomer: g.voiceOfCustomer?.slice(0, 2),
                            }))
                        : undefined;

                    // Get pain synopsis and market intel from strategyContext
                    const painSynopsis = strategyContext.painSynopsis;
                    const marketIntelligence = strategyContext.marketIntelligence;

                    const hooks = await generateHooksOnly({
                        avatarName: strategyContext.avatarName,
                        strategy: strategyContext.strategySummary,
                        tone: toneValue,
                        assets: strategyContext.selectedAssets,
                        painPoints: strategyContext.painPoints,
                        marketingStatements: marketingStatements,
                        // Gravity Culture additions
                        temperature: selectedTemperature,
                        primarySixS: selectedStoryStrategy?.primarySixS || selectedCandidate?.primarySixS || primarySixS || undefined,
                        productName: marketingStatements?.productName || undefined,
                        // Full avatar context for grounding
                        avatarContext: strategyContext.avatarContext,
                        // AI Strategy page selections
                        selectedStrategyCandidate: selectedCandidate,
                        selectedTemperatureStrategy: selectedTempStrategy,
                        selectedPsychologicalTrigger: selectedTrigger,
                        // Story Strategy (new flow with basedOn context)
                        selectedStoryStrategy: selectedStoryStrategy,
                        // NEW: Six S Gap Analysis, Pain Synopsis, Market Intelligence
                        sixSGaps: sixSGaps,
                        painSynopsis: painSynopsis,
                        marketIntelligence: marketIntelligence,
                    });

                    set({ generatedHooks: hooks, isRegenerating: false });
                } catch (error) {
                    console.error("Failed to regenerate hooks:", error);
                    set({ isRegenerating: false });
                }
            },

            setSelectedHookId: async (id) => {
                console.log("setSelectedHookId called with:", id);
                const { generatedHooks, customHookText, strategyContext, toneValue, campaignMode, directorsCutState, contentStrategyState } = get();

                // 1. Update selection immediately
                set({ selectedHookId: id });

                // 2. Determine Hook Text
                let hookText = "";
                if (id === 'custom') {
                    hookText = customHookText;
                } else {
                    const selectedHook = generatedHooks.find(h => h.id === id);
                    hookText = selectedHook?.text || "";
                }

                console.log("Resolved hookText:", hookText);
                console.log("Strategy Context exists:", !!strategyContext);

                if (!hookText || !strategyContext) {
                    console.warn("Missing hookText or strategyContext, aborting regen.");
                    return;
                }

                // 3. Trigger Scene Generation based on this Hook
                set({ isRegenerating: true });
                console.log("Starting scene generation...");
                toast.info("Generating script scenes based on selected hook...");

                try {
                    // Get temperature and Six S context for Gravity Culture-aligned scenes
                    const selectedTemperature = contentStrategyState.selectedTemperature || 'cold';
                    const primarySixS = contentStrategyState.dominantSixS.primary || undefined;
                    const marketingStatements = contentStrategyState.marketingStatements || strategyContext.marketingStatements;

                    // Get Story Strategy (THE CREATIVE VISION - most important for scene generation)
                    const selectedStoryStrategy = strategyContext.selectedStoryStrategy;

                    // Get Six S gaps from contentStrategyState (sorted by score for priority)
                    const sixSGaps = contentStrategyState.sixSGaps
                        ? [...contentStrategyState.sixSGaps]
                            .sort((a, b) => b.gapScore - a.gapScore)
                            .slice(0, 3) // Top 3 gaps
                            .map(g => ({
                                category: g.category,
                                label: g.label,
                                gapScore: g.gapScore,
                                priority: g.priority,
                                voiceOfCustomer: g.voiceOfCustomer?.slice(0, 2),
                            }))
                        : undefined;

                    // Get pain synopsis and market intel from strategyContext
                    const painSynopsis = strategyContext.painSynopsis;
                    const marketIntelligence = strategyContext.marketIntelligence;

                    // Use the new structured scene generation with full context
                    const generatedScenes = await generateScenesFromHook({
                        avatarName: strategyContext.avatarName,
                        strategy: strategyContext.strategySummary,
                        tone: toneValue,
                        assets: strategyContext.selectedAssets,
                        painPoints: strategyContext.painPoints,
                        marketingStatements: marketingStatements,
                        // Gravity Culture additions
                        temperature: selectedTemperature,
                        primarySixS: selectedStoryStrategy?.primarySixS || primarySixS || undefined,
                        productName: marketingStatements?.productName || undefined,
                        // Full avatar context for grounding
                        avatarContext: strategyContext.avatarContext,
                        // Story Strategy (THE CREATIVE VISION - guides the entire script)
                        selectedStoryStrategy: selectedStoryStrategy,
                        // NEW: Six S Gap Analysis, Pain Synopsis, Market Intelligence
                        sixSGaps: sixSGaps,
                        painSynopsis: painSynopsis,
                        marketIntelligence: marketIntelligence,
                    }, hookText, campaignMode);

                    console.log("Scenes generated successfully:", generatedScenes.length);

                    // Calculate duration for each scene
                    const calculateDuration = (text: string): number => {
                        const wordCount = text.split(/\s+/).filter(Boolean).length;
                        return Math.max(3, Math.ceil(wordCount / 2.5));
                    };

                    // Convert to Scene format with IDs and status
                    const scenes: Scene[] = generatedScenes.map((gs, index) => ({
                        id: `scene_${Date.now()}_${index}`,
                        label: gs.label,
                        script: gs.script,
                        speaker: gs.speaker,
                        durationEstimate: calculateDuration(gs.script),
                        imagePrompt: gs.visual || '', // Visual description for image generation
                        status: 'draft' as SceneStatus,
                        thumbnailCandidate: gs.label === 'HOOK' // HOOK is default thumbnail candidate
                    }));

                    // Also create combined scriptBody for backward compatibility
                    const combinedScript = scenes.map(s => s.script).filter(Boolean).join('\n\n');

                    // Update both scriptBody and directorsCutState.scenes
                    set({
                        scriptBody: combinedScript,
                        directorsCutState: {
                            ...directorsCutState,
                            scenes,
                            activeSceneId: scenes[0]?.id || null,
                            thumbnailSourceSceneIds: scenes.filter(s => s.thumbnailCandidate).map(s => s.id)
                        },
                        isRegenerating: false
                    });

                    toast.success(`Generated ${scenes.length} scenes!`);
                } catch (error) {
                    console.error("Failed to generate scenes from hook:", error);
                    set({ isRegenerating: false });
                    toast.error("Failed to generate scenes. Please try again.");
                }
            },

            setScriptBody: (text) => set({ scriptBody: text }),

            setVisualMessengerState: (updates) => set((state) => ({
                visualMessengerState: { ...state.visualMessengerState, ...updates }
            })),

            setCampaignMode: (mode) => set({ campaignMode: mode }),

            setThumbnailState: (updates) => set((state) => ({
                thumbnailState: { ...state.thumbnailState, ...updates }
            })),

            addAsset: (asset) => set((state) => {
                if (!state.strategyContext) return {};
                return {
                    strategyContext: {
                        ...state.strategyContext,
                        selectedAssets: [...state.strategyContext.selectedAssets, asset]
                    }
                };
            }),

            updateAsset: (id, updates) => set((state) => {
                if (!state.strategyContext) return {};
                return {
                    strategyContext: {
                        ...state.strategyContext,
                        selectedAssets: state.strategyContext.selectedAssets.map(a =>
                            a.id === id ? { ...a, ...updates } : a
                        )
                    }
                };
            }),

            // Kept for backward compatibility or direct calls, but mapped to new flow
            regenerateContent: async (mode = 'full') => {
                const { regenerateHooks, setSelectedHookId, generatedHooks, selectedHookId } = get();

                if (mode === 'full') {
                    await regenerateHooks();
                } else if (mode === 'script_only') {
                    // Re-trigger script generation with current hook
                    if (selectedHookId) {
                        await setSelectedHookId(selectedHookId);
                    }
                }
            },

            // Regenerate scenes with the current selected hook
            // Useful when user wants to refresh scenes without changing hooks
            regenerateScenes: async () => {
                const { selectedHookId, setSelectedHookId } = get();

                if (!selectedHookId) {
                    toast.error("Please select a hook first");
                    return;
                }

                // Simply re-trigger setSelectedHookId which handles scene generation
                console.log('[regenerateScenes] Regenerating scenes for hook:', selectedHookId);
                await setSelectedHookId(selectedHookId);
            },

            // Director's Cut State
            directorsCutState: {
                activeSceneId: null,
                selectedLayerId: null,
                cameraState: { pan: { x: 0, y: 0 }, zoom: 1 },
                layers: [],
                scenes: [],
                visualStyle: 'cinematic',
                thumbnailSourceSceneIds: []
            },
            setDirectorsCutState: (updates) => set((state) => ({
                directorsCutState: { ...state.directorsCutState, ...updates }
            })),
            resetDirectorsCutState: () => set({
                directorsCutState: {
                    activeSceneId: null,
                    selectedLayerId: null,
                    cameraState: { pan: { x: 0, y: 0 }, zoom: 1 },
                    layers: [],
                    scenes: [],
                    visualStyle: 'cinematic',
                    thumbnailSourceSceneIds: []
                }
            }),
            syncScenesFromScript: () => {
                const { scriptBody, directorsCutState, campaignMode } = get();
                // Safe check for scenes existence and length
                if (directorsCutState?.scenes && directorsCutState.scenes.length > 0) return; // Already synced

                // Simple heuristic: Split by newlines, filter empty
                const paragraphs = scriptBody.split('\n').filter(p => p.trim().length > 0);

                // Calculate duration estimate based on word count (~2.5 words/second)
                const calculateDuration = (text: string): number => {
                    const wordCount = text.split(/\s+/).filter(Boolean).length;
                    return Math.max(3, Math.ceil(wordCount / 2.5)); // Minimum 3 seconds
                };

                // Assign labels based on position
                const getLabel = (index: number, total: number): SceneLabel => {
                    if (index === 0) return 'HOOK';
                    if (index === 1) return 'PAIN';
                    if (index === total - 1) return 'CTA';
                    if (index === total - 2) return 'SOLUTION';
                    return 'TRANSITION';
                };

                // Alternate speakers for transformation_narrative mode
                const getSpeaker = (index: number): 'guide' | 'mentee' | undefined => {
                    if (campaignMode !== 'transformation_narrative') return undefined;
                    // Alternate: HOOK=guide, PAIN=mentee, SOLUTION=guide, CTA=guide
                    if (index === 1) return 'mentee'; // PAIN point from mentee perspective
                    return 'guide';
                };

                const scenes: Scene[] = paragraphs.map((text, index) => ({
                    id: `scene_${index + 1}`,
                    label: getLabel(index, paragraphs.length),
                    script: text,
                    speaker: getSpeaker(index),
                    durationEstimate: calculateDuration(text),
                    status: 'draft' as SceneStatus,
                    thumbnailCandidate: index === 0, // HOOK is default thumbnail candidate
                    // Legacy fields
                    thumbnail: '',
                    duration: `0:${String(calculateDuration(text)).padStart(2, '0')}`
                }));

                set((state) => ({
                    directorsCutState: {
                        ...state.directorsCutState,
                        scenes,
                        activeSceneId: scenes[0]?.id || null,
                        thumbnailSourceSceneIds: scenes.filter(s => s.thumbnailCandidate).map(s => s.id)
                    }
                }));
            },

            // Content Strategy State (Six S + Temperature)
            contentStrategyState: initialContentStrategyState,

            setDesireMarket: (market) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        desireMarket: market,
                    },
                })),

            setSixSGaps: (gaps) => {
                // Auto-calculate dominant Six S from gaps
                const sorted = [...gaps].sort((a, b) => b.gapScore - a.gapScore);
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        sixSGaps: gaps,
                        dominantSixS: {
                            primary: sorted[0]?.category || null,
                            primaryGapScore: sorted[0]?.gapScore || 0,
                            secondary: sorted[1]?.category || null,
                            secondaryGapScore: sorted[1]?.gapScore || 0,
                            tertiary: sorted[2]?.category || null,
                            tertiaryGapScore: sorted[2]?.gapScore || 0,
                        },
                    },
                }));
            },

            setMarketingStatementsStrategy: (statements) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        marketingStatements: statements,
                    },
                })),

            setSelectedTemperature: (temp) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        selectedTemperature: temp,
                    },
                })),

            // NEW: Set selected content framework
            setSelectedFrameworkId: (id) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        selectedFrameworkId: id,
                    },
                })),

            // Set selected psychological trigger (updated typing)
            setSelectedPsychologicalTriggerId: (id) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        selectedPsychologicalTriggerId: id,
                    },
                })),

            // NEW: Set story strategies with their generation inputs
            setStoryStrategies: (strategies, inputs) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        storyStrategies: strategies,
                        storyStrategyInputs: inputs,
                        selectedStoryStrategyId: null, // Clear selection when strategies change
                        // Clear downstream state
                        temperatureStrategies: {
                            cold: null,
                            warm: null,
                            hot: null,
                        },
                    },
                })),

            // NEW: Select a story strategy
            setSelectedStoryStrategyId: (id) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        selectedStoryStrategyId: id,
                        // Also set deprecated field for backward compatibility
                        selectedCandidateId: id,
                    },
                })),

            // DEPRECATED: Keep for backward compatibility
            setStrategyCandidates: (candidates) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        strategyCandidates: candidates,
                        // Clear temperature strategies when candidates change - they're now stale
                        temperatureStrategies: {
                            cold: null,
                            warm: null,
                            hot: null,
                        },
                        selectedTemperature: null,
                        selectedCandidateId: null,
                    },
                })),

            // DEPRECATED: Keep for backward compatibility
            setSelectedCandidateId: (id) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        selectedCandidateId: id,
                        // Also set new field
                        selectedStoryStrategyId: id,
                    },
                })),

            setTemperatureStrategy: (temp, strategy) =>
                set((state) => ({
                    contentStrategyState: {
                        ...state.contentStrategyState,
                        temperatureStrategies: {
                            ...state.contentStrategyState.temperatureStrategies,
                            [temp]: strategy,
                        },
                    },
                })),

            resetContentStrategy: () =>
                set({ contentStrategyState: initialContentStrategyState })
        }),
        {
            name: 'project-storage',
            partialize: (state) => ({
                strategyContext: state.strategyContext,
                toneValue: state.toneValue,
                generatedHooks: state.generatedHooks,
                selectedHookId: state.selectedHookId,
                customHookText: state.customHookText,
                scriptBody: state.scriptBody,
                visualMessengerState: state.visualMessengerState,
                campaignMode: state.campaignMode,
                // We exclude bgImage from persistence because Base64 strings are too large for localStorage (5MB limit).
                // Using a placeholder ensures the app doesn't crash, though state is lost on reload (unless saved to Drafts).
                thumbnailState: {
                    ...state.thumbnailState,
                    bgImage: state.thumbnailState.bgImage?.startsWith('data:')
                        ? "https://placehold.co/1280x720/1a1a1a/FFFFFF.png?text=Image+Not+Persisted+(Check+Drafts)&font=roboto"
                        : state.thumbnailState.bgImage
                },
                directorsCutState: state.directorsCutState,
                contentStrategyState: state.contentStrategyState
            })
        }
    )
);
