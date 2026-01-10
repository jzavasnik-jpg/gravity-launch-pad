import { fal } from "@fal-ai/client";

// Configure Fal with API Key
fal.config({
    credentials: import.meta.env.VITE_FAL_KEY,
});

export interface FalImageResult {
    imageUrl: string;
    prompt: string;
}

/**
 * Generates an image using Fal.ai (Flux Pro v1.1)
 * Used as a fallback when Gemini APIs fail.
 */
export async function generateImageWithFal(
    prompt: string,
    referenceImageUrl?: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<FalImageResult> {

    if (!import.meta.env.VITE_FAL_KEY) {
        throw new Error("VITE_FAL_KEY is missing");
    }

    console.log("Generating image with Fal.ai (Flux Pro)...");

    try {
        let endpoint = "fal-ai/flux-pro/v1.1";
        let input: any = {
            prompt: prompt,
            image_size: aspectRatio === '16:9' ? "landscape_16_9" : aspectRatio === '9:16' ? "portrait_16_9" : "square_hd",
            safety_tolerance: "2", // Allow some creative freedom
        };

        // If we have a reference image, we might want to use an image-to-image endpoint
        // or a model that supports it. Flux Pro supports it via specific endpoints or parameters.
        // For now, if it's Flux Pro, it's mostly text-to-image. 
        // If we need strong image consistency, we might need "fal-ai/flux-pro/v1/image-to-image" or similar.
        // However, the user asked for "Nano Banana Pro" which implies high quality.
        // Let's stick to standard Flux Pro for now as it's the most reliable "generator".
        // If reference image is critical, we might need a different model, but for fallback, getting ANY high quality image is better than error.

        // Note: If referenceImageUrl is provided, we could try to use it, but Flux Pro API 
        // primarily focuses on T2I. Let's rely on the prompt description for now in fallback mode.

        const result: any = await fal.subscribe(endpoint, {
            input,
            logs: true,
        });

        if (!result.data || !result.data.images || result.data.images.length === 0) {
            throw new Error("No image returned from Fal.ai");
        }

        return {
            imageUrl: result.data.images[0].url,
            prompt
        };

    } catch (error: any) {
        console.error("Fal.ai generation error:", error);
        throw new Error(`Fal.ai generation failed: ${error.message}`);
    }
}
