import type { PainSynopsisResult } from './pain-synopsis-api';
import type { MarketIntelligence } from './market-intel-api';
import type {
    SixSGap,
    StrategyCandidate,
    StoryStrategy,
    StoryStrategyInputs,
    TemperatureStrategy,
    MarketingStatements as MarketingStatementsType,
    Hook,
} from '@/store/projectStore';
import type { SixS, Temperature, DesireMarket, ContentFrameworkId, PsychologicalTriggerId } from './six-s-constants';
import {
    TEMPERATURE_DEFINITIONS,
    SIX_S_DEFINITIONS,
    getGapPriority,
    normalizeSixSCategory,
    ALL_SIX_S,
    CONTENT_FRAMEWORK_DEFINITIONS,
    PSYCHOLOGICAL_TRIGGER_DEFINITIONS,
} from './six-s-constants';

const API_BASE = 'http://localhost:3001';

// Helper to strip markdown formatting from AI-generated text
function stripMarkdown(text: string): string {
    if (!text) return text;
    // Remove bold (**text** or __text__)
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Remove italic (*text* or _text_) - be careful not to remove single asterisks in other contexts
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1');
}

export interface ContentFramework {
    name: string;
    description: string;
    structure: string[];
    bestFor: string;
    examples: string[];
}

export interface PsychologicalTrigger {
    name: string;
    description: string;
    hook: string;
    marketEvidence: string;
    relevanceScore: number; // 1-100
}

export interface StrategyRecommendation {
    framework: {
        name: string;
        reasoning: string;
        marketFit: number; // percentage
        structure: string[];
        examples: string[];
    };
    triggers: PsychologicalTrigger[];
    aiReasoning: string;
    suggestedHeadline: string;
    suggestedCTA: string;
}

/**
 * Generate content strategy recommendation based on pain synopsis and market intelligence
 */
export async function generateContentStrategy(
    painSynopsis: PainSynopsisResult,
    marketIntel: MarketIntelligence,
    marketingStatements?: any
): Promise<StrategyRecommendation> {

    const prompt = `You are a content strategy expert who creates data-driven content frameworks.

**Customer Context:**
- Name: ${painSynopsis.psychologicalProfile ? 'their avatar' : 'the customer'}
- Core Desire: ${painSynopsis.psychologicalProfile.coreDesire}
- Primary Emotion: ${painSynopsis.psychologicalProfile.primaryEmotion}
- Current Struggle: ${painSynopsis.storyBeats.struggle}
- Transformation Goal: ${painSynopsis.storyBeats.transformation}

**Market Intelligence:**
- Urgency Level: ${marketIntel?.sentiment?.urgency || 'Unknown'}
- Top Emotions: ${marketIntel?.sentiment?.topEmotions?.join(', ') || 'Not analyzed'}
- Common Phrases: ${marketIntel?.languagePatterns?.commonPhrases?.slice(0, 5).join(', ') || 'Not analyzed'}
- Emotional Triggers: ${marketIntel?.languagePatterns?.emotionalTriggers?.join(', ') || 'Not analyzed'}

**Your Marketing Promise:**
${marketingStatements ? JSON.stringify(marketingStatements, null, 2) : 'Transform their situation'}

Based on this data, recommend:

1. **Best Content Framework** - Choose ONE that fits the data:
   - Before/After Contrast (show transformation)
   - Problem-Agitate-Solve (amplify pain then offer solution)
   - Hero's Journey (position customer as hero)
   - The Curiosity Gap (tease insight they're missing)
   - Social Proof Story (others like them succeeded)
   - The Simple Truth (cut through complexity)

2. **3 Psychological Triggers** - Create specific hooks using:
   - Loss Aversion (what they're losing by waiting)
   - Social Proof (others in their situation)
   - Authority/Expertise (your unique insight)
   - Scarcity/Urgency (time-sensitive opportunity)
   - Progress/Momentum (quick wins available)

Generate response in this JSON format:

{
  "framework": {
    "name": "Before/After Contrast",
    "reasoning": "WHY you chose this based on urgency level (${marketIntel.sentiment.urgency}), top emotions, and market evidence",
    "market Fit": 85,
    "structure": ["Hook: Current painful state", "Insight: What changed", "Transformation: New reality", "CTA: How to start"],
    "examples": ["Quote from market intel supporting this approach"]
  },
  "triggers": [
    {
      "name": "Loss Aversion",
      "description": "Highlight what they're losing every day they wait",
      "hook": "Still using [painful current state]? Here's what you're losing...",
      "marketEvidence": "Quote from Reddit showing this pain",
      "relevanceScore": 95
    },
    {
      "name": "Social Proof",
      "description": "Show others escaped this exact situation",
      "hook": "[Number] people in [subreddit] made the switch. Here's what happened...",
      "marketEvidence": "Reference to upvote count or community consensus",
      "relevanceScore": 88
    },
    {
      "name": "Progress/Momentum",
      "description": "Promise quick, visible progress",
      "hook": "From [painful state] to [desired state] in [timeframe]",
      "marketEvidence": "Common desire mentioned in quotes",
      "relevanceScore": 82
    }
  ],
  "aiReasoning": "I chose [Framework] because your market shows [evidence]. The dominant emotion is [emotion] with [intensity] pain, which responds best to [approach]. The triggers leverage [market patterns] I found in the quotes.",
  "suggestedHeadline": "Powerful headline using framework + trigger",
  "suggestedCTA": "Clear call-to-action aligned with transformation"
}

Be specific. Reference actual market data. Explain your choices clearly.`;

    try {
        // Use backend proxy for Gemini API
        console.log('[Content Strategy] Generating content strategy via backend proxy...');

        const systemPrompt = 'You are a content strategy expert who creates data-driven, evidence-based content frameworks. You explain your reasoning clearly and reference market data.';

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'medium', // Medium thinking budget for strategy generation
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Content Strategy] Strategy generation complete');
        return result as StrategyRecommendation;

    } catch (error) {
        console.error('Error generating content strategy:', error);

        // Fallback strategy
        return {
            framework: {
                name: 'Before/After Contrast',
                reasoning: `Based on ${marketIntel.sentiment.urgency} urgency and emotional patterns in the market data, showing transformation is most effective.`,
                marketFit: 80,
                structure: [
                    'Hook: Current painful reality',
                    'Agitate: Why it\'s getting worse',
                    'Transformation: What changed',
                    'Proof: Results and evidence',
                    'CTA: How to start'
                ],
                examples: marketIntel?.quotes?.slice(0, 2).map(q => q.text?.slice(0, 100)) || [],
            },
            triggers: [
                {
                    name: 'Loss Aversion',
                    description: 'Highlight the cost of inaction',
                    hook: `Still ${painSynopsis.storyBeats.struggle}? Here's what it's costing you...`,
                    marketEvidence: marketIntel?.quotes?.[0]?.text || 'Market evidence',
                    relevanceScore: 90,
                },
                {
                    name: 'Social Proof',
                    description: 'Show others who solved this',
                    hook: `${marketIntel?.quotes?.length || 0}+ people facing this exact challenge found a solution...`,
                    marketEvidence: `Discussion across ${marketIntel?.suggestedSubreddits?.join(', ') || 'various communities'}`,
                    relevanceScore: 85,
                },
                {
                    name: 'Progress/Momentum',
                    description: 'Promise quick visible progress',
                    hook: `${painSynopsis?.storyBeats?.transformation || 'Transform your situation'}`,
                    marketEvidence: painSynopsis?.psychologicalProfile?.idealOutcome || 'Achieve your goals',
                    relevanceScore: 80,
                },
            ],
            aiReasoning: `Selected Before/After Contrast framework based on clear transformation potential and market evidence. Triggers leverage emotional patterns: ${marketIntel?.languagePatterns?.emotionalTriggers?.join(', ') || 'various patterns'}.`,
            suggestedHeadline: `How to Transform ${painSynopsis?.storyBeats?.struggle || 'your current situation'} into ${painSynopsis?.storyBeats?.transformation || 'success'}`,
            suggestedCTA: 'Start Your Transformation Now',
        };
    }
}

