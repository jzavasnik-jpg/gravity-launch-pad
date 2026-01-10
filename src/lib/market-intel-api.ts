// Six S Framework emotional categories
export type SixSCategory = 'Significance' | 'Safe' | 'Supported' | 'Successful' | 'Surprise & Delight' | 'Sharing';

export interface MarketQuote {
    id: string;
    source: 'quora' | 'stackexchange' | 'medium' | 'forum' | 'blog' | 'news' | 'paa' | 'google';
    text: string;
    author?: string;
    url?: string;
    upvotes?: number;
    timestamp?: string;
    displayLink?: string;
    relevanceScore: number;
    emotionalTone: SixSCategory; // Now uses Six S framework
    isRealQuote: boolean; // Source transparency: true = from real search, false = AI-generated
}

export interface MarketIntelligence {
    quotes: MarketQuote[];
    sentiment: {
        painIntensity: number; // 1-10
        urgency: 'low' | 'medium' | 'high';
        marketMaturity: 'emerging' | 'growing' | 'mature';
        topEmotions: string[];
    };
    languagePatterns: {
        commonPhrases: string[];
        emotionalTriggers: string[];
        objections: string[];
    };
    aiReasoning: string;
    suggestedSources: string[];
    peopleAlsoAsk: Array<{ question: string; snippet: string }>;
    // Reddit sentiment (aggregated, no direct quotes per TOS)
    redditSentiment?: {
        analyzed: boolean;
        postCount: number;
        overallSentiment: 'negative' | 'mixed' | 'positive';
        topThemes: string[];
        communityInsight: string; // AI-generated summary
    };
    // Source transparency stats
    sourceStats: {
        totalQuotes: number;
        realQuotes: number;
        googleQuotes: number;
        paaQuotes: number;
        redditPostsAnalyzed: number; // Count only, no quotes
        aiGeneratedQuotes: number;
    };
}

/**
 * Six S to search keywords mapping for targeted market validation
 */
const SIX_S_SEARCH_KEYWORDS: Record<string, string[]> = {
    'significance': ['recognition', 'valued', 'impact', 'matter', 'appreciated', 'noticed', 'ignored', 'overlooked'],
    'safe': ['security', 'trust', 'reliable', 'risk', 'fear', 'uncertain', 'confidence', 'worried', 'anxious'],
    'supported': ['alone', 'guidance', 'mentor', 'community', 'help', 'isolated', 'support', 'partnership'],
    'successful': ['achieve', 'results', 'goals', 'accomplish', 'progress', 'stuck', 'failure', 'competent'],
    'surprise-and-delight': ['creative', 'innovation', 'boring', 'exciting', 'fresh', 'new', 'different', 'inspired'],
    'sharing': ['community', 'share', 'together', 'contribute', 'belong', 'connect', 'social', 'proud'],
};

const BACKEND_URL = 'http://localhost:3001';

/**
 * Decode HTML entities and clean up YouTube comment text
 * Handles &quot; &#39; &amp; &lt; &gt; <br> etc.
 */
