// Six S Framework Constants and Helpers
// Based on Gravity Culture's emotional needs framework

export type SixS = 'significant' | 'safe' | 'supported' | 'successful' | 'surprise' | 'share';
export type Temperature = 'cold' | 'warm' | 'hot';
export type DesireMarket = 'money' | 'time' | 'experiences' | 'relationships';
export type ContentFrameworkId = 'before_after' | 'pas' | 'heros_journey' | 'curiosity_gap' | 'social_proof' | 'simple_truth';
export type PsychologicalTriggerId = 'loss_aversion' | 'social_proof' | 'authority' | 'scarcity' | 'progress';

// ============================================
// SIX S DEFINITIONS
// ============================================

export const SIX_S_DEFINITIONS: Record<SixS, {
    label: string;
    question: string;
    description: string;
    keywords: string[];
    icon: string;
}> = {
    significant: {
        label: 'Significant',
        question: 'Do you know my name and make me feel connected with purpose?',
        description: 'The need to feel seen, recognized, and that your presence matters. Not status (external perception), but self-identity (internal knowing).',
        keywords: ['invisible', 'unseen', 'nobody cares', 'does anyone', 'matter', 'noticed', 'recognized', 'identity', 'purpose', 'belong'],
        icon: '👁️',
    },
    safe: {
        label: 'Safe',
        question: 'Am I physically and mentally safe with you?',
        description: 'The need for trust, reliability, and protection from harm—both physical and emotional.',
        keywords: ['scared', 'afraid', 'trust', 'scam', 'risky', 'worried', 'anxious', 'protected', 'secure', 'reliable'],
        icon: '🛡️',
    },
    supported: {
        label: 'Supported',
        question: "Are you helping me achieve what's important to me on my journey?",
        description: 'The need for partnership, guidance, and someone who anticipates your needs.',
        keywords: ['alone', 'help', 'guide', 'mentor', 'stuck', 'confused', 'lost', 'direction', 'roadmap', 'partner'],
        icon: '🤝',
    },
    successful: {
        label: 'Successful',
        question: 'Are you providing opportunities for me to achieve success and recognizing when I do?',
        description: "The need for validation, milestones, and proof that you're making progress.",
        keywords: ['winning', 'progress', 'working', 'results', 'proof', 'milestone', 'achievement', 'track', 'failing', 'success'],
        icon: '🏆',
    },
    surprise: {
        label: 'Surprise & Delight',
        question: 'Are you providing experiences that excite and delight me?',
        description: 'The need for unexpected joy, generosity, and moments that exceed expectations.',
        keywords: ['wow', 'unexpected', 'delight', 'joy', 'bonus', 'extra', 'amazing', 'exceeded', 'surprise'],
        icon: '✨',
    },
    share: {
        label: 'Share',
        question: 'Was my last experience something remarkable I want to excitedly share?',
        description: 'The need to tell others, advocate, and spread the emotional high.',
        keywords: ['tell everyone', 'recommend', 'share', 'viral', 'amazing', 'have to tell', 'word of mouth'],
        icon: '📣',
    },
};

// ============================================
// TEMPERATURE DEFINITIONS
// ============================================

