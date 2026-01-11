// OpenAI calls are proxied through /api/ai/openai

export interface PainSynopsisResult {
    narrative: string;
    psychologicalProfile: {
        coreDesire: string;
        primaryEmotion: string;
        currentState: string;
        blockers: string[];
        idealOutcome: string;
    };
    storyBeats: {
        struggle: string;
        insight: string;
        transformation: string;
    };
}

/**
 * Generate a detailed psychological profile and narrative from ICP answers
 */
export async function generatePainSynopsis(
    icpAnswers: string[],
    coreDesire?: string,
    sixS?: string,
    avatarName?: string
): Promise<PainSynopsisResult> {

    const customerReference = avatarName || 'Your ideal customer';

    const prompt = `You are an expert customer psychologist creating a detailed psychological profile and narrative for content marketing.

Using the following ICP discovery answers, create a comprehensive pain synopsis that paints a vivid picture of the ideal customer's psychological state.

${avatarName ? `The customer's name is ${avatarName}. Use this name throughout the narrative to make it personal and specific.` : ''}

**Deepest Desire:** ${icpAnswers[0] || 'Not provided'}
**Ideal Customer:** ${icpAnswers[1] || 'Not provided'}
**Definition of Success:** ${icpAnswers[2] || 'Not provided'}
**Current Solutions Attempted:** ${icpAnswers[3] || 'Not provided'}
**Why Solutions Fail:** ${icpAnswers[4] || 'Not provided'}
**Ideal Solution:** ${icpAnswers[5] || 'Not provided'}
**Core Desire Market:** ${coreDesire || icpAnswers[6] || 'Not provided'}
**Decision Point:** ${icpAnswers[7] || 'Not provided'}
**Problem Solved:** ${icpAnswers[8] || 'Not provided'}
**Unique Framework:** ${icpAnswers[9] || 'Not provided'}
**Primary Emotion (Six S):** ${sixS || icpAnswers[10] || 'Not provided'}
**Hesitations/Objections:** ${icpAnswers[11] || 'Not provided'}
**Motivation to Act:** ${icpAnswers[12] || 'Not provided'}
**Specific Promise:** ${icpAnswers[13] || 'Not provided'}

Generate a response in the following JSON format:

{
  "narrative": "A 3-4 paragraph narrative that tells ${customerReference}'s story - their daily reality, inner conflicts, frustrations, what keeps them up at night, and what they dream about achieving. ${avatarName ? `Use the name ${avatarName} throughout.` : 'Write in third person, present tense.'} Include vivid sensory details and emotional depth.",
  "psychologicalProfile": {
    "coreDesire": "One sentence: What ${customerReference} REALLY wants deep down",
    "primaryEmotion": "IMPORTANT: Write a specific emotional state that ${customerReference} experiences daily. Be concrete and specific to their situation. GOOD: 'Anxious about falling behind competitors while juggling too many tools', BAD: 'Recognition and personal value'. Make it personal and situational, not a generic emotion category.",
    "currentState": "2-3 sentences describing ${customerReference}'s current situation and mindset",
    "blockers": ["Specific blocker 1 that ${customerReference} faces", "Specific blocker 2", "Specific blocker 3"],
    "idealOutcome": "What success looks and feels like for ${customerReference}"
  },
  "storyBeats": {
    "struggle": "${customerReference}'s current struggle (1-2 sentences, use their name if provided)",
    "insight": "The realization ${customerReference} needs to have (1-2 sentences)",
    "transformation": "What ${customerReference} becomes after solving this (1-2 sentences)"
  }
}

Make it deeply human, emotionally resonant, and specific to ${customerReference}. Avoid generic platitudes. ${avatarName ? `Remember to use the name ${avatarName} throughout the narrative and story beats.` : ''}`;

    try {
        const response = await fetch('/api/ai/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert customer psychologist and storyteller. You create vivid, emotionally resonant psychological profiles.'
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
        return result as PainSynopsisResult;

    } catch (error) {
        console.error('Error generating pain synopsis:', error);

        // Fallback response
        return {
            narrative: `Your ideal customer faces daily challenges that compound over time. They juggle multiple responsibilities, feeling the weight of expectations from all sides. Despite trying various solutions, they've yet to find the right fit for their specific needs. They dream of a transformation - moving from overwhelm to clarity, from struggle to flow. What they need isn't just another tool or tactic, but a complete shift in approach that honors their unique situation and goals.`,
            psychologicalProfile: {
                coreDesire: coreDesire || 'Achievement and progress',
                primaryEmotion: sixS || 'Confidence and capability',
                currentState: 'Feeling stuck between where they are and where they want to be',
                blockers: [
                    'Lack of clear direction',
                    'Too many competing priorities',
                    'Limited support and guidance'
                ],
                idealOutcome: 'A systematic approach that creates lasting change'
            },
            storyBeats: {
                struggle: 'They wake up every day feeling behind, despite working harder than ever.',
                insight: 'They realize they need a framework, not just more information.',
                transformation: 'They become someone who moves forward with clarity and confidence.'
            }
        };
    }
}