function decodeHtmlEntities(text: string): string {
    if (!text) return '';

    return text
        // Decode common HTML entities
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        // Convert <br> tags to newlines then to spaces for cleaner display
        .replace(/<br\s*\/?>/gi, ' ')
        // Remove any remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode numeric entities like &#34; &#x22;
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

// Marketing context interface for validation searches
export interface MarketingContext {
    promise: string;
    problem: string;
    solution: string;
    transformation: string;
}

/**
 * Use AI to generate intelligent search queries from ICP data + marketing statements
 * Returns multiple targeted queries for different aspects of the market
 */
async function generateSearchQueries(
    painPoints: string,
    targetAudience: string,
    problem: string,
    primarySixS?: string,
    marketingContext?: MarketingContext
): Promise<string[]> {
    try {
        const systemPrompt = `You are a market research expert. Generate YouTube search queries to find videos where the target audience discusses their problems, frustrations, and needs SPECIFICALLY RELATED to the problem being validated.

RULES:
1. Generate 3-5 search queries that would find videos where the TARGET AUDIENCE discusses the SPECIFIC PROBLEM being validated
2. Focus on: the exact pain point, the industry/occupation context, related challenges
3. Queries should find videos with COMMENTS from the target audience discussing THIS SPECIFIC problem
4. Each query should be 3-6 words, optimized for YouTube search
5. Queries MUST be relevant to the marketing problem statement - NOT generic queries
6. Return ONLY a JSON array of strings, no explanation

Example: If the problem is "course creators struggling to generate leads", good queries would be:
["course creator lead generation", "online course marketing struggles", "how to sell online courses"]

BAD queries would be:
["social anxiety tips", "entrepreneurship motivation", "business success stories"]`;

        // Build the prompt with marketing context for better relevance
        let userPrompt = `Generate YouTube search queries for this ICP and SPECIFIC PROBLEM to validate:

TARGET AUDIENCE: ${targetAudience}

THEIR PAIN POINTS: ${painPoints}

THE CORE PROBLEM TO VALIDATE: ${problem}`;

        // Add marketing statements if available for more precise targeting
        if (marketingContext && (marketingContext.problem || marketingContext.promise)) {
            userPrompt += `

MARKETING VALIDATION CONTEXT:
- Promise: ${marketingContext.promise || 'not specified'}
- Problem Statement: ${marketingContext.problem || 'not specified'}
- Solution Approach: ${marketingContext.solution || 'not specified'}
- Transformation: ${marketingContext.transformation || 'not specified'}`;
        }

        userPrompt += `

PRIMARY EMOTIONAL NEED (Six S): ${primarySixS || 'not specified'}

Return 3-5 search queries as a JSON array that will find videos where this audience discusses THIS SPECIFIC PROBLEM. Queries must be relevant to the marketing problem statement.`;

        const response = await fetch(`${BACKEND_URL}/api/generate-copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userPrompt }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate search queries');
        }

        const data = await response.json();

        // Handle both array response and object with queries property
        if (Array.isArray(data)) {
            return data.slice(0, 5);
        } else if (data.queries && Array.isArray(data.queries)) {
            return data.queries.slice(0, 5);
        }

        // Fallback to basic extraction if AI response is unexpected
        console.warn('[Market Intel] Unexpected AI response, using fallback query generation');
        return generateFallbackQueries(painPoints, targetAudience, problem);

    } catch (error: any) {
        console.warn('[Market Intel] AI query generation failed, using fallback:', error.message);
        return generateFallbackQueries(painPoints, targetAudience, problem);
    }
}

/**
 * Fallback query generation when AI is unavailable
 */
function generateFallbackQueries(painPoints: string, targetAudience: string, problem: string): string[] {
    // Extract key noun phrases from the input
    const audienceWords = targetAudience.split(/\s+/).filter(w => w.length > 4).slice(0, 2);
    const problemWords = problem.split(/\s+/).filter(w => w.length > 4).slice(0, 2);

    const queries: string[] = [];

    // Build contextual queries
    if (audienceWords.length > 0) {
        queries.push(`${audienceWords.join(' ')} problems`);
        queries.push(`${audienceWords.join(' ')} struggles`);
    }
    if (problemWords.length > 0) {
        queries.push(`how to ${problemWords.join(' ')}`);
    }

    // Add generic industry queries based on common patterns
    if (targetAudience.toLowerCase().includes('business') || targetAudience.toLowerCase().includes('entrepreneur')) {
        queries.push('small business owner challenges');
    }
    if (targetAudience.toLowerCase().includes('market')) {
        queries.push('marketing frustrations tips');
    }

    return queries.length > 0 ? queries.slice(0, 4) : ['business owner struggles', 'entrepreneur challenges'];
}

/**
 * Score a comment's relevance to the ICP pain points and marketing context
 */
function scoreCommentRelevance(
    commentText: string,
    painPoints: string,
    targetAudience: string,
    primarySixS?: string,
    marketingContext?: MarketingContext
): number {
    const textLower = commentText.toLowerCase();
    const painLower = painPoints.toLowerCase();
    const audienceLower = targetAudience.toLowerCase();

    let score = 40; // Lower base score to be more selective

    // Check for pain-related language
    const painIndicators = ['struggle', 'frustrated', 'hate', 'problem', 'issue', 'difficult', 'hard',
                           'challenge', 'stuck', 'help', 'need', 'wish', 'tired', 'overwhelm', 'stress',
                           'fail', 'waste', 'confus', 'annoy', 'disappoint'];
    painIndicators.forEach(word => {
        if (textLower.includes(word)) score += 8;
    });

    // Check for question patterns (indicates seeking help)
    if (textLower.includes('?') || textLower.includes('how do') || textLower.includes('anyone else')) {
        score += 12;
    }

    // Check for keywords from pain points
    const painKeywords = painLower.split(/\s+/).filter(w => w.length > 4);
    painKeywords.forEach(keyword => {
        if (textLower.includes(keyword)) score += 10;
    });

    // Check for audience-related terms
    const audienceKeywords = audienceLower.split(/\s+/).filter(w => w.length > 4);
    audienceKeywords.forEach(keyword => {
        if (textLower.includes(keyword)) score += 8;
    });

    // CRITICAL: Check for marketing context keywords (highest weight)
    if (marketingContext) {
        // Extract significant keywords from marketing statements
        const marketingText = `${marketingContext.problem} ${marketingContext.promise} ${marketingContext.solution}`.toLowerCase();
        const marketingKeywords = marketingText
            .split(/\s+/)
            .filter(w => w.length > 4 && !['their', 'about', 'which', 'would', 'could', 'should', 'being', 'there', 'where', 'these', 'those'].includes(w));

        let marketingMatches = 0;
        marketingKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                marketingMatches++;
                score += 15; // High weight for marketing context matches
            }
        });

        // Bonus for multiple marketing keyword matches
        if (marketingMatches >= 3) score += 20;
    }

    // Six S emotional indicators
    if (primarySixS) {
        const sixSKeywords = SIX_S_SEARCH_KEYWORDS[primarySixS.toLowerCase()] || [];
        sixSKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) score += 10;
        });
    }

    // Penalize very short comments or spam-like content
    if (commentText.length < 30) score -= 25;
    if (commentText.length > 500) score += 10; // Longer comments often more substantive
    if (textLower.includes('subscribe') || textLower.includes('check out my')) score -= 35;

    // Penalize off-topic content (generic encouragement, unrelated topics)
    const offTopicIndicators = ['social anxiety', 'depression help', 'mental health crisis', 'weight loss', 'dating advice'];
    offTopicIndicators.forEach(phrase => {
        if (textLower.includes(phrase) && !painLower.includes(phrase)) score -= 20;
    });

    return Math.max(0, Math.min(100, score));
}

/**
 * Generate market intelligence by fetching REAL quotes from YouTube and Google Search
 *
 * IMPORTANT: This function ONLY uses real quotes for authentic market validation.
 * AI-generated quotes would provide false validation and defeat the purpose.
 *
 * Sources (compliant with platform policies):
 * 1. YouTube (Service Account - comments from relevant videos)
 * 2. Google Search (public discussions from Quora, forums, blogs)
 * 3. Reddit (sentiment analysis only - NO direct quotes shown per TOS)
 */
export async function generateMarketIntelligence(
    painPoints: string,
    targetAudience: string,
    problem: string,
    quoteCount: number = 30,
    primarySixS?: string, // Pass the primary Six S for targeted search
    marketingContext?: MarketingContext // Marketing statements for validation context
): Promise<MarketIntelligence> {
    // Use AI to generate intelligent, contextual search queries using full context
    console.log(`[Market Intel] Generating AI-powered search queries for ICP...`, {
        hasMarketingContext: !!marketingContext,
        marketingProblem: marketingContext?.problem?.slice(0, 50),
    });
    const searchQueries = await generateSearchQueries(painPoints, targetAudience, problem, primarySixS, marketingContext);

    console.log(`[Market Intel] Search queries generated:`, searchQueries);

    let youtubeQuotes: MarketQuote[] = [];
    let googleQuotes: MarketQuote[] = [];
    let paaQuestions: Array<{ question: string; snippet: string }> = [];
    let redditSentiment: MarketIntelligence['redditSentiment'] = undefined;

    // === 1. FETCH YOUTUBE COMMENTS USING MULTIPLE INTELLIGENT QUERIES ===
    try {
        const { searchYouTubeComments } = await import('./youtube-api');

        // Search with each AI-generated query to get diverse, relevant results
        const commentsPerQuery = Math.ceil(40 / searchQueries.length);
        const allComments: any[] = [];

        for (const query of searchQueries) {
            console.log(`[Market Intel] Searching YouTube for: "${query}"`);
            try {
                const comments = await searchYouTubeComments(query, commentsPerQuery);
                allComments.push(...comments);
            } catch (e: any) {
                console.warn(`[Market Intel] Query "${query}" failed:`, e.message);
            }
        }

        // Deduplicate by comment ID
        const uniqueComments = allComments.filter((c, i, arr) =>
            arr.findIndex(x => x.id === c.id) === i
        );

        console.log(`[Market Intel] Found ${uniqueComments.length} unique comments from ${searchQueries.length} queries`);

        if (uniqueComments.length > 0) {
            // Apply relevance scoring based on ICP alignment + marketing context
            youtubeQuotes = uniqueComments.map(c => {
                const cleanText = decodeHtmlEntities(c.text);
                const relevanceScore = scoreCommentRelevance(cleanText, painPoints, targetAudience, primarySixS, marketingContext);
                return {
                    id: `yt-${c.id}`,
                    source: 'google' as const,
                    text: cleanText,
                    author: c.author,
                    url: `https://youtube.com/watch?v=${c.videoId}`,
                    upvotes: c.likeCount,
                    timestamp: c.publishTime,
                    displayLink: 'youtube.com',
                    relevanceScore: relevanceScore,
                    emotionalTone: detectSixSCategory(cleanText),
                    isRealQuote: true,
                };
            });

            // Filter out low-relevance comments (below threshold of 40)
            const relevantQuotes = youtubeQuotes.filter(q => q.relevanceScore >= 40);
            console.log(`[Market Intel] ✓ YouTube: ${relevantQuotes.length} relevant comments (filtered from ${youtubeQuotes.length})`);
            youtubeQuotes = relevantQuotes;
        }
    } catch (error: any) {
        console.warn('[Market Intel] YouTube unavailable:', error.message);
    }

    // === 2. FETCH GOOGLE SEARCH RESULTS (Quora, forums, blogs) ===
    // Use the first query for Google search (most comprehensive)
    const primaryQuery = searchQueries[0] || targetAudience;
    try {
        const { searchGoogleDiscussions, getPeopleAlsoAsk, extractQuotesFromResults } = await import('./google-search-api');

        const searchResults = await searchGoogleDiscussions(primaryQuery, targetAudience, 20);
        if (searchResults.length > 0) {
            const extracted = extractQuotesFromResults(searchResults, primarySixS);
            googleQuotes = extracted.map(q => ({
                ...q,
                source: q.source as MarketQuote['source'],
            }));
            console.log(`[Market Intel] ✓ Google Search: ${googleQuotes.length} results from forums/Q&A`);
        }

        // Pass marketing context and target audience for AI-powered PAA generation
        const paa = await getPeopleAlsoAsk(primaryQuery, problem, marketingContext, targetAudience);
        paaQuestions = paa.map(p => ({ question: p.question, snippet: p.snippet }));
        console.log(`[Market Intel] ✓ People Also Ask: ${paaQuestions.length} AI-generated questions`);

    } catch (error: any) {
        console.warn('[Market Intel] Google Search unavailable:', error.message);
    }

    // === 3. ANALYZE REDDIT FOR SENTIMENT (no direct quotes per TOS) ===
    try {
        const { analyzeRedditSentiment } = await import('./reddit-api');
        redditSentiment = await analyzeRedditSentiment(primaryQuery, targetAudience);
        if (redditSentiment?.analyzed) {
            console.log(`[Market Intel] ✓ Reddit Sentiment: ${redditSentiment.postCount} posts analyzed`);
        }
    } catch (error: any) {
        console.warn('[Market Intel] Reddit sentiment unavailable:', error.message);
    }

    // === 4. COMBINE REAL QUOTES ONLY (YouTube + Google, NOT Reddit) ===
    const realQuotes = [...youtubeQuotes, ...googleQuotes];

    console.log(`[Market Intel] Total: ${youtubeQuotes.length} YouTube + ${googleQuotes.length} Google = ${realQuotes.length} displayable quotes`);

    const displayQuotes = realQuotes
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, quoteCount);

    // === 5. ANALYZE QUOTES FOR SENTIMENT & PATTERNS ===
    const analysisResult = analyzeRealQuotes(displayQuotes, targetAudience);

    // Enhance sentiment with Reddit data if available
    if (redditSentiment?.analyzed) {
        // Blend Reddit themes into language patterns
        if (redditSentiment.topThemes.length > 0) {
            analysisResult.languagePatterns.emotionalTriggers = [
                ...redditSentiment.topThemes.slice(0, 3),
                ...analysisResult.languagePatterns.emotionalTriggers.slice(0, 2),
            ];
        }
        // Adjust pain intensity based on Reddit sentiment
        if (redditSentiment.overallSentiment === 'negative') {
            analysisResult.sentiment.painIntensity = Math.min(10, analysisResult.sentiment.painIntensity + 1);
        }
    }

    // === 6. BUILD SOURCE STATS ===
    const sourceStats = {
        totalQuotes: displayQuotes.length,
        realQuotes: displayQuotes.length,
        googleQuotes: displayQuotes.length,
        paaQuotes: paaQuestions.length,
        redditPostsAnalyzed: redditSentiment?.postCount || 0,
        aiGeneratedQuotes: 0,
    };

    // === 7. BUILD REASONING STRING ===
    const reasoningParts: string[] = [];

    // Mention the AI-generated queries used
    reasoningParts.push(`Searched using ${searchQueries.length} AI-generated queries: "${searchQueries.slice(0, 2).join('", "')}${searchQueries.length > 2 ? '...' : ''}"`);

    if (youtubeQuotes.length > 0) {
        reasoningParts.push(`Found ${youtubeQuotes.length} relevant YouTube comments (filtered by ICP alignment)`);
    }
    if (googleQuotes.length > 0) {
        reasoningParts.push(`Found ${googleQuotes.length} discussions from Quora, forums, and blogs`);
    }
    if (redditSentiment?.analyzed) {
        reasoningParts.push(`Analyzed sentiment from ${redditSentiment.postCount} Reddit posts`);
    }
    if (paaQuestions.length > 0) {
        reasoningParts.push(`${paaQuestions.length} "People Also Ask" questions identified`);
    }

    if (displayQuotes.length === 0 && !redditSentiment?.analyzed) {
        reasoningParts.push(`No relevant quotes found matching your ICP. Try adjusting pain points or target audience description.`);
    } else if (displayQuotes.length === 0 && redditSentiment?.analyzed) {
        reasoningParts.push(`No direct quotes matched your ICP, but Reddit sentiment provides market context.`);
    } else if (displayQuotes.length < 10) {
        reasoningParts.push(`Limited quote data (${displayQuotes.length}). Consider broadening your target audience description.`);
    } else {
        reasoningParts.push(`Analyzed ${displayQuotes.length} authentic, ICP-aligned quotes for Six S validation.`);
    }

    const aiReasoning = reasoningParts.join('. ') + ` Pain intensity: ${analysisResult.sentiment.painIntensity}/10.`;

    return {
        quotes: displayQuotes,
        sentiment: analysisResult.sentiment,
        languagePatterns: analysisResult.languagePatterns,
        aiReasoning,
        suggestedSources: ['YouTube', 'Quora', 'Medium', 'Industry Forums', 'Reddit (sentiment)'],
        peopleAlsoAsk: paaQuestions,
        redditSentiment,
        sourceStats,
    };
}


