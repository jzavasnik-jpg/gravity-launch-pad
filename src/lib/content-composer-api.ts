import { Hook, Scene, SceneLabel } from '@/store/projectStore';
import { Temperature, TEMPERATURE_DEFINITIONS } from '@/lib/six-s-constants';

const API_BASE = 'http://localhost:3001';

// Helper to format avatar data (arrays, objects, or strings) into readable text
function formatAvatarData(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
        return data.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return item.text || item.label || JSON.stringify(item);
            return String(item);
        }).join(', ');
    }
    if (typeof data === 'object') {
        // Handle objects with common patterns
        if (data.text) return data.text;
        if (data.items && Array.isArray(data.items)) return formatAvatarData(data.items);
        return Object.values(data).map(v => formatAvatarData(v)).filter(Boolean).join(', ');
    }
    return String(data);
}

export interface GenerateContentParams {
    avatarName: string;
    strategy: string;
    tone: number; // 0-100
    assets: { id: string; name: string }[];
    painPoints: string[];
    marketingStatements: any;
    selectedHook?: string; // Optional: if provided, generate script based on this hook
    // Gravity Culture additions
    temperature?: Temperature; // Audience temperature (cold, warm, hot)
    primarySixS?: string; // The dominant emotional need (e.g., 'safe', 'supported')
    productName?: string; // The product/service name for hook personalization
    // Full avatar context for grounding
    avatarContext?: {
        occupation?: string;
        age?: number;
        gender?: string;
        pain_points?: any; // Avatar-specific pain points
        dreams?: any;
        daily_challenges?: any;
        buying_triggers?: any;
    };
    // AI Strategy page selections (flow through to Hook Lab)
    selectedStrategyCandidate?: {
        name: string;
        primarySixS: string;
        secondarySixS: string;
        angle: string;
        hookPreview: string;
    };
    selectedTemperatureStrategy?: {
        temperature: string;
        hooks: Array<{ text: string; angle: string }>;
        toneGuidance: string;
    };
    selectedPsychologicalTrigger?: {
        id: string;
        name: string;
        hookTemplate: string;
    };
    // Story Strategy (new flow - includes basedOn context showing HOW it was generated)
    selectedStoryStrategy?: {
        id: string;
        name: string;
        primarySixS: string;
        secondarySixS: string;
        angle: string;
        hookPreview: string;
        whyItWorks?: string;
        basedOn?: {
            framework: string;
            trigger: string;
            temperature: string;
        };
    };
    // Six S Gap Analysis (for emotional targeting in hooks)
    sixSGaps?: Array<{
        category: string;
        label: string;
        gapScore: number;
        priority: string;
        voiceOfCustomer?: string[];
    }>;
    // Pain Synopsis (psychological profile + story beats)
    painSynopsis?: {
        psychologicalProfile?: {
            coreDesire?: string;
            primaryEmotion?: string;
            currentState?: string;
            blockers?: string[];
            idealOutcome?: string;
        };
        storyBeats?: {
            struggle?: string;
            insight?: string;
            transformation?: string;
        };
    };
    // Market Intelligence
    marketIntelligence?: {
        urgencyLevel?: string;
    };
}

export interface GeneratedContent {
    hooks: Hook[];
    script: string;
}

// New: Structured scene output from API
export interface GeneratedScene {
    label: SceneLabel;
    script: string;
    visual: string; // Visual description to help user "paint the picture"
    speaker?: 'guide' | 'mentee';
}

export interface GeneratedScenesContent {
    scenes: GeneratedScene[];
}

