import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useProjectStore, Asset, Scene, SceneLabel } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ChevronDown, User, Upload, Plus, Film, Thermometer } from 'lucide-react';
import { ProductAssetsPanel } from '@/components/content/ProductAssetsPanel';
import { HookLab } from '@/components/content/HookLab';
import { ToneSlider } from '@/components/content/ToneSlider';
import { SceneCard } from '@/components/content/SceneCard';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TEMPERATURE_DEFINITIONS, SIX_S_DEFINITIONS, PSYCHOLOGICAL_TRIGGER_DEFINITIONS } from '@/lib/six-s-constants';
import type { Temperature, PsychologicalTriggerId } from '@/lib/six-s-constants';
import { cn } from '@/lib/utils';
import { StepProgressLoader, GenerationStep } from '@/components/ui/StepProgressLoader';

// Step-based generation progress for scene script generation
const SCENE_GENERATION_STEPS: GenerationStep[] = [
    { id: "analyze", label: "Analyzing your hook selection" },
    { id: "hook", label: "Crafting attention-grabbing HOOK" },
    { id: "pain", label: "Building emotional PAIN points" },
    { id: "solution", label: "Presenting your SOLUTION" },
    { id: "cta", label: "Writing compelling CTA" },
    { id: "visuals", label: "Generating visual descriptions" },
];

