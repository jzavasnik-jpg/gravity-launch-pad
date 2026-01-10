/**
 * Deep Research API - Uses Gemini with Google Search Grounding
 *
 * This replaces the fragmented approach of YouTube/Reddit/Google APIs
 * with a single intelligent search that lets AI find what's relevant.
 */

import type { SixS } from './six-s-constants';

const API_BASE = 'http://localhost:3001';

// ==================== TYPES ====================

export interface ICPContext {
    // Avatar identity
    avatarName: string;
    avatarOccupation?: string;
    avatarStory?: string;

    // Core psychological profile
    coreDesire?: string;
    coreDesireDescription?: string;
    primarySixS?: string;
    primarySixSDescription?: string;

    // Pain points (comprehensive)
    painPoints: string[];
    painPointsMatrix?: Record<string, {
        score: number;
        challenges: string[];
        description?: string;
    }>;

    // Dreams and aspirations
    dreams: string[];
    idealOutcome?: string;

    // Daily reality
    dailyChallenges?: string[];

    // Marketing context
    marketingStatements?: {
        promise?: string;
        problem?: string;
        solution?: string;
        transformation?: string;
    };

    // ICP interview answers (raw)
    icpAnswers?: string[];
}

export interface DeepResearchResult {
    // Executive summary
    researchSummary: string;

    // What searches were performed
    searchQueriesUsed: string[];

    // Key findings with sources
    keyFindings: Array<{
        insight: string;
        source: string;
        emotionalResonance: string;
        quote: string;
    }>;

    // Six S analysis with scores
    sixSAnalysis: Record<SixS, {
        score: number;
        evidence: string;
        opportunities: string[];
    }>;

    // Voice of customer quotes
    voiceOfCustomer: Array<{
        text: string;
        source: string;
        sourceUrl?: string;
        emotion: string;
        sixS: string;
    }>;

    // Strategic recommendations
    strategicInsights: string[];

    // Content angle suggestions
    contentAngles: Array<{
        angle: string;
        hook: string;
        emotionalTrigger: string;
    }>;

    // Metadata from the search
    _metadata: {
        searchesPerformed: string[];
        sourcesFound: number;
        processingTime: number;
        groundingChunks?: Array<{
            web?: {
                uri: string;
                title: string;
            };
        }>;
        parseError?: boolean;
    };

    // Fallback for unparseable responses
    rawAnalysis?: string;
}

// ==================== CONTEXT BUILDER ====================

/**
 * Builds a comprehensive ICP context object from all available app state
 * This is the "vectorized package" that gets sent to the AI for research
 */
export function buildICPContext(
    avatarData: any,
    gravityICP: { answers: string[] },
    marketingStatements?: any,
    selectedCoreDesire?: { name: string; description?: string },
    selectedSixS?: { name: string; description?: string }
): ICPContext {
    // Extract pain points from multiple sources
    const painPoints: string[] = [];

    // From ICP answers
    if (gravityICP.answers[0]) {
        painPoints.push(gravityICP.answers[0]);
    }

    // From avatar's pain points matrix
    if (avatarData?.pain_points_matrix) {
        const matrixChallenges = Object.entries(avatarData.pain_points_matrix)
            .sort(([, a]: any, [, b]: any) => (b.score || 0) - (a.score || 0))
            .flatMap(([_, dim]: any) => dim.challenges || []);
        painPoints.push(...matrixChallenges);
    }

    // From daily challenges
    if (avatarData?.daily_challenges) {
        painPoints.push(...avatarData.daily_challenges);
    }

    // From marketing problem statement
    if (marketingStatements?.problem) {
        painPoints.push(marketingStatements.problem);
    }

    // Deduplicate
    const uniquePainPoints = [...new Set(painPoints)].slice(0, 10);

    // Extract dreams/aspirations
    const dreams: string[] = [];
    if (avatarData?.dreams) {
        dreams.push(...avatarData.dreams);
    }
    if (marketingStatements?.transformation) {
        dreams.push(marketingStatements.transformation);
    }
    if (gravityICP.answers[8]) { // Usually ideal outcome
        dreams.push(gravityICP.answers[8]);
    }
    const uniqueDreams = [...new Set(dreams)].slice(0, 5);

    return {
        avatarName: avatarData?.name || 'Target Customer',
        avatarOccupation: avatarData?.occupation,
        avatarStory: avatarData?.story,

        coreDesire: selectedCoreDesire?.name || avatarData?.core_desire,
        coreDesireDescription: selectedCoreDesire?.description || avatarData?.core_desire_description,

        primarySixS: selectedSixS?.name || avatarData?.primary_six_s,
        primarySixSDescription: selectedSixS?.description || avatarData?.primary_six_s_description,

        painPoints: uniquePainPoints,
        painPointsMatrix: avatarData?.pain_points_matrix,

        dreams: uniqueDreams,
        idealOutcome: avatarData?.dreams?.[0] || marketingStatements?.transformation,

        dailyChallenges: avatarData?.daily_challenges,

        marketingStatements: marketingStatements ? {
            promise: marketingStatements.promise,
            problem: marketingStatements.problem,
            solution: marketingStatements.solution,
            transformation: marketingStatements.transformation,
        } : undefined,

        icpAnswers: gravityICP.answers,
    };
}

