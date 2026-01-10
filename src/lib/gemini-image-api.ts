import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper to downscale image to reduce token count
async function downscaleImage(blob: Blob, maxWidth: number = 512): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.8 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl.split(',')[1]); // Return base64 data only
        };
        img.onerror = (err) => reject(new Error('Failed to load image for downscaling'));
        img.src = URL.createObjectURL(blob);
    });
}

// Helper to convert URL to Base64 with MIME type detection and Downscaling
async function urlToGenerativePart(url: string) {
    try {
        if (!url || url.trim().length === 0 || url === '/') {
            throw new Error("Avatar URL is empty or invalid");
        }

        // Handle Data URLs (Base64) directly
        if (url.startsWith('data:')) {
            console.log(`[Gemini] Using provided Data URL (base64)`);

            // Convert Base64 to Blob for downscaling
            try {
                const response = await fetch(url);
                const blob = await response.blob();

                // Downscale to 512px to save tokens/payload size
                const downscaledBase64 = await downscaleImage(blob, 512);

                return {
                    inlineData: {
                        data: downscaledBase64,
                        mimeType: "image/jpeg"
                    },
                };
            } catch (e) {
                console.warn("[Gemini] Failed to downscale data URL, using original:", e);
                const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
                const data = url.substring(url.indexOf(',') + 1);
                return {
                    inlineData: {
                        data: data,
                        mimeType: mimeType
                    },
                };
            }
        }

        // Ensure absolute URL and encode it to handle spaces/special chars
        const encodedUrl = encodeURI(url);
        const fullUrl = encodedUrl.startsWith('http') ? encodedUrl : `${window.location.origin}${encodedUrl.startsWith('/') ? '' : '/'}${encodedUrl}`;

        console.log(`[Gemini] Fetching avatar from: ${fullUrl} (Original: ${url})`);

        const response = await fetch(fullUrl);
        console.log(`[Gemini] Avatar fetch status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText} at ${fullUrl}`);
        }

        const contentType = response.headers.get('content-type');
        console.log(`[Gemini] Avatar content-type: ${contentType}`);

        if (contentType && !contentType.startsWith('image/')) {
            throw new Error(`Invalid content type: ${contentType} at ${fullUrl}. Expected image.`);
        }

        const blob = await response.blob();

        if (blob.type.startsWith('text/')) {
            throw new Error(`Avatar URL returned text/html at ${fullUrl}. Likely a 404 page.`);
        }

        let base64Data: string;
        try {
            // Try to downscale to save tokens
            base64Data = await downscaleImage(blob, 512);
        } catch (downscaleError) {
            console.warn("Downscaling failed, using original image:", downscaleError);
            // Fallback to original image if downscaling fails (e.g. canvas issues)
            base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result.split(',')[1]);
                    } else {
                        reject(new Error('Failed to read blob as base64'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        return {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg" // Always convert to JPEG for consistency
            },
        };
    } catch (error) {
        console.error("Error converting URL to generative part:", error);
        throw error;
    }
}

export interface GeminiImageResult {
    imageUrl: string;
    prompt: string;
}

/**
 * Internal helper to generate image with a specific model and retry logic.
 */
async function generateWithModel(
    modelName: string,
    prompt: string,
    parts: any[],
    avatarUrl?: string,
    maxRetries: number = 1, // Reduced to 1 to prevent "loop" feeling
    responseMimeType?: string
): Promise<GeminiImageResult> {
    const model = genAI.getGenerativeModel({ model: modelName });
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const fullParts = [...parts];

            // Handle avatar loading with strict error swallowing
            if (avatarUrl && avatarUrl.trim().length > 0) {
                // STRICT VALIDATION: Prevent fetching text prompts as URLs
                const isLikelyUrl = (avatarUrl.startsWith('http') || avatarUrl.startsWith('/')) &&
                    !avatarUrl.includes(' ') &&
                    (avatarUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) || avatarUrl.includes('googleusercontent'));

                if (!isLikelyUrl) {
                    console.warn(`[Gemini] Skipping invalid avatar URL (looks like text): "${avatarUrl}"`);
                    // Do not attempt to fetch. Proceed without avatar.
                } else {
                    try {
                        console.log(`[Gemini] Attempting to load avatar: "${avatarUrl}"`);
                        const avatarPart = await urlToGenerativePart(avatarUrl);
                        // Insert avatar part AFTER the prompt (index 1) to match: [Text(Prompt), Image(Avatar), Text(Instruction)]
                        // Assuming parts[0] is the prompt.
                        fullParts.splice(1, 0, avatarPart);
                    } catch (avatarError: any) {
                        console.warn("Failed to load avatar, proceeding without it. Error:", avatarError);
                        toast.error(`Avatar load failed: ${avatarError.message}. Proceeding without it.`);
                    }
                }
            }

            const request = {
                contents: [{ role: "user", parts: fullParts }],
                generationConfig: {
                    responseMimeType: responseMimeType,
                },
            };

            const result = await model.generateContent(request);
            const response = result.response;

            // Handle response...
            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
                const content = candidates[0].content;
                if (content.parts && content.parts.length > 0) {
                    const imagePart = content.parts.find((p: any) => p.inlineData);
                    if (imagePart && imagePart.inlineData) {
                        const mimeType = imagePart.inlineData.mimeType || "image/jpeg";
                        const base64Data = imagePart.inlineData.data;
                        return {
                            imageUrl: `data:${mimeType};base64,${base64Data}`,
                            prompt
                        };
                    }
                }
            }

            throw new Error(`No image data found in ${modelName} response`);

        } catch (error: any) {
            if (attempt < maxRetries - 1) {
                console.warn(`Attempt ${attempt + 1} failed for model ${modelName}. Retrying...`, error);
                attempt++;
                // Optional: Add a delay before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            } else {
                throw error; // Re-throw if all retries are exhausted
            }
        }
    }
    throw new Error("Max retries reached without successful generation.");
}

/**
 * Generates an image using Gemini 3 Pro Image (Nano Banana Pro).
 * Supports multimodal input (text + image) for character consistency.
 */
export async function generateImageWithGemini(
    prompt: string,
    avatarUrl?: string,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<GeminiImageResult> {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is missing');
    }

    // Explicitly construct parts to ensure correct format (Text, Image, Text)
    const parts: any[] = [
        { text: prompt }
    ];

    // Add reference image if provided
    if (avatarUrl) {
        try {
            // Note: urlToGenerativePart is now handled inside generateWithModel for better retry logic
            // But we keep the text instruction here
            parts.push({ text: "Edit this image to match the description above. Maintain the subject's identity exactly." });
        } catch (error) {
            console.error("Failed to process avatar URL:", error);
            // Continue without avatar if it fails to load
        }
    }

    try {
        // Try Primary Model
        return await generateWithModel("gemini-3-pro-image-preview", prompt, parts, avatarUrl);
    } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
            console.warn("Primary model rate limited. Switching to fallback: imagen-3.0-generate-001");
            try {
                // Try Fallback Model: Imagen 3 (Reverting to 3.0 as 4.0 returned 404)
                // We do NOT pass responseMimeType here as it causes 400 errors with Imagen on this API
                return await generateWithModel("imagen-3.0-generate-001", prompt, parts, avatarUrl);
            } catch (fallbackError: any) {
                throw new Error(`All generation attempts failed. Gemini: ${error.message}, Fallback: ${fallbackError.message}`);
            }
        }
        throw error;
    }
}