/**
 * Regenerate a specific trigger with new angle
 */
export async function regenerateTrigger(
    triggerName: string,
    painSynopsis: PainSynopsisResult,
    marketIntel: MarketIntelligence
): Promise<PsychologicalTrigger> {

    const prompt = `Create a compelling ${triggerName} trigger hook for content about:

**Customer's Pain:** ${painSynopsis.storyBeats.struggle}
**Transformation:** ${painSynopsis.storyBeats.transformation}
**Market Evidence:** ${marketIntel?.quotes?.slice(0, 3).map(q => q.text?.slice(0, 100)).join('; ') || 'No market evidence available'}

Return JSON:
{
  "name": "${triggerName}",
  "description": "Brief explanation",
  "hook": "Compelling hook text",
  "marketEvidence": "Reference to market data",
  "relevanceScore": 85
}`;

    try {
        // Use backend proxy for Gemini API
        console.log(`[Trigger Regeneration] Regenerating ${triggerName} trigger...`);

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt: 'You are an expert at crafting psychological triggers for marketing content. Create compelling, evidence-based triggers.',
                userPrompt: prompt,
                thinkingBudget: 'low', // Low thinking budget for trigger regeneration
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Trigger Regeneration] ${triggerName} trigger regenerated`);
        return result;
    } catch (error) {
        console.error('Error regenerating trigger:', error);
        throw error;
    }
}

// ============================================
// SIX S GAP ANALYSIS
// ============================================

/**
 * Analyze market intelligence to identify Six S emotional gaps
 * Returns gap scores for each of the 6 emotional needs
 */
export async function analyzeSixSGaps(
    marketIntel: MarketIntelligence,
    painSynopsis: PainSynopsisResult
): Promise<SixSGap[]> {
    // AUTHENTIC VALIDATION: Use only real quotes for Six S analysis
    // Sort by relevance score to prioritize most relevant quotes
    const sortedQuotes = [...marketIntel.quotes].sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Use up to 8000 characters for robust analysis
    const quotes = sortedQuotes.map(q => `[${q.source}] ${q.text}`).join('\n');
    const emotionalTriggers = marketIntel.languagePatterns.emotionalTriggers.join(', ');

    // Log stats for debugging
    console.log(`[Six S Gap Analysis] Using ${marketIntel.quotes.length} REAL quotes for authentic analysis`);

    const prompt = `You are an emotional intelligence analyst specializing in the Six S Framework for customer emotional needs.

**CRITICAL: Use EXACTLY these category keys (lowercase, no variations):**
- "significant" (feeling seen, recognized, identity)
- "safe" (trust, security, reliability)
- "supported" (guidance, help, partnership)
- "successful" (progress, validation, milestones)
- "surprise" (unexpected joy, delight, exceeding expectations)
- "share" (advocacy, telling others, word-of-mouth)

**Six S Framework Details:**
${Object.entries(SIX_S_DEFINITIONS).map(([key, def]) => `
- "${key}": ${def.question}
  Keywords: ${def.keywords.join(', ')}
`).join('')}

**Voice of Customer Quotes (prioritized by source authenticity):**
${quotes.slice(0, 8000)}

**Customer Profile:**
Core Desire: ${painSynopsis.psychologicalProfile.coreDesire}
Primary Emotion: ${painSynopsis.psychologicalProfile.primaryEmotion}
Current Struggle: ${painSynopsis.storyBeats.struggle}

**Your Task:**
Analyze the quotes and assign a GAP SCORE (0-100) for EACH of the 6 categories.
- 80-100: CRITICAL - market is screaming for this
- 60-79: STRONG - significant presence
- 40-59: BASELINE - present but not dominant
- 20-39: DELIVERY - save for fulfillment
- 0-19: OUTCOME - result of good delivery

You MUST return exactly 6 gaps, one for each category.

Return JSON:
{
  "gaps": [
    {"category": "significant", "gapScore": 85, "marketEvidence": ["quote1", "quote2"], "voiceOfCustomer": ["phrase1", "phrase2"], "reasoning": "why"},
    {"category": "safe", "gapScore": 70, "marketEvidence": ["quote1"], "voiceOfCustomer": ["phrase1"], "reasoning": "why"},
    {"category": "supported", "gapScore": 60, "marketEvidence": ["quote1"], "voiceOfCustomer": ["phrase1"], "reasoning": "why"},
    {"category": "successful", "gapScore": 45, "marketEvidence": ["quote1"], "voiceOfCustomer": ["phrase1"], "reasoning": "why"},
    {"category": "surprise", "gapScore": 30, "marketEvidence": ["quote1"], "voiceOfCustomer": ["phrase1"], "reasoning": "why"},
    {"category": "share", "gapScore": 20, "marketEvidence": ["quote1"], "voiceOfCustomer": ["phrase1"], "reasoning": "why"}
  ],
  "dominantGap": "significant",
  "secondaryGap": "supported"
}`;

    try {
        // Use deep thinking endpoint for thorough emotional analysis
        console.log('[Six S Gap Analysis] Using deep thinking model (Gemini 2.5 Pro) for thorough emotional analysis...');

        const systemPrompt = 'You are an expert emotional intelligence analyst. Analyze market data through the lens of the Six S Framework. Be precise with scores and always cite evidence. Take your time to deeply analyze the emotional patterns in the quotes.';

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'high', // Use high thinking budget for thorough emotional analysis
            })
        });

        if (!response.ok) {
            throw new Error(`Deep thinking API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Six S Gap Analysis] Deep thinking analysis complete');

        // Transform API response to SixSGap format with category normalization
        const processedGaps: SixSGap[] = [];
        const seenCategories = new Set<SixS>();

        for (const gap of result.gaps || []) {
            // Normalize the category (handles "surprise & delight" → "surprise", etc.)
            const normalizedCategory = normalizeSixSCategory(gap.category);

            if (!normalizedCategory) {
                console.warn(`Skipping unrecognized Six S category: "${gap.category}"`);
                continue;
            }

            // Skip duplicates (in case AI returns both "surprise" and "surprise & delight")
            if (seenCategories.has(normalizedCategory)) {
                console.log(`Skipping duplicate category: "${gap.category}" (normalized to "${normalizedCategory}")`);
                continue;
            }

            seenCategories.add(normalizedCategory);
            const definition = SIX_S_DEFINITIONS[normalizedCategory];

            processedGaps.push({
                category: normalizedCategory,
                label: definition.label,
                question: definition.question,
                gapScore: gap.gapScore,
                marketEvidence: gap.marketEvidence || [],
                voiceOfCustomer: gap.voiceOfCustomer || [],
                priority: getGapPriority(gap.gapScore).priority,
            });
        }

        // Ensure we have all 6 categories - fill in any missing with baseline scores
        for (const sixS of ALL_SIX_S) {
            if (!seenCategories.has(sixS)) {
                const definition = SIX_S_DEFINITIONS[sixS];
                processedGaps.push({
                    category: sixS,
                    label: definition.label,
                    question: definition.question,
                    gapScore: 50, // Baseline score for missing categories
                    marketEvidence: [],
                    voiceOfCustomer: [],
                    priority: 'baseline',
                });
            }
        }

        return processedGaps;

    } catch (error) {
        console.error('Error analyzing Six S gaps:', error);

        // Return default gaps with baseline scores
        return Object.entries(SIX_S_DEFINITIONS).map(([key, def]) => ({
            category: key as SixS,
            label: def.label,
            question: def.question,
            gapScore: 50,
            marketEvidence: [],
            voiceOfCustomer: [],
            priority: 'baseline' as const,
        }));
    }
}