export const TEMPERATURE_DEFINITIONS: Record<Temperature, {
    label: string;
    emoji: string;
    audienceState: string;
    communicationFocus: string;
    strategy: string;
    ctaStyle: string;
    ctaExamples: string[];
    // Gravity Culture hook direction
    hookDirection: string;
    hookExamples: string[];
    // Content approach per Gravity Culture
    contentApproach: string;
    color: string;
    bgColor: string;
    borderColor: string;
}> = {
    cold: {
        label: 'Cold',
        emoji: '🧊',
        audienceState: "They don't know you. They may not even know they have this problem.",
        communicationFocus: 'Awareness',
        strategy: "Lead AWAY from pain. Make them aware of the pain and curious about a solution. Don't sell—educate and intrigue.",
        hookDirection: "Agitate the pain they didn't know they had. Create pattern interrupt.",
        hookExamples: [
            "Ten reasons your [current approach] is out to get you.",
            "Stop doing [common mistake] if you want [desired outcome].",
            "The [industry] lie that's costing you [consequence]."
        ],
        contentApproach: "Focus on naming the pain clearly. Make them FEEL the problem before mentioning any solution. Build curiosity about what's causing their struggle.",
        ctaStyle: 'Soft CTA',
        ctaExamples: ['Follow for Part 2', 'Save this for later', 'Comment if this is you', 'Share with someone who needs this'],
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
    },
    warm: {
        label: 'Warm',
        emoji: '🌡️',
        audienceState: "They know solutions exist. They're comparing options. They've probably been burned before.",
        communicationFocus: 'Consideration',
        strategy: "Lead TOWARD solution. Differentiate your approach. Show why YOU are the answer. Prove with specifics.",
        hookDirection: "Position your unique approach. Show why other solutions failed them.",
        hookExamples: [
            "[Your method]'s [unique feature] is the clear choice.",
            "Why I stopped [common approach] and switched to [your approach].",
            "The difference between [failing approach] and [winning approach]."
        ],
        contentApproach: "They know the problem exists—show them YOUR specific solution is different. Use proof, specifics, and authority. Address why past solutions failed.",
        ctaStyle: 'Medium CTA',
        ctaExamples: ['Link in bio', 'DM me "START"', 'Watch the next video', 'Grab the free guide'],
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
    },
    hot: {
        label: 'Hot',
        emoji: '🔥',
        audienceState: "They know YOU. They trust you. They're ready to decide.",
        communicationFocus: 'Conversion',
        strategy: "Lead TOWARD action. Remove final objections. Create urgency. Make the offer directly.",
        hookDirection: "Remove final hesitation. Create urgency. Make the direct offer.",
        hookExamples: [
            "[Time-limited offer] — Keep your [benefit] and your [secondary benefit].",
            "Only [number] spots left. Here's exactly what you get.",
            "This is your last chance to [transformation] before [deadline]."
        ],
        contentApproach: "They trust you—now remove final objections. Be direct about the offer. Use scarcity and urgency authentically. Show what they'll miss by not acting.",
        ctaStyle: 'Hard CTA',
        ctaExamples: ['Enroll now', 'Join before doors close', 'Only 10 spots left', 'Use code SAVE20 today'],
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
    },
};

// ============================================
// DESIRE MARKET DEFINITIONS
// ============================================

export const DESIRE_MARKET_HIERARCHY = ['relationships', 'experiences', 'time', 'money'] as const;

export const DESIRE_MARKET_DEFINITIONS: Record<DesireMarket, {
    label: string;
    whatTheySay: string;
    whatTheyMean: string;
    contentAngle: string;
    icon: string;
}> = {
    money: {
        label: 'Money',
        whatTheySay: 'I need more revenue/clients/sales',
        whatTheyMean: 'I want security and freedom from financial stress',
        contentAngle: "Promise outcomes, but remember they'll spend money to get time",
        icon: '💰',
    },
    time: {
        label: 'Time',
        whatTheySay: 'I need more hours in the day',
        whatTheyMean: 'I want freedom and efficiency',
        contentAngle: 'Promise efficiency, but remember they want time for experiences',
        icon: '⏰',
    },
    experiences: {
        label: 'Experiences',
        whatTheySay: 'I want to feel successful/fulfilled',
        whatTheyMean: 'I want transformation and meaning',
        contentAngle: 'Show transformation, but remember experiences build relationships',
        icon: '🌟',
    },
    relationships: {
        label: 'Relationships',
        whatTheySay: 'I want to matter/connect/belong',
        whatTheyMean: 'I want deep human connection',
        contentAngle: 'This is the deepest need—speak to belonging and significance',
        icon: '❤️',
    },
};

// ============================================
// PRIORITY LABELS FOR GAP SCORES
// ============================================

export type GapPriority = 'critical' | 'strong' | 'baseline' | 'delivery' | 'outcome';

export interface GapPriorityInfo {
    priority: GapPriority;
    label: string;
    color: string;
    bgColor: string;
    instruction: string;
}

