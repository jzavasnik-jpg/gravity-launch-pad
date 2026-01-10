export interface PlatformConstraints {
    platform: string;
    displayName: string;
    maxLength?: number;
    toneGuidelines: string;
    forbiddenPhrases?: string[];
    recommendedStructure: string;
    icon: string;
}

export const PLATFORM_CONSTRAINTS: Record<string, PlatformConstraints> = {
    youtube: {
        platform: 'youtube',
        displayName: 'YouTube Shorts',
        maxLength: 100, // Title/hook for shorts
        toneGuidelines: 'Ultra-concise, hook within first 3 seconds. Optimize for vertical video and retention.',
        recommendedStructure: 'Immediate hook (visual + text) → Quick value delivery → Loop or CTA',
        icon: '▶️',
    },
    twitter: {
        platform: 'twitter',
        displayName: 'Twitter/X',
        maxLength: 280,
        toneGuidelines: 'Concise, punchy, hook-driven. Use threads for longer content.',
        recommendedStructure: 'Hook (first tweet) + Thread (numbered tweets) or Hook + Link',
        icon: '𝕏',
    },
    linkedin: {
        platform: 'linkedin',
        displayName: 'LinkedIn',
        toneGuidelines: 'Professional yet personal, insight-driven storytelling. Lead with value.',
        recommendedStructure: 'Personal story → Key insight → Actionable takeaway → Call-to-action',
        icon: '💼',
    },
    reddit: {
        platform: 'reddit',
        displayName: 'Reddit',
        toneGuidelines: 'Community-first, helpful, authentic. NO sales pitch. Value over promotion.',
        forbiddenPhrases: ['check out my product', 'DM me for more', 'link in bio', 'pm me'],
        recommendedStructure: 'Share genuine experience → Offer actionable value → Subtle mention if organically relevant',
        icon: '🤖',
    },
    instagram: {
        platform: 'instagram',
        displayName: 'Instagram',
        maxLength: 2200,
        toneGuidelines: 'Visual-first, authentic, relatable. Caption supports image/video.',
        recommendedStructure: 'Hook line → Story/value → CTA + hashtags',
        icon: '📸',
    },
    tiktok: {
        platform: 'tiktok',
        displayName: 'TikTok',
        maxLength: 150,
        toneGuidelines: 'Super concise, trend-aware, conversational. Text on screen.',
        recommendedStructure: 'Immediate hook → Quick value → Loop/CTA',
        icon: '🎵',
    },
    facebook: {
        platform: 'facebook',
        displayName: 'Facebook',
        toneGuidelines: 'Conversational, story-driven, community-building.',
        recommendedStructure: 'Engaging question/story → Value/insight → Discussion prompt',
        icon: '👥',
    },
};

export const AVAILABLE_PLATFORMS = Object.keys(PLATFORM_CONSTRAINTS);

/**
 * Content frameworks mapped to platform best practices
 */