export async function generateHooksOnly(params: GenerateContentParams): Promise<Hook[]> {
    const toneDescription = params.tone < 30 ? "Serious, Professional, Authoritative" :
        params.tone > 70 ? "Humorous, Witty, Entertaining" :
            "Balanced, Engaging, Relatable";

    // Get temperature-specific guidance from Gravity Culture framework
    const temperature = params.temperature || 'cold';
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];

    // Build temperature-specific hook guidance
    const temperatureGuidance = `
**Audience Temperature: ${tempDef.label.toUpperCase()} (${tempDef.emoji})**
- Audience State: ${tempDef.audienceState}
- Communication Focus: ${tempDef.communicationFocus}
- Strategy: ${tempDef.strategy}
- Hook Direction: ${tempDef.hookDirection}
- Example Hook Patterns:
  ${tempDef.hookExamples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n  ')}

**Content Approach for ${tempDef.label} Audience:**
${tempDef.contentApproach}

**CTA Style for this temperature: ${tempDef.ctaStyle}**
Examples: ${tempDef.ctaExamples.join(', ')}
`;

    // Marketing statements context if available
    const marketingContext = params.marketingStatements ? `
**Marketing Statements (Gravity Messaging Core):**
- Solution: ${params.marketingStatements.solution || 'Not defined'}
- USP: ${params.marketingStatements.usp || 'Not defined'}
- Transformation: ${params.marketingStatements.transformation || 'Not defined'}
` : '';

    // Build avatar context - this is CRITICAL for contextually relevant hooks
    const avatarContext = params.avatarContext ? `
**TARGET AVATAR PROFILE (USE THIS TO GROUND ALL HOOKS):**
- Name: ${params.avatarName}
${params.avatarContext.occupation ? `- Occupation: ${params.avatarContext.occupation}` : ''}
${params.avatarContext.age ? `- Age: ${params.avatarContext.age}` : ''}
${params.avatarContext.gender ? `- Gender: ${params.avatarContext.gender}` : ''}
${params.avatarContext.pain_points ? `- Their Specific Pain Points: ${formatAvatarData(params.avatarContext.pain_points)}` : ''}
${params.avatarContext.dreams ? `- Their Dreams/Goals: ${formatAvatarData(params.avatarContext.dreams)}` : ''}
${params.avatarContext.daily_challenges ? `- Daily Challenges: ${formatAvatarData(params.avatarContext.daily_challenges)}` : ''}
${params.avatarContext.buying_triggers ? `- What Would Make Them Buy: ${formatAvatarData(params.avatarContext.buying_triggers)}` : ''}

**CRITICAL: Your hooks MUST speak to this specific person's reality. DO NOT make up problems they don't have (like parenting struggles for a business-focused avatar, or fitness goals for someone focused on launching a product).**
` : '';

    // Build AI Strategy page context - selected strategy candidate and temperature
    const strategyPageContext = params.selectedStrategyCandidate ? `
**SELECTED STRATEGY FROM AI STRATEGY PAGE (USE THIS AS YOUR FOUNDATION):**
- Strategy Name: ${params.selectedStrategyCandidate.name}
- Primary Emotional Need (Six S): ${params.selectedStrategyCandidate.primarySixS}
- Secondary Emotional Need: ${params.selectedStrategyCandidate.secondarySixS}
- Content Angle: ${params.selectedStrategyCandidate.angle}
- Original Hook Preview (ADAPT THIS): "${params.selectedStrategyCandidate.hookPreview}"

**CRITICAL: Your hooks MUST be variations of the original hook preview above. Keep the same emotional angle (${params.selectedStrategyCandidate.primarySixS}) and messaging approach. Do NOT create completely unrelated hooks.
` : '';

    // Build temperature strategy context
    const temperatureStrategyContext = params.selectedTemperatureStrategy ? `
**SELECTED TEMPERATURE STRATEGY (USE THIS FOR TONE/APPROACH):**
- Temperature: ${params.selectedTemperatureStrategy.temperature.toUpperCase()}
- Example Hooks from Strategy:
${params.selectedTemperatureStrategy.hooks.slice(0, 2).map((h, i) => `  ${i + 1}. "${h.text}" (${h.angle})`).join('\n')}
- Tone Guidance: ${params.selectedTemperatureStrategy.toneGuidance}

**CRITICAL: Your hooks MUST follow this temperature level's approach. ${params.selectedTemperatureStrategy.temperature === 'cold' ? 'Focus on pain/awareness, no selling.' : params.selectedTemperatureStrategy.temperature === 'warm' ? 'Show your solution, build trust.' : 'Direct offer with urgency.'}**
` : '';

    // Build psychological trigger context
    const psychologicalTriggerContext = params.selectedPsychologicalTrigger ? `
**SELECTED PSYCHOLOGICAL TRIGGER (USE THIS IN YOUR HOOKS):**
- Trigger: ${params.selectedPsychologicalTrigger.name}
- Hook Template Pattern: "${params.selectedPsychologicalTrigger.hookTemplate}"

**CRITICAL: At least 2 of your 3 hooks MUST leverage this psychological trigger (${params.selectedPsychologicalTrigger.name}). Use the template pattern as inspiration.**
` : '';

    // Build Story Strategy context (new flow - includes basedOn info showing HOW the strategy was generated)
    const storyStrategyContext = params.selectedStoryStrategy ? `
**STORY STRATEGY (NEW FLOW - USE THIS AS PRIMARY FOUNDATION):**
- Strategy Name: ${params.selectedStoryStrategy.name}
- Primary Emotional Need (Six S): ${params.selectedStoryStrategy.primarySixS}
- Secondary Emotional Need: ${params.selectedStoryStrategy.secondarySixS}
- Content Angle: ${params.selectedStoryStrategy.angle}
- Hook Preview (ADAPT THIS): "${params.selectedStoryStrategy.hookPreview}"
${params.selectedStoryStrategy.whyItWorks ? `- Why It Works: ${params.selectedStoryStrategy.whyItWorks}` : ''}
${params.selectedStoryStrategy.basedOn ? `
**STRATEGY GENERATION CONTEXT (Shows HOW this strategy was created):**
- Content Framework Used: ${params.selectedStoryStrategy.basedOn.framework}
- Psychological Trigger Applied: ${params.selectedStoryStrategy.basedOn.trigger}
- Audience Temperature: ${params.selectedStoryStrategy.basedOn.temperature}

