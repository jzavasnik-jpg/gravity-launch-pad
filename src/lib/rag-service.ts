import { saveSessionVector } from "@/lib/database-service";

/**
 * Generates an embedding vector for a given text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch('http://localhost:3001/api/generate-embedding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.status}`);
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        return [];
    }
}

/**
 * Vectorizes the entire session context and stores it in Firestore
 */
export async function vectorizeSession(sessionId: string, data: any) {
    if (!sessionId || !data) return;

    console.log(`[RAG] Vectorizing session ${sessionId}...`);

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
        console.error("[RAG] Failed to generate embedding.");
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