// ============================================
// STRATEGY CANDIDATES GENERATION
// ============================================

/**
 * Generate 3 strategy candidates based on Six S gaps and marketing statements
 * Returns recommended, runner-up, and rejected strategies with reasoning
 */
export async function generateStrategyCandidates(
    sixSGaps: SixSGap[],
    marketingStatements: MarketingStatementsType,
    painSynopsis: PainSynopsisResult,
    marketIntel: MarketIntelligence,
    productName?: string
): Promise<StrategyCandidate[]> {
    // Sort gaps by score to identify primary and secondary
    const sortedGaps = [...sixSGaps].sort((a, b) => b.gapScore - a.gapScore);
    const primaryGap = sortedGaps[0];
    const secondaryGap = sortedGaps[1];

    // Get product name with multiple fallback sources
    const displayProductName = productName && productName.trim() !== ''
        ? productName
        : (marketingStatements as any)?.product_name
        || 'the product';

    console.log('[Strategy Candidates] Product name being used:', displayProductName);
    console.log('[Strategy Candidates] Product name sources:', {
        fromParam: productName,
        fromMarketingStatements: (marketingStatements as any)?.product_name
    });

    const prompt = `You are a content strategist specializing in emotional messaging for "${displayProductName}".

**Product Name (USE THIS EXACT NAME):** ${displayProductName}

**Six S Gap Analysis:**
${sortedGaps.map(g => `- ${g.label}: ${g.gapScore}/100 (${g.priority})`).join('\n')}

Primary Gap: ${primaryGap.label} (${primaryGap.gapScore}/100)
Secondary Gap: ${secondaryGap.label} (${secondaryGap.gapScore}/100)

**Marketing Statements (CONSTANTS - these don't change):**
Promise: ${marketingStatements.promise}
Problem: ${marketingStatements.problem}
Solution: ${marketingStatements.solution}
Transformation: ${marketingStatements.transformation}

**Customer Context:**
Core Desire: ${painSynopsis?.psychologicalProfile?.coreDesire || 'Not specified'}
Primary Emotion: ${painSynopsis?.psychologicalProfile?.primaryEmotion || 'Not specified'}
Urgency Level: ${marketIntel?.sentiment?.urgency || 'Medium'}

**Your Task:**
Generate 3 strategy candidates, each taking a different angle on how to express the SAME marketing promise through the lens of the Six S emotional needs.

Remember: The marketing statements are CONSTANTS. We're choosing HOW to express them, not WHAT to say.

**CRITICAL INSTRUCTION FOR hookPreview:**
- The "hookPreview" field MUST include the LITERAL product name "${displayProductName}" - write it out exactly as shown
- Do NOT use placeholders like "your product", "the product", "[product name]", "**your product**"
- Do NOT make up fake product names like "AuraFlow", "Zenith", "Spark"
- CORRECT example: "I was skeptical until ${displayProductName} completely changed how I approach my business..."
- WRONG example: "I was skeptical until **your product** completely changed..."

Return JSON with hookPreview containing the literal text "${displayProductName}":
{
  "candidates": [
    {
      "id": "strategy_1",
      "name": "The Significance Play",
      "primarySixS": "significant",
      "secondarySixS": "supported",
      "angle": "Lead with recognition and validation messaging",
      "whyItWorks": "Based on gap analysis showing need for recognition",
      "riskFactors": "May feel too emotional for analytical buyers",
      "hookPreview": "Finally, ${displayProductName} made me feel like someone actually understood my struggle...",
      "confidenceScore": 92,
      "recommendation": "recommended"
    },
    {
      "id": "strategy_2",
      "name": "The Safety-First Approach",
      "primarySixS": "safe",
      "secondarySixS": "successful",
      "angle": "Lead with trust, proof, and risk removal",
      "whyItWorks": "Addresses skepticism in the market",
      "riskFactors": "May not create enough urgency",
      "hookPreview": "I tested ${displayProductName} for 30 days and here's what happened...",
      "confidenceScore": 78,
      "recommendation": "runner_up"
    },
    {
      "id": "strategy_3",
      "name": "The Quick-Win Promise",
      "primarySixS": "successful",
      "secondarySixS": "surprise",
      "angle": "Lead with immediate results and milestones",
      "whyItWorks": "Success-oriented messaging for achievement seekers",
      "riskFactors": "Lower gap score means less market demand",
      "hookPreview": "Within 48 hours of using ${displayProductName}, I saw my first result...",
      "confidenceScore": 58,
      "recommendation": "rejected"
    }
  ],
  "analysisReasoning": "Explanation of ranking based on gap scores"
}`;

    try {
        // Use deep thinking endpoint for thorough strategy analysis
        console.log('[Strategy Candidates] Using deep thinking model (Gemini 2.5 Pro) for strategy generation...');

        const systemPrompt = 'You are a strategic content advisor. Generate distinct strategy options with clear trade-offs. Be honest about risks and confidence levels. Take your time to deeply consider each strategy angle.';

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'medium', // Medium thinking budget for strategy generation
            })
        });

        if (!response.ok) {
            throw new Error(`Deep thinking API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Strategy Candidates] Deep thinking strategy generation complete');

        return (result.candidates || []).map((c: any) => {
            // Normalize Six S categories from AI response
            const primarySixS = normalizeSixSCategory(c.primarySixS) || 'significant';
            const secondarySixS = normalizeSixSCategory(c.secondarySixS) || 'supported';

            return {
                id: c.id,
                name: c.name,
                primarySixS,
                secondarySixS,
                angle: c.angle,
                whyItWorks: c.whyItWorks,
                riskFactors: c.riskFactors,
                hookPreview: stripMarkdown(c.hookPreview),
                confidenceScore: c.confidenceScore,
                recommendation: c.recommendation as 'recommended' | 'runner_up' | 'rejected',
            };
        });

    } catch (error) {
        console.error('Error generating strategy candidates:', error);

        // Return default candidates
        return [
            {
                id: 'default_1',
                name: 'Primary Emotional Play',
                primarySixS: primaryGap.category,
                secondarySixS: secondaryGap.category,
                angle: `Lead with ${primaryGap.label} messaging`,
                whyItWorks: `${primaryGap.label} shows highest gap score (${primaryGap.gapScore}/100)`,
                riskFactors: 'Generated as fallback - review manually',
                hookPreview: marketingStatements.promise,
                confidenceScore: 70,
                recommendation: 'recommended',
            },
        ];
    }
}

// ============================================
// STORY STRATEGY GENERATION (NEW FLOW)
// ============================================

/**
 * Generate 3 Story Strategies based on foundational selections:
 * - Content Framework (how to structure the narrative)
 * - Psychological Trigger (what emotional lever to pull)
 * - Audience Temperature (how aware/ready the audience is)
 *
 * This replaces the old generateStrategyCandidates + generateTemperatureStrategy flow
 * with a single, unified generation that takes all inputs upfront.
 */
// Avatar data interface for strategy generation
export interface AvatarContext {
    name?: string;
    occupation?: string;
    age?: number;
    dreams?: string[];
    daily_challenges?: string[];
    buying_triggers?: string[];
    pain_points?: string[];
    core_desire?: string;
}

export async function generateStoryStrategies(
    // Required foundational inputs
    frameworkId: ContentFrameworkId,
    triggerId: PsychologicalTriggerId,
    temperature: Temperature,
    // Context from earlier steps
    sixSGaps: SixSGap[],
    marketingStatements: MarketingStatementsType,
    painSynopsis: PainSynopsisResult,
    marketIntel: MarketIntelligence,
    productName?: string,
    avatarData?: AvatarContext
): Promise<StoryStrategy[]> {
    // Get the definitions for selected inputs
    const framework = CONTENT_FRAMEWORK_DEFINITIONS[frameworkId];
    const trigger = PSYCHOLOGICAL_TRIGGER_DEFINITIONS[triggerId];
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];

    // Sort gaps by score to identify primary and secondary
    const sortedGaps = [...sixSGaps].sort((a, b) => b.gapScore - a.gapScore);
    const primaryGap = sortedGaps[0];
    const secondaryGap = sortedGaps[1];

    // Get product name with fallbacks
    const displayProductName = productName && productName.trim() !== ''
        ? productName
        : (marketingStatements as any)?.product_name
        || 'the product';

    console.log('[Story Strategies] Generating with:', {
        framework: framework.name,
        trigger: trigger.name,
        temperature: tempDef.label,
        productName: displayProductName
    });

    const prompt = `You are a content strategist creating Story Strategy options for "${displayProductName}".

**THE USER HAS SELECTED THESE FOUNDATIONAL ELEMENTS:**

1. **CONTENT FRAMEWORK: ${framework.name}** ${framework.icon}
   "${framework.description}"
   Structure: ${framework.structure.join(' → ')}
   Best for: ${framework.bestFor}

2. **PSYCHOLOGICAL TRIGGER: ${trigger.name}** ${trigger.icon}
   "${trigger.description}"
   Hook template pattern: "${trigger.hookTemplate}"

3. **AUDIENCE TEMPERATURE: ${tempDef.label}** ${tempDef.emoji}
   Audience state: ${tempDef.audienceState}
   Communication focus: ${tempDef.communicationFocus}
   Strategy: ${tempDef.strategy}
   CTA style: ${tempDef.ctaStyle}

**SIX S GAP ANALYSIS:**
${sortedGaps.map(g => `- ${g.label}: ${g.gapScore}/100 (${g.priority})`).join('\n')}
Primary emotional gap: ${primaryGap.label} (${primaryGap.gapScore}/100)
Secondary emotional gap: ${secondaryGap.label} (${secondaryGap.gapScore}/100)

**MARKETING CONSTANTS:**
Promise: ${marketingStatements.promise}
Problem: ${marketingStatements.problem}
Solution: ${marketingStatements.solution}
Transformation: ${marketingStatements.transformation}

**TARGET AVATAR (YOUR IDEAL CUSTOMER):**
${avatarData?.name ? `Name: ${avatarData.name}` : ''}
${avatarData?.occupation ? `Role/Occupation: ${avatarData.occupation}` : ''}
${avatarData?.age ? `Age: ${avatarData.age}` : ''}

**AVATAR'S PSYCHOLOGICAL PROFILE:**
Core Desire: ${painSynopsis?.psychologicalProfile?.coreDesire || avatarData?.core_desire || 'Not specified'}
Primary Emotion: ${painSynopsis?.psychologicalProfile?.primaryEmotion || 'Not specified'}
Current State: ${painSynopsis?.psychologicalProfile?.currentState || 'Not specified'}
Blockers: ${painSynopsis?.psychologicalProfile?.blockers?.join(', ') || 'Not specified'}

**AVATAR'S DAILY REALITY:**
${avatarData?.daily_challenges?.length ? `Daily Challenges:\n${avatarData.daily_challenges.map(c => `- ${c}`).join('\n')}` : ''}
${avatarData?.pain_points?.length ? `\nPain Points:\n${avatarData.pain_points.map(p => `- ${p}`).join('\n')}` : ''}
${avatarData?.dreams?.length ? `\nDreams/Aspirations:\n${avatarData.dreams.map(d => `- ${d}`).join('\n')}` : ''}
${avatarData?.buying_triggers?.length ? `\nBuying Triggers:\n${avatarData.buying_triggers.map(t => `- ${t}`).join('\n')}` : ''}

**AVATAR'S STORY ARC:**
Current Struggle: ${painSynopsis?.storyBeats?.struggle || 'Not specified'}
Needed Insight: ${painSynopsis?.storyBeats?.insight || 'Not specified'}
Transformation: ${painSynopsis?.storyBeats?.transformation || 'Not specified'}

**MARKET CONTEXT:**
Urgency Level: ${marketIntel?.sentiment?.urgency || 'Medium'}

**CRITICAL TEMPERATURE RULES FOR HOOK PREVIEWS:**
${temperature === 'cold' ? `
🧊 COLD AUDIENCE HOOK RULES (MUST FOLLOW):
- Lead AWAY from the solution - make them AWARE of the pain first
- Create curiosity and pattern interrupts - NOT solution reveals
- NO direct product mentions or offers in hooks
- NO transformation promises or results claims
- Focus on: "Did you know...", "Most people don't realize...", "Here's what's actually happening..."
- Agitate the pain they didn't know they had
- Make it educational and relatable, NOT salesy
- Example patterns: "The hidden reason why...", "What nobody tells you about...", "I used to think... until I discovered..."
` : ''}${temperature === 'warm' ? `
🔥 WARM AUDIENCE HOOK RULES (MUST FOLLOW):
- Introduce YOU as the answer - they know the problem, show you have the solution
- Include proof elements, specific benefits, or credibility markers
- Balance value with soft solution introduction
- Can mention the product/offer but focus on the JOURNEY
- Focus on: "Here's how I solved...", "The method that changed...", "What happened when I..."
- Show transformation in progress, not just end results
- Example patterns: "After trying everything, I found...", "The 3 steps that finally...", "Here's what worked for me..."
` : ''}${temperature === 'hot' ? `
🔥🔥 HOT AUDIENCE HOOK RULES (MUST FOLLOW):
- Go DIRECT with the offer - they're ready to buy
- Add urgency, scarcity, or deadline elements
- Remove objections IN the hook itself
- Mention "${displayProductName}" directly with clear value prop
- Focus on: "Join now before...", "Last chance to...", "Here's exactly what you get..."
- Make the CTA obvious and compelling
- Example patterns: "Doors close in...", "Only X spots left for...", "This is your sign to finally..."
` : ''}

**YOUR TASK:**
Generate 3 distinct Story Strategy options that ALL use the selected Framework, Trigger, and Temperature.

Each strategy should take a DIFFERENT ANGLE on HOW to apply these foundational elements:
- Recommended: The strongest application of the selections
- Runner-up: A valid alternative approach
- Alternative: A creative/unexpected take

All 3 strategies must:
1. Follow the ${framework.name} structure
2. Leverage the ${trigger.name} psychological trigger
3. Be appropriate for ${tempDef.label} audience temperature
4. Address the ${primaryGap.label} emotional gap
5. Use the avatar's context (their challenges, pain points, occupation) to inform the TOPIC - but DO NOT mention the avatar by name

**CRITICAL HOOK FORMAT RULES (MUST FOLLOW):**
- hookPreview must be **ONE SHORT SENTENCE** - maximum 15 words
- Hooks are PUNCHY OPENERS, not explanations or monologues
- NO filler phrases like "Many people...", "It's not about...", "Understanding why..."
- Start with a PATTERN INTERRUPT - something unexpected or provocative
- Write like a viral social media hook, not an essay introduction
${temperature === 'cold' ? `- For COLD: Do NOT mention "${displayProductName}" - focus on pain/curiosity only` : `- MUST include the literal product name "${displayProductName}"`}
- NEVER use the avatar's name (e.g., "${avatarData?.name || 'James'}") - the avatar is a fictional target, not someone the audience knows
- Do NOT use placeholders like "[product]", "**your product**", or generic names

**GOOD HOOK EXAMPLES (notice the brevity):**
- "You're losing $2,000/month and don't even know it."
- "Stop organizing your launches. Start automating them."
- "The spreadsheet isn't the problem. Your process is."
- "3 hours of launch prep? Try 20 minutes."

Return JSON:
{
  "strategies": [
    {
      "id": "story_1",
      "name": "Compelling Strategy Name",
      "primarySixS": "${primaryGap.category}",
      "secondarySixS": "${secondaryGap.category}",
      "angle": "How this strategy applies the framework + trigger",
      "hookPreview": "${temperature === 'cold'
        ? 'SHORT punchy hook like: \"Your launch chaos has a hidden cost.\"'
        : temperature === 'warm'
          ? `SHORT punchy hook like: \"${displayProductName} cut my launch prep from 3 hours to 20 minutes.\"`
          : `SHORT punchy hook like: \"${displayProductName} closes Friday. 47 spots left.\"`}",
      "whyItWorks": "Brief explanation of why this angle works",
      "confidenceScore": 92,
      "recommendation": "recommended"
    },
    {
      "id": "story_2",
      "name": "Runner-Up Strategy Name",
      "primarySixS": "${primaryGap.category}",
      "secondarySixS": "${sortedGaps[2]?.category || secondaryGap.category}",
      "angle": "Alternative application",
      "hookPreview": "Another SHORT punchy hook (max 15 words)",
      "whyItWorks": "Why this alternative works",
      "confidenceScore": 78,
      "recommendation": "runner_up"
    },
    {
      "id": "story_3",
      "name": "Alternative Strategy Name",
      "primarySixS": "${secondaryGap.category}",
      "secondarySixS": "${primaryGap.category}",
      "angle": "Creative/unexpected application",
      "hookPreview": "Creative SHORT punchy hook (max 15 words)",
      "whyItWorks": "Why this unexpected angle could work",
      "confidenceScore": 65,
      "recommendation": "alternative"
    }
  ],
  "generationContext": "All 3 strategies use ${framework.name} framework with ${trigger.name} trigger targeting ${tempDef.label} audience"
}`;

    try {
        console.log('[Story Strategies] Using deep thinking model for strategy generation...');

        const systemPrompt = `You are a strategic content advisor. Generate distinct story strategy options that all use the user's selected framework, trigger, and temperature. Each strategy should offer a different creative angle while staying true to the foundational selections. Be specific and reference the selections in your explanations.`;

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'medium',
            })
        });

        if (!response.ok) {
            throw new Error(`Deep thinking API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Story Strategies] Generation complete');

        // Transform to StoryStrategy format with basedOn field
        return (result.strategies || []).map((s: any): StoryStrategy => {
            const primarySixS = normalizeSixSCategory(s.primarySixS) || primaryGap.category;
            const secondarySixS = normalizeSixSCategory(s.secondarySixS) || secondaryGap.category;

            return {
                id: s.id,
                name: s.name,
                primarySixS,
                secondarySixS,
                angle: s.angle,
                hookPreview: stripMarkdown(s.hookPreview),
                whyItWorks: s.whyItWorks,
                confidenceScore: s.confidenceScore,
                recommendation: s.recommendation as 'recommended' | 'runner_up' | 'alternative',
                // NEW: Track what inputs created this strategy
                basedOn: {
                    framework: framework.name,
                    trigger: trigger.name,
                    temperature: tempDef.label,
                },
            };
        });

    } catch (error) {
        console.error('Error generating story strategies:', error);

        // Return fallback strategy
        return [{
            id: 'fallback_1',
            name: `${framework.name} + ${trigger.name} Strategy`,
            primarySixS: primaryGap.category,
            secondarySixS: secondaryGap.category,
            angle: `Apply ${framework.name} structure with ${trigger.name} trigger for ${tempDef.label} audience`,
            hookPreview: marketingStatements.promise,
            whyItWorks: 'Fallback strategy - please regenerate for better results',
            confidenceScore: 60,
            recommendation: 'recommended',
            basedOn: {
                framework: framework.name,
                trigger: trigger.name,
                temperature: tempDef.label,
            },
        }];
    }
}

// ============================================
// TEMPERATURE-SPECIFIC STRATEGY GENERATION
// ============================================

/**
 * Generate a complete strategy for a specific temperature level
 * Includes hooks, script outline, and CTA based on temperature
 *
 * @deprecated Use generateStoryStrategies() instead which takes temperature as input
 */
export async function generateTemperatureStrategy(
    temperature: Temperature,
    selectedStrategy: StrategyCandidate,
    sixSGaps: SixSGap[],
    marketingStatements: MarketingStatementsType,
    painSynopsis: PainSynopsisResult,
    marketIntel: MarketIntelligence,
    productName?: string,
    selectedPsychologicalTrigger?: {
        id: string;
        name: string;
        hookTemplate: string;
    }
): Promise<TemperatureStrategy> {
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];
    const primaryGap = sixSGaps.find(g => g.category === selectedStrategy.primarySixS);
    const displayProductName = productName || 'the product';

    // Get the original hook from the selected strategy candidate
    const originalHook = selectedStrategy.hookPreview || '';

    // Build psychological trigger context if provided
    const triggerContext = selectedPsychologicalTrigger ? `
**SELECTED PSYCHOLOGICAL TRIGGER (USE THIS IN YOUR HOOKS):**
- Trigger: ${selectedPsychologicalTrigger.name}
- Hook Template Pattern: "${selectedPsychologicalTrigger.hookTemplate}"

**CRITICAL: Your hooks MUST leverage this psychological trigger (${selectedPsychologicalTrigger.name}). Incorporate the emotional mechanism from this trigger into how you adapt the hooks for ${temperature} temperature.**
` : '';

    const prompt = `You are a content strategist adapting a hook for ${temperature.toUpperCase()} audience temperature.

**Temperature: ${tempDef.label} ${tempDef.emoji}**
Audience State: ${tempDef.audienceState}
Communication Focus: ${tempDef.communicationFocus}
Strategy: ${tempDef.strategy}
CTA Style: ${tempDef.ctaStyle}
Example CTAs: ${tempDef.ctaExamples.join(', ')}

**IMPORTANT - Product vs Strategy:**
- Product/Offer Name: "${displayProductName}" (use THIS in CTAs and direct offers)
- Communication Approach: "${selectedStrategy.name}" (this describes HOW we communicate, NOT the product name)
- Do NOT use "${selectedStrategy.name}" as a product name in CTAs - it's the messaging strategy, not the product

**Selected Communication Approach:**
Approach: ${selectedStrategy.name}
Primary Six S: ${selectedStrategy.primarySixS} (${primaryGap?.gapScore || 0}/100)
Angle: ${selectedStrategy.angle}

**ORIGINAL HOOK TO ADAPT (from selected strategy candidate):**
"${originalHook}"

This is the hook the user chose. Your job is to create ${temperature.toUpperCase()} temperature VARIANTS of this same hook concept - NOT completely new hooks.

**Marketing Statements (CONSTANTS):**
Promise: ${marketingStatements.promise}
Problem: ${marketingStatements.problem}
Solution: ${marketingStatements.solution}
Transformation: ${marketingStatements.transformation}

**Customer Context:**
Core Desire: ${painSynopsis?.psychologicalProfile?.coreDesire || 'Not specified'}
Current Struggle: ${painSynopsis?.storyBeats?.struggle || 'Not specified'}
Ideal Outcome: ${painSynopsis?.psychologicalProfile?.idealOutcome || 'Not specified'}

**Voice of Customer Evidence:**
${primaryGap?.voiceOfCustomer?.slice(0, 3).join('\n') || 'No direct quotes available'}
${triggerContext}
**Your Task:**
Adapt the ORIGINAL HOOK above for a ${temperature.toUpperCase()} audience. Keep the SAME core message and emotional angle, but adjust:

For ${temperature.toUpperCase()} content:
${temperature === 'cold' ? '- Focus on problem awareness and curiosity\n- Remove any direct product mentions or offers\n- Make it educational/relatable, not salesy\n- Soft CTA: Follow, Save, Comment, Share' : ''}
${temperature === 'warm' ? '- Show YOU are the answer (introduce solution)\n- Add proof elements or specific benefits\n- Balance between value and offer\n- Medium CTA: Link in bio, DM me, Grab the free guide' : ''}
${temperature === 'hot' ? '- Go direct with the offer\n- Add urgency, scarcity, or deadline\n- Remove objections in the hook itself\n- Hard CTA: Enroll now, Join before doors close, Use code today' : ''}

**CRITICAL:**
- The first hook should be a direct ${temperature} adaptation of the original hook "${originalHook}"
- Keep the same emotional core (${selectedStrategy.primarySixS}) and angle
- Only change HOW it's expressed for the temperature level

Return JSON:
{
  "temperature": "${temperature}",
  "hooks": [
    {
      "id": "hook_1",
      "text": "Temperature-adapted version of the original hook - SAME concept, adjusted for ${temperature} audience",
      "angle": "The angle from the original hook",
      "sixSAlignment": "${selectedStrategy.primarySixS}",
      "temperatureAlignment": "Why this adaptation works for ${temperature} audience"
    },
    {
      "id": "hook_2",
      "text": "A second variation on the same hook concept",
      "angle": "Same angle, different wording",
      "sixSAlignment": "${selectedStrategy.primarySixS}",
      "temperatureAlignment": "Variation explanation"
    }
  ],
  "scriptOutline": {
    "opening": "First 3 seconds - hook delivery adapted from original",
    "painAgitation": "Expand on the problem (adjust intensity for temperature)",
    "solutionTease": "Hint at the transformation (adjust directness for temperature)",
    "proofPoint": "Evidence or story",
    "cta": "Temperature-appropriate call to action"
  },
  "ctaOptions": [
    {
      "text": "CTA text for ${displayProductName}",
      "style": "${tempDef.ctaStyle}",
      "reasoning": "Why this CTA works for ${temperature}"
    }
  ],
  "toneGuidance": "How to deliver this content (energy, pacing, emotion)",
  "avoidList": ["Things NOT to say to ${temperature} audience"]
}`;

    try {
        // Use backend proxy for Gemini API (temperature strategy generation)
        console.log(`[Temperature Strategy] Generating ${temperature.toUpperCase()} audience strategy via backend proxy...`);

        const systemPrompt = `You are an expert at creating ${temperature} audience content. You understand that temperature determines HOW the message is expressed, not WHAT the message is. Be specific and actionable.`;

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'medium', // Medium thinking budget for temperature strategy
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Temperature Strategy] ${temperature.toUpperCase()} strategy generation complete`);

        return {
            temperature,
            hooks: result.hooks || [],
            scriptOutline: result.scriptOutline || {},
            ctaOptions: result.ctaOptions || [],
            toneGuidance: result.toneGuidance || '',
            avoidList: result.avoidList || [],
        };

    } catch (error) {
        console.error('Error generating temperature strategy:', error);

        // Return default strategy
        return {
            temperature,
            hooks: [{
                id: 'default_hook',
                text: `${marketingStatements.promise}`,
                angle: 'transformation',
                sixSAlignment: selectedStrategy.primarySixS,
                temperatureAlignment: `Default hook for ${temperature} audience`,
            }],
            scriptOutline: {
                opening: 'Hook delivery',
                painAgitation: marketingStatements.problem,
                solutionTease: marketingStatements.solution,
                proofPoint: 'Add your proof here',
                cta: tempDef.ctaExamples[0],
            },
            ctaOptions: tempDef.ctaExamples.map(cta => ({
                text: cta,
                style: tempDef.ctaStyle,
                reasoning: `Standard ${temperature} CTA`,
            })),
            toneGuidance: tempDef.strategy,
            avoidList: [],
        };
    }
}

