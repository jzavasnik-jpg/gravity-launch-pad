'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GlassPanel } from "@/components/GlassPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Sparkles, Zap, ChevronRight, ChevronLeft, Loader2, TrendingUp, MessageSquare, Brain, ExternalLink, Copy, Check, RefreshCw, Trash2, CheckCircle, XCircle, Image as ImageIcon, Plus, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";
import { toast } from "sonner";
import { generatePainSynopsis, PainSynopsisResult } from "@/lib/pain-synopsis-api";
import { generateMarketIntelligence, MarketIntelligence, MarketQuote } from "@/lib/market-intel-api";
import { generateContentStrategy, StrategyRecommendation, regenerateTrigger } from "@/lib/strategy-api";
import { generateSlideDeck, getGoogleAccessToken, SlideData } from "@/lib/google-slides-api";
import { Presentation, Video } from "lucide-react";
import { generateAllPlatformContent, PlatformContent, PlatformContentVariant } from "@/lib/platform-content-api";
import { VideoGenerationModal } from "@/components/video/VideoGenerationModal";
import { AssetSelectorModal } from "@/components/assets/AssetSelectorModal";
import { generateContent, generateCompleteSlide } from "@/lib/image-gen-api";
import { saveSlideImage, type GeneratedSlide } from "@/lib/slide-storage";
import { createStoryboard, analyzeScreenshot, matchAssetsToScenes, type ScreenshotAnalysis } from "@/lib/storyboard-api";
import type { Asset } from "@/lib/asset-types";
import { createContentStudioSession, updateContentStudioSession, getLatestContentStudioSession, saveMediaLabAsset } from "@/lib/content-studio-service";
import { AVAILABLE_PLATFORMS, PLATFORM_CONSTRAINTS } from "@/lib/platform-templates";
import { ThumbnailCard } from "@/components/content/ThumbnailCard";
import { selectAvatarPhoto } from "@/lib/api";


type ContentStudioStage = 'synopsis' | 'intelligence' | 'strategy' | 'assets' | 'generation' | 'library';

