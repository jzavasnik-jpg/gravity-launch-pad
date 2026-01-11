// FAL and OpenAI calls are proxied through /api/ai/*

export interface RenderProgress {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    url?: string;
}

/**
 * Generates a voiceover using OpenAI TTS (via proxy)
 */
export async function generateVoiceover(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<Blob> {
    // TODO: Create a dedicated TTS endpoint at /api/ai/tts
    // For now, we'll need to add a TTS route
    const response = await fetch("/api/ai/openai/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: voice,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`TTS failed: ${error.error?.message || response.statusText}`);
    }

    return await response.blob();
}

/**
 * Animates a static image using Fal.ai (Kling) via proxy
 */
export async function animateImage(
    imageUrl: string,
    prompt: string,
    onProgress?: (log: string) => void
): Promise<string> {
    try {
        // Submit job via proxy
        const response = await fetch('/api/ai/fal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'fal-ai/kling-video/v1.0/image-to-video',
                prompt: prompt,
                image_url: imageUrl,
                duration: '5',
                aspect_ratio: '16:9',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'FAL API error');
        }

        const result = await response.json();

        // If it's a queued job, poll for status
        if (result.request_id) {
            return await pollFalStatus(result.request_id, 'fal-ai/kling-video/v1.0/image-to-video', onProgress);
        }

        if (!result.video?.url && !result.images?.[0]?.url) {
            throw new Error("No video URL returned from Fal.ai");
        }

        return result.video?.url || result.images[0].url;
    } catch (error: any) {
        console.error("Fal.ai error:", error);
        throw new Error(`Video generation failed: ${error.message}`);
    }
}

async function pollFalStatus(requestId: string, model: string, onProgress?: (log: string) => void): Promise<string> {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const response = await fetch(`/api/ai/fal?request_id=${requestId}&model=${encodeURIComponent(model)}`);
        const data = await response.json();

        if (data.status === 'COMPLETED') {
            return data.video?.url || data.images?.[0]?.url;
        }

        if (data.status === 'FAILED') {
            throw new Error('Video generation failed');
        }

        if (onProgress && data.logs) {
            data.logs.forEach((log: any) => onProgress(log.message));
        }

        attempts++;
    }

    throw new Error('Video generation timed out');
}

/**
 * Helper to upload a Blob to a temporary URL (if needed for Fal.ai input)
 * Fal.ai usually accepts public URLs. If we have a local Blob (e.g. from upload),
 * we need to upload it to Firebase Storage first.
 */
