'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Target, Lightbulb, Shield, Zap, Loader2, RefreshCw, Layout, ListOrdered, Thermometer, Check, X, Grid, List, Sparkles, User, Heart, DollarSign, Clock, Star, Users, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { generateContentStrategy, StrategyRecommendation, generateStrategyCandidates, generateTemperatureStrategy, generateStoryStrategies } from '@/lib/strategy-api';
import { toast } from "sonner";
import { CampaignSetupModal } from '@/components/campaign/CampaignSetupModal';
import { useProjectStore, StrategyCandidate, TemperatureStrategy, StoryStrategy } from '@/store/projectStore';
import { getLatestICPSession, getAllAvatarsBySessionId, getMarketingStatementsByAvatarId } from '@/lib/database-service';
import {
    TEMPERATURE_DEFINITIONS,
    SIX_S_DEFINITIONS,
    normalizeSixSCategory,
    CONTENT_FRAMEWORK_DEFINITIONS,
    PSYCHOLOGICAL_TRIGGER_DEFINITIONS,
    getFrameworksForTemperature,
    getTriggersForTemperature,
    ALL_CONTENT_FRAMEWORKS,
    ALL_PSYCHOLOGICAL_TRIGGERS,
} from '@/lib/six-s-constants';
import type { Temperature, SixS, ContentFrameworkId, PsychologicalTriggerId, ContentFramework, PsychologicalTrigger } from '@/lib/six-s-constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StepProgressLoader, GenerationStep } from '@/components/ui/StepProgressLoader';
import { MagicLoader } from '@/components/ui/MagicLoader';

// Step-based generation progress for story strategies
const STORY_STRATEGY_STEPS: GenerationStep[] = [
    { id: "analyze", label: "Analyzing your framework selection" },
    { id: "trigger", label: "Applying psychological triggers" },
    { id: "temperature", label: "Calibrating for audience temperature" },
    { id: "gaps", label: "Mapping 6-S emotional gaps" },
    { id: "craft", label: "Crafting story angles" },
    { id: "score", label: "Scoring and ranking strategies" },
];