Use this context to maintain consistency. Your hooks should align with the ${params.selectedStoryStrategy.basedOn.framework} framework structure and leverage the ${params.selectedStoryStrategy.basedOn.trigger} psychological trigger.` : ''}

**CRITICAL: Your hooks MUST be variations of the hook preview above. Keep the same emotional angle (${params.selectedStoryStrategy.primarySixS}) and messaging approach. Do NOT create completely unrelated hooks.**
` : '';

    // Build Six S Gap Analysis context (NEW - for emotional targeting)
    const sixSGapsContext = params.sixSGaps && params.sixSGaps.length > 0 ? `
**SIX S EMOTIONAL GAP ANALYSIS (Target these emotional needs):**
${params.sixSGaps.map((g, i) => `${i + 1}. ${g.label}: ${g.gapScore}/100 (${g.priority})${g.voiceOfCustomer && g.voiceOfCustomer.length > 0 ? `\n   Voice of Customer: "${g.voiceOfCustomer[0]}"` : ''}`).join('\n')}

Primary Gap to Address: ${params.sixSGaps[0]?.label || 'Not specified'} (${params.sixSGaps[0]?.gapScore || 0}/100)
**CRITICAL: Your hooks MUST address the primary emotional gap (${params.sixSGaps[0]?.label}). Use language that makes the audience FEEL this need.**
` : '';

    // Build Pain Synopsis context (NEW - for psychological depth)
    const painSynopsisContext = params.painSynopsis ? `
**PSYCHOLOGICAL PROFILE (Use for emotional resonance):**
${params.painSynopsis.psychologicalProfile?.coreDesire ? `- Core Desire: ${params.painSynopsis.psychologicalProfile.coreDesire}` : ''}
${params.painSynopsis.psychologicalProfile?.primaryEmotion ? `- Primary Emotion: ${params.painSynopsis.psychologicalProfile.primaryEmotion}` : ''}
${params.painSynopsis.psychologicalProfile?.currentState ? `- Current State: ${params.painSynopsis.psychologicalProfile.currentState}` : ''}
${params.painSynopsis.psychologicalProfile?.blockers ? `- Blockers: ${params.painSynopsis.psychologicalProfile.blockers.join(', ')}` : ''}
${params.painSynopsis.psychologicalProfile?.idealOutcome ? `- Ideal Outcome: ${params.painSynopsis.psychologicalProfile.idealOutcome}` : ''}

**STORY BEATS (Follow this arc):**
${params.painSynopsis.storyBeats?.struggle ? `- Current Struggle: ${params.painSynopsis.storyBeats.struggle}` : ''}
${params.painSynopsis.storyBeats?.insight ? `- Needed Insight: ${params.painSynopsis.storyBeats.insight}` : ''}
${params.painSynopsis.storyBeats?.transformation ? `- Transformation: ${params.painSynopsis.storyBeats.transformation}` : ''}
` : '';

    // Build Market Intelligence context (NEW - for urgency calibration)
    const marketIntelContext = params.marketIntelligence?.urgencyLevel ? `
**MARKET URGENCY LEVEL: ${params.marketIntelligence.urgencyLevel.toUpperCase()}**
Calibrate your hook intensity based on this market urgency.
` : '';

    // Get product name for guardrails
    const productName = params.productName || params.marketingStatements?.productName || 'the product';

    const prompt = `You are a viral scriptwriter using the Gravity Culture framework for ${params.avatarName}.
${avatarContext}
${storyStrategyContext}
${strategyPageContext}
${temperatureStrategyContext}
${psychologicalTriggerContext}
${sixSGapsContext}
${painSynopsisContext}
${marketIntelContext}
**Context:**
- Strategy: ${params.strategy}
- Pain Points (from market research): ${params.painPoints.join(', ')}
${params.productName ? `- Product/Service: ${params.productName}` : ''}
${params.primarySixS ? `- Primary Emotional Need (Six S): ${params.primarySixS}` : ''}
${marketingContext}

**TWO DIMENSIONS OF CONTENT (Both Matter!):**

1. **TEMPERATURE (WHO + WHAT):** ${tempDef.label.toUpperCase()} ${tempDef.emoji}
   - Determines the audience's awareness level and what approach to take
   - ${tempDef.audienceState}
   - Strategy: ${tempDef.strategy}

2. **TONE (HOW):** ${toneDescription} (${params.tone}/100)
   - Determines the delivery style and personality of the content
   - ${params.tone < 30 ? 'Use formal language, data-driven points, credible authority' : params.tone > 70 ? 'Use humor, wit, playful language, relatable moments' : 'Balance professionalism with approachability'}

**IMPORTANT:** These work TOGETHER. For example:
- Cold + Serious = Educational pain point content with professional delivery
- Cold + Humorous = Pattern interrupt through comedy, relatable struggle humor
- Hot + Serious = Direct, no-nonsense offer with urgency
- Hot + Humorous = Playful urgency, fun scarcity messaging

${temperatureGuidance}

**CRITICAL: Temperature-Appropriate Hooks**
You are creating hooks for a ${tempDef.label.toUpperCase()} audience with a ${toneDescription.toLowerCase()} tone. This means:
${temperature === 'cold' ? `
- They don't know you or your solution yet
- Lead AWAY from pain (make them aware of the problem)
- DO NOT mention your product or make offers
- Focus on pattern interrupts and pain agitation
- End with soft CTAs (follow, save, comment)` : ''}
${temperature === 'warm' ? `
- They know solutions exist but are comparing options
- Lead TOWARD your solution (differentiate your approach)
- Show why YOUR method is different and better
- Use proof, specifics, and authority
- End with medium CTAs (link in bio, DM, free guide)` : ''}
${temperature === 'hot' ? `
- They already know and trust you
- Lead TOWARD action (make the direct offer)
- Remove final objections, create urgency
- Be direct about the offer and what they get
- End with hard CTAs (enroll now, limited spots, use code)` : ''}

**CRITICAL HOOK FORMAT RULES (MUST FOLLOW):**
- Each hook must be **ONE SHORT SENTENCE** - maximum 15 words
- Hooks are PUNCHY OPENERS, not explanations or monologues
- NO filler phrases like "Many people...", "It's not about...", "Understanding why...", "Most people don't realize..."
- Start with a PATTERN INTERRUPT - something unexpected or provocative
- Write like a viral social media hook, not an essay introduction
${temperature === 'cold' ? `- For COLD: Do NOT mention "${productName}" - focus on pain/curiosity only` : `- MUST include the literal product name "${productName}"`}
- NEVER use the avatar's name (e.g., "${params.avatarName}") - the avatar is a fictional target, not someone the audience knows
- Do NOT use placeholders like "[product]", "**your product**", or generic names

**GOOD HOOK EXAMPLES (notice the brevity and punch):**
- "You're losing $2,000/month and don't even know it."
- "Stop organizing your launches. Start automating them."
- "The spreadsheet isn't the problem. Your process is."
- "3 hours of launch prep? Try 20 minutes."
- "Your competition already knows this. You don't."

**BAD HOOK EXAMPLES (too long, filler phrases, or weak):**
- "Many people struggle with managing their product launches effectively..." (filler + too long)
- "Understanding why your launches fail is the first step to success..." (weak opener)
- "It's not about working harder, it's about working smarter on your product..." (cliché)
- "If you're like most entrepreneurs, you probably..." (generic + too long)

**TEMPERATURE-SPECIFIC FOCUS PHRASES:**
${temperature === 'cold' ? `
For COLD hooks, focus on:
- "Did you know..."
- "The hidden reason why..."
- "What nobody tells you about..."
- "I used to think... until I discovered..."
- Pattern interrupts that create curiosity without selling` : ''}
${temperature === 'warm' ? `
For WARM hooks, focus on:
- "Here's how I solved..."
- "The method that changed..."
- "What happened when I..."
- "After trying everything, I found..."
- "The 3 steps that finally..."` : ''}
${temperature === 'hot' ? `
For HOT hooks, focus on:
- "Join ${productName} now before..."
- "Last chance to..."
- "Here's exactly what you get with ${productName}..."
- "Doors close in..."
- "Only X spots left for ${productName}..."` : ''}

**Task:**
Create 3 distinct, attention-grabbing hooks for a short video (TikTok/Reels/Shorts).
Each hook MUST be appropriate for the ${tempDef.label} temperature level.
Each hook MUST be under 15 words and start with a pattern interrupt.
- Option A: Direct approach for ${tempDef.label} audience
- Option B: Story/Curiosity approach for ${tempDef.label} audience
- Option C: Contrarian/Bold approach for ${tempDef.label} audience
- Score each hook's estimated virality (0-100) based on how well it matches the temperature strategy.

**Output Format (JSON):**
{
    "hooks": [
        { "id": "hook_a", "text": "Hook text here", "score": 95, "approach": "direct" },
        { "id": "hook_b", "text": "Hook text here", "score": 88, "approach": "story" },
        { "id": "hook_c", "text": "Hook text here", "score": 92, "approach": "contrarian" }
    ]
}`;

    try {
        const result = await callOpenAI(prompt);
        return result.hooks;
    } catch (error) {
        console.error("Error generating hooks:", error);
        throw error;
    }
}