export const getGapPriority = (score: number): GapPriorityInfo => {
    if (score >= 80) {
        return {
            priority: 'critical',
            label: 'CRITICAL',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            instruction: 'Lead with this in your hook',
        };
    }
    if (score >= 60) {
        return {
            priority: 'strong',
            label: 'STRONG',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            instruction: 'Use as supporting message',
        };
    }
    if (score >= 40) {
        return {
            priority: 'baseline',
            label: 'BASELINE',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            instruction: "Mention but don't lead with it",
        };
    }
    if (score >= 20) {
        return {
            priority: 'delivery',
            label: 'DELIVERY',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            instruction: 'Save for fulfillment, not hook',
        };
    }
    return {
        priority: 'outcome',
        label: 'OUTCOME',
        color: 'text-teal-500',
        bgColor: 'bg-teal-500/10',
        instruction: 'Result of good delivery',
    };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getSixSIcon = (category: SixS): string => {
    return SIX_S_DEFINITIONS[category].icon;
};

export const getTemperatureIcon = (temperature: Temperature): string => {
    return TEMPERATURE_DEFINITIONS[temperature].emoji;
};

export const getDesireMarketIcon = (market: DesireMarket): string => {
    return DESIRE_MARKET_DEFINITIONS[market].icon;
};

// Get all Six S categories as an array
export const ALL_SIX_S: SixS[] = ['significant', 'safe', 'supported', 'successful', 'surprise', 'share'];

// Get all temperatures as an array
export const ALL_TEMPERATURES: Temperature[] = ['cold', 'warm', 'hot'];

// Get all desire markets as an array
export const ALL_DESIRE_MARKETS: DesireMarket[] = ['money', 'time', 'experiences', 'relationships'];

// ============================================
// CATEGORY NORMALIZATION
// ============================================

/**
 * Normalize AI-returned category strings to valid SixS keys
 * Handles variations like "surprise & delight" → "surprise"
 */
export const normalizeSixSCategory = (category: string): SixS | null => {
    const normalized = category.toLowerCase().trim();

    // Direct matches
    if (ALL_SIX_S.includes(normalized as SixS)) {
        return normalized as SixS;
    }

    // Handle common variations
    const mappings: Record<string, SixS> = {
        'surprise & delight': 'surprise',
        'surprise and delight': 'surprise',
        'surprise/delight': 'surprise',
        'delight': 'surprise',
        'significance': 'significant',
        'safety': 'safe',
        'security': 'safe',
        'support': 'supported',
        'success': 'successful',
        'sharing': 'share',
        'advocacy': 'share',
    };

    if (mappings[normalized]) {
        return mappings[normalized];
    }

    // Partial match fallback
    for (const sixS of ALL_SIX_S) {
        if (normalized.includes(sixS) || sixS.includes(normalized.split(' ')[0])) {
            return sixS;
        }
    }

    console.warn(`Could not normalize Six S category: "${category}"`);
    return null;
};

/**
 * Match a text string (quote, comment, etc.) to the most relevant Six S category
 * Returns the category with the most keyword matches, or null if no matches
 */
export const matchTextToSixS = (text: string): SixS | null => {
    const lowercaseText = text.toLowerCase();
    const scores: Record<SixS, number> = {
        significant: 0,
        safe: 0,
        supported: 0,
        successful: 0,
        surprise: 0,
        share: 0,
    };

    // Score each category based on keyword matches
    for (const [category, definition] of Object.entries(SIX_S_DEFINITIONS)) {
        for (const keyword of definition.keywords) {
            if (lowercaseText.includes(keyword.toLowerCase())) {
                scores[category as SixS] += 1;
            }
        }
    }

    // Find the category with the highest score
    let maxScore = 0;
    let bestMatch: SixS | null = null;

    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestMatch = category as SixS;
        }
    }

    return maxScore > 0 ? bestMatch : null;
};

// ============================================
// AVATAR MATRIX TO SIX S MAPPING
// ============================================

/**
 * Mapping from Avatar's pain_points_matrix keys to Six S type keys
 * Avatar matrix uses: 'Significance', 'Safe', 'Supported', 'Successful', 'Surprise-and-delight', 'Sharing'
 * Six S types use: 'significant', 'safe', 'supported', 'successful', 'surprise', 'share'
 */