export default function ContentStudio() {
    const router = useRouter();
    const {
        appState,
        setContentStudioPainSynopsis,
        setContentStudioMarketIntel,
        setContentStudioStrategy,
        setContentStudioPlatformContent,
        hydrateSessionData,
        setAvatarData,
        setMarketingStatements
    } = useApp();
    const { user, isEmailVerified, hasProAccess } = useAuth();
    const [currentStage, setCurrentStage] = useState<ContentStudioStage>('synopsis');
    const [loading, setLoading] = useState(false);

    // Use persisted data from context
    const [painSynopsis, setPainSynopsis] = useState<PainSynopsisResult | null>(
        appState.contentStudioPainSynopsis
    );

    const [marketIntel, setMarketIntel] = useState<MarketIntelligence | null>(
        appState.contentStudioMarketIntel
    );

    // AI strategy suggestions (load from persisted state)
    const [strategy, setStrategy] = useState<StrategyRecommendation | null>(
        appState.contentStudioStrategy
    );

    // Generated platform content (load from persisted state)
    const [platformContent, setPlatformContent] = useState<Record<string, PlatformContent>>({});
    const [generatedPlatforms, setGeneratedPlatforms] = useState<PlatformContent[]>(
        appState.contentStudioPlatformContent || []
    );
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showAssetSelector, setShowAssetSelector] = useState(false);
    const [pendingVariant, setPendingVariant] = useState<PlatformContentVariant | null>(null);
    const [pendingPlatformId, setPendingPlatformId] = useState<string>("");
    const [pendingGoogleToken, setPendingGoogleToken] = useState<string>("");
    const [currentPresentationId, setCurrentPresentationId] = useState("");
    const [currentScript, setCurrentScript] = useState("");
    const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlide[]>([]); // NEW: Generated slide images
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(AVAILABLE_PLATFORMS);
    const [generatingPlatforms, setGeneratingPlatforms] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [showAssetSelectionModal, setShowAssetSelectionModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Content Studio session persistence
    const [contentStudioSessionId, setContentStudioSessionId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);

    // Copy states
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    // Load Content Studio session on mount
    useEffect(() => {
        const loadSession = async () => {
            if (!user?.uid) {
                setLoadingSession(false);
                return;
            }

            console.log('[ContentStudio] Loading session for user:', user.uid);
            const session = await getLatestContentStudioSession(user.uid);

            if (session) {
                console.log('[ContentStudio] Session loaded:', session.id);
                setContentStudioSessionId(session.id!);

                // Load saved data
                if (session.pain_synopsis) {
                    console.log('[ContentStudio] Restoring Pain Synopsis');
                    setPainSynopsis(session.pain_synopsis);
                    setContentStudioPainSynopsis(session.pain_synopsis);
                }
                if (session.market_intel) {
                    console.log('[ContentStudio] Restoring Market Intel');
                    setMarketIntel(session.market_intel);
                    setContentStudioMarketIntel(session.market_intel);
                }
                if (session.ai_strategy) {
                    console.log('[ContentStudio] Restoring AI Strategy');
                    setStrategy(session.ai_strategy);
                    setContentStudioStrategy(session.ai_strategy);
                }
                if (session.platform_content) {
                    console.log('[ContentStudio] Restoring Platform Content');
                    setGeneratedPlatforms(session.platform_content);

                    // Convert array back to record for UI state
                    const contentRecord: Record<string, PlatformContent> = {};
                    session.platform_content.forEach((pc: PlatformContent) => {
                        contentRecord[pc.platform] = pc;
                    });
                    setPlatformContent(contentRecord);
                    setContentStudioPlatformContent(session.platform_content);
                }

                // Restore Context Data
                if (session.icp_data) {
                    console.log('[ContentStudio] Restoring ICP Data');
                    hydrateSessionData({
                        id: session.icp_data.sessionId,
                        answers: session.icp_data.answers,
                        current_question: session.icp_data.currentQuestion,
                        core_desire: session.icp_data.core_desire,
                        six_s: session.icp_data.six_s
                    });
                }


                if (session.avatar_data) {
                    console.log('[ContentStudio] Restoring Avatar Data');

                    // Validate and fix corrupted photo_url
                    let avatarData = session.avatar_data;

                    // Handle case where avatarData is a string (corrupted)
                    if (typeof avatarData === 'string') {
                        console.warn('[ContentStudio] Corrupted avatar data (string detected):', avatarData);
                        avatarData = { photo_url: null }; // Reset to object
                        toast.error("Avatar data was corrupted and has been reset. Please re-select your avatar if needed.");
                    }

                    if (avatarData && avatarData.photo_url && (
                        !avatarData.photo_url.startsWith('/') ||
                        avatarData.photo_url.includes(' ') ||
                        !avatarData.photo_url.match(/\.(jpg|jpeg|png|webp)$/i) ||
                        avatarData.photo_url.length > 100
                    )) {
                        console.warn('[ContentStudio] Corrupted avatar URL detected:', avatarData.photo_url);
                        if (avatarData.age && avatarData.gender) {
                            const newPhoto = selectAvatarPhoto(avatarData.age, avatarData.gender);
                            avatarData.photo_url = newPhoto.photoUrl;
                            console.log('[ContentStudio] Fixed avatar URL to:', avatarData.photo_url);
                            toast.success("Repaired corrupted avatar data");
                        } else {
                            avatarData.photo_url = null;
                        }
                    }

                    setAvatarData(avatarData);
                }
                if (session.marketing_statements) {
                    console.log('[ContentStudio] Restoring Marketing Statements');
                    setMarketingStatements(session.marketing_statements);
                }
                if (session.selected_assets) {
                    console.log('[ContentStudio] Restoring Selected Assets');
                    setSelectedAssets(session.selected_assets);
                }
                if (session.platform_content && session.platform_content.length > 0) {
                    console.log('[ContentStudio] Restoring Platform Content');
                    setGeneratedPlatforms(session.platform_content);
                    // Convert array back to record for state
                    const contentRecord: Record<string, PlatformContent> = {};
                    session.platform_content.forEach((pc: PlatformContent) => {
                        contentRecord[pc.platform] = pc;
                    });
                    setPlatformContent(contentRecord);
                }

                // Auto-advance stage based on data
                if (session.platform_content && session.platform_content.length > 0) {
                    setCurrentStage('generation');
                } else if (session.ai_strategy) {
                    setCurrentStage('strategy');
                } else if (session.market_intel) {
                    setCurrentStage('intelligence');
                } else if (session.pain_synopsis) {
                    setCurrentStage('intelligence'); // Go to next step after synopsis
                }
            } else {
                // Create new session
                console.log('[ContentStudio] Creating new session');
                const newSessionId = await createContentStudioSession(user.uid);
                if (newSessionId) {
                    setContentStudioSessionId(newSessionId);
                }
            }

            setLoadingSession(false);
        };

        loadSession();
    }, [user?.uid, setContentStudioPainSynopsis, setContentStudioMarketIntel, setContentStudioStrategy, setContentStudioPlatformContent]);

    // Auto-save when data changes
    useEffect(() => {
        if (!contentStudioSessionId || loadingSession) return;

        console.log('[ContentStudio] Auto-saving session data...');

        // Sanitize platform content to remove large base64 images (Firestore 1MB limit)
        const sanitizedPlatforms = generatedPlatforms.map(p => ({
            ...p,
            variants: p.variants.map(v => ({
                ...v,
                thumbnailUrl: v.thumbnailUrl?.startsWith('data:') ? null : v.thumbnailUrl
            }))
        }));

        updateContentStudioSession(contentStudioSessionId, {
            pain_synopsis: painSynopsis || null,
            market_intel: marketIntel || null,
            ai_strategy: strategy || null,
            platform_content: sanitizedPlatforms || [],
            icp_data: {
                ...appState.gravityICP,
                sessionId: appState.sessionId || null,
                core_desire: appState.selectedCoreDesire || null,
                six_s: appState.selectedSixS || null
            },
            avatar_data: appState.avatarData || null,
            marketing_statements: appState.marketingStatements || null,
            selected_assets: selectedAssets || []
        });
    }, [
        painSynopsis,
        marketIntel,
        strategy,
        generatedPlatforms,
        contentStudioSessionId,
        loadingSession,
        appState.gravityICP,
        appState.avatarData,
        appState.marketingStatements,
        appState.sessionId,
        appState.selectedCoreDesire,
        appState.selectedSixS,
        selectedAssets
    ]);

    // Sync local state to context for persistence (backwards compatibility)
    useEffect(() => {
        if (painSynopsis) {
            setContentStudioPainSynopsis(painSynopsis);
        }
    }, [painSynopsis, setContentStudioPainSynopsis]);

    useEffect(() => {
        if (marketIntel) {
            setContentStudioMarketIntel(marketIntel);
        }
    }, [marketIntel, setContentStudioMarketIntel]);

    const stages = [
        { id: 'synopsis', label: 'Pain Synopsis', completed: !!painSynopsis },
        { id: 'intelligence', label: 'Market Intel', completed: !!marketIntel },
        { id: 'strategy', label: 'AI Strategy', completed: !!strategy },
        { id: 'assets', label: 'Product Assets', completed: selectedAssets.length > 0 },
        { id: 'generation', label: 'Content', completed: Object.keys(platformContent).length > 0 },
        { id: 'library', label: 'Library', completed: false }
    ];

    const currentStageIndex = stages.findIndex(s => s.id === currentStage);

    const handleNextStage = () => {
        const nextIndex = currentStageIndex + 1;
        if (nextIndex < stages.length) {
            setCurrentStage(stages[nextIndex].id as ContentStudioStage);
        }
    };

    const handlePreviousStage = () => {
        const prevIndex = currentStageIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStage(stages[prevIndex].id as ContentStudioStage);
        }
    };

    // Generate detailed pain narrative from all ICP data
    const generateDetailedPainSynopsis = async () => {
        setLoading(true);
        try {
            const avatarName = appState.avatarData?.name || appState.avatarDataList[0]?.name;

            const result = await generatePainSynopsis(
                appState.gravityICP.answers,
                appState.selectedCoreDesire?.name,
                appState.selectedSixS?.name,
                avatarName  // Pass avatar name
            );

            setPainSynopsis(result);
            toast.success("Detailed pain synopsis generated!");
        } catch (error) {
            console.error('Error generating synopsis:', error);
            toast.error("Failed to generate synopsis");
        } finally {
            setLoading(false);
        }
    };

    // Generate market intelligence
    const generateMarketIntel = async () => {
        if (!painSynopsis) {
            toast.error("Please generate pain synopsis first");
            return;
        }

        setLoading(true);
        try {
            const result = await generateMarketIntelligence(
                appState.gravityICP.answers[0] || '', // Pain points
                appState.gravityICP.answers[1] || '', // Target audience
                appState.gravityICP.answers[8] || '', // Problem
                15 // 15 quotes as specified
            );

            setMarketIntel(result);
            toast.success("Market intelligence gathered!");
        } catch (error) {
            console.error('Error generating market intelligence:', error);
            toast.error("Failed to gather market intelligence");
        } finally {
            setLoading(false);
        }
    };

    // Generate AI strategy recommendations
    const generateStrategy = async () => {
        if (!painSynopsis || !marketIntel) {
            toast.error("Please generate pain synopsis and market intelligence first");
            return;
        }

        setLoading(true);
        try {
            const result = await generateContentStrategy(
                painSynopsis,
                marketIntel,
                appState.marketingStatements
            );

            setStrategy(result);
            setContentStudioStrategy(result); // Persist to context
            toast.success("AI strategy generated!");
            handleNextStage();
        } catch (error) {
            console.error('Error generating strategy:', error);
            toast.error("Failed to generate strategy");
        } finally {
            setLoading(false);
        }
    };

    // Generate platform-specific content
    const generatePlatforms = async () => {
        if (!strategy || !painSynopsis) {
            toast.error("Please generate strategy first");
            return;
        }

        setGeneratingPlatforms(true);
        try {
            const productName = appState.gravityICP.answers[9] || "your product";
            const results = await generateAllPlatformContent(
                selectedPlatforms,
                strategy,
                painSynopsis,
                productName,
                selectedAssets
            );

            setPlatformContent(results);
            const platformsArray = Object.values(results);
            setGeneratedPlatforms(platformsArray); // Update local state for auto-save
            setContentStudioPlatformContent(platformsArray); // Persist to context
            toast.success(`Generated content for ${selectedPlatforms.length} platforms!`);
        } catch (error) {
            console.error('Error generating platform content:', error);
            toast.error("Failed to generate platform content");
        } finally {
            setGeneratingPlatforms(false);
        }
    };

    // Helper functions
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedContent(label);
            toast.success(`${label} copied!`);
            setTimeout(() => setCopiedContent(null), 2000);
        } catch (error) {
            toast.error("Failed to copy");
        }
    };

    const handleRegenerateTrigger = async (triggerIndex: number) => {
        if (!strategy || !painSynopsis || !marketIntel) return;

        setLoading(true);
        try {
            const currentTrigger = strategy.triggers[triggerIndex];
            const newTrigger = await regenerateTrigger(
                currentTrigger.name,
                painSynopsis,
                marketIntel
            );

            const updatedTriggers = [...strategy.triggers];
            updatedTriggers[triggerIndex] = newTrigger;

            setStrategy({
                ...strategy,
                triggers: updatedTriggers
            });

            toast.success("Trigger regenerated!");
        } catch (error) {
            console.error('Error regenerating trigger:', error);
            toast.error("Failed to regenerate trigger");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSlides = (variant: PlatformContentVariant, platformId: string) => {
        // No Google auth needed - we're using Gemini directly!
        setPendingVariant(variant);
        setPendingPlatformId(platformId);
        setShowAssetSelector(true);
    };

    const handleAssetsSelected = async (assets: Asset[]) => {
        if (!pendingVariant || !pendingPlatformId) {
            toast.error("Session expired. Please try again.");
            return;
        }

        const variant = pendingVariant;
        const platformId = pendingPlatformId;
        const progressId = "video-storyboard";
        const presentationId = `${platformId}_${Date.now()}`;

        try {
            // Step 1: AI Storyboarding
            toast.loading("🎬 Analyzing script and creating storyboard...", { id: progressId });
            const storyboard = await createStoryboard(
                variant.content,
                platformId,
                assets,
                {
                    icpAnswers: appState.gravityICP.answers,
                    painSynopsis: painSynopsis || undefined,
                    marketingStatements: appState.marketingStatements
                }
            );
            console.log("Storyboard created:", storyboard);

            // Step 2: Analyze Screenshots (if any)
            const screenshots = assets.filter(a => a.asset_type === 'screenshot');
            const screenshotAnalyses: ScreenshotAnalysis[] = [];

            if (screenshots.length > 0) {
                toast.loading(`🔍 Understanding your screenshots... (0/${screenshots.length})`, { id: progressId });

                for (let i = 0; i < screenshots.length; i++) {
                    const screenshot = screenshots[i];
                    if (screenshot.storage_url) {
                        try {
                            const analysis = await analyzeScreenshot(screenshot.storage_url, screenshot.id);
                            screenshotAnalyses.push(analysis);
                            toast.loading(`🔍 Understanding your screenshots... (${i + 1}/${screenshots.length})`, { id: progressId });
                        } catch (e) {
                            console.error("Screenshot analysis failed", e);
                        }
                    }
                }
            }

            // Step 3: Match Assets to Scenes
            toast.loading("🎯 Matching assets to scenes...", { id: progressId });
            const matchedScenes = matchAssetsToScenes(storyboard, assets, screenshotAnalyses);
            console.log("Matched scenes:", matchedScenes);

            // Step 4: Generate Complete Slide Images with Gemini
            const slideImages: GeneratedSlide[] = [];

            // Determine aspect ratio based on platform
            const verticalPlatforms = ['youtube', 'tiktok', 'instagram'];
            const aspectRatio: 'landscape' | 'portrait' = verticalPlatforms.includes(platformId.toLowerCase()) ? 'portrait' : 'landscape';

            // Extract avatar/character description from ICP
            const avatarDescription = painSynopsis?.avatar_synthesis?.description || undefined;

            for (let i = 0; i < matchedScenes.length; i++) {
                const scene = matchedScenes[i];
                toast.loading(`✨ Creating slide ${i + 1}/${matchedScenes.length} with Gemini...`, { id: progressId });

                try {
                    // Generate COMPLETE slide image (text + visuals in one!)
                    const base64Image = await generateCompleteSlide(
                        scene.visualDescription,
                        scene.scriptText,
                        storyboard.visualTheme,
                        avatarDescription,
                        aspectRatio
                    );

                    // Save to Firebase Storage
                    const imageUrl = await saveSlideImage(base64Image, scene.sceneNumber, presentationId);

                    slideImages.push({
                        sceneNumber: scene.sceneNumber,
                        imageUrl,
                        scriptText: scene.scriptText,
                        visualDescription: scene.visualDescription
                    });
                } catch (e) {
                    console.error(`Failed to generate slide for scene ${i}`, e);
                    toast.error(`Failed to generate scene ${i + 1}: ${(e as Error).message}`, { id: progressId, duration: 3000 });
                }
            }

            // Step 5: Success - Show slides
            setCurrentPresentationId(presentationId);
            setGeneratedSlides(slideImages);
            toast.dismiss(progressId);
            toast.success(`✅ Created ${slideImages.length} stunning slides! Ready to animate.`, { duration: 4000 });

            // Open video modal for animation
            setCurrentScript(variant.content);
            setShowVideoModal(true);
        } catch (error: any) {
            console.error(error);
            toast.dismiss(progressId);
            toast.error(`Failed to generate slides: ${error.message || 'Unknown error'}`);
        }
    };

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platformId]);
        }
    };

    const getSentimentBadge = (intensity: number) => {
        if (intensity >= 8) return <Badge className="bg-red-500">High Pain</Badge>;
        if (intensity >= 5) return <Badge className="bg-yellow-500">Medium Pain</Badge>;
        return <Badge className="bg-green-500">Low Pain</Badge>;
    };

    // Six S color mapping for emotional tags
    const getEmotionColor = (category: string) => {
        switch (category) {
            case 'Significance': return 'border-purple-400';
            case 'Safe': return 'border-blue-400';
            case 'Supported': return 'border-green-400';
            case 'Successful': return 'border-yellow-400';
            case 'Surprise & Delight': return 'border-pink-400';
            case 'Sharing': return 'border-cyan-400';
            default: return 'border-primary';
        }
    };

    // Helper function to navigate to Media Lab with data
    const navigateToMediaLab = (variant: PlatformContentVariant, platformId: string) => {
        const projectData = {
            script: variant.content,
            hook: variant.hook,
            platform: platformId,
            thumbnails: variant.thumbnailUrl ? [{
                id: Date.now().toString(),
                url: variant.thumbnailUrl,
                title: 'Generated Thumbnail',
                ctr: 0
            }] : []
        };

        // Store in sessionStorage for Media Lab to read
        sessionStorage.setItem('mediaLabProjectData', JSON.stringify(projectData));

        // Save to Firestore (Media Lab collection)
        if (user?.uid && variant.thumbnailUrl) {
            toast.promise(saveMediaLabAsset(user.uid, {
                type: 'thumbnail',
                platform: platformId,
                title: variant.hook || 'Viral Thumbnail',
                url: variant.thumbnailUrl,
                script: variant.content
            }), {
                loading: 'Saving to Media Lab...',
                success: 'Saved to Media Lab!',
                error: 'Failed to save to Media Lab'
            });
        }

        router.push('/media-lab');
        toast.success("Pushed to Media Lab!");
    };

    return (
        <>

            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Email Verification Alert */}
                    {!isEmailVerified && user?.email && (
                        <EmailVerificationAlert email={user.email} />
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-4xl font-bold font-display text-g-heading">
                                    Content Studio
                                </h1>
                                {hasProAccess && (
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-g-text-inverse">
                                        <Zap className="w-3 h-3 mr-1" />
                                        PRO
                                    </Badge>
                                )}
                            </div>
                            <p className="text-g-muted font-sans">
                                AI-powered content creation from customer insights to multi-platform optimization
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>

                    {/* Progress Indicator */}
                    <GlassPanel>
                        <div className="flex items-center justify-between">
                            {stages.map((stage, index) => (
                                <React.Fragment key={stage.id}>
                                    <div
                                        className={`flex items - center gap - 2 cursor - pointer ${currentStage === stage.id ? 'opacity-100' : 'opacity-50'
                                            } `}
                                        onClick={() => setCurrentStage(stage.id as ContentStudioStage)}
                                    >
                                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center ${stage.completed
                                            ? 'bg-green-500 text-white'
                                            : currentStage === stage.id
                                                ? 'bg-g-accent text-white'
                                                : 'bg-g-muted text-g-text'
                                            } `}>
                                            {stage.completed ? '✓' : index + 1}
                                        </div>
                                        <span className="font-medium text-sm">{stage.label}</span>
                                    </div>
                                    {index < stages.length - 1 && (
                                        <ChevronRight className="w-5 h-5 text-g-muted" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </GlassPanel>

                    {/* Stage 1: Pain Synopsis */}
                    {currentStage === 'synopsis' && (
                        <GlassPanel>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Avatar Psychological Profile</h2>
                                    <p className="text-g-muted">
                                        AI creates a comprehensive psychological profile using all ICP discovery data
                                    </p>
                                </div>

                                {!painSynopsis ? (
                                    <div className="text-center py-12">
                                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                                        <h3 className="text-xl font-semibold mb-2">Generate Detailed Synopsis</h3>
                                        <p className="text-g-muted mb-6">
                                            Transform all ICP answers into a vivid psychological profile
                                        </p>
                                        <Button
                                            onClick={generateDetailedPainSynopsis}
                                            disabled={loading}
                                            variant="gradient"
                                            size="lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="w-4 h-4 mr-2" />
                                                    Generate Profile
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Narrative */}
                                        <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                                            <h3 className="text-lg font-semibold mb-3">Customer Narrative</h3>
                                            <p className="text-lg leading-relaxed whitespace-pre-line">{painSynopsis.narrative}</p>
                                        </div>

                                        {/* Psychological Profile Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">Core Desire</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.psychologicalProfile.coreDesire}</p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">Primary Emotion</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.psychologicalProfile.primaryEmotion}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="md:col-span-2">
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">Current State</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.psychologicalProfile.currentState}</p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">Key Blockers</h4>
                                                    <ul className="text-sm text-g-text space-y-1">
                                                        {painSynopsis.psychologicalProfile.blockers.map((blocker, i) => (
                                                            <li key={i}>• {blocker}</li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">Ideal Outcome</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.psychologicalProfile.idealOutcome}</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Story Beats */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="border-l-4 border-red-500">
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">📉 Struggle</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.storyBeats.struggle}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-l-4 border-yellow-500">
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">💡 Insight</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.storyBeats.insight}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-l-4 border-green-500">
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-2 text-g-heading">🚀 Transformation</h4>
                                                    <p className="text-sm text-g-text">{painSynopsis.storyBeats.transformation}</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                            <Button variant="outline" onClick={generateDetailedPainSynopsis} disabled={loading}>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Regenerate
                                            </Button>
                                            <Button onClick={handleNextStage} variant="gradient">
                                                Continue to Market Intelligence
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassPanel>
                    )}

                    {/* Stage 2: Market Intelligence */}
                    {currentStage === 'intelligence' && (
                        <GlassPanel>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Market Intelligence</h2>
                                    <p className="text-g-muted">
                                        AI agents gather real consumer sentiment from Reddit, Quora, and People Also Ask
                                    </p>
                                </div>

                                {!marketIntel ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                                        <h3 className="text-xl font-semibold mb-2">Gather Market Intelligence</h3>
                                        <p className="text-g-muted mb-6">
                                            AI will analyze 15 real YouTube comments to validate your market
                                        </p>
                                        <Button
                                            onClick={generateMarketIntel}
                                            disabled={loading || !painSynopsis}
                                            variant="gradient"
                                            size="lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Gathering Intelligence...
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp className="w-4 h-4 mr-2" />
                                                    Generate Market Intel
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* AI Reasoning */}
                                        <Card className="bg-blue-500/10 border-blue-500/30">
                                            <CardContent className="pt-6">
                                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                                    <Brain className="w-5 h-5" />
                                                    AI Reasoning
                                                </h3>
                                                <p className="text-sm text-g-text">{marketIntel.aiReasoning}</p>
                                            </CardContent>
                                        </Card>

                                        {/* Sentiment Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <h4 className="text-sm font-medium text-g-muted mb-2">Pain Intensity</h4>
                                                    <div className="text-3xl font-bold text-g-heading mb-2">{marketIntel.sentiment.painIntensity}/10</div>
                                                    {getSentimentBadge(marketIntel.sentiment.painIntensity)}
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <h4 className="text-sm font-medium text-g-muted mb-2">Urgency</h4>
                                                    <div className="text-2xl font-bold text-g-heading capitalize">{marketIntel.sentiment.urgency}</div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <h4 className="text-sm font-medium text-g-muted mb-2">Market Maturity</h4>
                                                    <div className="text-2xl font-bold text-g-heading capitalize">{marketIntel.sentiment.marketMaturity}</div>
                                                </CardContent>
                                            </Card>

                                            <Card className="md:col-span-1">
                                                <CardContent className="pt-6">
                                                    <h4 className="text-sm font-medium text-g-muted mb-2">Top Emotions</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {marketIntel.sentiment.topEmotions.map((emotion, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{emotion}</Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Market Quotes */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                                                <span>Consumer Quotes ({marketIntel.quotes.length})</span>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline">Reddit: {marketIntel.quotes.filter(q => q.source === 'reddit').length}</Badge>
                                                    <Badge variant="outline">Quora: {marketIntel.quotes.filter(q => q.source === 'quora').length}</Badge>
                                                    <Badge variant="outline">PAA: {marketIntel.quotes.filter(q => q.source === 'paa').length}</Badge>
                                                </div>
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                                                {marketIntel.quotes.map((quote) => (
                                                    <Card key={quote.id} className={`border - l - 4 ${getEmotionColor(quote.emotionalTone)} `}>
                                                        <CardContent className="pt-4">
                                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-xs">{quote.source}</Badge>
                                                                    <Badge className="text-xs capitalize">{quote.emotionalTone}</Badge>
                                                                    {quote.relevanceScore && (
                                                                        <Badge variant="outline" className="text-xs">{quote.relevanceScore}% match</Badge>
                                                                    )}
                                                                </div>
                                                                {quote.upvotes && (
                                                                    <span className="text-sm text-g-muted">↑ {quote.upvotes}</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-g-text mb-2">"{quote.text}"</p>
                                                            <div className="flex items-center gap-2 text-xs text-g-muted">
                                                                {quote.author && <span>— {quote.author}</span>}
                                                                {quote.subreddit && <span>in {quote.subreddit}</span>}
                                                                {quote.timestamp && <span>• {quote.timestamp}</span>}
                                                                {quote.url && (
                                                                    <a href={quote.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-g-accent hover:underline">
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        View
                                                                    </a>
                                                                )}

                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Language Patterns */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-3 text-g-heading">Common Phrases</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {marketIntel.languagePatterns.commonPhrases.map((phrase, i) => (
                                                            <Badge key={i} variant="secondary">{phrase}</Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-3 text-g-heading">Emotional Triggers</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {marketIntel.languagePatterns.emotionalTriggers.map((trigger, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-orange-500/20">{trigger}</Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold mb-3 text-g-heading">Objections</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {marketIntel.languagePatterns.objections.map((objection, i) => (
                                                            <Badge key={i} variant="secondary" className="bg-red-500/20">{objection}</Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="flex gap-3 justify-between">
                                            <Button variant="outline" onClick={handlePreviousStage}>
                                                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                                Back
                                            </Button>
                                            <div className="flex gap-3">
                                                <Button variant="outline" onClick={generateMarketIntel} disabled={loading}>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Regenerate
                                                </Button>
                                                <Button onClick={handleNextStage} variant="gradient">
                                                    Continue to AI Strategy
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div >
                        </GlassPanel >
                    )
                    }

                    {/* Strategy Stage */}
                    {
                        currentStage === 'strategy' && (
                            <GlassPanel>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                                <Brain className="w-6 h-6" />
                                                AI Content Strategy
                                            </h2>
                                            <p className="text-g-muted">
                                                AI-recommended framework and psychological triggers based on your market intelligence
                                            </p>
                                        </div>
                                    </div>

                                    {!strategy ? (
                                        <div className="text-center py-12">
                                            <div className="max-w-md mx-auto">
                                                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                                                <h3 className="text-xl font-semibold mb-2">Generate AI Strategy</h3>
                                                <p className="text-g-muted mb-6">
                                                    Let AI analyze your pain synopsis and market intelligence to recommend the perfect content framework and psychological triggers
                                                </p>
                                                <Button
                                                    onClick={generateStrategy}
                                                    disabled={loading}
                                                    variant="gradient"
                                                    className="gap-2"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4" />
                                                            Generate AI Strategy
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Recommended Framework */}
                                            <Card className="border-purple-400/30 bg-purple-500/5">
                                                <CardContent className="pt-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <Badge className="bg-purple-500 mb-2">Recommended Framework</Badge>
                                                            <h3 className="text-xl font-bold text-g-heading">{strategy.framework.name}</h3>
                                                        </div>
                                                        <Badge variant="outline" className="text-green-400 border-green-400">
                                                            {strategy.framework.marketFit}% Market Fit
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Why This Framework:</h4>
                                                            <p className="text-g-muted">{strategy.framework.reasoning}</p>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold mb-2">Content Structure:</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                {strategy.framework.structure.map((step, i) => (
                                                                    <div key={i} className="p-3 rounded-lg bg-g-hover">
                                                                        <span className="text-xs text-purple-400 font-semibold">Step {i + 1}</span>
                                                                        <p className="text-sm mt-1">{step}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold mb-2">Example Hook:</h4>
                                                            <div className="p-4 rounded-lg bg-g-hover relative group">
                                                                <p className="italic text-g-muted">&ldquo;{strategy.framework.examples[0]}&rdquo;</p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                                                    onClick={() => copyToClipboard(strategy.framework.examples[0], "Hook")}
                                                                >
                                                                    {copiedContent === "Hook" ? (
                                                                        <Check className="w-4 h-4" />
                                                                    ) : (
                                                                        <Copy className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold mb-2">Recommended CTA:</h4>
                                                            <div className="p-4 rounded-lg bg-g-hover relative group">
                                                                <p className="font-medium">{strategy.suggestedCTA}</p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                                                    onClick={() => copyToClipboard(strategy.suggestedCTA, "CTA")}
                                                                >
                                                                    {copiedContent === "CTA" ? (
                                                                        <Check className="w-4 h-4" />
                                                                    ) : (
                                                                        <Copy className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Psychological Triggers */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-yellow-400" />
                                                    Psychological Triggers ({strategy.triggers.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {strategy.triggers.map((trigger, index) => (
                                                        <Card key={index} className="relative group">
                                                            <CardContent className="pt-6">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <Badge variant="secondary">{trigger.name}</Badge>
                                                                    <div className="flex gap-1">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {trigger.relevanceScore}%
                                                                        </Badge>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                                            onClick={() => handleRegenerateTrigger(index)}
                                                                            disabled={loading}
                                                                        >
                                                                            <RefreshCw className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <p className="text-sm text-g-muted mb-3">{trigger.description}</p>

                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-g-muted mb-1">Hook:</p>
                                                                        <p className="text-sm italic">&ldquo;{trigger.hook}&rdquo;</p>
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-xs font-semibold text-g-muted mb-1">Market Evidence:</p>
                                                                        <p className="text-xs text-g-muted">{trigger.marketEvidence}</p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation */}
                                            <div className="flex gap-3 justify-between">
                                                <Button variant="outline" onClick={handlePreviousStage}>
                                                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                                    Back
                                                </Button>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" onClick={generateStrategy} disabled={loading}>
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        Regenerate
                                                    </Button>
                                                    <Button onClick={handleNextStage} variant="gradient">
                                                        Continue to Content Generation
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassPanel>
                        )
                    }

                    {/* Stage 4: Product Assets */}
                    {currentStage === 'assets' && (
                        <GlassPanel>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Product Assets</h2>
                                    <p className="text-g-muted">
                                        Select product images or screenshots to give the AI visual context.
                                        This helps generate more accurate scripts and thumbnails.
                                    </p>
                                </div>

                                {selectedAssets.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-g-muted/20 rounded-lg">
                                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                                        <h3 className="text-xl font-semibold mb-2">No Assets Selected</h3>
                                        <p className="text-g-muted mb-6">
                                            Add product visuals to enhance your content generation.
                                        </p>
                                        <Button
                                            onClick={() => setShowAssetSelectionModal(true)}
                                            className="bg-g-accent hover:bg-g-accent/90"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Select Assets
                                        </Button>
                                        <div className="mt-4">
                                            <Button
                                                variant="ghost"
                                                onClick={handleNextStage}
                                                className="text-g-muted hover:text-g-text"
                                            >
                                                Skip for now
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {selectedAssets.map((asset) => (
                                                <div key={asset.id} className="relative group aspect-square rounded-lg overflow-hidden border border-g-border bg-black/20">
                                                    <img
                                                        src={asset.storage_url}
                                                        alt={asset.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id))}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-xs text-white truncate">
                                                        {asset.name}
                                                    </div>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => setShowAssetSelectionModal(true)}
                                                className="aspect-square rounded-lg border-2 border-dashed border-g-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-g-accent/50 hover:bg-g-accent/5 transition-colors"
                                            >
                                                <Plus className="w-8 h-8 text-g-muted mb-2" />
                                                <span className="text-sm text-g-muted">Add More</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t border-g-border">
                                            <Button
                                                onClick={handleNextStage}
                                                className="bg-g-accent hover:bg-g-accent/90"
                                            >
                                                Continue to Content
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassPanel>
                    )}

                    {/* Platform Content Generation Stage */}
                    {
                        currentStage === 'generation' && (
                            <GlassPanel>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                                <Sparkles className="w-6 h-6" />
                                                Platform Content Generation
                                            </h2>
                                            <p className="text-g-muted">
                                                Generate optimized content for 7 different platforms
                                            </p>
                                        </div>
                                        {hasProAccess && <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">PRO</Badge>}
                                    </div>

                                    {!hasProAccess ? (
                                        <Card className="border-purple-400/30 bg-purple-500/5">
                                            <CardContent className="pt-6 text-center py-12">
                                                <Zap className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                                                <h3 className="text-xl font-semibold mb-2">PRO Feature</h3>
                                                <p className="text-g-muted mb-6">
                                                    Upgrade to PRO to generate platform-optimized content for YouTube Shorts, Twitter, LinkedIn, Reddit, Facebook, Instagram, and TikTok.
                                                </p>
                                                <Button variant="gradient">
                                                    Upgrade to PRO
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Platform Selection */}
                                            {Object.keys(platformContent).length === 0 && (
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <h3 className="font-semibold mb-4">Select Platforms</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {AVAILABLE_PLATFORMS.map((platformId) => {
                                                                const constraints = PLATFORM_CONSTRAINTS[platformId];
                                                                const isSelected = selectedPlatforms.includes(platformId);
                                                                return (
                                                                    <button
                                                                        key={platformId}
                                                                        onClick={() => togglePlatform(platformId)}
                                                                        className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                                                            ? 'border-purple-400 bg-purple-500/10'
                                                                            : 'border-g-border hover:border-g-muted'
                                                                            } `}
                                                                    >
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-lg">{constraints.icon}</span>
                                                                            <span className="font-semibold text-sm capitalize">{platformId}</span>
                                                                        </div>
                                                                        <span className="text-xs text-g-muted">{constraints.toneGuidelines}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="mt-6 text-center">
                                                            <Button
                                                                onClick={generatePlatforms}
                                                                disabled={generatingPlatforms || selectedPlatforms.length === 0}
                                                                variant="gradient"
                                                                className="gap-2"
                                                            >
                                                                {generatingPlatforms ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Generating for {selectedPlatforms.length} platforms...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles className="w-4 h-4" />
                                                                        Generate Content ({selectedPlatforms.length} platforms)
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Generated Content Display */}
                                            {Object.keys(platformContent).length > 0 && (
                                                <div className="space-y-6">
                                                    {Object.entries(platformContent).map(([platformId, content]) => {
                                                        const constraints = PLATFORM_CONSTRAINTS[platformId];
                                                        if (!constraints) return null;
                                                        return (
                                                            <Card key={platformId} className="border-purple-400/20">
                                                                <CardContent className="pt-6">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-2xl">{constraints.icon}</span>
                                                                            <div>
                                                                                <h3 className="font-bold text-lg capitalize">{platformId}</h3>
                                                                                <p className="text-xs text-g-muted">{constraints.toneGuidelines}</p>
                                                                            </div>
                                                                        </div>
                                                                        <Badge variant="outline">{content.variants.length} variants</Badge>
                                                                    </div>

                                                                    {/* Variants */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {content.variants.map((variant, idx) => (
                                                                            <div key={idx} className="p-4 rounded-lg bg-g-hover relative group">
                                                                                <div className="flex items-start justify-between mb-2">
                                                                                    <Badge variant="secondary" className="text-xs">
                                                                                        Variant {idx + 1}
                                                                                    </Badge>
                                                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        {/* Actions moved to footer */}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-3">
                                                                                    {/* Hook Display */}
                                                                                    {variant.hook && (
                                                                                        <div className="bg-background/50 p-3 rounded-md border border-g-border">
                                                                                            <span className="text-xs font-bold text-g-muted uppercase tracking-wider block mb-1">Hook / Concept</span>
                                                                                            <p className="text-sm font-medium italic">"{variant.hook}"</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Viral Thumbnail Agent */}
                                                                                    <ThumbnailCard
                                                                                        platform={platformId}
                                                                                        content={variant.content}
                                                                                        hook={variant.hook}
                                                                                        productName={appState.gravityICP.answers[9] || "Product"}
                                                                                        productContext={{
                                                                                            description: appState.marketingStatements?.productDescription,
                                                                                            solution: appState.marketingStatements?.solutionStatement
                                                                                        }}
                                                                                        assets={selectedAssets}
                                                                                        avatarUrl={appState.avatarData?.photo_url}
                                                                                        initialImageUrl={variant.thumbnailUrl}
                                                                                        onThumbnailGenerated={(url) => {
                                                                                            console.log("Thumbnail generated:", url);
                                                                                            // Update state to persist thumbnail
                                                                                            setPlatformContent(prev => {
                                                                                                const updated = { ...prev };
                                                                                                const platform = updated[platformId];
                                                                                                if (platform) {
                                                                                                    const newVariants = [...platform.variants];
                                                                                                    newVariants[idx] = {
                                                                                                        ...newVariants[idx],
                                                                                                        thumbnailUrl: url
                                                                                                    };
                                                                                                    updated[platformId] = {
                                                                                                        ...platform,
                                                                                                        variants: newVariants
                                                                                                    };
                                                                                                }
                                                                                                // Update the array version for persistence as well
                                                                                                const newArray = Object.values(updated);
                                                                                                setGeneratedPlatforms(newArray);
                                                                                                return updated;
                                                                                            });
                                                                                        }}
                                                                                    />

                                                                                    {/* Main Content */}
                                                                                    <div>
                                                                                        <Textarea
                                                                                            className="min-h-[200px] text-sm font-mono"
                                                                                            value={variant.content}
                                                                                            onChange={(e) => {
                                                                                                const newText = e.target.value;
                                                                                                setPlatformContent(prev => {
                                                                                                    const updated = { ...prev };
                                                                                                    const platform = updated[platformId];
                                                                                                    if (platform) {
                                                                                                        const newVariants = [...platform.variants];
                                                                                                        newVariants[idx] = {
                                                                                                            ...newVariants[idx],
                                                                                                            content: newText
                                                                                                        };
                                                                                                        updated[platformId] = {
                                                                                                            ...platform,
                                                                                                            variants: newVariants
                                                                                                        };
                                                                                                    }
                                                                                                    return updated;
                                                                                                });
                                                                                            }}
                                                                                        />
                                                                                    </div>

                                                                                    {/* Hashtags */}
                                                                                    {variant.hashtags && variant.hashtags.length > 0 && (
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {variant.hashtags.map((tag, i) => (
                                                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                                                    #{tag}
                                                                                                </Badge>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Platform-specific metadata */}
                                                                                    {platformId === 'youtube' && variant.scriptTimestamps && variant.scriptTimestamps.length > 0 && (
                                                                                        <div className="text-xs text-g-muted border-t border-g-border pt-2 mt-2">
                                                                                            <p className="font-semibold mb-1">Script Timestamps:</p>
                                                                                            {variant.scriptTimestamps.map((ts, i: number) => (
                                                                                                <div key={i} className="mb-1">
                                                                                                    <span className="text-purple-400">{ts.time}:</span> {ts.text}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}

                                                                                    {platformId === 'twitter' && variant.threadPosts && variant.threadPosts.length > 1 && (
                                                                                        <div className="text-xs text-g-muted border-t border-g-border pt-2 mt-2">
                                                                                            <p className="font-semibold mb-1">Thread ({variant.threadPosts.length} tweets):</p>
                                                                                            {variant.threadPosts.map((tweet: string, i: number) => (
                                                                                                <div key={i} className="mb-2">
                                                                                                    <span className="text-purple-400">{i + 1}.</span> {tweet}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Action Bar Footer */}
                                                                                < div className="mt-4 pt-4 border-t border-g-border flex items-center justify-between" >
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="text-g-muted hover:text-g-text"
                                                                                        onClick={() => copyToClipboard(variant.content, `${platformId} Variant ${idx + 1} `)}
                                                                                    >
                                                                                        {copiedContent === `${platformId} Variant ${idx + 1} ` ? (
                                                                                            <>
                                                                                                <Check className="w-4 h-4 mr-2" />
                                                                                                Copied
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <Copy className="w-4 h-4 mr-2" />
                                                                                                Copy
                                                                                            </>
                                                                                        )}
                                                                                    </Button>

                                                                                    <div className="flex gap-3">

                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            onClick={() => {
                                                                                                if (variant.thumbnailUrl) {
                                                                                                    setPreviewImage(variant.thumbnailUrl);
                                                                                                } else {
                                                                                                    toast.error("No thumbnail to preview");
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Play className="w-4 h-4 mr-2" />
                                                                                            Motion Preview
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="gradient"
                                                                                            size="sm"
                                                                                            className="shadow-lg shadow-g-accent/20"
                                                                                            onClick={() => navigateToMediaLab(variant, platformId)}
                                                                                        >
                                                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                                                            Open in Media Lab
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}

                                                    {/* Navigation */}
                                                    <div className="flex gap-3 justify-between">
                                                        <Button variant="outline" onClick={handlePreviousStage}>
                                                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                                            Back
                                                        </Button>
                                                        <div className="flex gap-3">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setPlatformContent({});
                                                                }}
                                                            >
                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                Start Over
                                                            </Button>
                                                            <Button onClick={handleNextStage} variant="gradient">
                                                                View Library
                                                                <ChevronRight className="w-4 h-4 ml-2" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* LIBRARY STAGE */}
                                    {currentStage === 'library' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                        Content Library
                                                    </h2>
                                                    <p className="text-gray-400 mt-2">Your saved content studio sessions</p>
                                                </div>
                                            </div>

                                            {loadingSession ? (
                                                <div className="text-center py-12">
                                                    <p className="text-gray-400">Loading sessions...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Current Session Summary */}
                                                    <GlassPanel className="p-6">
                                                        <h3 className="text-xl font-semibold mb-4">Current Session</h3>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Card className="p-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-semibold">Pain Synopsis</h4>
                                                                    {painSynopsis ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                                                </div>
                                                                {painSynopsis && (
                                                                    <p className="text-sm text-gray-400 truncate">
                                                                        {painSynopsis.narrative.substring(0, 100)}...
                                                                    </p>
                                                                )}
                                                            </Card>

                                                            <Card className="p-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-semibold">Market Intel</h4>
                                                                    {marketIntel ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                                                </div>
                                                                {marketIntel && (
                                                                    <p className="text-sm text-gray-400">
                                                                        {marketIntel.trends.length} trends identified
                                                                    </p>
                                                                )}
                                                            </Card>

                                                            <Card className="p-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-semibold">AI Strategy</h4>
                                                                    {strategy ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                                                </div>
                                                                {strategy && (
                                                                    <p className="text-sm text-gray-400">
                                                                        {strategy.recommended_triggers.length} content triggers
                                                                    </p>
                                                                )}
                                                            </Card>

                                                            <Card className="p-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-semibold">Platform Content</h4>
                                                                    {generatedPlatforms.length > 0 ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                                                                </div>
                                                                {generatedPlatforms.length > 0 && (
                                                                    <p className="text-sm text-gray-400">
                                                                        {generatedPlatforms.length} platforms generated
                                                                    </p>
                                                                )}
                                                            </Card>
                                                        </div>

                                                        <div className="mt-6 flex gap-3">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setCurrentStage('synopsis')}
                                                            >
                                                                <ChevronLeft className="w-4 h-4 mr-2" />
                                                                Back to Synopsis
                                                            </Button>
                                                            <Button
                                                                variant="gradient"
                                                                onClick={() => setCurrentStage('generation')}
                                                                disabled={generatedPlatforms.length === 0}
                                                            >
                                                                View Generated Content
                                                            </Button>
                                                        </div>
                                                    </GlassPanel>

                                                    {/* Generated Platform Content */}
                                                    {generatedPlatforms.length > 0 && (
                                                        <div className="mt-6">
                                                            <h3 className="text-xl font-semibold mb-4">Generated Content</h3>
                                                            <div className="grid gap-4">
                                                                {generatedPlatforms.map((platform, idx) => (
                                                                    <GlassPanel key={idx} className="p-6">
                                                                        <h4 className="text-lg font-semibold mb-3 capitalize">
                                                                            {platform.platform}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-400 mb-4">
                                                                            {platform.variants.length} variants generated
                                                                        </p>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setCurrentStage('generation');
                                                                                // Could add logic to jump to this platform
                                                                            }}
                                                                        >
                                                                            View Details
                                                                        </Button>
                                                                    </GlassPanel>
                                                                ))}
                                                            </div >
                                                        </div >
                                                    )}
                                                </div >
                                            )}
                                        </div >
                                    )}
                                </div >
                            </GlassPanel>
                        )
                    }
                </div >
            </div >

            {/* Motion Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-purple-500/30" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/80"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        {/* Ken Burns Effect Container */}
                        <div className="w-full h-full overflow-hidden">
                            <img
                                src={previewImage}
                                alt="Motion Preview"
                                className="w-full h-full object-cover animate-ken-burns"
                                style={{
                                    animation: 'ken-burns 15s ease-out infinite alternate'
                                }}
                            />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                            <h3 className="text-xl font-bold text-white mb-2">Motion Preview</h3>
                            <p className="text-sm text-gray-300">Simulating video intro movement...</p>
                        </div>
                    </div>
                    <style>{`
                        @keyframes ken-burns {
                            0% { transform: scale(1.0) translate(0, 0); }
                            100% { transform: scale(1.15) translate(-2%, -2%); }
                        }
                    `}</style>
                </div>
            )}

            {showVideoModal && (
                <VideoGenerationModal
                    isOpen={showVideoModal}
                    onClose={() => setShowVideoModal(false)}
                    script={currentScript}
                    presentationId={currentPresentationId}
                    slides={generatedSlides}
                />
            )
            }

            <AssetSelectorModal
                isOpen={showAssetSelectionModal}
                onClose={() => setShowAssetSelectionModal(false)}
                onConfirm={(assets) => {
                    // Merge with existing assets, avoiding duplicates
                    const newAssets = [...selectedAssets];
                    assets.forEach(asset => {
                        if (!newAssets.find(a => a.id === asset.id)) {
                            newAssets.push(asset);
                        }
                    });
                    setSelectedAssets(newAssets);
                    setShowAssetSelectionModal(false);
                }}
            />
        </>
    );
}