/**
 * Generate a structured script with labeled scenes based on the selected hook.
 *
 * STORY-FIRST APPROACH:
 * 1. Story Strategy is the CREATIVE VISION the user chose - this guides everything
 * 2. Write the FULL STORY first as a cohesive narrative
 * 3. Parse the story into labeled scenes (HOOK, PAIN, SOLUTION, CTA)
 * 4. Generate visuals AFTER scripts to ensure visual consistency across all scenes
 *
 * The result should feel like the Story Strategy coming to life.
 */
export async function generateScenesFromHook(
    params: GenerateContentParams,
    hookText: string,
    campaignMode: 'direct_authority' | 'transformation_narrative' = 'direct_authority'
): Promise<GeneratedScene[]> {
    const toneDescription = params.tone < 30 ? "Serious, Professional, Authoritative" :
        params.tone > 70 ? "Humorous, Witty, Entertaining" :
            "Balanced, Engaging, Relatable";

    // Get temperature-specific guidance
    const temperature = params.temperature || 'cold';
    const tempDef = TEMPERATURE_DEFINITIONS[temperature];

    // Get product name for guardrails
    const productName = params.productName || params.marketingStatements?.productName || 'the product';

    // === BUILD STORY STRATEGY CONTEXT (THE CREATIVE VISION) ===
    const storyStrategyContext = params.selectedStoryStrategy ? `
**═══════════════════════════════════════════════════════════════════════════════**
**YOUR STORY STRATEGY - THE CREATIVE VISION TO BRING TO LIFE**
**═══════════════════════════════════════════════════════════════════════════════**

The user chose this Story Strategy. Your ENTIRE script must feel like this vision coming to life.

**Strategy Name:** ${params.selectedStoryStrategy.name}
**The Angle:** ${params.selectedStoryStrategy.angle}
**Why It Works:** ${params.selectedStoryStrategy.whyItWorks || 'Emotionally resonant with target audience'}

**Emotional Core:**
- Primary Six S Need: ${params.selectedStoryStrategy.primarySixS} (THIS is what the audience craves)
- Secondary Six S Need: ${params.selectedStoryStrategy.secondarySixS}

**The Hook That Started It All:** "${params.selectedStoryStrategy.hookPreview}"
(Your selected hook "${hookText}" is a variation of this - maintain the same emotional thread)

${params.selectedStoryStrategy.basedOn ? `
**How This Strategy Was Built:**
- Content Framework: ${params.selectedStoryStrategy.basedOn.framework}
- Psychological Trigger: ${params.selectedStoryStrategy.basedOn.trigger}
- Audience Temperature: ${params.selectedStoryStrategy.basedOn.temperature}

Your script MUST follow the ${params.selectedStoryStrategy.basedOn.framework} structure and leverage the ${params.selectedStoryStrategy.basedOn.trigger} psychological trigger throughout.
` : ''}

**CRITICAL:** Every scene must ladder up to this strategy. The PAIN scene should agitate the ${params.selectedStoryStrategy.primarySixS} need. The SOLUTION should satisfy it. The CTA should promise it.
**═══════════════════════════════════════════════════════════════════════════════**
` : '';

    // === BUILD AVATAR CONTEXT (WHO WE'RE SPEAKING TO) ===
    const avatarContext = params.avatarContext ? `
**TARGET AVATAR (Write for THIS specific person - but NEVER mention their name):**
${params.avatarContext.occupation ? `- Role: ${params.avatarContext.occupation}` : ''}
${params.avatarContext.age ? `- Age: ${params.avatarContext.age}` : ''}
${params.avatarContext.pain_points ? `- Their Pain Points: ${formatAvatarData(params.avatarContext.pain_points)}` : ''}
${params.avatarContext.dreams ? `- Their Dreams: ${formatAvatarData(params.avatarContext.dreams)}` : ''}
${params.avatarContext.daily_challenges ? `- Daily Challenges: ${formatAvatarData(params.avatarContext.daily_challenges)}` : ''}
` : '';

    // === BUILD SIX S GAP CONTEXT ===
    const sixSGapsContext = params.sixSGaps && params.sixSGaps.length > 0 ? `
**EMOTIONAL GAP ANALYSIS (Weave these feelings into your script):**
${params.sixSGaps.map((g, i) => `${i + 1}. ${g.label}: ${g.gapScore}/100${g.voiceOfCustomer && g.voiceOfCustomer.length > 0 ? ` - Voice: "${g.voiceOfCustomer[0]}"` : ''}`).join('\n')}

Primary Gap: ${params.sixSGaps[0]?.label} - Your PAIN scene should make them FEEL this gap viscerally.
` : '';

    // === BUILD PAIN SYNOPSIS CONTEXT ===
    const painSynopsisContext = params.painSynopsis ? `
**PSYCHOLOGICAL PROFILE (Use for authentic emotional resonance):**
${params.painSynopsis.psychologicalProfile?.coreDesire ? `- Their Core Desire: ${params.painSynopsis.psychologicalProfile.coreDesire}` : ''}
${params.painSynopsis.psychologicalProfile?.currentState ? `- Where They Are Now: ${params.painSynopsis.psychologicalProfile.currentState}` : ''}
${params.painSynopsis.psychologicalProfile?.blockers ? `- What's Blocking Them: ${params.painSynopsis.psychologicalProfile.blockers.join(', ')}` : ''}
${params.painSynopsis.psychologicalProfile?.idealOutcome ? `- Where They Want To Be: ${params.painSynopsis.psychologicalProfile.idealOutcome}` : ''}

**STORY ARC (Your script should follow this emotional journey):**
${params.painSynopsis.storyBeats?.struggle ? `- PAIN Scene: ${params.painSynopsis.storyBeats.struggle}` : ''}
${params.painSynopsis.storyBeats?.insight ? `- TRANSITION: ${params.painSynopsis.storyBeats.insight}` : ''}
${params.painSynopsis.storyBeats?.transformation ? `- SOLUTION Scene: ${params.painSynopsis.storyBeats.transformation}` : ''}
` : '';

    // === BUILD MARKETING CONTEXT ===
    const marketingContext = params.marketingStatements ? `
**MARKETING CONSTANTS (Use as script foundation):**
- Promise: ${params.marketingStatements.promise || 'Not defined'}
- Problem: ${params.marketingStatements.problem || 'Not defined'}
- Solution: ${params.marketingStatements.solution || 'Not defined'}
- Transformation: ${params.marketingStatements.transformation || 'Not defined'}
` : '';

    // === SPEAKER INSTRUCTIONS ===
    const speakerInstructions = campaignMode === 'transformation_narrative'
        ? `
**SPEAKER ROLES (Transformation Narrative Mode):**
- "guide": The expert/mentor who has the solution
- "mentee": The avatar experiencing the problem (use for PAIN scene)
Alternate between speakers to create dialogue-like flow.`
        : '';

    // === TEMPERATURE-SPECIFIC SCENE GUIDANCE ===
    const temperatureSceneGuidance = `
**TEMPERATURE: ${tempDef.label.toUpperCase()} ${tempDef.emoji}**
Audience State: ${tempDef.audienceState}
Strategy: ${tempDef.strategy}

**Scene-by-Scene Temperature Rules:**
${temperature === 'cold' ? `
- HOOK: Pattern interrupt. Make them stop scrolling. DO NOT sell.
- PAIN: Go DEEP into the problem. Make them FEEL it. NO solutions yet.
- SOLUTION: Tease that a solution exists. Plant curiosity seeds. Do NOT pitch "${productName}" directly.
- CTA: SOFT only. "Follow for Part 2", "Save this", "Comment if this is you"` : ''}
${temperature === 'warm' ? `
- HOOK: Position your unique approach. Show you get their failed attempts.
- PAIN: Validate their frustration. Show you've been there.
- SOLUTION: Present YOUR method with "${productName}". Use proof and credentials.
- CTA: MEDIUM. "Link in bio", "DM me START", "Grab the free guide"` : ''}
${temperature === 'hot' ? `
- HOOK: Speak to people who know you. Reference shared journey.
- PAIN: Address final hesitations head-on.
- SOLUTION: Be specific about "${productName}". Show the complete offer.
- CTA: HARD with urgency. "Enroll in ${productName} now", "Only X spots left", "Use code TODAY"` : ''}`;

    // === GUARDRAILS ===
    const guardrails = `
**═══════════════════════════════════════════════════════════════════════════════**
**CRITICAL GUARDRAILS - MUST FOLLOW**
**═══════════════════════════════════════════════════════════════════════════════**

1. **NEVER mention the avatar's name** ("${params.avatarName}") - they are a fictional target, not someone the audience knows

2. **Product Name Rules by Temperature:**
${temperature === 'cold' ? `   - COLD: Do NOT mention "${productName}" in any scene - focus on pain/awareness only` : `   - ${temperature.toUpperCase()}: You MUST mention "${productName}" in SOLUTION and CTA scenes`}

3. **Script Format Rules:**
   - Keep each scene script SHORT - spoken word, not essay
   - HOOK: 1-2 sentences max (3-5 seconds spoken)
   - PAIN: 2-3 sentences (8-12 seconds)
   - SOLUTION: 2-4 sentences (10-15 seconds)
   - CTA: 1-2 sentences (5-8 seconds)

4. **NO generic filler phrases:**
   - Avoid: "Many people struggle with...", "It's not about...", "Understanding why..."
   - Use: Direct, punchy, emotionally-charged language

5. **Story Continuity:**
   - Each scene must flow naturally from the previous
   - Maintain the same emotional thread throughout
   - The story should feel like ONE narrative, not disconnected scenes
`;

    // === VISUAL CONSISTENCY RULES ===
    const visualConsistencyRules = `
**═══════════════════════════════════════════════════════════════════════════════**
**VISUAL CONSISTENCY RULES - ALL SCENES MUST FEEL LIKE ONE VIDEO**
**═══════════════════════════════════════════════════════════════════════════════**

Before writing visuals, establish these constants:

1. **PRIMARY ENVIRONMENT:** Choose ONE main setting (home office, studio, coffee shop, etc.)
   - HOOK, PAIN, SOLUTION should share this environment OR have intentional contrast
   - If using before/after, clearly note the environmental shift

2. **CHARACTER CONSISTENCY:**
   - Same person throughout (unless transformation narrative with guide + mentee)
   - Consistent wardrobe within same "timeline"
   - Expressions should progress: stressed → hopeful → confident → inviting

3. **LIGHTING PROGRESSION:**
   - HOOK/PAIN: Can be harsher, blue-tinted, or dramatic (stress/problem)
   - SOLUTION/CTA: Warmer, brighter, more inviting (resolution/hope)
   - This creates subliminal emotional progression

4. **CAMERA STYLE:**
   - Maintain consistent camera language (handheld vs stable, close-up vs wide)
   - HOOK: Often close-up for intimacy/pattern interrupt
   - PAIN: Medium shots, may include environment chaos
   - SOLUTION: Clean frames, organized visuals
   - CTA: Direct to camera, confident framing

5. **PROP/ASSET CONTINUITY:**
   - If a laptop appears in HOOK, it should logically exist in other scenes
   - Available assets: ${params.assets.map(a => a.name).join(', ') || 'None specified'}
   - Reference these assets consistently where they fit naturally

**OUTPUT NOTE:** In your response, include an "environment" field that describes the consistent visual world for all scenes.
`;

    // Build system prompt for Gemini (role + context)
    const systemPrompt = `You are a viral video scriptwriter bringing a Story Strategy to life.
You specialize in creating 45-60 second video scripts that emotionally resonate with target audiences.
You ALWAYS output valid JSON format. Never include markdown code blocks.

${storyStrategyContext}
${avatarContext}
${sixSGapsContext}
${painSynopsisContext}
${marketingContext}
${guardrails}
${visualConsistencyRules}`;

    // Build user prompt (the task)
    const userPrompt = `**SELECTED HOOK (Start your story here):** "${hookText}"

**CONTENT DIMENSIONS:**
1. **TEMPERATURE:** ${tempDef.label.toUpperCase()} ${tempDef.emoji} - ${tempDef.audienceState}
2. **TONE:** ${toneDescription} (${params.tone}/100) - ${params.tone < 30 ? 'Professional, authoritative' : params.tone > 70 ? 'Humorous, witty, entertaining' : 'Balanced, conversational'}

${temperatureSceneGuidance}
${speakerInstructions}

**═══════════════════════════════════════════════════════════════════════════════**
**YOUR TASK: BRING THE STORY STRATEGY TO LIFE**
**═══════════════════════════════════════════════════════════════════════════════**

Write a 45-60 second video script that:
1. Opens with the selected hook
2. Follows the Story Strategy's angle and emotional core
3. Maintains visual consistency across all scenes
4. Ends with a ${tempDef.ctaStyle} CTA

**STEP 1:** First, define the visual environment (setting, lighting, character look)
**STEP 2:** Write the FULL story as a cohesive narrative
**STEP 3:** Break it into scenes with matching visuals

**Output Format (JSON - NO markdown, just raw JSON):**
{
    "environment": {
        "setting": "Primary location description",
        "lighting": "Lighting approach and progression",
        "character": "Character appearance and wardrobe",
        "props": "Key props that appear across scenes"
    },
    "scenes": [
        {
            "label": "HOOK",
            "script": "Opening hook - punchy, pattern-interrupting",
            "visual": "Visual that establishes environment + hooks attention"${campaignMode === 'transformation_narrative' ? ',\n            "speaker": "guide"' : ''}
        },
        {
            "label": "PAIN",
            "script": "Agitate the problem - make them feel the ${params.selectedStoryStrategy?.primarySixS || 'emotional'} gap",
            "visual": "Visual showing struggle - same environment, stressed state"${campaignMode === 'transformation_narrative' ? ',\n            "speaker": "mentee"' : ''}
        },
        {
            "label": "SOLUTION",
            "script": "Present the answer - satisfy the ${params.selectedStoryStrategy?.primarySixS || 'emotional'} need",
            "visual": "Transformation visual - same environment, shifted lighting/mood"${campaignMode === 'transformation_narrative' ? ',\n            "speaker": "guide"' : ''}
        },
        {
            "label": "CTA",
            "script": "${tempDef.ctaStyle} call to action",
            "visual": "Direct, confident, inviting - culmination of visual journey"${campaignMode === 'transformation_narrative' ? ',\n            "speaker": "guide"' : ''}
        }
    ]
}

Valid labels: "HOOK", "PAIN", "SOLUTION", "CTA", "TRANSITION"
${campaignMode === 'transformation_narrative' ? 'Valid speakers: "guide", "mentee"' : ''}

Remember: This script should feel like the "${params.selectedStoryStrategy?.name || 'Story Strategy'}" coming to life. Every word, every visual should ladder up to the strategy's angle.`;

    try {
        // Use Gemini 2.5 Flash for scene generation (80% cheaper than GPT-4o, excellent quality)
        const result = await callGeminiDeep(systemPrompt, userPrompt, 'medium');

        // Log environment for debugging/future use
        if (result.environment) {
            console.log('[Scene Generation] Visual Environment:', result.environment);
        }

        // Validate and ensure proper structure
        const scenes: GeneratedScene[] = (result.scenes || []).map((scene: any, index: number) => {
            // Ensure valid label
            const validLabels: SceneLabel[] = ['HOOK', 'PAIN', 'SOLUTION', 'CTA', 'TRANSITION'];
            const label = validLabels.includes(scene.label) ? scene.label : 'TRANSITION';

            return {
                label,
                script: scene.script || '',
                visual: scene.visual || '',
                speaker: campaignMode === 'transformation_narrative'
                    ? (scene.speaker === 'mentee' ? 'mentee' : 'guide')
                    : undefined
            };
        });

        // Ensure we have at least the core scenes
        if (scenes.length === 0) {
            // Fallback: create default structure with the hook
            return [
                { label: 'HOOK', script: hookText, visual: 'Attention-grabbing opening shot', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined },
                { label: 'PAIN', script: '', visual: 'Visual showing the struggle or problem', speaker: campaignMode === 'transformation_narrative' ? 'mentee' : undefined },
                { label: 'SOLUTION', script: '', visual: 'Transformation or solution reveal', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined },
                { label: 'CTA', script: '', visual: 'Direct call to action with confident delivery', speaker: campaignMode === 'transformation_narrative' ? 'guide' : undefined }
            ];
        }

        return scenes;
    } catch (error) {
        console.error("Error generating scenes:", error);
        throw error;
    }
}