// ============================================
// HOOK GENERATION FOR TEMPERATURE
// ============================================

/**
 * Generate additional hooks for a specific temperature
 * Used for regeneration and variation
 */
export async function generateHooksForTemperature(
    temperature: Temperature,
    selectedStrategy: StrategyCandidate,
    marketingStatements: MarketingStatementsType,
    count: number = 3
): Promise<Hook[]> {
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];

    const prompt = `Generate ${count} compelling hooks for ${temperature.toUpperCase()} audience content.

**Temperature: ${tempDef.label}**
- Audience: ${tempDef.audienceState}
- Focus: ${tempDef.communicationFocus}
- Strategy: ${tempDef.strategy}

**Emotional Angle: ${selectedStrategy.name}**
Primary Six S: ${selectedStrategy.primarySixS}
Approach: ${selectedStrategy.angle}

**Marketing Promise:**
${marketingStatements.promise}

**Problem We Solve:**
${marketingStatements.problem}

Return JSON:
{
  "hooks": [
    {
      "id": "hook_${Date.now()}_1",
      "text": "Hook text",
      "angle": "curiosity/pain/transformation/social-proof/question",
      "sixSAlignment": "${selectedStrategy.primarySixS}",
      "temperatureAlignment": "Why this works for ${temperature}"
    }
  ]
}`;

    try {
        // Use backend proxy for Gemini API
        console.log(`[Hooks Generation] Generating ${count} hooks for ${temperature.toUpperCase()} audience...`);

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt: 'You are an expert at crafting compelling hooks for social media content. Create attention-grabbing hooks that resonate with the target audience.',
                userPrompt: prompt,
                thinkingBudget: 'low', // Low thinking budget for hook generation
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Hooks Generation] Generated ${result.hooks?.length || 0} hooks`);

        return result.hooks || [];

    } catch (error) {
        console.error('Error generating hooks:', error);
        throw error;
    }
}

// ============================================
// SCRIPT GENERATION FOR TEMPERATURE
// ============================================

/**
 * Generate a full script for a specific temperature and hook
 */
export async function generateScriptForTemperature(
    temperature: Temperature,
    selectedHook: Hook,
    selectedStrategy: StrategyCandidate,
    marketingStatements: MarketingStatementsType,
    painSynopsis: PainSynopsisResult,
    targetDuration: number = 30 // seconds
): Promise<{ script: string; scenes: Array<{ label: string; content: string; duration: number }> }> {
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];

    const prompt = `Write a ${targetDuration}-second video script for ${temperature.toUpperCase()} audience.

