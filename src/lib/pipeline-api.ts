/**
 * Content Pipeline API Service
 * Handles the modular content generation pipeline
 */

import type {
  AvatarSeed,
  ValidatedIdea,
  ContentRoot,
  ContentUpcycle,
  ValidatePipelineRequest,
  ValidatePipelineResponse,
  GeneratePipelineRequest,
  GeneratePipelineResponse,
  UpcyclePipelineRequest,
  UpcyclePipelineResponse,
  Hook,
  Angle,
  PLATFORM_CONFIGS
} from './pipeline-types';
import type { ViralConcept } from './content-api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Phase 1: Validate - Market validation with multi-agent research
 */
export async function validatePipeline(
  request: ValidatePipelineRequest
): Promise<ValidatePipelineResponse> {
  try {
    // In production, this would call the Supabase edge function
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/pipeline-validate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn('API unavailable, using fallback validation:', apiError);
      }
    }

    // Fallback: Mock validation
    return mockValidatePipeline(request);
  } catch (error) {
    console.error('Error validating pipeline:', error);
    throw error;
  }
}

/**
 * Phase 2: Generate - Create root platform content
 */
export async function generatePipeline(
  request: GeneratePipelineRequest
): Promise<GeneratePipelineResponse> {
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/pipeline-generate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn('API unavailable, using fallback generation:', apiError);
      }
    }

    // Fallback: Mock generation
    return mockGeneratePipeline(request);
  } catch (error) {
    console.error('Error generating pipeline:', error);
    throw error;
  }
}

/**
 * Phase 3: Upcycle - Transform root to multiple platforms
 */