/**
 * @deprecated Use generateScenesFromHook instead for structured output
 * Kept for backward compatibility
 */
export async function generateScriptOnly(params: GenerateContentParams, hookText: string): Promise<string> {
    const toneDescription = params.tone < 30 ? "Serious, Professional, Authoritative" :
        params.tone > 70 ? "Humorous, Witty, Entertaining" :
            "Balanced, Engaging, Relatable";

    const prompt = `You are a viral scriptwriter for ${params.avatarName}.

    **Context:**
    - Strategy: ${params.strategy}
    - Tone: ${toneDescription} (Value: ${params.tone}/100)
    - Pain Points: ${params.painPoints.join(', ')}
    - Available Assets: ${params.assets.map(a => a.name).join(', ')}
    - **Selected Hook**: "${hookText}"

    **Task:**
    Write a 60-second video script that starts with the Selected Hook.
    - The script MUST flow naturally from the hook. The hook sets the narrative arc.
    - **CRITICAL**: You MUST incorporate references to the available assets where appropriate using tags like [Visual: Asset Name].
    - Use short, punchy sentences.

    **Output Format (JSON):**
    {
        "script": "Full script body starting with the hook..."
    }`;

    try {
        const result = await callOpenAI(prompt);
        return result.script;
    } catch (error) {
        console.error("Error generating script:", error);
        throw error;
    }
}

// Helper for OpenAI calls - uses backend proxy for security
// Default to gpt-4o-mini for cost efficiency (90% cheaper than gpt-4o)
async function callOpenAI(prompt: string, model: string = 'gpt-4o-mini'): Promise<any> {
    const response = await fetch(`${API_BASE}/api/openai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a world-class viral scriptwriter. Always output valid JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content || '{}');
}

// Helper for Gemini deep thinking - uses Gemini 2.5 Flash for complex reasoning
// 80% cheaper than GPT-4o with excellent quality for script generation
async function callGeminiDeep(systemPrompt: string, userPrompt: string, thinkingBudget: 'low' | 'medium' | 'high' = 'medium'): Promise<any> {
    const response = await fetch(`${API_BASE}/api/generate-deep`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            systemPrompt,
            userPrompt,
            thinkingBudget
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errorData.error || response.statusText}`);
    }

    return await response.json();
}

// Keep original for backward compatibility if needed
export async function generateScriptAndHooks(params: GenerateContentParams): Promise<GeneratedContent> {
    const hooks = await generateHooksOnly(params);
    const script = await generateScriptOnly(params, hooks[0].text);
    return { hooks, script };
}