export default function StrategyPage() {
    const router = useRouter();
    const { appState, setContentStudioStrategy, setHeaderActions, hydrateSessionData, setAvatarData, setMarketingStatements } = useApp();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [loadingTemperatureStrategy, setLoadingTemperatureStrategy] = useState(false);
    const [loadingStoryStrategies, setLoadingStoryStrategies] = useState(false);
    const [strategy, setStrategy] = useState<StrategyRecommendation | null>(appState.contentStudioStrategy);
    const [showCampaignSetup, setShowCampaignSetup] = useState(false);
    const hasLoadedDataRef = useRef(false);

    // Step-based progress tracking for story strategies generation
    const [storyStepIndex, setStoryStepIndex] = useState(0);
    const [storyCompletedSteps, setStoryCompletedSteps] = useState<string[]>([]);

    // Load ICP data from database on mount (same pattern as MarketRadar.tsx)
    useEffect(() => {
        async function loadICPData() {
            // Only load once
            if (hasLoadedDataRef.current) return;

            const userId = user?.uid || appState.userId;
            if (!userId) {
                console.log('[Strategy] No user ID available, skipping database load');
                setLoadingData(false);
                return;
            }

            console.log('[Strategy] Loading ICP data from database for user:', userId);
            hasLoadedDataRef.current = true;

            try {
                // Load the latest ICP session
                const session = await getLatestICPSession(userId);
                if (session) {
                    console.log('[Strategy] Found ICP session:', session.id);

                    // Hydrate the session data into AppContext
                    hydrateSessionData(session);

                    // Load avatar data
                    const avatars = await getAllAvatarsBySessionId(session.id!);
                    if (avatars.length > 0) {
                        const avatar = avatars[0];
                        console.log('[Strategy] Found avatar:', avatar.name);
                        setAvatarData(avatar);

                        // Load marketing statements for the avatar
                        if (avatar.id) {
                            const marketingData = await getMarketingStatementsByAvatarId(avatar.id);
                            if (marketingData) {
                                console.log('[Strategy] Found marketing statements');
                                setMarketingStatements(marketingData);
                            }
                        }
                    }
                } else {
                    console.log('[Strategy] No ICP session found');
                }
            } catch (error) {
                console.error('[Strategy] Error loading ICP data:', error);
                toast.error('Failed to load profile data');
            } finally {
                setLoadingData(false);
            }
        }

        loadICPData();
    }, [user?.uid, appState.userId]);

    // Framework selection now uses store (selectedFrameworkId from contentStrategyState)
    const [showAllFrameworks, setShowAllFrameworks] = useState(false);

    // User-selected trigger (single selection for clarity)
    // selectedPsychologicalTriggerId now comes from store (replaces local selectedTriggerId)
    const [showAllTriggers, setShowAllTriggers] = useState(false);

    // Loading state for framework preview generation
    const [loadingFrameworkPreview, setLoadingFrameworkPreview] = useState(false);
    const [frameworkPreviews, setFrameworkPreviews] = useState<Record<ContentFrameworkId, {
        hook: string;
        insight: string;
        transformation: string;
        cta: string;
    }>>({} as any);

    // Zustand store for strategy state
    const {
        contentStrategyState,
        setSelectedTemperature,
        setSelectedFrameworkId,
        setSelectedPsychologicalTriggerId,
        setStoryStrategies,
        setSelectedStoryStrategyId,
        // Deprecated - kept for backward compatibility
        setStrategyCandidates,
        setTemperatureStrategy,
        setSelectedCandidateId,
    } = useProjectStore();

    const {
        sixSGaps,
        selectedTemperature,
        // New foundational selections
        selectedFrameworkId,
        selectedPsychologicalTriggerId,
        // New story strategies
        storyStrategies: rawStoryStrategies,
        selectedStoryStrategyId,
        storyStrategyInputs,
        // Deprecated - kept for backward compatibility
        strategyCandidates,
        selectedCandidateId,
        temperatureStrategies,
    } = contentStrategyState;

    // Defensive fallback for migration - handle undefined/null storyStrategies
    const storyStrategies = Array.isArray(rawStoryStrategies) ? rawStoryStrategies : [];

    // Local state for viewMode (removed from store, using local state instead)
    const [viewMode, setViewMode] = useState<'single' | 'matrix'>('single');

    // Use marketingStatements from AppContext (set by ProductStrategy page)
    const marketingStatements = appState.marketingStatements;

    // Get the selected strategy candidate (user selection overrides AI recommendation)
    const selectedCandidate = selectedCandidateId
        ? strategyCandidates.find(c => c.id === selectedCandidateId)
        : strategyCandidates.find(c => c.recommendation === 'recommended') || strategyCandidates[0];
    const currentTemperatureStrategy = selectedTemperature ? temperatureStrategies[selectedTemperature] : null;

    // Helper to check if a Six S matches the user's ICP selection
    const isICPSixS = (category: SixS): boolean => {
        const selectedName = appState.selectedSixS?.name;
        if (!selectedName) return false;
        const normalizedSelected = normalizeSixSCategory(selectedName);
        return normalizedSelected === category;
    };

    // Get the active framework (user selection or AI recommendation)
    const getActiveFramework = (): { id: ContentFrameworkId | null; def: ContentFramework | null; isUserSelected: boolean } => {
        if (selectedFrameworkId) {
            return {
                id: selectedFrameworkId,
                def: CONTENT_FRAMEWORK_DEFINITIONS[selectedFrameworkId],
                isUserSelected: true
            };
        }
        // Try to match AI recommendation to our definitions
        const aiFrameworkName = strategy?.framework?.name?.toLowerCase() || '';
        const matchedId = ALL_CONTENT_FRAMEWORKS.find(id =>
            CONTENT_FRAMEWORK_DEFINITIONS[id].name.toLowerCase().includes(aiFrameworkName.split(' ')[0])
        );
        return {
            id: matchedId || null,
            def: matchedId ? CONTENT_FRAMEWORK_DEFINITIONS[matchedId] : null,
            isUserSelected: false
        };
    };

    const activeFramework = strategy ? getActiveFramework() : { id: null, def: null, isUserSelected: false };

    useEffect(() => {
        if (!appState.contentStudioStrategy && appState.contentStudioMarketIntel && !loading) {
            fetchStrategy();
        } else if (appState.contentStudioStrategy) {
            setStrategy(appState.contentStudioStrategy);
        }
    }, [appState.contentStudioStrategy, appState.contentStudioMarketIntel]);

    // Inject header actions - gate Next button until story strategy is selected
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={fetchStrategy}
                    disabled={loading}
                    className="border-primary/30 text-foreground hover:bg-primary/10"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Regenerate
                </Button>
                <Button
                    onClick={() => router.push('/veritas/content-composer')}
                    disabled={!selectedStoryStrategyId}
                    className={cn(
                        "shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]",
                        selectedStoryStrategyId
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                >
                    Next: Content Composer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );

        return () => setHeaderActions(null);
    }, [setHeaderActions, loading, selectedStoryStrategyId, router]);

    const fetchStrategy = async () => {
        if (!appState.contentStudioPainSynopsis || !appState.contentStudioMarketIntel) {
            toast.error("Missing prerequisites: Pain Synopsis or Market Intel");
            return;
        }

        setLoading(true);
        try {
            const result = await generateContentStrategy(
                appState.contentStudioPainSynopsis,
                appState.contentStudioMarketIntel,
                appState.marketingStatements
            );
            setStrategy(result);
            setContentStudioStrategy(result);
            toast.success("AI Strategy generated!");

            // Also generate strategy candidates if we have Six S gaps
            if (sixSGaps.length > 0 && marketingStatements) {
                fetchStrategyCandidates();
            }
        } catch (error) {
            console.error("Failed to generate strategy:", error);
            toast.error("Failed to generate strategy");
        } finally {
            setLoading(false);
        }
    };

    // Compute prerequisites status for elegant inline display
    const prerequisites = {
        painSynopsis: !!appState.contentStudioPainSynopsis,
        marketIntel: !!appState.contentStudioMarketIntel,
        sixSGaps: sixSGaps.length > 0,
        marketingStatements: !!marketingStatements,
    };
    const allPrerequisitesMet = prerequisites.painSynopsis && prerequisites.marketIntel && prerequisites.sixSGaps && prerequisites.marketingStatements;

    // Get product name from ICP answers (index 9) or marketing statements
    const productName = appState.gravityICP?.answers?.[9] || marketingStatements?.product_name || 'your product';

    console.log('[Strategy] Product name resolved to:', productName);
    console.log('[Strategy] Product name sources:', {
        fromICP: appState.gravityICP?.answers?.[9],
        fromMarketingStatements: marketingStatements?.product_name,
        allICPAnswers: appState.gravityICP?.answers
    });

    const fetchStrategyCandidates = async () => {
        // Prerequisites are checked inline in UI, but double-check here
        if (!allPrerequisitesMet) {
            console.warn('[Strategy] Cannot generate candidates - prerequisites not met:', prerequisites);
            return;
        }

        setLoadingCandidates(true);
        try {
            const candidates = await generateStrategyCandidates(
                sixSGaps,
                marketingStatements,
                appState.contentStudioPainSynopsis,
                appState.contentStudioMarketIntel,
                productName
            );
            // Clear local selection state - new candidates mean old selection is stale
            setSelectedCandidateId(null);
            setStrategyCandidates(candidates);
            toast.success("Strategy candidates generated!");
        } catch (error) {
            console.error("Failed to generate strategy candidates:", error);
            toast.error("Failed to generate strategy candidates");
        } finally {
            setLoadingCandidates(false);
        }
    };

    // Check if all foundational selections are made
    const hasAllFoundationalSelections = selectedFrameworkId && selectedPsychologicalTriggerId && selectedTemperature;

    // Get the selected story strategy
    const selectedStoryStrategy = selectedStoryStrategyId
        ? storyStrategies.find(s => s.id === selectedStoryStrategyId)
        : null;

    // Generate Story Strategies using the NEW flow with step-based progress
    const fetchStoryStrategies = async () => {
        if (!selectedFrameworkId || !selectedPsychologicalTriggerId || !selectedTemperature) {
            toast.error("Please select Framework, Trigger, and Temperature first");
            return;
        }

        if (!marketingStatements) {
            toast.error("Marketing statements not loaded yet");
            return;
        }

        // Reset step progress
        setStoryStepIndex(0);
        setStoryCompletedSteps([]);
        setLoadingStoryStrategies(true);

        // Variable step timing to feel more realistic (longer for "heavier" tasks)
        // Total time should span most of the API call (~12-18 seconds typically)
        const stepDurations = [
            2500,  // Step 1: Analyzing framework - medium
            3500,  // Step 2: Applying triggers - longer (psychological analysis)
            2800,  // Step 3: Calibrating temperature - medium
            4000,  // Step 4: Mapping 6-S gaps - longest (deep emotional analysis)
            3200,  // Step 5: Crafting story angles - longer (creative work)
            // Step 6 (scoring) completes when API returns
        ];

        let currentStep = 0;
        const advanceStep = () => {
            if (currentStep < stepDurations.length) {
                setStoryCompletedSteps(steps => [...steps, STORY_STRATEGY_STEPS[currentStep].id]);
                currentStep++;
                setStoryStepIndex(currentStep);

                if (currentStep < stepDurations.length) {
                    setTimeout(advanceStep, stepDurations[currentStep]);
                }
            }
        };

        // Start the first step after initial delay
        const stepTimeout = setTimeout(advanceStep, stepDurations[0]);

        try {
            const painSynopsis = appState.contentStudioPainSynopsis || {
                psychologicalProfile: {},
                storyBeats: {}
            };
            const marketIntel = appState.contentStudioMarketIntel || {
                sentiment: {}
            };

            // Prepare avatar context for grounding the hooks
            const avatarContext = appState.avatarData ? {
                name: appState.avatarData.name,
                occupation: appState.avatarData.occupation,
                age: appState.avatarData.age,
                dreams: appState.avatarData.dreams,
                daily_challenges: appState.avatarData.daily_challenges,
                buying_triggers: appState.avatarData.buying_triggers,
                pain_points: appState.avatarData.pain_points,
                core_desire: appState.avatarData.core_desire,
            } : undefined;

            const strategies = await generateStoryStrategies(
                selectedFrameworkId,
                selectedPsychologicalTriggerId,
                selectedTemperature,
                sixSGaps,
                marketingStatements,
                painSynopsis,
                marketIntel,
                productName,
                avatarContext
            );

            // Complete all remaining steps when API returns
            clearTimeout(stepTimeout);
            setStoryCompletedSteps(STORY_STRATEGY_STEPS.map(s => s.id));
            setStoryStepIndex(STORY_STRATEGY_STEPS.length);

            setStoryStrategies(strategies, {
                frameworkId: selectedFrameworkId,
                triggerId: selectedPsychologicalTriggerId,
                temperature: selectedTemperature,
            });
            toast.success("Story strategies generated!");
        } catch (error) {
            clearTimeout(stepTimeout);
            console.error("Failed to generate story strategies:", error);
            toast.error("Failed to generate story strategies");
        } finally {
            setLoadingStoryStrategies(false);
        }
    };

    const fetchTemperatureStrategy = async (temp: Temperature) => {
        if (!selectedCandidate) {
            toast.error("Select a strategy candidate first");
            return;
        }

        if (!marketingStatements) {
            toast.error("Marketing statements not loaded yet");
            return;
        }

        // painSynopsis and marketIntel can be empty - we have fallbacks in the API

        setLoadingTemperatureStrategy(true);
        try {
            // Provide empty defaults if painSynopsis or marketIntel are missing
            const painSynopsis = appState.contentStudioPainSynopsis || {
                psychologicalProfile: {},
                storyBeats: {}
            };
            const marketIntel = appState.contentStudioMarketIntel || {
                sentiment: {}
            };

            // Get trigger definition if selected
            const selectedTrigger = selectedPsychologicalTriggerId
                ? {
                    id: selectedPsychologicalTriggerId,
                    name: PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].name,
                    hookTemplate: PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].hookTemplate,
                }
                : undefined;

            const tempStrategy = await generateTemperatureStrategy(
                temp,
                selectedCandidate,
                sixSGaps,
                marketingStatements,
                painSynopsis,
                marketIntel,
                productName,
                selectedTrigger
            );
            setTemperatureStrategy(temp, tempStrategy);
            toast.success(`${TEMPERATURE_DEFINITIONS[temp].label} strategy generated!`);
        } catch (error) {
            console.error("Failed to generate temperature strategy:", error);
            toast.error("Failed to generate temperature strategy");
        } finally {
            setLoadingTemperatureStrategy(false);
        }
    };

    const handleTemperatureSelect = async (temp: Temperature) => {
        setSelectedTemperature(temp);

        // Generate temperature strategy if not already generated
        if (!temperatureStrategies[temp]) {
            await fetchTemperatureStrategy(temp);
        }
    };

    // Generate all three temperature strategies in parallel for Matrix view
    const fetchAllTemperatureStrategies = async () => {
        if (!selectedCandidate) {
            toast.error("Select a strategy candidate first");
            return;
        }

        if (!marketingStatements) {
            toast.error("Marketing statements not loaded yet");
            return;
        }

        setLoadingTemperatureStrategy(true);
        const temperatures: Temperature[] = ['cold', 'warm', 'hot'];

        // Provide empty defaults if painSynopsis or marketIntel are missing
        const painSynopsis = appState.contentStudioPainSynopsis || {
            psychologicalProfile: {},
            storyBeats: {}
        };
        const marketIntel = appState.contentStudioMarketIntel || {
            sentiment: {}
        };

        // Get trigger definition if selected
        const selectedTrigger = selectedPsychologicalTriggerId
            ? {
                id: selectedPsychologicalTriggerId,
                name: PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].name,
                hookTemplate: PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].hookTemplate,
            }
            : undefined;

        try {
            // Generate all temperatures in parallel
            const promises = temperatures.map(async (temp) => {
                if (!temperatureStrategies[temp]) {
                    const tempStrategy = await generateTemperatureStrategy(
                        temp,
                        selectedCandidate,
                        sixSGaps,
                        marketingStatements,
                        painSynopsis,
                        marketIntel,
                        productName,
                        selectedTrigger
                    );
                    setTemperatureStrategy(temp, tempStrategy);
                }
            });

            await Promise.all(promises);
            toast.success("All temperature strategies generated!");
        } catch (error) {
            console.error("Failed to generate temperature strategies:", error);
            toast.error("Failed to generate some temperature strategies");
        } finally {
            setLoadingTemperatureStrategy(false);
        }
    };

    // Handle view mode change
    const handleViewModeChange = async (mode: 'single' | 'matrix') => {
        setViewMode(mode);

        // When switching to matrix, generate all temperature strategies
        if (mode === 'matrix' && selectedCandidate) {
            const needsGeneration = ['cold', 'warm', 'hot'].some(t => !temperatureStrategies[t as Temperature]);
            if (needsGeneration) {
                await fetchAllTemperatureStrategies();
            }
        }
    };

    // Auto-generate strategy candidates when Six S gaps are available
    useEffect(() => {
        if (sixSGaps.length > 0 && strategyCandidates.length === 0 && marketingStatements && !loadingCandidates) {
            fetchStrategyCandidates();
        }
    }, [sixSGaps, marketingStatements]);

    // Show loading state while ICP data is being fetched
    if (loadingData) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <MagicLoader
                    category="strategy"
                    title="Loading Strategy Data"
                    subtitle="Preparing your market intelligence and audience insights"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <CampaignSetupModal
                isOpen={showCampaignSetup}
                onClose={() => setShowCampaignSetup(false)}
            />

            {/* Sub-header */}
            <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/veritas/market-radar')}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">AI Strategy</h1>
                        <p className="text-base text-muted-foreground">
                            Strategic angles for {appState.avatarData?.name || "your avatar"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ICP Context Panel */}
            {(appState.selectedCoreDesire || appState.selectedSixS || appState.avatarData || marketingStatements) && (
                <div className="px-6 py-4 border-b border-border bg-card/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-6">
                            {/* Avatar */}
                            {appState.avatarData?.name && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground uppercase tracking-wider block">Target</span>
                                        <span className="text-base font-medium text-foreground">{appState.avatarData.name}</span>
                                    </div>
                                </div>
                            )}

                            {/* Core Desire */}
                            {appState.selectedCoreDesire && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        {appState.selectedCoreDesire.name === 'Money' && <DollarSign className="w-4 h-4 text-primary" />}
                                        {appState.selectedCoreDesire.name === 'Time' && <Clock className="w-4 h-4 text-primary" />}
                                        {appState.selectedCoreDesire.name === 'Experiences' && <Star className="w-4 h-4 text-primary" />}
                                        {appState.selectedCoreDesire.name === 'Relationships' && <Users className="w-4 h-4 text-primary" />}
                                        {!['Money', 'Time', 'Experiences', 'Relationships'].includes(appState.selectedCoreDesire.name) && <Heart className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground uppercase tracking-wider block">Core Desire</span>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                            {appState.selectedCoreDesire.name}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Primary Emotion (Six S) */}
                            {appState.selectedSixS && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Heart className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground uppercase tracking-wider block">Primary Emotion</span>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                            {appState.selectedSixS.name}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Marketing Statements Summary */}
                            {marketingStatements && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground uppercase tracking-wider block">Framework</span>
                                        <span className="text-base font-medium text-foreground truncate max-w-[200px]">
                                            {marketingStatements.frameworkName || 'Custom Framework'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading && !strategy ? (
                    <div className="h-96 flex items-center justify-center">
                        <Card className="bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)] max-w-lg">
                            <MagicLoader
                                category="strategy"
                                title="Generating Content Strategy"
                                subtitle="Analyzing your market data and crafting strategic angles"
                            />
                        </Card>
                    </div>
                ) : !strategy ? (
                    <div className="h-96 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Target className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-muted-foreground mb-4">No strategy generated yet. Ensure you have Market Intel first.</p>
                        <Button
                            onClick={() => router.push('/veritas/market-radar')}
                            className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                        >
                            Go to Market Radar
                        </Button>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* ============================================= */}
                        {/* STEP 1: Content Framework Selection */}
                        {/* ============================================= */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-primary" />
                                        Step 1: Content Framework
                                    </h2>
                                    <p className="text-base text-muted-foreground mt-1">
                                        Choose how your content will be structured
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllFrameworks(!showAllFrameworks)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {showAllFrameworks ? 'Show Less' : 'See All Options'}
                                </Button>
                            </div>

                            {/* AI Recommended Framework (always visible) */}
                            {strategy.framework && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6"
                                >
                                    <Card className={cn(
                                        "p-6 bg-card/85 backdrop-blur-xl border transition-all cursor-pointer",
                                        (!selectedFrameworkId || selectedFrameworkId === (strategy.framework.name.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') as ContentFrameworkId))
                                            ? "border-emerald-500/40 shadow-[0_0_40px_-8px_rgba(16,185,129,0.4)]"
                                            : "border-border hover:border-primary/30"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                                                {CONTENT_FRAMEWORK_DEFINITIONS[Object.keys(CONTENT_FRAMEWORK_DEFINITIONS).find(k =>
                                                    CONTENT_FRAMEWORK_DEFINITIONS[k as ContentFrameworkId].name.toLowerCase().includes(strategy.framework.name.toLowerCase().split(' ')[0])
                                                ) as ContentFrameworkId]?.icon || '📝'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-display font-semibold text-foreground">{strategy.framework.name}</h3>
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                        AI Recommended
                                                    </Badge>
                                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                                                        {strategy.framework.marketFit}% Market Fit
                                                    </Badge>
                                                </div>
                                                <p className="text-base text-muted-foreground mb-4">
                                                    <span className="text-primary font-medium">Why: </span>
                                                    {strategy.framework.reasoning}
                                                </p>

                                                {/* Structure */}
                                                <div className="flex flex-wrap gap-2">
                                                    {strategy.framework.structure.map((step, i) => (
                                                        <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-full text-xs">
                                                            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-muted-foreground">{step.split(':')[0]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {/* All Framework Options Grid */}
                            <AnimatePresence>
                                {showAllFrameworks && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 border-t border-border">
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Select a different framework or confirm the AI recommendation above
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {ALL_CONTENT_FRAMEWORKS.map((frameworkId) => {
                                                    const framework = CONTENT_FRAMEWORK_DEFINITIONS[frameworkId];
                                                    const isSelected = selectedFrameworkId === frameworkId;
                                                    const isAIRecommended = strategy.framework.name.toLowerCase().includes(framework.name.toLowerCase().split(' ')[0].toLowerCase());

                                                    return (
                                                        <motion.div
                                                            key={frameworkId}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: ALL_CONTENT_FRAMEWORKS.indexOf(frameworkId) * 0.05 }}
                                                        >
                                                            <Card
                                                                onClick={() => setSelectedFrameworkId(frameworkId)}
                                                                className={cn(
                                                                    "p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1",
                                                                    isSelected
                                                                        ? "border-primary/50 shadow-[0_0_30px_-8px_rgba(79,209,255,0.4)] bg-primary/5"
                                                                        : isAIRecommended
                                                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                                                        : "border-border hover:border-primary/30 bg-card/50"
                                                                )}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <span className="text-2xl">{framework.icon}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-medium text-foreground text-sm truncate">{framework.name}</h4>
                                                                            {isAIRecommended && (
                                                                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 flex-shrink-0">
                                                                                    AI Pick
                                                                                </Badge>
                                                                            )}
                                                                            {isSelected && !isAIRecommended && (
                                                                                <Badge variant="outline" className="text-[10px] border-primary/50 text-primary flex-shrink-0">
                                                                                    Selected
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">{framework.description}</p>
                                                                        <div className="flex items-center gap-1 mt-2">
                                                                            {framework.temperatureAffinity.map(temp => (
                                                                                <span key={temp} className="text-xs">
                                                                                    {TEMPERATURE_DEFINITIONS[temp].emoji}
                                                                                </span>
                                                                            ))}
                                                                            <span className="text-[10px] text-muted-foreground ml-1">
                                                                                Best for: {framework.temperatureAffinity.map(t => TEMPERATURE_DEFINITIONS[t].label).join(', ')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Framework Preview - Shows structure of selected framework */}
                            {activeFramework.def && (
                                <motion.div
                                    key={activeFramework.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6"
                                >
                                    <Card className={cn(
                                        "p-5 bg-card/85 backdrop-blur-xl shadow-[0_0_30px_-8px_rgba(79,209,255,0.2)]",
                                        activeFramework.isUserSelected
                                            ? "border-primary/40"
                                            : "border-emerald-500/30"
                                    )}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{activeFramework.def.icon}</span>
                                                <div>
                                                    <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
                                                        {activeFramework.def.name} Structure
                                                        {activeFramework.isUserSelected && (
                                                            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                                                                Your Selection
                                                            </Badge>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        How content will be organized using this framework
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Framework Structure Steps */}
                                        <div className="space-y-2">
                                            {activeFramework.def.structure.map((step, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border">
                                                    <span className={cn(
                                                        "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                                                        activeFramework.isUserSelected
                                                            ? "bg-primary/20 text-primary"
                                                            : "bg-emerald-500/20 text-emerald-400"
                                                    )}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-foreground">{step}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Best For info */}
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium text-primary">Best for:</span> {activeFramework.def.bestFor}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </div>

                        {/* ============================================= */}
                        {/* STEP 2: Psychological Triggers */}
                        {/* ============================================= */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-400" />
                                        Step 2: Psychological Triggers
                                    </h2>
                                    <p className="text-base text-muted-foreground mt-1">
                                        Select the persuasion lever that will drive action
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllTriggers(!showAllTriggers)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {showAllTriggers ? 'Show Less' : 'See All Options'}
                                </Button>
                            </div>

                            {/* Avatar's Buying Triggers */}
                            {appState.avatarData?.buying_triggers && appState.avatarData.buying_triggers.length > 0 && (
                                <Card className="p-4 mb-6 bg-card/60 border-primary/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground text-sm">
                                                {appState.avatarData.name}'s Buying Triggers
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                What motivates them to take action
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {appState.avatarData.buying_triggers.map((trigger, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="px-3 py-1 text-xs bg-primary/5 border-primary/20 text-foreground"
                                            >
                                                {trigger}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* AI Generated Triggers */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {strategy.triggers.map((trigger, i) => (
                                    <Card key={i} className="p-5 bg-card/85 backdrop-blur-xl border-yellow-500/30 shadow-[0_0_30px_-8px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_-5px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">
                                                    {PSYCHOLOGICAL_TRIGGER_DEFINITIONS[
                                                        Object.keys(PSYCHOLOGICAL_TRIGGER_DEFINITIONS).find(k =>
                                                            trigger.name.toLowerCase().includes(PSYCHOLOGICAL_TRIGGER_DEFINITIONS[k as PsychologicalTriggerId].name.toLowerCase().split(' ')[0].toLowerCase())
                                                        ) as PsychologicalTriggerId
                                                    ]?.icon || '⚡'}
                                                </span>
                                                <h3 className="text-base font-medium text-foreground group-hover:text-yellow-400 transition-colors">
                                                    {trigger.name}
                                                </h3>
                                            </div>
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                                                AI Selected
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-base mb-4 line-clamp-2">{trigger.description}</p>

                                        <div className="space-y-3">
                                            <div className="bg-muted/30 p-3 rounded border border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Hook</p>
                                                <p className="text-sm text-foreground font-medium line-clamp-2">"{trigger.hook}"</p>
                                            </div>
                                            {trigger.marketEvidence && (
                                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{trigger.marketEvidence}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* All Available Triggers */}
                            <AnimatePresence>
                                {showAllTriggers && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 border-t border-border">
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Select a primary trigger to customize your content approach. Each works best for different audience temperatures.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                                {ALL_PSYCHOLOGICAL_TRIGGERS.map((triggerId) => {
                                                    const triggerDef = PSYCHOLOGICAL_TRIGGER_DEFINITIONS[triggerId];
                                                    const isAISelected = strategy.triggers.some(t =>
                                                        t.name.toLowerCase().includes(triggerDef.name.toLowerCase().split(' ')[0].toLowerCase())
                                                    );
                                                    const isUserSelected = selectedPsychologicalTriggerId === triggerId;

                                                    return (
                                                        <motion.div
                                                            key={triggerId}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: ALL_PSYCHOLOGICAL_TRIGGERS.indexOf(triggerId) * 0.05 }}
                                                        >
                                                            <Card
                                                                onClick={() => {
                                                                    // Single select - toggle off if already selected
                                                                    setSelectedPsychologicalTriggerId(isUserSelected ? null : triggerId);
                                                                }}
                                                                className={cn(
                                                                    "p-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5",
                                                                    isUserSelected
                                                                        ? "border-primary/50 shadow-[0_0_20px_-5px_rgba(79,209,255,0.4)] bg-primary/5 ring-2 ring-primary/30"
                                                                        : isAISelected
                                                                        ? "border-yellow-500/30 bg-yellow-500/5"
                                                                        : "border-border hover:border-primary/30 bg-card/50"
                                                                )}
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-xl">{triggerDef.icon}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1 mb-1">
                                                                            <h4 className="font-medium text-foreground text-xs truncate">{triggerDef.name}</h4>
                                                                            {isAISelected && !isUserSelected && (
                                                                                <Badge variant="outline" className="text-[8px] px-1 py-0 border-yellow-500/30 text-yellow-400 flex-shrink-0">
                                                                                    AI
                                                                                </Badge>
                                                                            )}
                                                                            {isUserSelected && (
                                                                                <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/50 text-primary flex-shrink-0">
                                                                                    <Check className="w-2 h-2 mr-0.5" />
                                                                                    Selected
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {triggerDef.temperatureAffinity.map(temp => (
                                                                                <span key={temp} className="text-[10px]">
                                                                                    {TEMPERATURE_DEFINITIONS[temp].emoji}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {/* Show selected trigger's hook template */}
                                            {selectedPsychologicalTriggerId && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-4"
                                                >
                                                    <Card className="p-4 bg-primary/5 border-primary/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xl">{PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].icon}</span>
                                                            <h4 className="font-medium text-foreground text-sm">
                                                                {PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].name} Hook Template
                                                            </h4>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground italic">
                                                            "{PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId].hookTemplate}"
                                                        </p>
                                                    </Card>
                                                </motion.div>
                                            )}

                                            {/* Temperature Guide */}
                                            <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
                                                <p className="text-xs text-muted-foreground mb-2">Temperature Guide:</p>
                                                <div className="flex flex-wrap gap-4">
                                                    {(['cold', 'warm', 'hot'] as Temperature[]).map(temp => {
                                                        const tempDef = TEMPERATURE_DEFINITIONS[temp];
                                                        const tempTriggers = getTriggersForTemperature(temp);
                                                        return (
                                                            <div key={temp} className="flex items-center gap-2">
                                                                <span>{tempDef.emoji}</span>
                                                                <span className={cn("text-xs font-medium", tempDef.color)}>{tempDef.label}:</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {tempTriggers.map(t => t.name).join(', ')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ============================================= */}
                        {/* STEP 3: Audience Temperature Selection */}
                        {/* ============================================= */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                                        <Thermometer className="w-5 h-5 text-primary" />
                                        Step 3: Audience Temperature
                                    </h2>
                                    <p className="text-base text-muted-foreground mt-1">
                                        How aware is your audience of the problem and your solution?
                                    </p>
                                </div>
                            </div>

                            {/* Temperature Selection Cards - Floating Card Effect per CLAUDE.md */}
                            <div className="grid grid-cols-3 gap-6">
                                {(['cold', 'warm', 'hot'] as Temperature[]).map((temp) => {
                                    const tempDef = TEMPERATURE_DEFINITIONS[temp];
                                    const isSelected = selectedTemperature === temp;

                                    return (
                                        <motion.button
                                            key={temp}
                                            onClick={() => setSelectedTemperature(temp)}
                                            whileHover={{ y: -4 }}
                                            transition={{ duration: 0.3 }}
                                            className={cn(
                                                "p-6 rounded-xl border text-left transition-all duration-300",
                                                "bg-card/85 backdrop-blur-xl",
                                                isSelected
                                                    ? `${tempDef.borderColor} shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_30px_60px_-15px_rgba(0,0,0,0.9)] ring-2 ring-offset-2 ring-offset-background`
                                                    : "border-border shadow-[0_0_40px_-8px_rgba(79,209,255,0.2),0_25px_50px_-15px_rgba(0,0,0,0.8)] hover:border-primary/30 hover:shadow-[0_0_50px_-5px_rgba(79,209,255,0.3)]"
                                            )}
                                            style={isSelected ? {
                                                ['--tw-ring-color' as any]: temp === 'cold' ? 'rgba(96, 165, 250, 0.5)' : temp === 'warm' ? 'rgba(251, 146, 60, 0.5)' : 'rgba(248, 113, 113, 0.5)'
                                            } : undefined}
                                        >
                                            {/* Header with emoji and label */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                                                    tempDef.bgColor,
                                                    "border",
                                                    tempDef.borderColor
                                                )}>
                                                    {tempDef.emoji}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={cn(
                                                            "font-display font-semibold text-xl",
                                                            isSelected ? tempDef.color : "text-foreground"
                                                        )}>
                                                            {tempDef.label}
                                                        </h4>
                                                        {isSelected && (
                                                            <Badge className={cn("text-[10px]", tempDef.bgColor, tempDef.color, tempDef.borderColor)}>
                                                                <Check className="w-3 h-3 mr-1" />
                                                                Selected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className={cn("text-sm font-medium", tempDef.color)}>
                                                        {tempDef.communicationFocus}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Audience State */}
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {tempDef.audienceState}
                                            </p>

                                            {/* Strategy - the key differentiator */}
                                            <div className={cn(
                                                "p-4 rounded-lg mb-4",
                                                tempDef.bgColor,
                                                "border",
                                                tempDef.borderColor
                                            )}>
                                                <p className={cn("text-xs font-medium uppercase tracking-wider mb-1", tempDef.color)}>
                                                    Strategy
                                                </p>
                                                <p className="text-sm text-foreground">
                                                    {tempDef.strategy}
                                                </p>
                                            </div>

                                            {/* Hook Direction */}
                                            <div className="mb-3">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                    Hook Direction
                                                </p>
                                                <p className={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                                    {tempDef.hookDirection}
                                                </p>
                                            </div>

                                            {/* Example Hook */}
                                            <div className="mb-4">
                                                <p className={cn("text-xs uppercase tracking-wider mb-1", tempDef.color)}>
                                                    Example {tempDef.label} Hook
                                                </p>
                                                <p className={cn("text-sm italic", isSelected ? "text-foreground/90" : "text-muted-foreground")}>
                                                    "{tempDef.hookExamples[0]}"
                                                </p>
                                            </div>

                                            {/* Example CTA */}
                                            <div className="pt-3 border-t border-border">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                                    Example CTA
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {tempDef.ctaExamples.slice(0, 2).map((cta, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="outline"
                                                            className={cn(
                                                                "text-xs",
                                                                isSelected ? tempDef.color : "text-muted-foreground",
                                                                isSelected ? tempDef.borderColor : "border-border"
                                                            )}
                                                        >
                                                            {cta}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ============================================= */}
                        {/* GENERATE STORY STRATEGIES BUTTON */}
                        {/* ============================================= */}
                        <div className="py-6">
                            <Card className={cn(
                                "p-6 text-center transition-all",
                                hasAllFoundationalSelections
                                    ? "bg-primary/5 border-primary/30 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]"
                                    : "bg-card/50 border-border"
                            )}>
                                {/* Selection Status */}
                                <div className="flex items-center justify-center gap-6 mb-4">
                                    <div className={cn(
                                        "flex items-center gap-2 text-sm",
                                        selectedFrameworkId ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {selectedFrameworkId ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{CONTENT_FRAMEWORK_DEFINITIONS[selectedFrameworkId].icon} {CONTENT_FRAMEWORK_DEFINITIONS[selectedFrameworkId].name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">1</span>
                                                <span>Framework</span>
                                            </>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    <div className={cn(
                                        "flex items-center gap-2 text-sm",
                                        selectedPsychologicalTriggerId ? "text-yellow-400" : "text-muted-foreground"
                                    )}>
                                        {selectedPsychologicalTriggerId ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId].icon} {PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId].name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">2</span>
                                                <span>Trigger</span>
                                            </>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    <div className={cn(
                                        "flex items-center gap-2 text-sm",
                                        selectedTemperature ? TEMPERATURE_DEFINITIONS[selectedTemperature].color : "text-muted-foreground"
                                    )}>
                                        {selectedTemperature ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{TEMPERATURE_DEFINITIONS[selectedTemperature].emoji} {TEMPERATURE_DEFINITIONS[selectedTemperature].label}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">3</span>
                                                <span>Temperature</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={fetchStoryStrategies}
                                    disabled={!hasAllFoundationalSelections || loadingStoryStrategies}
                                    size="lg"
                                    className={cn(
                                        "px-8 py-6 text-lg",
                                        hasAllFoundationalSelections
                                            ? "bg-primary text-primary-foreground shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90 hover:shadow-[0_0_40px_-5px_rgba(79,209,255,0.7)]"
                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {loadingStoryStrategies ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Generating Story Strategies...
                                        </>
                                    ) : storyStrategies.length > 0 ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 mr-2" />
                                            Regenerate Story Strategies
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Generate Story Strategies
                                        </>
                                    )}
                                </Button>

                                {!hasAllFoundationalSelections && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Complete all 3 selections above to unlock
                                    </p>
                                )}
                            </Card>
                        </div>

                        {/* ============================================= */}
                        {/* STORY STRATEGIES RESULTS */}
                        {/* ============================================= */}
                        {(storyStrategies.length > 0 || loadingStoryStrategies) && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            Story Strategies
                                        </h2>
                                        {storyStrategies.length > 0 && storyStrategyInputs && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Built using <span className="text-primary">{CONTENT_FRAMEWORK_DEFINITIONS[storyStrategyInputs.frameworkId].name}</span> + <span className="text-yellow-400">{PSYCHOLOGICAL_TRIGGER_DEFINITIONS[storyStrategyInputs.triggerId].name}</span> + <span className={TEMPERATURE_DEFINITIONS[storyStrategyInputs.temperature].color}>{TEMPERATURE_DEFINITIONS[storyStrategyInputs.temperature].label}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Story Strategies Display */}
                            {loadingStoryStrategies ? (
                                <div className="flex items-center justify-center py-8">
                                    <StepProgressLoader
                                        title="Generating Story Strategies"
                                        subtitle={`Creating 3 story angles using ${selectedFrameworkId ? CONTENT_FRAMEWORK_DEFINITIONS[selectedFrameworkId].name : 'your framework'}`}
                                        steps={STORY_STRATEGY_STEPS}
                                        currentStepIndex={storyStepIndex}
                                        completedSteps={storyCompletedSteps}
                                        completeTitle="Strategies Ready!"
                                    />
                                </div>
                            ) : storyStrategies.length > 0 ? (
                                <div className="space-y-4">
                                    {storyStrategies.map((story, i) => {
                                        const primaryDef = SIX_S_DEFINITIONS[story.primarySixS];
                                        const isRecommended = story.recommendation === 'recommended';
                                        const isRunnerUp = story.recommendation === 'runner_up';
                                        const isSelected = selectedStoryStrategyId === story.id;

                                        return (
                                            <motion.div
                                                key={story.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <Card
                                                    onClick={() => setSelectedStoryStrategyId(story.id)}
                                                    className={cn(
                                                        "p-6 bg-card/85 backdrop-blur-xl border transition-all duration-300 cursor-pointer",
                                                        isSelected
                                                            ? "border-primary/50 shadow-[0_0_50px_-8px_rgba(79,209,255,0.5)] ring-2 ring-primary/30"
                                                            : isRecommended
                                                            ? "border-emerald-500/40 shadow-[0_0_40px_-8px_rgba(16,185,129,0.4)] hover:-translate-y-1"
                                                            : isRunnerUp
                                                            ? "border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)] hover:-translate-y-1"
                                                            : "border-border hover:-translate-y-1"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{primaryDef?.icon}</span>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-display font-semibold text-foreground text-lg">{story.name}</h4>
                                                                    {isRecommended && (
                                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                                                            Recommended
                                                                        </Badge>
                                                                    )}
                                                                    {isRunnerUp && (
                                                                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                                                            Runner-up
                                                                        </Badge>
                                                                    )}
                                                                    {!isRecommended && !isRunnerUp && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Alternative
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {primaryDef?.label} focused
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isSelected && (
                                                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs flex items-center gap-1">
                                                                    <Check className="w-3 h-3" />
                                                                    Selected
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-xs">
                                                                {story.confidenceScore}%
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <p className="text-base text-muted-foreground mb-4">{story.angle}</p>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                                            <p className="text-xs text-muted-foreground mb-1">Hook Preview</p>
                                                            <p className="text-sm text-foreground font-medium">"{story.hookPreview}"</p>
                                                        </div>
                                                        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                            <p className="text-xs text-emerald-400 mb-1">Why it works</p>
                                                            <p className="text-xs text-muted-foreground">{story.whyItWorks}</p>
                                                        </div>
                                                    </div>

                                                    {/* Built using badge */}
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <p className="text-xs text-muted-foreground">
                                                            Built using: <span className="text-primary">{story.basedOn.framework}</span> + <span className="text-yellow-400">{story.basedOn.trigger}</span> + <span className={TEMPERATURE_DEFINITIONS[selectedTemperature || 'cold'].color}>{story.basedOn.temperature}</span>
                                                        </p>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