export const AVATAR_MATRIX_TO_SIX_S: Record<string, SixS> = {
    'Significance': 'significant',
    'Safe': 'safe',
    'Supported': 'supported',
    'Successful': 'successful',
    'Surprise-and-delight': 'surprise',
    'Sharing': 'share',
};

/**
 * Reverse mapping: Six S type keys to Avatar matrix display labels
 */
export const SIX_S_TO_DISPLAY_LABEL: Record<SixS, string> = {
    'significant': 'Significance',
    'safe': 'Safety',
    'supported': 'Support',
    'successful': 'Success',
    'surprise': 'Surprise & Delight',
    'share': 'Sharing',
};

/**
 * Convert an avatar's pain_points_matrix key to a valid SixS type
 */
export const normalizeAvatarMatrixKey = (key: string): SixS | null => {
    // Direct mapping
    if (AVATAR_MATRIX_TO_SIX_S[key]) {
        return AVATAR_MATRIX_TO_SIX_S[key];
    }

    // Try lowercase normalization
    const normalized = normalizeSixSCategory(key);
    if (normalized) return normalized;

    return null;
};

/**
 * Get the icon for a Six S category (works with both matrix keys and type keys)
 */
export const getSixSIconForKey = (key: string): string => {
    const sixS = normalizeAvatarMatrixKey(key) || normalizeSixSCategory(key);
    if (sixS && SIX_S_DEFINITIONS[sixS]) {
        return SIX_S_DEFINITIONS[sixS].icon;
    }
    return '📊'; // Default icon
};

// ============================================
// CONTENT FRAMEWORK DEFINITIONS
// ============================================

export interface ContentFramework {
    id: ContentFrameworkId;
    name: string;
    description: string;
    structure: string[];
    bestFor: string;
    icon: string;
    temperatureAffinity: Temperature[]; // Which temperatures this works best with
}

export const CONTENT_FRAMEWORK_DEFINITIONS: Record<ContentFrameworkId, ContentFramework> = {
    before_after: {
        id: 'before_after',
        name: 'Before/After Contrast',
        description: 'Show transformation through stark contrast between pain state and desired outcome',
        structure: [
            'Hook: Current painful reality',
            'Agitate: Why it\'s getting worse',
            'Transformation: What changed',
            'Proof: Results and evidence',
            'CTA: How to start'
        ],
        bestFor: 'High emotional pain, clear transformation stories, visual impact',
        icon: '🔄',
        temperatureAffinity: ['cold', 'warm'],
    },
    pas: {
        id: 'pas',
        name: 'Problem-Agitate-Solve',
        description: 'Amplify the pain, then offer the solution as relief',
        structure: [
            'Problem: Name the pain clearly',
            'Agitate: Make them feel it deeply',
            'Solution: Present your answer',
            'Proof: Why it works',
            'CTA: Next step'
        ],
        bestFor: 'Urgent problems, skeptical audiences, competitive markets',
        icon: '🔥',
        temperatureAffinity: ['cold', 'warm'],
    },
    heros_journey: {
        id: 'heros_journey',
        name: 'Hero\'s Journey',
        description: 'Position the customer as the hero, you as the guide',
        structure: [
            'Ordinary World: Where they are now',
            'Call to Adventure: The opportunity',
            'Guide Appears: You enter',
            'Transformation: The change',
            'Return: New reality'
        ],
        bestFor: 'Story-driven brands, personal transformation, course creators',
        icon: '⚔️',
        temperatureAffinity: ['warm', 'hot'],
    },
    curiosity_gap: {
        id: 'curiosity_gap',
        name: 'The Curiosity Gap',
        description: 'Tease an insight they\'re missing to create tension',
        structure: [
            'Hook: Intriguing statement',
            'Gap: What they don\'t know',
            'Tease: Hint at the insight',
            'Reveal: The key insight',
            'CTA: How to learn more'
        ],
        bestFor: 'Educational content, thought leadership, new perspectives',
        icon: '🧩',
        temperatureAffinity: ['cold'],
    },
    social_proof: {
        id: 'social_proof',
        name: 'Social Proof Story',
        description: 'Others like them succeeded, so can they',
        structure: [
            'Hook: Relatable struggle',
            'Proof: Others faced this too',
            'Method: What they did',
            'Results: What happened',
            'CTA: Join them'
        ],
        bestFor: 'Skeptical audiences, competitive markets, high-ticket offers',
        icon: '👥',
        temperatureAffinity: ['warm', 'hot'],
    },
    simple_truth: {
        id: 'simple_truth',
        name: 'The Simple Truth',
        description: 'Cut through complexity with refreshing clarity',
        structure: [
            'Hook: Contrarian statement',
            'Truth: The simple answer',
            'Evidence: Why it works',
            'Application: How to use it',
            'CTA: Start here'
        ],
        bestFor: 'Overwhelmed audiences, commodity markets, thought leaders',
        icon: '💡',
        temperatureAffinity: ['cold', 'warm'],
    },
};

