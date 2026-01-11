// Reddit API calls are proxied through /api/search/reddit

interface RedditPost {
    data: {
        id: string;
        title: string;
        selftext: string;
        author: string;
        subreddit: string;
        created_utc: number;
        score: number;
        num_comments: number;
        permalink: string;
        url: string;
    };
}

import type { SixSCategory } from './market-intel-api';

export interface RedditQuote {
    text: string;
    author: string;
    subreddit: string;
    url: string;
    upvotes: number;
    timestamp: string;
    relevanceScore: number;
    emotionalTone: SixSCategory;
}

/**
 * Determine relevant subreddits based on ICP target audience
 */
function suggestSubreddits(targetAudience: string): string[] {
    const audienceLower = targetAudience.toLowerCase();
    const subreddits: string[] = [];

    // Common business/marketing subreddits
    if (audienceLower.includes('entrepreneur') || audienceLower.includes('business')) {
        subreddits.push('Entrepreneur', 'smallbusiness', 'startups');
    }

    if (audienceLower.includes('market') || audienceLower.includes('sales')) {
        subreddits.push('marketing', 'sales', 'socialmedia');
    }

    if (audienceLower.includes('saas') || audienceLower.includes('software')) {
        subreddits.push('SaaS', 'software', 'webdev');
    }

    if (audienceLower.includes('creator') || audienceLower.includes('content')) {
        subreddits.push('content_marketing', 'ContentCreation', 'YouTubers');
    }

    if (audienceLower.includes('freelance') || audienceLower.includes('consultant')) {
        subreddits.push('freelance', 'consulting', 'digitalnomad');
    }

    // Default fallback
    if (subreddits.length === 0) {
        subreddits.push('Entrepreneur', 'AskReddit', 'business');
    }

    return [...new Set(subreddits)]; // Remove duplicates
}

/**
 * Search Reddit for relevant posts and comments
 */
export async function searchReddit(
    keywords: string,
    targetAudience: string,
    limit: number = 15
): Promise<RedditQuote[]> {
    try {
        const subreddits = suggestSubreddits(targetAudience);
        const quotes: RedditQuote[] = [];

        // Search across multiple subreddits via proxy
        for (const subreddit of subreddits.slice(0, 3)) { // Limit to 3 subreddits to avoid rate limits
            try {
                const response = await fetch('/api/search/reddit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keywords,
                        subreddit,
                        limit: 10,
                        sort: 'relevance',
                        time: 'year',
                    }),
                });

                if (!response.ok) {
                    console.warn(`Reddit search failed for r/${subreddit}:`, response.statusText);
                    continue;
                }

                const data = await response.json();
                const posts: RedditPost[] = data.data?.children || [];

                // Extract quotes from posts
                for (const post of posts) {
                    if (quotes.length >= limit) break;

                    const text = post.data.selftext || post.data.title;
                    if (!text || text.length < 50) continue; // Skip very short posts

                    const quote: RedditQuote = {
                        text: text.slice(0, 500), // Limit length
                        author: post.data.author,
                        subreddit: `r/${post.data.subreddit}`,
                        url: `https://reddit.com${post.data.permalink}`,
                        upvotes: post.data.score,
                        timestamp: new Date(post.data.created_utc * 1000).toISOString().split('T')[0],
                        relevanceScore: calculateRelevanceScore(text, keywords, post.data.score),
                        emotionalTone: detectEmotionalTone(text),
                    };

                    quotes.push(quote);
                }

                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.warn(`Error searching r/${subreddit}:`, error);
                continue;
            }
        }

        // Sort by relevance score and return top quotes
        return quotes
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);

    } catch (error) {
        console.error('Reddit search error:', error);
        return []; // Return empty array on failure (will fall back to AI-generated)
    }
}

/**
 * Calculate relevance score based on keyword match and upvotes
 */
function calculateRelevanceScore(text: string, keywords: string, upvotes: number): number {
    const textLower = text.toLowerCase();
    const keywordsLower = keywords.toLowerCase().split(' ');

    // Count keyword matches
    let keywordMatches = 0;
    for (const keyword of keywordsLower) {
        if (textLower.includes(keyword)) {
            keywordMatches++;
        }
    }

    // Score = (keyword matches * 20) + (upvotes normalized to 0-40)
    const keywordScore = (keywordMatches / keywordsLower.length) * 60;
    const upvoteScore = Math.min(upvotes / 10, 40); // Max 40 points from upvotes

    return Math.round(keywordScore + upvoteScore);
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
            if (textLower.includes(keyword)) scores[category]++;
        });
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'Successful';

    return (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as SixSCategory) || 'Successful';
}

/**
 * Get suggested subreddits for display
 */
export function getSuggestedSubreddits(targetAudience: string): string[] {
    return suggestSubreddits(targetAudience);
}

/**
 * Reddit Sentiment Analysis (TOS-compliant)
 *
 * IMPORTANT: This function does NOT return direct quotes.
 * It only returns aggregated sentiment data for market validation.
 * Per Reddit's Terms of Service, we cannot display user content directly.
 */
