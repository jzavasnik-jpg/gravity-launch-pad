import { fal } from "@fal-ai/client";

// Configure Fal with API Key
// Note: In production, this should be proxied through a backend to keep the key secret
fal.config({
    credentials: import.meta.env.VITE_FAL_KEY,
});

export interface RenderProgress {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message: string;
    url?: string;
}

/**
 * Generates a voiceover using OpenAI TTS
 */
export async function generateVoiceover(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<Blob> {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
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
 * Animates a static image using Fal.ai (Kling)
 */
export async function animateImage(
    imageUrl: string,
    prompt: string,
    onProgress?: (log: string) => void
): Promise<string> {
    try {
        // Using Kling 1.0 (Standard)
        // Model ID might change, verify on Fal.ai
        const result = await fal.subscribe("fal-ai/kling-video/v1.0/image-to-video", {
            input: {
                image_url: imageUrl,
                prompt: prompt,
                duration: "5", // 5 seconds is standard for Kling
                aspect_ratio: "16:9"
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS" && update.logs) {
                    update.logs.map((log) => log.message).forEach(msg => {
                        if (onProgress) onProgress(msg);
                    });
                }
            },
        });

        if (!result.data || !result.data.video || !result.data.video.url) {
            throw new Error("No video URL returned from Fal.ai");
        }

        return result.data.video.url;
    } catch (error: any) {
        console.error("Fal.ai error:", error);
        throw new Error(`Video generation failed: ${error.message}`);
    }
}

/**
 * Helper to upload a Blob to a temporary URL (if needed for Fal.ai input)
 * Fal.ai usually accepts public URLs. If we have a local Blob (e.g. from upload),
 * we need to upload it to Firebase Storage first.
 */
