/**
 * Content Generation API
 * Handles viral concept generation and content scoring
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface ViralConceptScore {
  hookStrength: number;
  patternInterrupt: number;
  emotionalCuriosity: number;
  algorithmFit: number;
  viralCeiling: number;
  overall: number;
}

export interface ViralConcept {
  id: string;
  title: string;
  description: string;
  hook: string;
  platform: string;
  targetAudience: string;
  framework: string;
  psychologicalTriggers: string[];
  scores: ViralConceptScore;
  reasoning: string;
  estimatedReach: string;
}

export interface ConceptGenerationRequest {
  product: string;
  audience: string;
  platform: string;
  gravitySixS?: string;
  brandVoice?: string;
}

export interface ConceptEvaluationRequest {
  concepts: Array<{
    title: string;
    description: string;
    hook: string;
  }>;
  platform: string;
  targetAudience: string;
}

/**
 * Generate viral content concepts using multi-agent workflow
 * Research Agent → Strategy Agent → Evaluation Agent
 */
export async function generateViralConcepts(
  request: ConceptGenerationRequest
): Promise<ViralConcept[]> {
  try {
    console.log('Generating viral concepts...', request);

    // In production, this would call the Supabase edge function
    // For now, returning mock data with realistic structure
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/generate-viral-concepts`,
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
          const data = await response.json();
          return data.concepts || [];
        }
      } catch (apiError) {
        console.warn('API unavailable, using fallback concepts:', apiError);
      }
    }

    // Fallback: Generate mock concepts based on request
    return generateFallbackConcepts(request);
  } catch (error) {
    console.error('Error generating viral concepts:', error);
    return generateFallbackConcepts(request);
  }
}

/**
 * Evaluate and score content concepts
 */
export async function evaluateConcepts(
  request: ConceptEvaluationRequest
): Promise<ViralConcept[]> {
  try {
    console.log('Evaluating concepts...', request);

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/evaluate-concepts`,
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
          const data = await response.json();
          return data.evaluatedConcepts || [];
        }
      } catch (apiError) {
        console.warn('API unavailable, using fallback evaluation:', apiError);
      }
    }

    // Fallback: Score the provided concepts
    return evaluateFallbackConcepts(request);
  } catch (error) {
    console.error('Error evaluating concepts:', error);
    return evaluateFallbackConcepts(request);
  }
}

/**
 * Generate fallback concepts when API is unavailable
 */