export interface RedditSentimentResult {
    analyzed: boolean;
    postCount: number;
    overallSentiment: 'negative' | 'mixed' | 'positive';
    topThemes: string[];
    communityInsight: string; // AI-summarized, not direct quotes
}

/**
 * Analyze Reddit posts for sentiment WITHOUT returning direct quotes
 * This is TOS-compliant as we only show aggregated insights
 */
export async function analyzeRedditSentiment(
    keywords: string,
    targetAudience: string
): Promise<RedditSentimentResult> {
    try {
        const subreddits = suggestSubreddits(targetAudience);

        let totalPosts = 0;
        let sentimentCounts = { frustrated: 0, hopeful: 0, desperate: 0, skeptical: 0, determined: 0 };
        let themeWords: Map<string, number> = new Map();

        // Collect posts for analysis (NOT for display) via proxy
        for (const subreddit of subreddits.slice(0, 3)) {
            try {
                const response = await fetch('/api/search/reddit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keywords,
                        subreddit,
                        limit: 25,
                        sort: 'relevance',
                        time: 'year',
                    }),
                });

                if (!response.ok) continue;

                const data = await response.json();
                const posts: RedditPost[] = data.data?.children || [];

                for (const post of posts) {
                    const text = (post.data.selftext || post.data.title || '').toLowerCase();
                    if (text.length < 20) continue;

                    totalPosts++;

                    // Aggregate sentiment (not storing actual content)
                    const tone = detectEmotionalTone(text);
                    sentimentCounts[tone]++;

                    // Extract common theme words (generic, not quotes)
                    const words = text.split(/\s+/).filter(w => w.length > 5);
                    for (const word of words.slice(0, 10)) {
                        const cleanWord = word.replace(/[^a-z]/g, '');
                        if (cleanWord.length > 5 && !isStopWord(cleanWord)) {
                            themeWords.set(cleanWord, (themeWords.get(cleanWord) || 0) + 1);
                        }
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                continue;
            }
        }

        if (totalPosts === 0) {
            return {
                analyzed: false,
                postCount: 0,
                overallSentiment: 'mixed',
                topThemes: [],
                communityInsight: 'No relevant Reddit discussions found.',
            };
        }

        // Calculate overall sentiment
        const negativeCount = sentimentCounts.frustrated + sentimentCounts.desperate + sentimentCounts.skeptical;
        const positiveCount = sentimentCounts.hopeful + sentimentCounts.determined;
        let overallSentiment: 'negative' | 'mixed' | 'positive' = 'mixed';
        if (negativeCount > positiveCount * 1.5) overallSentiment = 'negative';
        else if (positiveCount > negativeCount * 1.5) overallSentiment = 'positive';

        // Get top themes (generic words, not quotes)
        const topThemes = Array.from(themeWords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        // Generate insight summary (AI-style, not direct quotes)
        const dominantEmotion = Object.entries(sentimentCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const communityInsight = generateCommunityInsight(
            totalPosts,
            overallSentiment,
            dominantEmotion,
            topThemes,
            subreddits.slice(0, 3)
        );

        return {
            analyzed: true,
            postCount: totalPosts,
            overallSentiment,
            topThemes,
            communityInsight,
        };

    } catch (error) {
        console.error('Reddit sentiment analysis error:', error);
        return {
            analyzed: false,
            postCount: 0,
            overallSentiment: 'mixed',
            topThemes: [],
            communityInsight: 'Reddit analysis unavailable.',
        };
    }
}

/**
 * Check if word is a common stop word
 */
function isStopWord(word: string): boolean {
    const stopWords = [
        'about', 'after', 'again', 'being', 'before', 'between', 'could', 'during',
        'every', 'first', 'found', 'getting', 'going', 'having', 'information',
        'people', 'really', 'something', 'their', 'there', 'these', 'thing', 'think',
        'thought', 'through', 'trying', 'using', 'where', 'which', 'while', 'would',
    ];
    return stopWords.includes(word);
}

/**
 * Generate a community insight summary (not direct quotes)
 */
function generateCommunityInsight(
    postCount: number,
    sentiment: string,
    dominantEmotion: string,
    themes: string[],
    subreddits: string[]
): string {
    const subredditStr = subreddits.map(s => `r/${s}`).join(', ');
    const themeStr = themes.length > 0 ? themes.slice(0, 3).join(', ') : 'various topics';

    const sentimentDescriptions = {
        negative: 'expressing frustration and seeking solutions',
        mixed: 'showing varied perspectives on the topic',
        positive: 'sharing successes and optimistic outlooks',
    };

    return `Analysis of ${postCount} posts from ${subredditStr} shows the community is ${sentimentDescriptions[sentiment as keyof typeof sentimentDescriptions]}. Common themes include: ${themeStr}. The dominant emotional tone is ${dominantEmotion}.`;
}