export const FRAMEWORK_PLATFORM_TEMPLATES: Record<string, Record<string, string>> = {
    'Before/After Contrast': {
        youtube: `📱 YOUTUBE SHORTS SCRIPT (60 sec)

HOOK (0-3 sec): 
[Visual: Show "before" state] 
Text on screen: "[Painful state]"
Voice: "I used to [struggle]..."

VALUE (3-45 sec):
[Visual: Quick cuts showing transformation]
Text: "Then this changed everything ↓"
Voice: "Here's what happened..."
• [Key change 1]
• [Key change 2]  
• [Result]

CTA (45-60 sec):
[Visual: Current state]
Text: "You can do this too"
Voice: "Comment [keyword] for the full breakdown"`,

        twitter: `Hook: [Painful before state in 1 line]

Let me show you what changed...

🧵Thread:
1/ [What they were experiencing]
2/ [What changed/realized]
3/ [New reality]
4/ [How you can do it too]`,

        linkedin: `I used to [painful before state].

It was [specific impact on daily life/emotions].

Then [turning point/insight].

Now [transformed state with specifics].

Here's what changed:
• [Change 1]
• [Change 2]
• [Change 3]

The difference is [tangible result].

If you're still [painful state], here's what helped me...`,

        reddit: `[Subreddit context] - hope this helps someone

Background: I spent [time period] dealing with [specific struggle]. It was affecting [concrete impacts].

What changed: [Genuine insight or realization]

Results: [Honest before/after without hype]

Happy to share more about [specific aspect] if helpful to anyone in similar situation.`,

        facebook: `Can I be honest about [topic]?

I used to [painful before state]. It was affecting [area of life].

Everything changed when [turning point].

Now [current reality with specifics].

Anyone else been through something similar? 👇`,

        instagram: `POV: You finally escaped [painful state] 🎯

Before:
[Struggle point 1]
[Struggle point 2]
[Struggle point 3]

After:
✨ [Transformation 1]
✨ [Transformation 2]
✨ [Transformation 3]

The shift: [Key insight]

Double tap if you're ready for this change ❤️

#[relevant] #[hashtags]`,

        tiktok: `🎬 TIKTOK SCRIPT (15-30 sec)

Text: "Before vs After [topic]"

Before (fast cuts):
- [Pain point 1]
- [Pain point 2]
- [Pain point 3]

After (smooth transitions):
✅ [Result 1]
✅ [Result 2]
✅ [Result 3]

Text overlay: "Comment 'HOW' for the breakdown"`,
    },

    'Problem-Agitate-Solve': {
        youtube: `📱 YOUTUBE SHORTS SCRIPT

HOOK (0-3 sec):
Text: "If you're [struggling with X]..."
Voice: "Stop doing this ❌"

AGITATE (3-30 sec):
[Visual: Show problem getting worse]
Text: "This is why it's not working:"
• [Reason 1]
• [Reason 2]
• [Making it worse]

SOLVE (30-55 sec):
[Visual: Solution in action]
Text: "Do this instead ✅"
Voice: "[Quick actionable solution]"

CTA (55-60 sec):
"Follow for more [topic] tips"`,

        twitter: `Most people struggling with [problem] don't realize [key insight].

Here's why it's getting worse:

🧵

1/ [Agitation point 1]
2/ [Agitation point 2]  
3/ [The real solution]
4/ [How to implement]`,

        linkedin: `Let's talk about [problem] honestly.

Everyone knows it's an issue, but here's what nobody mentions: [agitation].

It's costing you [specific impact].

The solution isn't [common approach].

It's [actual solution with reasoning].

I learned this by [personal experience/data].

Here's how to apply it...`,

        reddit: `PSA: If you're dealing with [problem], this might save you some headaches

I see a lot of posts about [problem]. Here's what worked for me after trying everything else.

The issue: [Clear problem description]

Why it sucks: [Agitation without overdoing it]

What actually worked: [Genuine solution]

Hope this helps someone avoid the same mistakes I made.`,

        facebook: `Real talk: [Problem] is getting worse and here's why...

Most advice tells you [common but wrong approach].

That actually makes it worse because [agitation].

What worked for me: [Solution]

Drop a 💡 if this makes sense`,

        instagram: `❌ STOP [doing wrong thing]

If you're dealing with [problem], this is making it worse:

1. [Agitation 1]
2. [Agitation 2]
3. [Agitation 3]

✅ DO THIS INSTEAD:

[Clear, actionable solution]

Save this for later 🔖

#[topic] #[help]`,

        tiktok: `STOP ❌

If you [have problem], you're probably making it worse

Here's why:
→ [Reason 1]
→ [Reason 2]

Do THIS instead ✅
[Quick solution]

#[topic]tip`,
    },

    'The Simple Truth': {
        youtube: `📱 YOUTUBE SHORTS SCRIPT

HOOK (0-3 sec):
Text: "Everyone complicates [topic]"
Voice: "It's actually simple..."

TRUTH (3-45 sec):
[Visual: Clear, simple demonstration]
Text: "The real answer:"
Voice: "[Simple truth explained clearly]"

PROOF (45-55 sec):
"Here's why it works:"
[Quick evidence/example]

CTA (55-60 sec):
"Try this and let me know"`,

        twitter: `Everyone complicates [topic].

The truth is simpler:

[Clear, direct statement]

Here's what that means 👇`,

        linkedin: `After [X years/attempts] with [topic], I learned something counterintuitive:

[Simple truth statement]

Not what most "experts" will tell you.

Here's why...`,

        reddit: `Unpopular opinion: [topic] is way simpler than people make it

Hear me out.

Most advice tells you [complicated approach].

Reality: [Simple truth]

Here's my experience...`,

        facebook: `Hot take: [Topic] doesn't have to be complicated

The simple truth everyone misses:

[Clear statement]

Agree or disagree? 🤔`,

        instagram: `The TRUTH about [topic] nobody tells you:

It's not complicated.

Most "experts" overcomplicate it.

The reality:
→ [Simple truth]

That's it. That's the post.

Tag someone who needs this 👇

#simple #truth #[topic]`,

        tiktok: `POV: You finally understand [topic]

Everyone: [Overcomplicated advice]

Reality: [Simple truth in one line]

Mind = Blown 🤯

#[topic]hack`,
    },
};

/**
 * Get platform-specific template for a given framework
 */
export function getPlatformTemplate(framework: string, platform: string): string {
    return FRAMEWORK_PLATFORM_TEMPLATES[framework]?.[platform] || '';
}

/**
 * Validate content against platform constraints
 */
export function validatePlatformContent(content: string, platform: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const constraints = PLATFORM_CONSTRAINTS[platform];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check length
    if (constraints.maxLength && content.length > constraints.maxLength) {
        errors.push(`Content exceeds ${constraints.maxLength} character limit (${content.length} chars)`);
    }

    // Check forbidden phrases
    if (constraints.forbiddenPhrases) {
        const contentLower = content.toLowerCase();
        constraints.forbiddenPhrases.forEach(phrase => {
            if (contentLower.includes(phrase.toLowerCase())) {
                errors.push(`Contains forbidden phrase: "${phrase}". This violates platform best practices.`);
            }
        });
    }

    // Platform-specific warnings
    if (platform === 'reddit' && (content.includes('my product') || content.includes('buy'))) {
        warnings.push('Content may be too promotional for Reddit. Focus on value-first approach.');
    }

    if (platform === 'twitter' && content.length > 240 && content.length < 280) {
        warnings.push('Consider breaking into a thread for better engagement.');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
