'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw, Brain, ChevronDown, ChevronUp, User, Target, Heart, Globe, ExternalLink, Sparkles, Quote, Lightbulb, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store/projectStore';
import { SIX_S_DEFINITIONS, getGapPriority } from '@/lib/six-s-constants';
import type { SixS } from '@/lib/six-s-constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingStages, DEEP_RESEARCH_STAGES } from '@/components/ui/ThinkingStages';
import { useSimpleThinkingStages } from '@/hooks/useThinkingStages';
import { RadarLoaderOverlay } from '@/components/ui/RadarLoader';
import { buildICPContext, conductDeepResearch, extractSixSGaps, type DeepResearchResult } from '@/lib/deep-research-api';
import { getLatestICPSession, getAllAvatarsBySessionId, getMarketingStatementsByAvatarId } from '@/lib/database-service';
import { toast } from 'sonner';

export default function MarketRadarPage() {
    const router = useRouter();
    const { appState, setHeaderActions, setContentStudioMarketIntel, hydrateSessionData, setAvatarData, setMarketingStatements } = useApp();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [research, setResearch] = useState<DeepResearchResult | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('sixS');
    const hasInitializedRef = useRef(false);
    const hasLoadedDataRef = useRef(false);

    // Zustand store for Six S gaps
    const { setSixSGaps, contentStrategyState } = useProjectStore();

    // Thinking stages for deep research
    const researchStages = useSimpleThinkingStages(DEEP_RESEARCH_STAGES);

    // Load ICP data from database on mount if not already loaded
    useEffect(() => {
        async function loadICPData() {
            if (hasLoadedDataRef.current) return;

            const userId = user?.uid || appState.userId;
            if (!userId) {
                console.log('[Market Radar] No user ID, skipping data load');
                setLoadingData(false);
                return;
            }

            // Check if we already have ICP data loaded
            const hasAnswers = appState.gravityICP.answers.some(a => a && a.trim());
            if (hasAnswers) {
                console.log('[Market Radar] ICP data already loaded');
                hasLoadedDataRef.current = true;
                setLoadingData(false);
                return;
            }

            console.log('[Market Radar] Loading ICP data from database for user:', userId);
            hasLoadedDataRef.current = true;

            try {
                // Get latest ICP session with real answers
                const session = await getLatestICPSession(userId);

                if (session) {
                    const hasRealAnswers = session.answers?.some((a: string) => a && a.trim());

                    if (hasRealAnswers) {
                        console.log('[Market Radar] Found session with answers:', session.id);
                        hydrateSessionData(session);

                        // Also load avatar and marketing statements if available
                        const avatars = await getAllAvatarsBySessionId(session.id);
                        if (avatars && avatars.length > 0) {
                            const avatar = avatars[0]; // Use first avatar
                            console.log('[Market Radar] Found avatar:', avatar.name);
                            setAvatarData(avatar);

                            // Get marketing statements for this avatar
                            const marketing = await getMarketingStatementsByAvatarId(avatar.id);
                            if (marketing && marketing.length > 0) {
                                console.log('[Market Radar] Found marketing statements');
                                setMarketingStatements(marketing);
                            }
                        }
                    } else {
                        console.log('[Market Radar] Session found but no real answers');
                        toast.info('No ICP data found. Please complete an ICP interview first.');
                    }
                } else {
                    console.log('[Market Radar] No session found');
                    toast.info('No ICP data found. Please complete an ICP interview first.');
                }
            } catch (error) {
                console.error('[Market Radar] Error loading ICP data:', error);
                toast.error('Failed to load ICP data');
            } finally {
                setLoadingData(false);
            }
        }

        loadICPData();
    }, [user?.uid, appState.userId]);

    // Load existing research from AppContext on mount (persistence)
    useEffect(() => {
        if (appState.contentStudioMarketIntel && !research) {
            console.log('[Market Radar] Loading existing research from AppContext');

            let researchData = appState.contentStudioMarketIntel;

            // If rawAnalysis contains JSON string, try to parse it
            if (researchData.rawAnalysis && typeof researchData.rawAnalysis === 'string' && !researchData.sixSAnalysis) {
                try {
                    const parsed = JSON.parse(researchData.rawAnalysis);
                    console.log('[Market Radar] Parsed stored rawAnalysis into structured data');
                    researchData = { ...researchData, ...parsed };
                    delete researchData.rawAnalysis;
                } catch (e) {
                    console.warn('[Market Radar] Could not parse stored rawAnalysis as JSON');
                }
            }

            setResearch(researchData);
            hasInitializedRef.current = true;

            // Also restore Six S gaps if they exist
            if (contentStrategyState.sixSGaps.length === 0 && appState.contentStudioMarketIntel) {
                const gaps = extractSixSGaps(appState.contentStudioMarketIntel);
                setSixSGaps(gaps.map(g => ({
                    category: g.category,
                    gapScore: g.gapScore,
                    evidence: g.evidence,
                    opportunities: g.opportunities,
                    quotes: g.quotes,
                })));
            }
        }
    }, [appState.contentStudioMarketIntel]);

    // Auto-fetch on mount only if we have ICP data AND no existing research
    useEffect(() => {
        if (!hasInitializedRef.current &&
            appState.gravityICP.answers.length > 0 &&
            !loading &&
            !research &&
            !appState.contentStudioMarketIntel) {
            hasInitializedRef.current = true;
            conductResearch();
        }
    }, [appState.gravityICP.answers, appState.contentStudioMarketIntel]);

    const conductResearch = async () => {
        setLoading(true);
        researchStages.start();

        try {
            // Debug: Log raw appState data before building context
            console.log('[Market Radar] Raw appState data:', {
                hasAvatarData: !!appState.avatarData,
                avatarDataName: appState.avatarData?.name,
                gravityICPAnswers: appState.gravityICP.answers.filter(a => a && a.trim()).length,
                hasMarketingStatements: !!appState.marketingStatements,
                selectedCoreDesire: appState.selectedCoreDesire?.name,
                selectedSixS: appState.selectedSixS?.name,
            });

            // Build comprehensive ICP context
            const icpContext = buildICPContext(
                appState.avatarData,
                appState.gravityICP,
                appState.marketingStatements,
                appState.selectedCoreDesire,
                appState.selectedSixS
            );

            console.log('[Market Radar] Starting deep research with context:', {
                avatarName: icpContext.avatarName,
                painPointsCount: icpContext.painPoints.length,
                primarySixS: icpContext.primarySixS,
                icpAnswersCount: icpContext.icpAnswers?.filter(a => a && a.trim()).length || 0,
                fullContext: icpContext,
            });

            // Conduct deep research with Google Search grounding
            const result = await conductDeepResearch(icpContext);

            // Debug: Check what we received
            console.log('[Market Radar] Received result:', {
                hasResearchSummary: !!result.researchSummary,
                hasSixSAnalysis: !!result.sixSAnalysis,
                hasRawAnalysis: !!result.rawAnalysis,
                sixSAnalysisType: typeof result.sixSAnalysis,
                rawAnalysisType: typeof result.rawAnalysis,
            });

            // If rawAnalysis contains JSON string, try to parse it
            if (result.rawAnalysis && typeof result.rawAnalysis === 'string' && !result.sixSAnalysis) {
                try {
                    const parsed = JSON.parse(result.rawAnalysis);
                    console.log('[Market Radar] Parsed rawAnalysis into structured data');
                    // Merge parsed data into result
                    Object.assign(result, parsed);
                    delete result.rawAnalysis; // Remove raw since we parsed it
                } catch (e) {
                    console.warn('[Market Radar] Could not parse rawAnalysis as JSON');
                }
            }

            setResearch(result);

            // Store in AppContext for persistence across page navigations
            setContentStudioMarketIntel(result);

            // Extract Six S gaps and store in Zustand
            const gaps = extractSixSGaps(result);
            setSixSGaps(gaps.map(g => ({
                category: g.category,
                gapScore: g.gapScore,
                evidence: g.evidence,
                opportunities: g.opportunities,
                quotes: g.quotes,
            })));

            researchStages.complete();

            console.log('[Market Radar] Deep research complete:', {
                keyFindingsCount: result.keyFindings?.length || 0,
                voiceOfCustomerCount: result.voiceOfCustomer?.length || 0,
                searchesPerformed: result._metadata?.searchesPerformed?.length || 0,
            });

        } catch (error) {
            console.error('[Market Radar] Deep research failed:', error);
            researchStages.reset();
        } finally {
            setLoading(false);
        }
    };

    // Inject header actions
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={conductResearch}
                    disabled={loading}
                    className="border-primary/30 text-foreground hover:bg-primary/10"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    New Research
                </Button>
                <Button
                    onClick={() => router.push('/veritas/strategy')}
                    disabled={!research}
                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:bg-primary/90"
                >
                    Next: AI Strategy <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );

        return () => setHeaderActions(null);
    }, [setHeaderActions, loading, router, research]);

    // Six S color mapping
    const getSixSColor = (category: string) => {
        switch (category) {
            case 'Significance': return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
            case 'Safe': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
            case 'Supported': return 'text-green-400 border-green-500/20 bg-green-500/10';
            case 'Successful': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
            case 'Surprise & Delight': return 'text-pink-400 border-pink-500/20 bg-pink-500/10';
            case 'Sharing': return 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10';
            default: return 'text-primary border-primary/20 bg-primary/10';
        }
    };

    // Show loading state while loading ICP data
    if (loadingData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading ICP data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 space-y-8">
            {/* FULL-SCREEN RADAR OVERLAY - Magic Moment Experience */}
            <AnimatePresence>
                {loading && (
                    <RadarLoaderOverlay
                        title="Market Radar Active"
                        subtitle={`Scanning conversations for ${appState.avatarData?.name || 'your target audience'}`}
                        messages={[
                            "Scanning Reddit discussions...",
                            "Analyzing Quora questions...",
                            "Finding emotional pain points...",
                            "Mapping Six S emotional gaps...",
                            "Extracting voice of customer...",
                            "Discovering content angles...",
                            "Processing real conversations...",
                            "Identifying strategic insights...",
                        ]}
                    />
                )}
            </AnimatePresence>

            {/* Page Header */}
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Market Radar</h1>
                <p className="text-muted-foreground">
                    AI-powered deep research for {appState.avatarData?.name || "your avatar"} using Google Search grounding.
                </p>
            </div>

            {/* ICP Context Panel */}
            {(appState.selectedCoreDesire || appState.selectedSixS || appState.avatarData) && (
                <div className="max-w-7xl mx-auto">
                    <Card className="p-4 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
                        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            Research Context
                        </h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            {appState.avatarData?.name && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Target:</span>
                                    <span className="text-sm font-medium text-foreground">{appState.avatarData.name}</span>
                                </div>
                            )}
                            {appState.selectedCoreDesire && (
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        {appState.selectedCoreDesire.name}
                                    </Badge>
                                </div>
                            )}
                            {appState.selectedSixS && (
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-primary" />
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        {appState.selectedSixS.name}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* No Research State */}
            {!research && !loading && (
                <div className="max-w-7xl mx-auto h-96 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                        Ready to Research
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                        Click below to start AI-powered deep research. The AI will search the web for real conversations and analyze emotional patterns.
                    </p>
                    <Button
                        onClick={conductResearch}
                        className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:bg-primary/90"
                    >
                        <Brain className="w-4 h-4 mr-2" />
                        Start Deep Research
                    </Button>
                </div>
            )}

            {/* Research Results */}
            {research && (
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Research Summary */}
                    <Card className="p-6 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            Research Summary
                        </h2>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {research.researchSummary || 'No summary available.'}
                        </p>
                        {research._metadata && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Badge variant="outline" className="text-xs">
                                    {research._metadata.searchesPerformed?.length || 0} searches performed
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {research._metadata.sourcesFound || 0} sources found
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {((research._metadata.processingTime || 0) / 1000).toFixed(1)}s processing time
                                </Badge>
                            </div>
                        )}
                    </Card>

                    {/* Six S Emotional Gap Analysis */}
                    <div>
                        <button
                            onClick={() => setExpandedSection(expandedSection === 'sixS' ? null : 'sixS')}
                            className="w-full flex items-center justify-between mb-4"
                        >
                            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-primary" />
                                </div>
                                Six S Emotional Gap Analysis
                            </h2>
                            {expandedSection === 'sixS' ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                        </button>

                        <AnimatePresence>
                            {expandedSection === 'sixS' && research.sixSAnalysis && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {Object.entries(research.sixSAnalysis)
                                        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
                                        .map(([category, analysis], i) => {
                                            const priorityInfo = getGapPriority(analysis.score || 5);
                                            const sixSDef = SIX_S_DEFINITIONS[category as SixS];

                                            return (
                                                <motion.div
                                                    key={category}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                >
                                                    <Card className={cn(
                                                        "p-4 h-full",
                                                        "bg-card/85 backdrop-blur-xl border rounded-xl",
                                                        getSixSColor(category)
                                                    )}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-display font-semibold text-foreground">
                                                                {category}
                                                            </h3>
                                                            <div className={cn(
                                                                "px-2 py-1 rounded-full text-xs font-bold",
                                                                priorityInfo.color
                                                            )}>
                                                                {analysis.score}/10
                                                            </div>
                                                        </div>
                                                        {sixSDef && (
                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                {sixSDef.description}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-foreground/80 mb-3">
                                                            {analysis.evidence}
                                                        </p>
                                                        {analysis.opportunities && analysis.opportunities.length > 0 && (
                                                            <div className="space-y-1">
                                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                                    Opportunities:
                                                                </span>
                                                                <ul className="text-xs text-foreground/70 space-y-1">
                                                                    {analysis.opportunities.slice(0, 2).map((opp, j) => (
                                                                        <li key={j} className="flex items-start gap-1">
                                                                            <span className="text-primary">•</span>
                                                                            {opp}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Voice of Customer Quotes */}
                    {research.voiceOfCustomer && research.voiceOfCustomer.length > 0 && (
                        <div>
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'voc' ? null : 'voc')}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Quote className="w-5 h-5 text-primary" />
                                    </div>
                                    Voice of Customer ({research.voiceOfCustomer.length})
                                </h2>
                                {expandedSection === 'voc' ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>

                            <AnimatePresence>
                                {expandedSection === 'voc' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        {research.voiceOfCustomer.map((voc, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Card className="p-4 bg-card/85 backdrop-blur-xl border border-border/50 rounded-xl">
                                                    <p className="text-foreground/90 italic mb-3">
                                                        "{voc.text}"
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={cn("text-xs", getSixSColor(voc.sixS))}>
                                                                {voc.sixS}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {voc.emotion}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Globe className="w-3 h-3" />
                                                            {voc.source}
                                                            {voc.sourceUrl && (
                                                                <a
                                                                    href={voc.sourceUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="ml-1 text-primary hover:underline"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Key Findings */}
                    {research.keyFindings && research.keyFindings.length > 0 && (
                        <div>
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'findings' ? null : 'findings')}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Lightbulb className="w-5 h-5 text-primary" />
                                    </div>
                                    Key Findings ({research.keyFindings.length})
                                </h2>
                                {expandedSection === 'findings' ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>

                            <AnimatePresence>
                                {expandedSection === 'findings' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        {research.keyFindings.map((finding, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <Card className="p-4 bg-card/85 backdrop-blur-xl border border-border/50 rounded-xl">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <span className="text-sm font-bold text-primary">{i + 1}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-foreground font-medium mb-2">
                                                                {finding.insight}
                                                            </p>
                                                            {finding.quote && (
                                                                <p className="text-sm text-foreground/70 italic mb-2">
                                                                    "{finding.quote}"
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Globe className="w-3 h-3" />
                                                                    {finding.source}
                                                                </span>
                                                                <Badge className={cn("text-xs", getSixSColor(finding.emotionalResonance))}>
                                                                    {finding.emotionalResonance}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Content Angles */}
                    {research.contentAngles && research.contentAngles.length > 0 && (
                        <div>
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'angles' ? null : 'angles')}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-primary" />
                                    </div>
                                    Content Angles ({research.contentAngles.length})
                                </h2>
                                {expandedSection === 'angles' ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>

                            <AnimatePresence>
                                {expandedSection === 'angles' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {research.contentAngles.map((angle, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <Card className="p-4 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl hover:-translate-y-1 transition-transform">
                                                    <h3 className="font-display font-semibold text-foreground mb-2">
                                                        {angle.angle}
                                                    </h3>
                                                    <p className="text-sm text-primary font-medium mb-2">
                                                        "{angle.hook}"
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                        Triggers: {angle.emotionalTrigger}
                                                    </Badge>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Strategic Insights */}
                    {research.strategicInsights && research.strategicInsights.length > 0 && (
                        <Card className="p-6 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl">
                            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                Strategic Insights
                            </h2>
                            <ul className="space-y-3">
                                {research.strategicInsights.map((insight, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-primary">{i + 1}</span>
                                        </div>
                                        <p className="text-foreground/90">{insight}</p>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Raw Analysis Fallback */}
                    {research.rawAnalysis && !research.sixSAnalysis && (
                        <Card className="p-6 bg-card/85 backdrop-blur-xl border border-yellow-500/25 rounded-xl">
                            <h2 className="text-xl font-display font-bold text-foreground mb-4">
                                Raw Analysis Output
                            </h2>
                            <pre className="text-sm text-foreground/80 whitespace-pre-wrap overflow-auto max-h-96">
                                {research.rawAnalysis}
                            </pre>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