// ==================== API CALL ====================

/**
 * Conducts deep market research using Gemini with Google Search grounding
 * This is a single intelligent call that replaces YouTube/Reddit/Google scraping
 */
export async function conductDeepResearch(
    icpContext: ICPContext,
    researchFocus: 'market_intelligence' | 'competitor_analysis' | 'content_research' = 'market_intelligence'
): Promise<DeepResearchResult> {
    console.log('[Deep Research] Starting grounded research for:', icpContext.avatarName);
    console.log('[Deep Research] Pain points:', icpContext.painPoints.slice(0, 3));
    console.log('[Deep Research] Primary Six S:', icpContext.primarySixS);

    const response = await fetch(`${API_BASE}/api/deep-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            icpContext,
            researchFocus,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Deep Research] API error:', error);
        throw new Error(`Deep research API error: ${error.error || response.statusText}`);
    }

    const result = await response.json();

    console.log('[Deep Research] Research complete!');
    console.log('[Deep Research] Searches performed:', result._metadata?.searchesPerformed?.length || 0);
    console.log('[Deep Research] Sources found:', result._metadata?.sourcesFound || 0);
    console.log('[Deep Research] Processing time:', result._metadata?.processingTime, 'ms');

    // Validate Six S analysis exists
    if (!result.sixSAnalysis && !result.rawAnalysis) {
        console.warn('[Deep Research] No Six S analysis in response, may need manual parsing');
    }

    return result as DeepResearchResult;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert deep research result to the legacy MarketIntelligence format
 * for backward compatibility with existing UI components
 */
export function convertToLegacyFormat(research: DeepResearchResult): {
    quotes: Array<{
        text: string;
        source: string;
        sourceUrl?: string;
        emotion: string;
        sixS: string;
        relevanceScore: number;
    }>;
    peopleAlsoAsk: Array<{
        question: string;
        snippet: string;
    }>;
    sentiment: {
        overall: string;
        distribution: Record<string, number>;
    };
} {
    // Convert voiceOfCustomer to quotes format
    const quotes = (research.voiceOfCustomer || []).map((voc, index) => ({
        text: voc.text,
        source: voc.source,
        sourceUrl: voc.sourceUrl,
        emotion: voc.emotion,
        sixS: voc.sixS,
        relevanceScore: 100 - (index * 5), // Higher relevance for earlier quotes
    }));

    // Convert content angles to PAA format
    const peopleAlsoAsk = (research.contentAngles || []).map(angle => ({
        question: angle.hook,
        snippet: angle.angle,
    }));

    // Add strategic insights as additional PAA
    (research.strategicInsights || []).forEach((insight, i) => {
        peopleAlsoAsk.push({
            question: `Strategic Insight ${i + 1}`,
            snippet: insight,
        });
    });

    // Build sentiment from Six S scores
    const sixSScores = research.sixSAnalysis || {};
    const avgScore = Object.values(sixSScores).reduce((sum, s) => sum + (s.score || 5), 0) / 6;

    return {
        quotes,
        peopleAlsoAsk,
        sentiment: {
            overall: avgScore >= 7 ? 'High Pain' : avgScore >= 5 ? 'Moderate Pain' : 'Low Pain',
            distribution: Object.fromEntries(
                Object.entries(sixSScores).map(([key, val]) => [key, val.score || 5])
            ),
        },
    };
}

/**
 * Extract Six S gaps from deep research for use in strategy generation
 */
export function extractSixSGaps(research: DeepResearchResult): Array<{
    category: SixS;
    gapScore: number;
    evidence: string;
    opportunities: string[];
    quotes: string[];
}> {
    const sixSAnalysis = research.sixSAnalysis || {};
    const voiceOfCustomer = research.voiceOfCustomer || [];

    return Object.entries(sixSAnalysis).map(([category, analysis]) => {
        // Find quotes that match this Six S
        const matchingQuotes = voiceOfCustomer
            .filter(voc => voc.sixS === category)
            .map(voc => voc.text);

        return {
            category: category as SixS,
            gapScore: analysis.score || 5,
            evidence: analysis.evidence || '',
            opportunities: analysis.opportunities || [],
            quotes: matchingQuotes,
        };
    }).sort((a, b) => b.gapScore - a.gapScore);
}
