// FAL API calls are proxied through /api/ai/fal

export interface FalImageResult {
    imageUrl: string;
    prompt: string;
}

/**
 * Generates an image using Fal.ai (Flux Pro v1.1) via proxy
 * Used as a fallback when Gemini APIs fail.
 */
export async function generateImageWithFal(
    prompt: string,
    referenceImageUrl?: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<FalImageResult> {
    console.log("Generating image with Fal.ai (Flux Pro)...");

    try {
        const imageSize = aspectRatio === '16:9' ? "landscape_16_9" : aspectRatio === '9:16' ? "portrait_16_9" : "square_hd";

        const response = await fetch('/api/ai/fal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                model: 'fal-ai/flux-pro/v1.1',
                image_size: imageSize,
                safety_tolerance: '2',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'FAL API error');
        }

        const result = await response.json();

        // Handle queued jobs
        if (result.request_id) {
            return await pollFalImageResult(result.request_id, prompt);
        }

        if (!result.images || result.images.length === 0) {
            throw new Error("No image returned from Fal.ai");
        }

        return {
            imageUrl: result.images[0].url,
            prompt
        };

    } catch (error: any) {
        console.error("Fal.ai generation error:", error);
        throw new Error(`Fal.ai generation failed: ${error.message}`);
    }
}

async function pollFalImageResult(requestId: string, prompt: string): Promise<FalImageResult> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch(`/api/ai/fal?request_id=${requestId}&model=fal-ai/flux-pro/v1.1`);
        const data = await response.json();

        if (data.status === 'COMPLETED' && data.images?.[0]?.url) {
            return { imageUrl: data.images[0].url, prompt };
        }

        if (data.status === 'FAILED') {
            throw new Error('Image generation failed');
        }

        attempts++;
    }

    throw new Error('Image generation timed out');
}
