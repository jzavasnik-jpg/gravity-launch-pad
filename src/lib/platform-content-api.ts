const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

import type { PainSynopsisResult } from './pain-synopsis-api';
import type { StrategyRecommendation } from './strategy-api';
import { PLATFORM_CONSTRAINTS, getPlatformTemplate, validatePlatformContent } from './platform-templates';

export interface PlatformContentVariant {
    id: string;
    content: string;
    hook?: string;
    cta?: string;
    thumbnailUrl?: string; // Generated thumbnail URL
    hashtags?: string[];
    // Platform-specific
    threadPosts?: string[]; // Twitter
    sections?: { heading: string; body: string }[]; // LinkedIn
    subreddit?: string; // Reddit
    flair?: string; // Reddit
    scriptTimestamps?: { time: string; text: string; visual: string }[]; // YouTube Shorts
    onScreenText?: string[]; // TikTok
}

export interface PlatformContent {
    platform: string;
    displayName: string;
    icon: string;
    variants: PlatformContentVariant[];
    validation: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}

/**
 * Generate platform-optimized content based on strategy
 */
export async function generatePlatformContent(
    platform: string,
    strategy: StrategyRecommendation,
    painSynopsis: PainSynopsisResult,
    productName: string,
    assets: any[] = [],
    variantCount: number = 2
): Promise<PlatformContent> {

    const constraints = PLATFORM_CONSTRAINTS[platform];
    if (!constraints) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    const template = getPlatformTemplate(strategy.framework.name, platform);

    // Extract asset context
    const assetContext = assets.length > 0
        ? `\n**Product Visual Context (Use this to describe visuals):**\n${assets.map(a => `- ${a.name}: ${a.description || 'No description'}`).join('\n')}`
        : '';

    const prompt = `You are a ${constraints.displayName} content expert creating platform-optimized content.

**Product/Service:**
- Name: ${productName}
${assetContext}

**Customer Context:**
- Struggle: ${painSynopsis.storyBeats.struggle}
- Insight: ${painSynopsis.storyBeats.insight}
- Transformation: ${painSynopsis.storyBeats.transformation}

**Content Strategy:**
- Framework: ${strategy.framework.name}
- Hook/Trigger: ${strategy.triggers[0]?.hook || strategy.suggestedHeadline}
- CTA: ${strategy.suggestedCTA}

**Platform Guidelines (${constraints.displayName}):**
- Tone: ${constraints.toneGuidelines}
- Structure: ${constraints.recommendedStructure}
${constraints.maxLength ? `- Max length: ${constraints.maxLength} characters` : ''}
${constraints.forbiddenPhrases ? `- FORBIDDEN: ${constraints.forbiddenPhrases.join(', ')}` : ''}

**Template to adapt:**
${template || 'Create original content following the framework'}

Generate ${variantCount} different variants optimized for ${constraints.displayName}.
CRITICAL: You MUST mention the product name "${productName}" naturally in the content where appropriate (e.g. in the CTA or as the solution).

Return JSON:
{
  "variants": [
    {
      "id": "1",
      ${platform === 'youtube' || platform === 'tiktok' ? '"content": "FULL VIDEO SCRIPT: Include [Visual] cues, (Voiceover) narration, and dialogue. Do not just summarize.",' : '"content": "Full content text for ${platform}",'}
      "hook": "Opening hook/first line",
      "cta": "Call to action",
      ${platform === 'twitter' ? '"threadPosts": ["Tweet 1", "Tweet 2", "Tweet 3"],' : ''}
      ${platform === 'linkedin' ? '"sections": [{"heading": "Section title", "body": "Section content"}],' : ''}
      ${platform === 'reddit' ? '"subreddit": "r/relevantsubreddit", "flair": "Discussion",' : ''}
      ${platform === 'youtube' ? '"scriptTimestamps": [{"time": "0-3s", "text": "Hook text", "visual": "What to show"}],' : ''}
      ${platform === 'instagram' || platform === 'tiktok' ? '"hashtags": ["hashtag1", "hashtag2"],' : ''}
      ${platform === 'tiktok' ? '"onScreenText": ["Text overlay 1", "Text overlay 2"]' : ''}
    }
  ]
}

Make each variant distinctly different. Follow platform best practices strictly.`;

    try {
        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are a ${constraints.displayName} content expert. You create engaging, platform-optimized content that follows best practices and drives engagement.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content || '{}');

        // Validate each variant
        const variants = result.variants || [];
        const validation = validatePlatformContent(
            variants[0]?.content || '',
            platform
        );

        return {
            platform,
            displayName: constraints.displayName,
            icon: constraints.icon,
            variants,
            validation,
        };

    } catch (error) {
        console.error(`Error generating ${platform} content:`, error);

        // Fallback content
        return generateFallbackContent(platform, strategy, painSynopsis);
    }
}

/**
 * Generate content for all platforms at once
 */
export async function generateAllPlatformContent(
    platforms: string[],
    strategy: StrategyRecommendation,
    painSynopsis: PainSynopsisResult,
    productName: string,
    assets: any[] = []
): Promise<Record<string, PlatformContent>> {

    const results: Record<string, PlatformContent> = {};

    // Generate sequentially to avoid rate limits
    for (const platform of platforms) {
        try {
            results[platform] = await generatePlatformContent(platform, strategy, painSynopsis, productName, assets, 2);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to generate ${platform} content:`, error);
            results[platform] = generateFallbackContent(platform, strategy, painSynopsis);
        }
    }

    return results;
}

/**
 * Regenerate a single variant for a platform
 */
export async function regeneratePlatformVariant(
    platform: string,
    strategy: StrategyRecommendation,
    painSynopsis: PainSynopsisResult,
    productName: string
): Promise<PlatformContentVariant> {

    const content = await generatePlatformContent(platform, strategy, painSynopsis, productName, 1);
    return content.variants[0];
}

/**
 * Fallback content generation
 */
function generateFallbackContent(
    platform: string,
    strategy: StrategyRecommendation,
    painSynopsis: PainSynopsisResult
): PlatformContent {

    const constraints = PLATFORM_CONSTRAINTS[platform] || PLATFORM_CONSTRAINTS['twitter'];

    const baseContent = `${strategy.triggers[0]?.hook || strategy.suggestedHeadline}

${painSynopsis.storyBeats.insight}

${strategy.suggestedCTA}`;

    return {
        platform,
        displayName: constraints.displayName,
        icon: constraints.icon,
        variants: [
            {
                id: '1',
                content: baseContent,
                hook: strategy.triggers[0]?.hook || strategy.suggestedHeadline,
                cta: strategy.suggestedCTA,
            }
        ],
        validation: validatePlatformContent(baseContent, platform),
    };
}