export const ALL_CONTENT_FRAMEWORKS: ContentFrameworkId[] = [
    'before_after', 'pas', 'heros_journey', 'curiosity_gap', 'social_proof', 'simple_truth'
];

// ============================================
// PSYCHOLOGICAL TRIGGER DEFINITIONS
// ============================================

export interface PsychologicalTrigger {
    id: PsychologicalTriggerId;
    name: string;
    description: string;
    temperatureAffinity: Temperature[]; // Which temperatures this works best with
    icon: string;
    hookTemplate: string; // Template for generating hooks
}

export const PSYCHOLOGICAL_TRIGGER_DEFINITIONS: Record<PsychologicalTriggerId, PsychologicalTrigger> = {
    loss_aversion: {
        id: 'loss_aversion',
        name: 'Loss Aversion',
        description: 'Highlight what they\'re losing by waiting or not acting',
        temperatureAffinity: ['cold', 'warm'],
        icon: '⚠️',
        hookTemplate: 'Every day you wait, you\'re losing [specific loss]. Here\'s what it\'s costing you...',
    },
    social_proof: {
        id: 'social_proof',
        name: 'Social Proof',
        description: 'Show others in their situation who succeeded',
        temperatureAffinity: ['warm', 'hot'],
        icon: '👥',
        hookTemplate: '[Number] people just like you made the switch. Here\'s what happened...',
    },
    authority: {
        id: 'authority',
        name: 'Authority/Expertise',
        description: 'Leverage your unique insight or expertise',
        temperatureAffinity: ['warm'],
        icon: '🎓',
        hookTemplate: 'After [experience/credential], I discovered the one thing that [outcome]...',
    },
    scarcity: {
        id: 'scarcity',
        name: 'Scarcity/Urgency',
        description: 'Time-sensitive opportunity or limited availability',
        temperatureAffinity: ['hot'],
        icon: '⏰',
        hookTemplate: 'Only [number] spots left. Doors close in [time]. This is your last chance to [outcome]...',
    },
    progress: {
        id: 'progress',
        name: 'Progress/Momentum',
        description: 'Promise quick, visible progress and early wins',
        temperatureAffinity: ['cold', 'warm', 'hot'],
        icon: '📈',
        hookTemplate: 'In just [timeframe], you\'ll see [specific progress]. Start here...',
    },
};

export const ALL_PSYCHOLOGICAL_TRIGGERS: PsychologicalTriggerId[] = [
    'loss_aversion', 'social_proof', 'authority', 'scarcity', 'progress'
];

/**
 * Get frameworks best suited for a specific temperature
 */
export const getFrameworksForTemperature = (temp: Temperature): ContentFramework[] => {
    return Object.values(CONTENT_FRAMEWORK_DEFINITIONS)
        .filter(f => f.temperatureAffinity.includes(temp));
};

/**
 * Get triggers best suited for a specific temperature
 */
export const getTriggersForTemperature = (temp: Temperature): PsychologicalTrigger[] => {
    return Object.values(PSYCHOLOGICAL_TRIGGER_DEFINITIONS)
        .filter(t => t.temperatureAffinity.includes(temp));
};