**Hook (Opening):**
"${selectedHook.text}"

**Temperature: ${tempDef.label}**
- ${tempDef.communicationFocus}
- CTA Style: ${tempDef.ctaStyle}

**Strategy: ${selectedStrategy.name}**
Emotional Angle: ${selectedStrategy.primarySixS}

**Marketing Content:**
Problem: ${marketingStatements.problem}
Solution: ${marketingStatements.solution}
Transformation: ${marketingStatements.transformation}

**Customer Journey:**
Struggle: ${painSynopsis.storyBeats.struggle}
Guide Appears: ${painSynopsis.storyBeats.guideAppears}
Transformation: ${painSynopsis.storyBeats.transformation}

Write a script that:
1. Opens with the hook
2. Follows ${temperature} audience principles
3. Ends with appropriate CTA
4. Fits in ~${targetDuration} seconds (${Math.round(targetDuration * 2.5)} words)

Return JSON:
{
  "script": "Full script text",
  "scenes": [
    {
      "label": "HOOK",
      "content": "Scene content",
      "duration": 5
    },
    {
      "label": "PAIN",
      "content": "Scene content",
      "duration": 8
    },
    {
      "label": "SOLUTION",
      "content": "Scene content",
      "duration": 12
    },
    {
      "label": "CTA",
      "content": "Scene content",
      "duration": 5
    }
  ],
  "totalDuration": ${targetDuration},
  "wordCount": 75
}`;

    try {
        // Use backend proxy for Gemini API
        console.log(`[Script Generation] Generating ${targetDuration}s script for ${temperature.toUpperCase()} audience...`);

        const systemPrompt = `You are a short-form video scriptwriter. Write punchy, engaging scripts for ${temperature} audiences. Every word matters.`;

        const response = await fetch(`${API_BASE}/api/generate-deep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: prompt,
                thinkingBudget: 'medium', // Medium thinking budget for script generation
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Script Generation] Script generation complete`);

        return {
            script: result.script || '',
            scenes: result.scenes || [],
        };

    } catch (error) {
        console.error('Error generating script:', error);
        throw error;
    }
}