export function ContentComposer() {
    const navigate = useNavigate();
    const { appState, setHeaderActions } = useApp();
    const { user } = useAuth();
    const {
        strategyContext,
        setStrategyContext,
        scriptBody,
        setScriptBody,
        regenerateContent,
        isRegenerating,
        visualMessengerState,
        setVisualMessengerState,
        campaignMode,
        directorsCutState,
        setDirectorsCutState,
        contentStrategyState
    } = useProjectStore();

    // Get temperature-aware strategy context
    const {
        selectedTemperature,
        temperatureStrategies,
        strategyCandidates,
        selectedCandidateId,
        selectedPsychologicalTriggerId,
        // New story strategy fields
        storyStrategies: rawStoryStrategies,
        selectedStoryStrategyId,
        selectedFrameworkId,
    } = contentStrategyState;

    // Defensive fallback for migration - handle undefined/null storyStrategies
    const storyStrategies = Array.isArray(rawStoryStrategies) ? rawStoryStrategies : [];
    const currentTemperatureStrategy = selectedTemperature ? temperatureStrategies[selectedTemperature] : null;

    // Get the selected story strategy (new flow)
    const selectedStoryStrategy = selectedStoryStrategyId
        ? storyStrategies.find(s => s.id === selectedStoryStrategyId)
        : null;

    // Gate: Redirect if no story strategy is selected
    useEffect(() => {
        // Give a moment for state to hydrate from localStorage
        const timer = setTimeout(() => {
            if (!selectedStoryStrategyId && storyStrategies.length === 0) {
                // No story strategy selected - redirect to Strategy page
                toast.error("Please select a Story Strategy first");
                navigate('/veritas/strategy');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedStoryStrategyId, storyStrategies.length, navigate]);

    // Use user's selected candidate, or fall back to AI recommended, or first
    const selectedCandidate = selectedCandidateId
        ? strategyCandidates.find(c => c.id === selectedCandidateId)
        : strategyCandidates.find(c => c.recommendation === 'recommended') || strategyCandidates[0];

    // Local scenes state that syncs with store
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

    // Step-based progress tracking for scene generation
    const [sceneStepIndex, setSceneStepIndex] = useState(0);
    const [sceneCompletedSteps, setSceneCompletedSteps] = useState<string[]>([]);

    // Animate step progress when regenerating with variable timing
    useEffect(() => {
        if (!isRegenerating) {
            // Reset when not regenerating
            setSceneStepIndex(0);
            setSceneCompletedSteps([]);
            return;
        }

        // Variable step timing to feel more realistic (longer for "heavier" tasks)
        const stepDurations = [
            2200,  // Step 1: Analyzing hook - medium
            3000,  // Step 2: Crafting HOOK - creative work
            3500,  // Step 3: Building PAIN - emotional depth
            3200,  // Step 4: Presenting SOLUTION - longer
            2800,  // Step 5: Writing CTA - medium
            // Step 6 (visuals) completes when API returns
        ];

        let currentStep = 0;
        const timeouts: NodeJS.Timeout[] = [];

        const advanceStep = () => {
            if (currentStep < stepDurations.length) {
                setSceneCompletedSteps(prev => [...prev, SCENE_GENERATION_STEPS[currentStep].id]);
                currentStep++;
                setSceneStepIndex(currentStep);

                if (currentStep < stepDurations.length) {
                    timeouts.push(setTimeout(advanceStep, stepDurations[currentStep]));
                }
            }
        };

        // Start the first step after initial delay
        timeouts.push(setTimeout(advanceStep, stepDurations[0]));

        return () => timeouts.forEach(t => clearTimeout(t));
    }, [isRegenerating]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initialize Store on Mount
    useEffect(() => {
        if (!appState.avatarData) {
            return;
        }

        // Get psychological trigger definition if selected
        const triggerDef = selectedPsychologicalTriggerId
            ? PSYCHOLOGICAL_TRIGGER_DEFINITIONS[selectedPsychologicalTriggerId as PsychologicalTriggerId]
            : null;

        // Construct Strategy Context from AppState + Strategy Selections
        const context = {
            avatarId: appState.avatarData.id,
            avatarName: appState.avatarData.name,
            strategySummary: appState.contentStudioStrategy?.framework?.name
                ? `${appState.contentStudioStrategy.framework.name}: ${appState.contentStudioStrategy.framework.reasoning}`
                : "General Viral Strategy",
            selectedAssets: (appState.selectedProductAssets || []).map(a => ({
                ...a,
                role: undefined,
                tags: []
            })) as Asset[],
            painPoints: Array.isArray(appState.contentStudioMarketIntel)
                ? appState.contentStudioMarketIntel.map((m: any) => m.text).slice(0, 3)
                : [],
            marketingStatements: appState.marketingStatements,
            // Full avatar context for grounding hook generation
            avatarContext: {
                occupation: appState.avatarData.occupation,
                age: appState.avatarData.age,
                gender: appState.avatarData.gender,
                pain_points: appState.avatarData.pain_points,
                dreams: appState.avatarData.dreams,
                daily_challenges: appState.avatarData.daily_challenges,
                buying_triggers: appState.avatarData.buying_triggers,
            },
            // AI Strategy page selections (flow through to Hook Lab)
            selectedStrategyCandidate: selectedCandidate ? {
                name: selectedCandidate.name,
                primarySixS: selectedCandidate.primarySixS,
                secondarySixS: selectedCandidate.secondarySixS,
                angle: selectedCandidate.angle,
                hookPreview: selectedCandidate.hookPreview || '',
            } : undefined,
            selectedTemperatureStrategy: currentTemperatureStrategy ? {
                temperature: selectedTemperature || 'cold',
                hooks: currentTemperatureStrategy.hooks.map(h => ({ text: h.text, angle: h.angle })),
                toneGuidance: currentTemperatureStrategy.toneGuidance || '',
            } : undefined,
            selectedPsychologicalTrigger: triggerDef ? {
                id: selectedPsychologicalTriggerId!,
                name: triggerDef.name,
                hookTemplate: triggerDef.hookTemplate,
            } : undefined,
            // NEW: Story Strategy (from the new flow)
            selectedStoryStrategy: selectedStoryStrategy ? {
                id: selectedStoryStrategy.id,
                name: selectedStoryStrategy.name,
                primarySixS: selectedStoryStrategy.primarySixS,
                secondarySixS: selectedStoryStrategy.secondarySixS,
                angle: selectedStoryStrategy.angle,
                hookPreview: selectedStoryStrategy.hookPreview,
                whyItWorks: selectedStoryStrategy.whyItWorks,
                basedOn: selectedStoryStrategy.basedOn,
            } : undefined,
            // NEW: Pain Synopsis for psychological depth
            painSynopsis: appState.contentStudioPainSynopsis ? {
                psychologicalProfile: {
                    coreDesire: appState.contentStudioPainSynopsis.psychologicalProfile?.coreDesire,
                    primaryEmotion: appState.contentStudioPainSynopsis.psychologicalProfile?.primaryEmotion,
                    currentState: appState.contentStudioPainSynopsis.psychologicalProfile?.currentState,
                    blockers: appState.contentStudioPainSynopsis.psychologicalProfile?.blockers,
                    idealOutcome: appState.contentStudioPainSynopsis.psychologicalProfile?.idealOutcome,
                },
                storyBeats: {
                    struggle: appState.contentStudioPainSynopsis.storyBeats?.struggle,
                    insight: appState.contentStudioPainSynopsis.storyBeats?.insight,
                    transformation: appState.contentStudioPainSynopsis.storyBeats?.transformation,
                },
            } : undefined,
            // NEW: Market Intelligence for urgency context
            marketIntelligence: appState.contentStudioMarketIntel ? {
                urgencyLevel: appState.contentStudioMarketIntel.sentiment?.urgency,
            } : undefined,
        };

        setStrategyContext(context);

        // Initialize Visual Messenger Default (Avatar)
        if (!visualMessengerState.currentUrl) {
            setVisualMessengerState({
                mode: 'avatar',
                currentUrl: appState.avatarData.photo_url
            });
        }

        // Initial Generation - Only if empty
        if (!scriptBody && !isRegenerating) {
            regenerateContent();
        }
    }, [appState.avatarData, appState.contentStudioStrategy, setStrategyContext, selectedCandidate, currentTemperatureStrategy, selectedPsychologicalTriggerId, selectedTemperature, selectedStoryStrategy]);

    // Sync scenes from store - only when store scenes are structurally different
    // This prevents overwriting local changes (like referenceImages) during re-renders
    useEffect(() => {
        const storeScenes = directorsCutState?.scenes || [];

        if (storeScenes.length > 0) {
            // Only update if scene IDs changed (new scenes from hook selection)
            // Don't overwrite if it's just a sync-back from our own setDirectorsCutState
            const currentIds = scenes.map(s => s.id).join(',');
            const storeIds = storeScenes.map(s => s.id).join(',');

            if (currentIds !== storeIds) {
                // Scene structure changed - use store scenes
                setScenes(storeScenes);
                if (!activeSceneId || !storeScenes.find(s => s.id === activeSceneId)) {
                    setActiveSceneId(storeScenes[0].id);
                }
            }
        } else if (scenes.length === 0 && !isRegenerating) {
            // No scenes yet - show default empty structure for user to understand the flow
            // These will be replaced when user selects a hook
            const defaultScenes: Scene[] = [
                { id: `scene_default_0`, label: 'HOOK', script: '', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined, durationEstimate: 3, status: 'draft', thumbnailCandidate: true },
                { id: `scene_default_1`, label: 'PAIN', script: '', speaker: campaignMode === 'transformation_narrative' ? 'mentee' : undefined, durationEstimate: 5, status: 'draft' },
                { id: `scene_default_2`, label: 'SOLUTION', script: '', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined, durationEstimate: 5, status: 'draft' },
                { id: `scene_default_3`, label: 'CTA', script: '', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined, durationEstimate: 3, status: 'draft' },
            ];
            setScenes(defaultScenes);
            setActiveSceneId(defaultScenes[0].id);
        }
    }, [directorsCutState?.scenes, campaignMode, isRegenerating]);

    // Sync scenes to store whenever they change
    useEffect(() => {
        if (scenes.length > 0) {
            setDirectorsCutState({ scenes });

            // Also update scriptBody for backward compatibility
            const combinedScript = scenes.map(s => s.script).filter(Boolean).join('\n\n');
            if (combinedScript !== scriptBody?.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n\n').trim()) {
                setScriptBody(combinedScript);
            }
        }
    }, [scenes]);

    // Scene handlers
    const handleSceneChange = useCallback((sceneId: string, updates: Partial<Scene>) => {
        setScenes(prev => prev.map(s => {
            if (s.id !== sceneId) return s;

            const updated = { ...s, ...updates };

            // Recalculate duration if script changed
            if (updates.script !== undefined) {
                const wordCount = updates.script.split(/\s+/).filter(Boolean).length;
                updated.durationEstimate = Math.max(3, Math.ceil(wordCount / 2.5));
            }

            // Handle ctaUrl update
            if (updates.ctaUrl !== undefined) {
                updated.ctaUrl = updates.ctaUrl;
            }

            return updated;
        }));
    }, []);

    const handleAddScene = useCallback(() => {
        const newScene: Scene = {
            id: `scene_${Date.now()}`,
            label: 'TRANSITION',
            script: '',
            speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined,
            durationEstimate: 3,
            status: 'draft'
        };
        setScenes(prev => [...prev, newScene]);
        setActiveSceneId(newScene.id);
        toast.success("New scene added");
    }, [campaignMode]);

    const handleDeleteScene = useCallback((sceneId: string) => {
        if (scenes.length <= 1) {
            toast.error("Cannot delete the last scene");
            return;
        }
        setScenes(prev => prev.filter(s => s.id !== sceneId));
        if (activeSceneId === sceneId) {
            setActiveSceneId(scenes.find(s => s.id !== sceneId)?.id || null);
        }
        toast.success("Scene deleted");
    }, [activeSceneId, scenes]);

    const handleNext = () => {
        const hasContent = scenes.some(s => s.script.trim().length > 0);
        if (!hasContent) {
            toast.error("Please add content to at least one scene.");
            return;
        }
        // Navigate to Director's Cut (NOT Thumbnail Composer - updated flow)
        navigate('/veritas/directors-cut');
    };

    const handleVisualMessengerChange = (mode: 'avatar' | 'user' | 'custom') => {
        if (mode === 'custom') {
            fileInputRef.current?.click();
            return;
        }

        let url = '';
        if (mode === 'avatar') url = appState.avatarData?.photo_url || '';
        if (mode === 'user') url = user?.photoURL || '';

        if (!url && mode === 'user') {
            toast.error("No profile photo found. Please upload one in Settings.");
            return;
        }

        setVisualMessengerState({ mode, currentUrl: url });
        toast.success(`Visual Messenger updated to: ${mode}`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setVisualMessengerState({ mode: 'custom', currentUrl: objectUrl });
            toast.success("Custom visual uploaded");
        }
    };

    // Calculate total duration
    const totalDuration = scenes.reduce((sum, s) => sum + s.durationEstimate, 0);

    // Inject header actions
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                    <p className="text-base font-mono text-foreground">{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</p>
                </div>
                <Button
                    onClick={handleNext}
                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:bg-primary/90"
                >
                    Next: Director's Cut <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );

        return () => setHeaderActions(null);
    }, [setHeaderActions, totalDuration, handleNext]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Sub-header */}
            <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/veritas/strategy')}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Film className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">Content Composer</h1>
                        <p className="text-base text-muted-foreground">Create your video script scene by scene</p>
                    </div>
                </div>

                {/* Temperature Context Badge */}
                {selectedTemperature && (
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg border",
                        TEMPERATURE_DEFINITIONS[selectedTemperature].bgColor,
                        TEMPERATURE_DEFINITIONS[selectedTemperature].borderColor
                    )}>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{TEMPERATURE_DEFINITIONS[selectedTemperature].emoji}</span>
                            <div>
                                <p className={cn(
                                    "text-base font-display font-semibold",
                                    TEMPERATURE_DEFINITIONS[selectedTemperature].color
                                )}>
                                    {TEMPERATURE_DEFINITIONS[selectedTemperature].label} Audience
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {TEMPERATURE_DEFINITIONS[selectedTemperature].ctaStyle}
                                </p>
                            </div>
                        </div>
                        {selectedCandidate && (
                            <div className="flex items-center gap-1 pl-3 border-l border-border/50">
                                <span className="text-base">{SIX_S_DEFINITIONS[selectedCandidate.primarySixS]?.icon}</span>
                                <span className="text-sm text-muted-foreground">
                                    {SIX_S_DEFINITIONS[selectedCandidate.primarySixS]?.label}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Product Assets Library */}
                <div className="w-72 border-r border-border bg-card/50 flex flex-col">
                    <ProductAssetsPanel />
                </div>

                {/* Main Panel: Scene Cards */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 pb-0">
                        {/* Context Header */}
                        {campaignMode === 'direct_authority' ? (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* Target Profile */}
                                <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center">
                                    <p className="text-sm text-muted-foreground font-medium uppercase mb-1">Target Profile Data</p>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-5 h-5 border border-border">
                                            <AvatarImage src={appState.avatarData?.photo_url} />
                                            <AvatarFallback>{appState.avatarData?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-base text-foreground font-medium truncate">{appState.avatarData?.name || "Loading..."}</p>
                                    </div>
                                </div>

                                {/* Visual Messenger */}
                                <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center">
                                    <p className="text-sm text-muted-foreground font-medium uppercase mb-1">Visual Messenger</p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 hover:bg-muted p-1 rounded transition-colors w-full">
                                                <Avatar className="w-6 h-6 border border-border">
                                                    <AvatarImage src={visualMessengerState.currentUrl} />
                                                    <AvatarFallback>VM</AvatarFallback>
                                                </Avatar>
                                                <span className="text-base text-foreground font-medium truncate flex-1 text-left">
                                                    {visualMessengerState.mode === 'avatar' ? 'Profile Data Photo' :
                                                        visualMessengerState.mode === 'user' ? 'My Account Photo' : 'Custom Visual'}
                                                </span>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-card border-border w-56">
                                            <DropdownMenuLabel>Select Face Source</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleVisualMessengerChange('avatar')} className="cursor-pointer">
                                                <Avatar className="w-4 h-4 mr-2"><AvatarImage src={appState.avatarData?.photo_url} /></Avatar>
                                                Use Profile Data Photo
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleVisualMessengerChange('user')} className="cursor-pointer">
                                                <User className="w-4 h-4 mr-2" />
                                                Use My Account Photo
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleVisualMessengerChange('custom')} className="cursor-pointer">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Custom Visual...
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                {/* Tone Slider */}
                                <ToneSlider />
                            </div>
                        ) : (
                            // Transformation Narrative Header
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* The Mentee */}
                                <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
                                    <p className="text-sm text-orange-400 font-medium uppercase mb-1 pl-2">The Mentee (Target)</p>
                                    <div className="flex items-center gap-2 pl-2">
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarImage src={appState.avatarData?.photo_url} />
                                            <AvatarFallback>{appState.avatarData?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="text-base text-foreground font-medium truncate">{appState.avatarData?.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">Experiencing Pain</p>
                                        </div>
                                    </div>
                                </div>

                                {/* The Guide */}
                                <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
                                    <p className="text-sm text-primary font-medium uppercase mb-1 pl-2">The Guide (You)</p>
                                    <div className="flex items-center gap-2 pl-2">
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarImage src={user?.photoURL || "https://github.com/shadcn.png"} />
                                            <AvatarFallback>YOU</AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="text-base text-foreground font-medium truncate">Your Identity</p>
                                            <p className="text-sm text-muted-foreground truncate">Providing Solution</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tone Slider */}
                                <ToneSlider />
                            </div>
                        )}
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                        {/* Temperature Strategy Guidance */}
                        {currentTemperatureStrategy && selectedTemperature && (
                            <div className={cn(
                                "p-4 rounded-xl border",
                                TEMPERATURE_DEFINITIONS[selectedTemperature].bgColor,
                                TEMPERATURE_DEFINITIONS[selectedTemperature].borderColor
                            )}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Thermometer className={cn("w-5 h-5", TEMPERATURE_DEFINITIONS[selectedTemperature].color)} />
                                        <h3 className={cn("font-display font-semibold", TEMPERATURE_DEFINITIONS[selectedTemperature].color)}>
                                            {TEMPERATURE_DEFINITIONS[selectedTemperature].label} Audience Guidance
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-sm",
                                        TEMPERATURE_DEFINITIONS[selectedTemperature].color,
                                        TEMPERATURE_DEFINITIONS[selectedTemperature].borderColor
                                    )}>
                                        {TEMPERATURE_DEFINITIONS[selectedTemperature].communicationFocus}
                                    </Badge>
                                </div>

                                {currentTemperatureStrategy.toneGuidance && (
                                    <p className="text-base text-muted-foreground mb-3">
                                        {currentTemperatureStrategy.toneGuidance}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-muted-foreground">Suggested CTAs:</span>
                                    {currentTemperatureStrategy.ctaOptions.slice(0, 4).map((cta, i) => (
                                        <Badge
                                            key={i}
                                            variant="outline"
                                            className={cn(
                                                "text-sm cursor-pointer hover:opacity-80 transition-opacity",
                                                TEMPERATURE_DEFINITIONS[selectedTemperature].color,
                                                TEMPERATURE_DEFINITIONS[selectedTemperature].borderColor
                                            )}
                                            onClick={() => {
                                                // Could copy to clipboard or auto-fill CTA scene
                                                toast.success(`CTA copied: "${cta.text}"`);
                                                navigator.clipboard.writeText(cta.text);
                                            }}
                                        >
                                            {cta.text}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hook Lab */}
                        <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl overflow-hidden shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
                            <HookLab />
                        </div>

                        {/* Scene Cards Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-display font-semibold text-foreground">Scene Timeline</h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                    onClick={handleAddScene}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Scene
                                </Button>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {scenes.map((scene, index) => (
                                    <SceneCard
                                        key={scene.id}
                                        id={scene.id}
                                        index={index}
                                        label={scene.label}
                                        script={scene.script}
                                        imagePrompt={scene.imagePrompt}
                                        speaker={scene.speaker}
                                        durationEstimate={scene.durationEstimate}
                                        showSpeaker={campaignMode === 'transformation_narrative'}
                                        ctaUrl={scene.ctaUrl}
                                        referenceImages={scene.referenceImages}
                                        availableAssets={strategyContext?.selectedAssets || []}
                                        onChange={(updates) => handleSceneChange(scene.id, updates)}
                                        onDelete={() => handleDeleteScene(scene.id)}
                                        isActive={activeSceneId === scene.id}
                                        onClick={() => setActiveSceneId(scene.id)}
                                    />
                                ))}
                            </AnimatePresence>

                            {scenes.length === 0 && !isRegenerating && (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                        <Film className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                                        Select a Hook Above
                                    </h3>
                                    <p className="text-lg text-muted-foreground mb-4 max-w-sm">
                                        Choose a hook from the Hook Lab to auto-generate your scene structure.
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        The AI will create a complete script with labeled scenes: <span className="text-primary">HOOK</span> → <span className="text-orange-400">PAIN</span> → <span className="text-emerald-400">SOLUTION</span> → <span className="text-primary">CTA</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Regenerating Overlay - Step-based Magic Moment */}
                        {isRegenerating && (
                            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="bg-card/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-8 shadow-[0_0_60px_-10px_rgba(79,209,255,0.3)]">
                                    <StepProgressLoader
                                        title="Generating Scene-by-Scene Script"
                                        subtitle="Creating your complete video script with visual descriptions"
                                        steps={SCENE_GENERATION_STEPS}
                                        currentStepIndex={sceneStepIndex}
                                        completedSteps={sceneCompletedSteps}
                                        completeTitle="Script Ready!"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