/**
 * Analyze real quotes to generate sentiment and patterns
 */
function analyzeRealQuotes(quotes: MarketQuote[], targetAudience: string): MarketIntelligence {
    // Calculate sentiment from real quotes
    const frustrationWords = ['frustrated', 'terrible', 'awful', 'hate', 'worst', 'stuck', 'annoying'];
    const desperationWords = ['desperate', 'struggling', 'overwhelmed', 'drowning', 'help'];

    let painIntensity = 5; // Default medium
    let frustrationCount = 0;
    let desperationCount = 0;

    quotes.forEach(q => {
        const textLower = q.text.toLowerCase();
        frustrationWords.forEach(word => { if (textLower.includes(word)) frustrationCount++; });
        desperationWords.forEach(word => { if (textLower.includes(word)) desperationCount++; });
    });

    painIntensity = Math.min(10, 5 + Math.floor((frustrationCount + desperationCount) / 2));

    // Extract common phrases
    const allText = quotes.map(q => q.text).join(' ').toLowerCase();
    const commonPhrases = extractPhrases(allText);

    return {
        quotes,
        sentiment: {
            painIntensity,
            urgency: painIntensity >= 8 ? 'high' : painIntensity >= 5 ? 'medium' : 'low',
            marketMaturity: 'growing',
            topEmotions: [...new Set(quotes.map(q => q.emotionalTone))].slice(0, 3),
        },
        languagePatterns: {
            commonPhrases: commonPhrases.slice(0, 8),
            emotionalTriggers: ['wasting time', 'falling behind', 'too complex'],
            objections: ['tried before', 'too expensive', 'no time'],
        },
        aiReasoning: `Analyzed ${quotes.length} quotes. Pain intensity: ${painIntensity}/10. Six S categories: ${[...new Set(quotes.map(q => q.emotionalTone))].slice(0, 3).join(', ')}.`,
        suggestedSources: ['YouTube', 'Quora', 'Medium', 'Industry Forums'],
        peopleAlsoAsk: [],
        sourceStats: {
            totalQuotes: quotes.length,
            realQuotes: quotes.filter(q => q.isRealQuote).length,
            googleQuotes: quotes.filter(q => q.isRealQuote).length,
            paaQuotes: 0,
            aiGeneratedQuotes: quotes.filter(q => !q.isRealQuote).length,
        },
    };
}