function generateFallbackConcepts(request: ConceptGenerationRequest): ViralConcept[] {
  const { product, audience, platform, gravitySixS } = request;

  const concepts: ViralConcept[] = [
    {
      id: '1',
      title: 'The Contradiction Hook',
      description: `Why ${audience} are doing ${product} completely wrong (and how to fix it in 60 seconds)`,
      hook: `Everyone tells you to ${product} this way. I did the opposite and 10xed my results.`,
      platform,
      targetAudience: audience,
      framework: 'Contradiction',
      psychologicalTriggers: ['curiosity-gap', 'pattern-recognition', 'validation'],
      scores: {
        hookStrength: 92,
        patternInterrupt: 88,
        emotionalCuriosity: 90,
        algorithmFit: 85,
        viralCeiling: 89,
        overall: 89
      },
      reasoning: 'Contradiction pattern creates immediate curiosity and challenges existing beliefs. Strong for breaking scroll patterns.',
      estimatedReach: '50K-200K views'
    },
    {
      id: '2',
      title: 'The Real Numbers Story',
      description: `I tested 47 different approaches to ${product}. Only 3 worked. Here's the data.`,
      hook: `47 experiments. $10K spent. These 3 techniques changed everything.`,
      platform,
      targetAudience: audience,
      framework: 'Real Numbers',
      psychologicalTriggers: ['authority', 'social-proof', 'curiosity-gap'],
      scores: {
        hookStrength: 88,
        patternInterrupt: 82,
        emotionalCuriosity: 85,
        algorithmFit: 90,
        viralCeiling: 86,
        overall: 86
      },
      reasoning: 'Specific numbers build credibility and curiosity. Data-driven content performs well on all platforms.',
      estimatedReach: '30K-150K views'
    },
    {
      id: '3',
      title: 'The POV Moment',
      description: `POV: You finally realize why your ${product} strategy wasn't working`,
      hook: `POV: That moment when you discover you've been doing it backwards this whole time`,
      platform,
      targetAudience: audience,
      framework: 'POV',
      psychologicalTriggers: ['validation', 'identity-reinforcement', 'tribe-belonging'],
      scores: {
        hookStrength: 85,
        patternInterrupt: 90,
        emotionalCuriosity: 88,
        algorithmFit: 87,
        viralCeiling: 85,
        overall: 87
      },
      reasoning: 'POV format is highly engaging on short-form platforms. Creates instant relatability and connection.',
      estimatedReach: '40K-180K views'
    },
    {
      id: '4',
      title: 'The Secret Reveal',
      description: `What top ${audience} know about ${product} that nobody talks about publicly`,
      hook: `The insider strategy that's been gatekept for too long. Here's what nobody's telling you.`,
      platform,
      targetAudience: audience,
      framework: 'Secret Reveal',
      psychologicalTriggers: ['fomo', 'curiosity-gap', 'authority'],
      scores: {
        hookStrength: 90,
        patternInterrupt: 85,
        emotionalCuriosity: 92,
        algorithmFit: 83,
        viralCeiling: 88,
        overall: 88
      },
      reasoning: 'Secret reveal creates powerful FOMO and curiosity. Positions content as exclusive insider knowledge.',
      estimatedReach: '45K-190K views'
    },
    {
      id: '5',
      title: 'The Micro Tutorial',
      description: `3-step framework for ${product} that ${audience} can implement in 5 minutes`,
      hook: `Copy this exact  framework. It takes 5 minutes and changes everything.`,
      platform,
      targetAudience: audience,
      framework: 'Micro Tutorial',
      psychologicalTriggers: ['reciprocity', 'progress-momentum', 'commitment-consistency'],
      scores: {
        hookStrength: 84,
        patternInterrupt: 80,
        emotionalCuriosity: 82,
        algorithmFit: 88,
        viralCeiling: 84,
        overall: 84
      },
      reasoning: 'Quick-win tutorials drive high engagement and saves. Actionable content performs consistently well.',
      estimatedReach: '25K-120K views'
    },
    {
      id: '6',
      title: 'The Mistake Confession',
      description: `I wasted 6 months on ${product} before learning these 3 lessons`,
      hook: `The mistakes that cost me $15K. Learn from my failure.`,
      platform,
      targetAudience: audience,
      framework: 'Mistake Confessional',
      psychologicalTriggers: ['validation', 'loss-aversion', 'reciprocity'],
      scores: {
        hookStrength: 86,
        patternInterrupt: 83,
        emotionalCuriosity: 87,
        algorithmFit: 85,
        viralCeiling: 85,
        overall: 85
      },
      reasoning: 'Vulnerability builds trust. Loss aversion is powerful motivator. Highly shareable.',
      estimatedReach: '35K-160K views'
    },
    {
      id: '7',
      title: 'The Before-After',
      description: `My ${product} approach before vs after discovering this framework`,
      hook: `Day 1: struggling. Day 90: transformed. Here's what changed.`,
      platform,
      targetAudience: audience,
      framework: 'Before-After',
      psychologicalTriggers: ['progress-momentum', 'identity-reinforcement', 'social-proof'],
      scores: {
        hookStrength: 87,
        patternInterrupt: 86,
        emotionalCuriosity: 85,
        algorithmFit: 89,
        viralCeiling: 87,
        overall: 87
      },
      reasoning: 'Visual transformation is highly engaging. Shows possibility and creates aspiration.',
      estimatedReach: '38K-170K views'
    },
    {
      id: '8',
      title: 'The Pattern Interrupt',
      description: `Stop everything. This changes how ${audience} should think about ${product}`,
      hook: `Stop. Delete your plan. Here's why.`,
      platform,
      targetAudience: audience,
      framework: 'Pattern Interrupt',
      psychologicalTriggers: ['pattern-recognition', 'fomo', 'authority'],
      scores: {
        hookStrength: 91,
        patternInterrupt: 95,
        emotionalCuriosity: 86,
        algorithmFit: 82,
        viralCeiling: 88,
        overall: 88
      },
      reasoning: 'Direct command breaks scroll pattern effectively. Creates urgency and demands attention.',
      estimatedReach: '42K-185K views'
    },
    {
      id: '9',
      title: 'The Urgent Warning',
      description: `Why ${audience} need to change their ${product} strategy before 2024`,
      hook: `If you're not doing this by Q4, you're already behind.`,
      platform,
      targetAudience: audience,
      framework: 'Urgent Warning',
      psychologicalTriggers: ['loss-aversion', 'fomo', 'social-proof'],
      scores: {
        hookStrength: 89,
        patternInterrupt: 84,
        emotionalCuriosity: 88,
        algorithmFit: 86,
        viralCeiling: 87,
        overall: 87
      },
      reasoning: 'Urgency creates immediate action. Fear of falling behind is powerful motivator.',
      estimatedReach: '40K-175K views'
    },
    {
      id: '10',
      title: 'The List Format',
      description: `7 ${product} mistakes that ${audience} make (and how to fix them)`,
      hook: `These 7 errors are costing you thousands. Here's the fix.`,
      platform,
      targetAudience: audience,
      framework: 'List Format',
      psychologicalTriggers: ['validation', 'progress-momentum', 'authority'],
      scores: {
        hookStrength: 83,
        patternInterrupt: 79,
        emotionalCuriosity: 81,
        algorithmFit: 90,
        viralCeiling: 83,
        overall: 83
      },
      reasoning: 'List format is scannable and shareable. Provides clear structure and multiple value points.',
      estimatedReach: '28K-140K views'
    }
  ];

  // If gravitySixS is provided, adjust scores based on emotional alignment
  if (gravitySixS) {
    concepts.forEach(concept => {
      if (concept.framework === 'POV' && gravitySixS === 'Sharing') {
        concept.scores.overall += 3;
        concept.scores.emotionalCuriosity += 5;
      }
    });
  }

  // Sort by overall score
  return concepts.sort((a, b) => b.scores.overall - a.scores.overall);
}

/**
 * Evaluate fallback concepts
 */
function evaluateFallbackConcepts(request: ConceptEvaluationRequest): ViralConcept[] {
  const { concepts: inputConcepts, platform, targetAudience } = request;

  return inputConcepts.map((concept, index) => ({
    id: `eval-${index + 1}`,
    title: concept.title,
    description: concept.description,
    hook: concept.hook,
    platform,
    targetAudience,
    framework: 'Custom',
    psychologicalTriggers: ['curiosity-gap', 'validation'],
    scores: {
      hookStrength: 75 + Math.random() * 20,
      patternInterrupt: 70 + Math.random() * 25,
      emotionalCuriosity: 75 + Math.random() * 20,
      algorithmFit: 70 + Math.random() * 25,
      viralCeiling: 72 + Math.random() * 23,
      overall: 73 + Math.random() * 22
    },
    reasoning: 'Concept shows promise with good fundamentals. Consider strengthening the hook and adding more emotional triggers.',
    estimatedReach: '20K-100K views'
  })).sort((a, b) => b.scores.overall - a.scores.overall);
}
