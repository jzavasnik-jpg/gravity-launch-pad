import { saveSessionVector } from "@/lib/database-service";

// Supabase Edge Function URL for embedding generation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Generates an embedding vector for a given text using Gemini
 * Uses Supabase Edge Function with API keys stored in Supabase Vault
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.status}`);
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        // Silently fail if embedding service isn't running - not critical for app function
        // Only log in development if explicitly enabled
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_RAG) {
            console.warn("[RAG] Embedding service unavailable");
        }
        return [];
    }
}

/**
 * Vectorizes the entire session context and stores it in Firestore
 */
export async function vectorizeSession(sessionId: string, data: any) {
    if (!sessionId || !data) return;

    // Vectorization runs silently in background

    // 1. Construct a rich context string from all available data
    const contextParts = [];

    // ICP Answers
    if (data.icp_answers && Array.isArray(data.icp_answers)) {
        contextParts.push(`ICP Interview Answers: ${data.icp_answers.join(" ")}`);
    }

    // Avatar Profile
    if (data.avatar) {
        contextParts.push(`Avatar Name: ${data.avatar.name}`);
        contextParts.push(`Avatar Bio: ${data.avatar.story || ''}`);
        contextParts.push(`Avatar Occupation: ${data.avatar.occupation || ''}`);
        contextParts.push(`Avatar Age: ${data.avatar.age || ''}`);
        contextParts.push(`Avatar Challenges: ${data.avatar.daily_challenges?.join(" ") || ''}`);
    }

    // Marketing Statements
    if (data.marketing_statements) {
        contextParts.push(`Marketing Statements: ${JSON.stringify(data.marketing_statements)}`);
    }

    // Pain Synopsis
    if (data.pain_synopsis) {
        contextParts.push(`Pain Synopsis: ${JSON.stringify(data.pain_synopsis)}`);
    }

    // Market Intel
    if (data.market_intel) {
        contextParts.push(`Market Intelligence: ${JSON.stringify(data.market_intel)}`);
    }

    // Strategy
    if (data.strategy) {
        contextParts.push(`Content Strategy: ${JSON.stringify(data.strategy)}`);
    }

    const fullContext = contextParts.join("\n\n");

    if (!fullContext.trim()) {
        console.log("[RAG] No context to vectorize.");
        return;
    }

    // 2. Generate Embedding
    const embedding = await generateEmbedding(fullContext);

    if (embedding.length === 0) {
        // Silently return - embedding service likely not running
        return;
    }

    // 3. Store in Supabase
    try {
        const success = await saveSessionVector(
            sessionId,
            embedding,
            fullContext.substring(0, 1000) // Store a preview
        );
        if (success) {
            console.log(`[RAG] Successfully vectorized session ${sessionId}`);
        }
    } catch (error) {
        console.error("[RAG] Error storing vector:", error);
    }
}
