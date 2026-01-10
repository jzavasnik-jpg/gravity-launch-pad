/**
 * Google Custom Search API for Market Intelligence
 *
 * Uses Google's Custom Search JSON API to find real discussions and quotes
 * from forums, Q&A sites, and community platforms.
 *
 * Compliant sources:
 * - Quora (public discussions)
 * - Stack Exchange sites
 * - Medium articles
 */

import type { SixSCategory } from './market-intel-api';

/*
 * - Industry forums
 * - News articles
 * - Blog comments
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID; // Custom Search Engine ID

export interface GoogleSearchResult {
    id: string;
    title: string;
    snippet: string;
    url: string;
    source: 'quora' | 'stackexchange' | 'medium' | 'forum' | 'blog' | 'news';
    displayLink: string;
    datePublished?: string;
}

export interface PeopleAlsoAsk {
    question: string;
    snippet: string;
    source?: string;
    url?: string;
}

/**
 * Search Google for real market discussions
 * Targets discussion sites, Q&A platforms, and forums
 */
export async function searchGoogleDiscussions(
    keywords: string,
    targetAudience: string,
    maxResults: number = 20
): Promise<GoogleSearchResult[]> {
    // If no API key, use fallback
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        console.warn('[Google Search] API credentials not configured, using web scraping fallback');
        return await scrapeDiscussions(keywords, targetAudience, maxResults);
    }

    try {
        // Build search query targeting discussion sites
        const discussionSites = [
            'site:quora.com',
            'site:reddit.com', // Public indexed pages are OK
            'site:stackexchange.com',
            'site:medium.com',
            'site:indiehackers.com',
            'site:producthunt.com',
        ].join(' OR ');

        const searchQuery = `${keywords} ${targetAudience} (${discussionSites})`;

        const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?` +
            `key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}` +
            `&q=${encodeURIComponent(searchQuery)}` +
            `&num=${Math.min(maxResults, 10)}` + // Google CSE max is 10 per request
            `&dateRestrict=y1` // Last year
        );

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();
        const results: GoogleSearchResult[] = [];

        if (data.items) {
            for (const item of data.items) {
                const source = detectSource(item.displayLink);
                results.push({
                    id: `google-${Date.now()}-${results.length}`,
                    title: item.title,
                    snippet: item.snippet || '',
                    url: item.link,
                    source,
                    displayLink: item.displayLink,
                    datePublished: item.pagemap?.metatags?.[0]?.['article:published_time'],
                });
            }
        }

        console.log(`[Google Search] Found ${results.length} discussion results`);
        return results;

    } catch (error) {
        console.error('[Google Search] API error:', error);
        return await scrapeDiscussions(keywords, targetAudience, maxResults);
    }
}

// Marketing context interface for PAA generation
interface MarketingContext {
    promise?: string;
    problem?: string;
    solution?: string;
    transformation?: string;
}

/**
 * Get "People Also Ask" questions from Google or AI-generated
 * These represent real user questions/concerns
 */
export async function getPeopleAlsoAsk(
    keywords: string,
    problem: string,
    marketingContext?: MarketingContext,
    targetAudience?: string
): Promise<PeopleAlsoAsk[]> {
    // PAA requires either SerpAPI or scraping Google results
    // For now, we'll use a proxy approach through the backend

    try {
        const response = await fetch('http://localhost:3001/api/paa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, problem })
        });

        if (response.ok) {
            const data = await response.json();
            return data.questions || [];
        }
    } catch (error) {
        console.warn('[PAA] Backend unavailable, using AI-generated questions');
    }

    // Fallback: Generate AI-powered contextual PAA questions
    return generateAIPoweredPAA(keywords, problem, marketingContext, targetAudience);
}

/**
 * Fallback: Scrape public discussions using backend proxy
 */
async function scrapeDiscussions(
    keywords: string,
    targetAudience: string,
    maxResults: number
): Promise<GoogleSearchResult[]> {
    try {
        const response = await fetch('http://localhost:3001/api/scrape-discussions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, targetAudience, maxResults })
        });

        if (response.ok) {
            const data = await response.json();
            return data.results || [];
        }
    } catch (error) {
        console.warn('[Scrape] Backend unavailable:', error);
    }

    // Return empty if no backend
    return [];
}

/**
 * Detect source type from URL
 */
function detectSource(displayLink: string): GoogleSearchResult['source'] {
    const link = displayLink.toLowerCase();
    if (link.includes('quora')) return 'quora';
    if (link.includes('stackexchange') || link.includes('stackoverflow')) return 'stackexchange';
    if (link.includes('medium')) return 'medium';
    if (link.includes('forum') || link.includes('community') || link.includes('discuss')) return 'forum';
    if (link.includes('news') || link.includes('techcrunch') || link.includes('forbes')) return 'news';
    return 'blog';
}

const BACKEND_URL = 'http://localhost:3001';

/**
 * Generate AI-powered contextual PAA questions based on full ICP context
 * Uses AI to create relevant questions that the target audience is actually searching for
 */
async function generateAIPoweredPAA(
    keywords: string,
    problem: string,
    marketingContext?: MarketingContext,
    targetAudience?: string
): Promise<PeopleAlsoAsk[]> {
    try {
        const systemPrompt = `You are a market research expert who understands what questions people search for on Google related to specific problems.

Generate 4-6 "People Also Ask" style questions that someone experiencing this problem would search for.

RULES:
1. Questions should be specific to the problem domain, NOT generic
2. Questions should reflect real search intent (how-to, why, what, comparison)
3. Snippets should be brief, helpful answers that validate the problem exists
4. Questions must be relevant to the target audience's situation
5. Return ONLY valid JSON, no explanation