/**
 * Extract common phrases from text
 */
function extractPhrases(text: string): string[] {
    // Simple phrase extraction - look for repeated 2-3 word phrases
    const words = text.split(/\s+/);
    const phrases: Map<string, number> = new Map();

    for (let i = 0; i < words.length - 2; i++) {
        const twoWord = `${words[i]} ${words[i + 1]}`;
        const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;

        if (twoWord.length > 8) {
            phrases.set(twoWord, (phrases.get(twoWord) || 0) + 1);
        }
        if (threeWord.length > 12) {
            phrases.set(threeWord, (phrases.get(threeWord) || 0) + 1);
        }
    }

    return Array.from(phrases.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([phrase]) => phrase);
}

/**
 * Detect Six S category from text content
 * Maps comment content to the Six S emotional framework
 */
function detectSixSCategory(text: string): SixSCategory {
    const textLower = text.toLowerCase();

    // Six S keyword mappings (expanded for better detection)
    const sixSPatterns: Record<SixSCategory, string[]> = {
        'Significance': [
            'recognition', 'valued', 'impact', 'matter', 'appreciated', 'noticed', 'ignored', 'overlooked',
            'respect', 'important', 'meaningful', 'legacy', 'influence', 'visible', 'heard', 'acknowledged'
        ],
        'Safe': [
            'security', 'trust', 'reliable', 'risk', 'fear', 'uncertain', 'confidence', 'worried', 'anxious',
            'stable', 'secure', 'protect', 'safe', 'dangerous', 'scary', 'nervous', 'comfort', 'peace of mind'
        ],
        'Supported': [
            'alone', 'guidance', 'mentor', 'community', 'help', 'isolated', 'support', 'partnership',
            'team', 'together', 'lonely', 'abandoned', 'backed', 'assisted', 'advice', 'coach', 'guide'
        ],
        'Successful': [
            'achieve', 'results', 'goals', 'accomplish', 'progress', 'stuck', 'failure', 'competent',
            'win', 'success', 'grow', 'improve', 'advance', 'milestone', 'breakthrough', 'struggle'
        ],
        'Surprise & Delight': [
            'creative', 'innovation', 'boring', 'exciting', 'fresh', 'new', 'different', 'inspired',
            'amazing', 'wow', 'unexpected', 'fun', 'joy', 'delight', 'surprise', 'discover', 'spark'
        ],
        'Sharing': [
            'community', 'share', 'together', 'contribute', 'belong', 'connect', 'social', 'proud',
            'give back', 'help others', 'teach', 'pass on', 'inspire others', 'collective', 'group'
        ],
    };

    // Score each Six S category
    const scores: Record<SixSCategory, number> = {
        'Significance': 0,
        'Safe': 0,
        'Supported': 0,
        'Successful': 0,
        'Surprise & Delight': 0,
        'Sharing': 0,
    };

    for (const [category, keywords] of Object.entries(sixSPatterns) as [SixSCategory, string[]][]) {
        keywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                scores[category]++;
            }
        });
    }

    // Find highest scoring category
    const maxScore = Math.max(...Object.values(scores));

    // If no matches, default to 'Successful' (most common business/entrepreneurship context)
    if (maxScore === 0) return 'Successful';

    // Return the first category with max score
    return (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as SixSCategory) || 'Successful';
}

