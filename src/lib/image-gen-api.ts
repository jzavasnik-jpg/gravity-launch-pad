
import { saveGeneratedAsset } from "./slide-storage";

export async function generateContent(prompt: string, assets: { url: string, mimeType: string }[] = [], aspectRatio: string = '16:9'): Promise<string> {
    try {
        console.log(`Generating image via local proxy (Gemini 3)...`);
        console.log(`   - Prompt: ${prompt.substring(0, 50)}...`);
        console.log(`   - Assets: ${assets.length}`);
        console.log(`   - AspectRatio: ${aspectRatio}`);

        // Pre-process assets: Convert Blob URLs to Base64
        const processedAssets = await Promise.all(assets.map(async (asset) => {
            if (asset.url.startsWith('blob:')) {
                try {
                    const blobResp = await fetch(asset.url);
                    const blob = await blobResp.blob();
                    const reader = new FileReader();
                    return new Promise<{ url: string, mimeType: string }>((resolve) => {
                        reader.onloadend = () => {
                            const base64data = reader.result as string;
                            resolve({ url: base64data, mimeType: asset.mimeType });
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.error("Failed to convert blob:", e);
                    return asset;
                }
            }
            return asset;
        }));

        const response = await fetch('http://localhost:3001/api/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, assets: processedAssets, aspectRatio })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Parse Gemini 3 response (Vertex AI SDK uses camelCase inlineData, REST API uses snake_case inline_data)
        const imagePart = data.candidates?.[0]?.content?.parts?.[0];

        const inlineData = imagePart?.inlineData || imagePart?.inline_data;

        if (!inlineData || !inlineData.data) {
            console.error("Unexpected Gemini 3 response structure:", data);
            throw new Error("No image data found in Gemini 3 response");
        }

        const base64Image = inlineData.data;
        const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';

        // Save to storage
        const imageUrl = await saveGeneratedAsset(base64Image, 'gemini_gen');
        return imageUrl;

    } catch (error: any) {
        console.error("Gemini generation error:", error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
}

/**
 * Generates a COMPLETE slide image with Gemini
 */
export async function generateCompleteSlide(
    sceneDescription: string,
    scriptText: string,
    visualTheme: string = "modern and professional",
    characterDescription?: string,
    aspectRatio: 'landscape' | 'portrait' = 'portrait'
): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env');
    }

    const orientation = aspectRatio === 'portrait' ? '9:16 vertical' : '16:9 horizontal';

    const prompt = `Create a stunning, complete video slide image ready for animation.

**Visual Scene:** ${sceneDescription}
${characterDescription ? `**Character:** ${characterDescription}
CRITICAL: Maintain exact same character in every scene - same face, clothing, age, ethnicity` : ''}

**Text to Display (integrate beautifully):**
"${scriptText}"

**Visual Style:** ${visualTheme}, hyper-realistic photography, cinematic 4K quality

**Design Requirements:**
- Layout: ${orientation} aspect ratio
- Text: LARGE, BOLD, perfectly readable, beautifully integrated into the design
- Typography: Professional, modern, high contrast
- Visuals: Photorealistic commercial photography (NOT illustrated/cartoony)
- Composition: Dynamic, engaging, magazine-quality
- Text placement: Professional graphic design layout
- Fill entire frame with compelling visual
- NO spelling errors in text
- Sharp focus, perfect exposure
- Natural lighting and colors

Create a single, complete slide image that looks like a professional video frame - ready to animate.`;

    try {
        const baseUrl = import.meta.env.DEV ? '/google-api' : 'https://generativelanguage.googleapis.com';
        const model = 'gemini-3-pro-image-preview';

        const response = await fetch(
            `${baseUrl}/v1alpha/models/${model}:generateImages?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    numberOfImages: 1,
                    aspectRatio: aspectRatio === 'portrait' ? '9:16' : '16:9',
                    safetyFilterLevel: 'BLOCK_ONLY_HIGH',
                    personGeneration: characterDescription ? 'ALLOW_ADULT' : 'DONT_ALLOW',
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.generatedImages || data.generatedImages.length === 0) {
            throw new Error('No images generated by Gemini');
        }

        return data.generatedImages[0].bytesBase64Encoded;
    } catch (error: any) {
        console.error('Gemini image generation error:', error);
        throw new Error(`Failed to generate slide with Gemini: ${error.message}`);
    }
}