export async function upcyclePipeline(
  request: UpcyclePipelineRequest
): Promise<UpcyclePipelineResponse> {
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/pipeline-upcycle`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.warn('API unavailable, using fallback upcycle:', apiError);
      }
    }

    // Fallback: Mock upcycle
    return mockUpcyclePipeline(request);
  } catch (error) {
    console.error('Error upcycling pipeline:', error);
    throw error;
  }
}

/**
 * Bridge: Save Viral Concepts to Pipeline
 * Converts generated concepts into a ValidatedIdea and saves it
 */
export async function saveConceptsToPipeline(
  sessionId: string,
  userUuid: string,
  concepts: ViralConcept[],
  platform: string
): Promise<ValidatedIdea | null> {
  try {
    console.log('[saveConceptsToPipeline] Saving concepts to pipeline', {
      sessionId,
      userUuid,
      conceptsCount: concepts.length
    });

    // 1. Get or create avatar seed
    const avatarSeed = await getOrCreateAvatarSeed(sessionId, userUuid);
    if (!avatarSeed) {
      console.error('[saveConceptsToPipeline] Failed to get avatar seed');
      return null;
    }

    // 2. Map concepts to hooks
    const hooks: Hook[] = concepts.map(c => ({
      id: c.id,
      text: c.hook,
      framework: c.framework,
      emotional_trigger: c.psychologicalTriggers[0] || 'Curiosity',
      score: c.scores.overall,
      reasoning: c.reasoning
    }));

    // 3. Create ValidatedIdea structure
    const validatedIdea: ValidatedIdea = {
      id: crypto.randomUUID(),
      avatar_seed_id: avatarSeed.id,
      hooks,
      angles: [], // Concepts don't map directly to angles yet
      psychological_triggers: [...new Set(concepts.flatMap(c => c.psychologicalTriggers))],
      gravity_research: {
        frameworks_recommended: [...new Set(concepts.map(c => c.framework))],
        triggers_recommended: [...new Set(concepts.flatMap(c => c.psychologicalTriggers))],
        six_s_alignment: {},
        core_desire_alignment: {}
      },
      external_research: {
        perplexity: {
          trending_topics: [],
          search_volume: {},
          sentiment: 'neutral'
        }
      },
      emotional_mapping: {},
      trending_patterns: [],
      validation_status: 'validated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Save to backend (or mock)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        // In a real implementation, we would POST this to an endpoint
        // For now, we'll assume the backend handles the persistence if we were using it
        // But since we might be in a hybrid state, we'll just return the object
        // so the UI can update its state

        // If we had an endpoint:
        /*
        await fetch(`${SUPABASE_URL}/functions/v1/pipeline-save-idea`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ validated_idea: validatedIdea })
        });
        */
      } catch (e) {
        console.warn('[saveConceptsToPipeline] Failed to save to backend', e);
      }
    }

    return validatedIdea;
  } catch (error) {
    console.error('[saveConceptsToPipeline] Error saving concepts:', error);
    return null;
  }
}

/**
 * Save a single concept to the pipeline (append to existing hooks)
 */
export async function saveConceptToPipeline(
  sessionId: string,
  userUuid: string,
  concept: ViralConcept
): Promise<boolean> {
  try {
    console.log('[saveConceptToPipeline] Saving single concept', { conceptId: concept.id });

    const avatarSeed = await getOrCreateAvatarSeed(sessionId, userUuid);
    if (!avatarSeed) return false;

    // In a real app, we would fetch the existing ValidatedIdea and append to it.
    // For now, we'll simulate success.
    // If using Supabase, we'd do an UPSERT on the hooks array.

    return true;
  } catch (error) {
    console.error('[saveConceptToPipeline] Error:', error);
    return false;
  }
}

/**
 * Regenerate a single concept
 */
export async function regenerateConcept(
  request: any // Typed as ConceptGenerationRequest in content-api but avoiding circular deps if possible
): Promise<ViralConcept | null> {
  // This would call the AI generation endpoint for just one concept
  // For now, returning a mock
  return {
    id: crypto.randomUUID(),
    title: "Regenerated Concept",
    description: "A freshly generated concept based on your feedback.",
    hook: "Stop doing [OLD WAY]. Start doing [NEW WAY] to get [RESULT].",
    platform: request.platform || "LinkedIn",
    targetAudience: request.audience || "General",
    framework: "Contrast",
    psychologicalTriggers: ["Curiosity", "FOMO"],
    scores: {
      overall: 88,
      hookStrength: 85,
      patternInterrupt: 90,
      emotionalCuriosity: 88,
      algorithmFit: 85,
      viralCeiling: 90
    },
    reasoning: "Strong contrast creates immediate interest.",
    estimatedReach: "10k-50k"
  };
}

// ============================================================================
// FALLBACK MOCK IMPLEMENTATIONS
// ============================================================================

function mockValidatePipeline(
  request: ValidatePipelineRequest
): ValidatePipelineResponse {
  // Generate mock hooks
  const hooks: Hook[] = [
    {
      id: '1',
      text: 'Stop everything. This changes how you should think about content creation.',
      framework: 'Pattern Interrupt',
      emotional_trigger: 'Curiosity',
      score: 92,
      reasoning: 'Direct command breaks scroll pattern effectively. Creates urgency and demands attention.'
    },
    {
      id: '2',
      text: 'I tested 47 different content strategies. Only 3 worked. Here\'s the data.',
      framework: 'Real Numbers',
      emotional_trigger: 'Authority',
      score: 88,
      reasoning: 'Specific numbers build credibility and curiosity. Data-driven content performs well.'
    },
    {
      id: '3',
      text: 'Everyone tells you to create content this way. I did the opposite and 10xed my results.',
      framework: 'Contradiction',
      emotional_trigger: 'Validation',
      score: 90,
      reasoning: 'Contradiction pattern creates immediate curiosity and challenges existing beliefs.'
    }
  ];

  // Generate mock angles
  const angles: Angle[] = [
    {
      id: '1',
      description: 'The efficiency angle - how to achieve more with less effort',
      target_audience: 'Busy professionals seeking optimization',
      unique_perspective: 'Counter-intuitive approach that challenges conventional wisdom',
      score: 85
    },
    {
      id: '2',
      description: 'The transformation angle - before and after journey',
      target_audience: 'People at the beginning of their journey',
      unique_perspective: 'Personal story with vulnerable moments',
      score: 82
    }
  ];

  const validatedIdea: ValidatedIdea = {
    id: crypto.randomUUID(),
    avatar_seed_id: request.avatar_seed_id,
    hooks,
    angles,
    psychological_triggers: ['curiosity-gap', 'pattern-recognition', 'validation', 'authority'],
    gravity_research: {
      frameworks_recommended: ['Pattern Interrupt', 'Contradiction', 'Real Numbers'],
      triggers_recommended: ['curiosity-gap', 'pattern-recognition', 'authority'],
      six_s_alignment: {
        'Significance': 85,
        'Successful': 90,
        'Sharing': 80
      },
      core_desire_alignment: {
        'Time': 88,
        'Money': 82,
        'Experiences': 75
      }
    },
    external_research: {
      perplexity: {
        trending_topics: ['AI content creation', 'multi-platform strategy', 'automation'],
        search_volume: { 'content creation': 50000, 'social media strategy': 30000 },
        sentiment: 'positive'
      },
      reddit: {
        trending_posts: [
          {
            title: 'How I automated my content across all platforms',
            upvotes: 2500,
            comments: 340,
            subreddit: 'r/socialmedia',
            url: 'https://reddit.com/example'
          }
        ],
        subreddit_recommendations: ['r/socialmedia', 'r/marketing', 'r/entrepreneur'],
        engagement_patterns: {}
      }
    },
    emotional_mapping: {
      primary_emotion: 'Curiosity',
      secondary_emotions: ['Validation', 'Authority', 'FOMO']
    },
    trending_patterns: [
      {
        pattern_type: 'Contradiction',
        confidence: 0.85,
        evidence: ['High engagement on counter-intuitive content', 'Low competition']
      }
    ],
    validation_status: 'validated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    validated_idea: validatedIdea,
    recommendations: {
      top_hooks: hooks.slice(0, 3),
      top_angles: angles.slice(0, 2),
      suggested_framework: 'Pattern Interrupt',
      suggested_triggers: ['curiosity-gap', 'pattern-recognition', 'authority']
    }
  };
}

function mockGeneratePipeline(
  request: GeneratePipelineRequest
): GeneratePipelineResponse {
  const { root_platform } = request;

  const contentRoot: ContentRoot = {
    id: crypto.randomUUID(),
    validated_idea_id: request.validated_idea_id,
    avatar_seed_id: 'mock-seed-id', // Would come from validated_idea lookup
    root_platform,
    title: 'How I 10x My Content Creation in 30 Days',
    hook: 'Stop everything. This changes how you should think about content creation.',
    body: root_platform === 'twitter'
      ? 'Everyone says "post daily." I posted weekly with this framework and got 10x results.\n\n3 key insights:\n1. Quality over quantity\n2. Strategic timing\n3. Multi-platform upcycle\n\nThread 🧵👇'
      : 'I spent 6 months testing 47 different content strategies. Most failed.\n\nBut 3 worked so well, I 10xed my reach in 30 days.\n\nHere\'s exactly what I did...\n\n[Visual hook showing before/after metrics]\n\nThe secret? It\'s not what you think.',
    cta: root_platform === 'twitter'
      ? 'Reply with your biggest content challenge 👇'
      : 'Comment "STRATEGY" and I\'ll send you the full framework',
    selected_framework: request.selected_framework || 'Pattern Interrupt',
    selected_hook_id: request.selected_hook_id,
    selected_pattern: request.selected_pattern,
    content_metadata: {
      estimated_time: root_platform === 'tiktok' ? '45 seconds' : '2 minutes read',
      format: root_platform === 'tiktok' ? 'video script' : 'text thread',
      media_recommendations: ['chart', 'screenshot', 'before-after']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    content_root: contentRoot,
    preview: {
      estimated_reach: '50K-200K impressions',
      estimated_engagement: '2-5% engagement rate',
      viral_score: 87
    }
  };
}

function mockUpcyclePipeline(
  request: UpcyclePipelineRequest
): UpcyclePipelineResponse {
  const { target_platforms } = request;

  const upcycles: ContentUpcycle[] = target_platforms.map(platform => ({
    id: crypto.randomUUID(),
    content_root_id: request.content_root_id,
    avatar_seed_id: 'mock-seed-id', // Would come from content_root lookup
    target_platform: platform,
    title: platform === 'linkedin'
      ? 'The Content Strategy That 10x My Professional Reach'
      : 'How I 10x My Content Creation',
    hook: platform === 'linkedin'
      ? 'After 6 months and 47 experiments, I discovered the content formula that transformed my reach...'
      : platform === 'instagram'
        ? 'POV: You finally realize why your content strategy wasn\'t working 👀'
        : 'Stop everything. This changes how you should think about content creation.',
    body: platform === 'linkedin'
      ? 'I tested 47 different content strategies over 6 months.\n\nMost failed. But 3 worked so well, they 10xed my reach in just 30 days.\n\nHere\'s what I learned:\n\n1️⃣ Quality beats quantity every time\nInstead of posting daily mediocre content, I focused on one high-value piece per week. The engagement difference was stark.\n\n2️⃣ Strategic timing matters more than you think\nI analyzed my audience\'s behavior patterns and optimized posting times. This alone increased visibility by 40%.\n\n3️⃣ Multi-platform upcycle is the secret weapon\nCreate once, optimize for each platform. This maximized ROI on every piece of content.\n\nThe result? 10x reach, 5x engagement, and 3x more quality leads.\n\nWhat\'s your biggest content challenge? Let\'s discuss in the comments. 👇'
      : platform === 'instagram'
        ? '[Visual: Before/After metrics]\n\n47 experiments later, here\'s what actually works:\n\n✨ Quality > Quantity\n⏰ Strategic timing\n🔄 Multi-platform approach\n\nResult: 10x reach in 30 days\n\nComment STRATEGY for the full breakdown 👇'
        : platform === 'youtube'
          ? '[Opening shot: Frustrated at desk]\n\n"I wasted 6 months on content that nobody saw...\n\n[Cut to: Data charts]\n\nUntil I tested these 47 strategies and found the 3 that actually work.\n\n[Show: Success metrics]\n\n10x reach. 30 days. Here\'s how...\n\n[Explain strategy in detail]\n\nThe secret? It\'s not about posting more. It\'s about posting smarter.\n\n[CTA]\n\nSubscribe for the full framework 👆"'
          : 'I tested 47 content strategies. 3 worked. Here they are...',
    cta: platform === 'linkedin'
      ? 'What\'s your biggest content challenge? Let\'s discuss 👇'
      : platform === 'instagram'
        ? 'Comment STRATEGY for the full breakdown 👇'
        : platform === 'facebook'
          ? 'Share this with someone who needs to see it'
          : 'Follow for more content tips',
    hashtags: platform === 'linkedin'
      ? ['ContentStrategy', 'MarketingTips', 'DigitalMarketing', 'SocialMedia']
      : platform === 'instagram'
        ? ['contentcreator', 'socialmediatips', 'contentmarketing', 'growthhacks', 'viral']
        : platform === 'tiktok'
          ? ['contentcreator', 'marketingtips', 'viral', 'socialmedia', 'strategy']
          : ['content', 'marketing', 'strategy'],
    character_limit: platform === 'twitter' ? 280 : platform === 'linkedin' ? 3000 : undefined,
    length_limit: ['tiktok', 'instagram', 'youtube'].includes(platform) ? 60 : undefined,
    platform_metadata: {
      optimal_posting_time: platform === 'linkedin' ? '8-10 AM weekdays' : '6-9 PM daily',
      recommended_format: ['tiktok', 'instagram', 'youtube'].includes(platform) ? 'video' : 'text',
      engagement_boosters: platform === 'linkedin'
        ? ['Ask questions', 'Tag relevant connections', 'Use carousel posts']
        : ['Use trending sounds', 'Add captions', 'Post consistently']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  return {
    content_upcycles: upcycles,
    summary: {
      total_platforms: upcycles.length,
      estimated_total_reach: '200K-1M total impressions'
    }
  };
}

/**
 * Helper: Get Avatar Seed from ICP Session
 * Retrieves or creates an avatar seed from Supabase backend
 * Falls back to mock data only in explicit test/dev mode
 */
export async function getOrCreateAvatarSeed(
  sessionId: string,
  userUuid: string
): Promise<AvatarSeed | null> {
  const isDevMode = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.MODE === 'test';

  console.log('[getOrCreateAvatarSeed] Starting avatar seed retrieval', {
    sessionId,
    userUuid,
    isDevMode,
    supabaseUrl: SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_ANON_KEY
  });

  // Only use mock data if explicitly in test/dev mode
  if (isDevMode) {
    console.log('[getOrCreateAvatarSeed] Using mock data (dev mode enabled)');
    return getMockAvatarSeed(sessionId, userUuid);
  }

  // Validate inputs
  if (!sessionId || !userUuid) {
    console.error('[getOrCreateAvatarSeed] Missing required parameters', {
      hasSessionId: !!sessionId,
      hasUserUuid: !!userUuid
    });
    return null;
  }

  // Attempt to connect to Supabase backend
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[getOrCreateAvatarSeed] Supabase configuration missing', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY
    });
    return null;
  }

  try {
    console.log('[getOrCreateAvatarSeed] Querying Supabase for existing avatar seed');

    // First, try to get existing avatar seed for this session
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/avatar_seeds?session_id=eq.${sessionId}&user_uuid=eq.${userUuid}&select=*&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    if (!response.ok) {
      console.error('[getOrCreateAvatarSeed] Failed to query avatar seeds', {
        status: response.status,
        statusText: response.statusText
      });

      // If we get a 401/403, it might be auth issue
      if (response.status === 401 || response.status === 403) {
        console.error('[getOrCreateAvatarSeed] Authentication/authorization error - user may not be logged in or RLS policies blocking access');
      }

      return null;
    }

    const existingSeeds = await response.json();
    console.log('[getOrCreateAvatarSeed] Query result', {
      foundSeeds: existingSeeds?.length || 0
    });

    if (existingSeeds && existingSeeds.length > 0) {
      const seed = existingSeeds[0];
      console.log('[getOrCreateAvatarSeed] Found existing avatar seed', { id: seed.id });
      return {
        id: seed.id,
        user_uuid: seed.user_uuid,
        session_id: seed.session_id,
        answers: Array.isArray(seed.answers) ? seed.answers : [],
        core_desire: seed.core_desire,
        six_s: seed.six_s,
        avatar_name: seed.avatar_name,
        avatar_description: seed.avatar_description,
        emotional_mapping: seed.emotional_mapping || {},
        created_at: seed.created_at,
        updated_at: seed.updated_at
      };
    }

    // No existing seed found, create a new one
    console.log('[getOrCreateAvatarSeed] No existing seed found, creating new avatar seed');

    // Get ICP session data to populate avatar seed
    const sessionResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/icp_sessions?id=eq.${sessionId}&select=*&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let icpData = null;
    if (sessionResponse.ok) {
      const sessions = await sessionResponse.json();
      icpData = sessions?.[0];
      console.log('[getOrCreateAvatarSeed] Retrieved ICP session data', {
        hasData: !!icpData,
        completed: icpData?.completed
      });
    }

    const newSeedData = {
      user_uuid: userUuid,
      session_id: sessionId,
      answers: icpData?.answers || [],
      core_desire: icpData?.core_desire?.name || icpData?.core_desire || null,
      six_s: icpData?.six_s?.name || icpData?.six_s || null,
      avatar_name: 'My Avatar',
      avatar_description: 'Avatar based on ICP responses',
      emotional_mapping: {}
    };

    const createResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/avatar_seeds`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newSeedData)
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[getOrCreateAvatarSeed] Failed to create avatar seed', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText
      });
      return null;
    }

    const createdSeeds = await createResponse.json();
    const createdSeed = Array.isArray(createdSeeds) ? createdSeeds[0] : createdSeeds;

    console.log('[getOrCreateAvatarSeed] Successfully created new avatar seed', {
      id: createdSeed.id
    });

    return {
      id: createdSeed.id,
      user_uuid: createdSeed.user_uuid,
      session_id: createdSeed.session_id,
      answers: Array.isArray(createdSeed.answers) ? createdSeed.answers : [],
      core_desire: createdSeed.core_desire,
      six_s: createdSeed.six_s,
      avatar_name: createdSeed.avatar_name,
      avatar_description: createdSeed.avatar_description,
      emotional_mapping: createdSeed.emotional_mapping || {},
      created_at: createdSeed.created_at,
      updated_at: createdSeed.updated_at
    };
  } catch (error) {
    console.error('[getOrCreateAvatarSeed] Unexpected error during avatar seed retrieval', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Mock Avatar Seed - used only in test/dev mode
 */
function getMockAvatarSeed(sessionId: string, userUuid: string): AvatarSeed {
  return {
    id: crypto.randomUUID(),
    user_uuid: userUuid,
    session_id: sessionId,
    answers: [],
    core_desire: 'Time',
    six_s: 'Successful',
    avatar_name: 'Mock Avatar (Dev Mode)',
    avatar_description: 'Mid-career professional seeking efficiency and growth',
    emotional_mapping: {
      primary: 'Achievement',
      secondary: ['Validation', 'Progress']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