Example output format:
[
  {"question": "How do course creators generate leads without paid ads?", "snippet": "Many course creators struggle with organic lead generation..."},
  {"question": "Why is my online course not selling?", "snippet": "Common reasons include unclear positioning and lack of visibility..."}
]`;

        let userPrompt = `Generate "People Also Ask" questions for this market validation context:

PROBLEM TO VALIDATE: ${problem}

SEARCH KEYWORDS: ${keywords}

TARGET AUDIENCE: ${targetAudience || 'professionals facing this challenge'}`;

        // Add marketing context for more precise question generation
        if (marketingContext && (marketingContext.problem || marketingContext.promise)) {
            userPrompt += `

MARKETING CONTEXT:
- Promise: ${marketingContext.promise || 'not specified'}
- Problem Statement: ${marketingContext.problem || 'not specified'}
- Solution: ${marketingContext.solution || 'not specified'}
- Transformation: ${marketingContext.transformation || 'not specified'}`;
        }

        userPrompt += `

Generate 4-6 specific "People Also Ask" questions that validate this problem exists in the market. Return as JSON array.`;

        const response = await fetch(`${BACKEND_URL}/api/generate-copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userPrompt }),
        });

        if (response.ok) {
            const data = await response.json();

            // Handle both array response and object with questions property
            if (Array.isArray(data)) {
                console.log(`[PAA] Generated ${data.length} AI-powered questions`);
                return data.slice(0, 6);
            } else if (data.questions && Array.isArray(data.questions)) {
                console.log(`[PAA] Generated ${data.questions.length} AI-powered questions`);
                return data.questions.slice(0, 6);
            }
        }
    } catch (error) {
        console.warn('[PAA] AI generation failed, using fallback:', error);
    }

    // Ultimate fallback: Generate more contextual template-based questions
    return generateTemplatePAA(keywords, problem, targetAudience);
}

/**
 * Template-based PAA generation as ultimate fallback
 * More contextual than the original generic version
 */
function generateTemplatePAA(keywords: string, problem: string, targetAudience?: string): PeopleAlsoAsk[] {
    const problemWords = problem.split(' ').filter(w => w.length > 4).slice(0, 3);
    const keywordList = keywords.split(' ').filter(k => k.length > 3).slice(0, 2);
    const mainTopic = keywordList.join(' ') || problemWords.join(' ') || 'this challenge';
    const audience = targetAudience?.split(' ').filter(w => w.length > 3)[0] || 'professionals';

    return [
        {
            question: `How do ${audience}s solve ${mainTopic}?`,
            snippet: `Many ${audience}s are finding new approaches to address ${mainTopic} through systematic processes and better tools.`,
        },
        {
            question: `What are the biggest challenges with ${mainTopic}?`,
            snippet: `The most common challenges include time constraints, lack of clarity, and finding the right solution that fits their specific needs.`,
        },
        {
            question: `Is ${mainTopic} worth the investment?`,
            snippet: `This depends on your specific situation, but many ${audience}s report significant improvements after addressing this properly.`,
        },
        {
            question: `What do experts recommend for ${mainTopic}?`,
            snippet: `Industry experts suggest starting with a clear strategy and focusing on the core problem before exploring solutions.`,
        },
    ];
}

/**
 * Extract quotes/pain points from Google search snippets
 */
export function extractQuotesFromResults(
    results: GoogleSearchResult[],
    primarySixS?: string
): Array<{
    id: string;
    source: string;
    text: string;
    url: string;
    relevanceScore: number;
    emotionalTone: SixSCategory;
    isRealQuote: boolean;
}> {
    return results.map((result, index) => {
        // Clean up snippet - remove ellipsis and artifacts
        let text = result.snippet
            .replace(/\.\.\./g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Skip very short snippets
        if (text.length < 30) return null;

        return {
            id: result.id,
            source: result.source,
            text: `"${text}" - from ${result.displayLink}`,
            url: result.url,
            relevanceScore: 85 - index, // Decrease relevance by position
            emotionalTone: detectEmotionalTone(text),
            isRealQuote: true,
        };
    }).filter(Boolean) as any[];
}

/**
 * Detect Six S category from text content
 */
function detectEmotionalTone(text: string): SixSCategory {
    const textLower = text.toLowerCase();

    const sixSPatterns: Record<SixSCategory, string[]> = {
        'Significance': ['recognition', 'valued', 'impact', 'matter', 'appreciated', 'noticed', 'ignored', 'respect', 'important'],
        'Safe': ['security', 'trust', 'reliable', 'risk', 'fear', 'uncertain', 'confidence', 'worried', 'anxious', 'stable'],
        'Supported': ['alone', 'guidance', 'mentor', 'community', 'help', 'isolated', 'support', 'team', 'together'],
        'Successful': ['achieve', 'results', 'goals', 'accomplish', 'progress', 'stuck', 'failure', 'success', 'grow'],
        'Surprise & Delight': ['creative', 'innovation', 'boring', 'exciting', 'fresh', 'new', 'different', 'inspired', 'amazing'],
        'Sharing': ['community', 'share', 'together', 'contribute', 'belong', 'connect', 'social', 'proud', 'give back'],
    };

    let maxScore = 0;
    let maxCategory: SixSCategory = 'Successful';

    for (const [category, keywords] of Object.entries(sixSPatterns) as [SixSCategory, string[]][]) {
        const score = keywords.filter(keyword => textLower.includes(keyword)).length;
        if (score > maxScore) {
            maxScore = score;
            maxCategory = category;
        }
    }

    return maxCategory;
}
