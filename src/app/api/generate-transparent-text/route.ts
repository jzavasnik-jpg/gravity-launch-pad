import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';

// Vertex AI configuration for Gemini 3 Pro Image Preview (Nano Banana Pro)
// Uses global location endpoint as required by this model
const PROJECT_ID = 'gen-lang-client-0904075747';
const MODEL_ID = 'gemini-3-pro-image-preview';
const VERTEX_AI_ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/publishers/google/models/${MODEL_ID}:generateContent`;

let authClient: GoogleAuth | null = null;

async function getAuthClient(): Promise<GoogleAuth> {
    if (authClient) return authClient;

    try {
        // Use service account JSON from project root
        const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

        authClient = new GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        return authClient;
    } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        throw new Error('Google Auth initialization failed');
    }
}

export async function POST(request: NextRequest) {
    console.log("🔤 Generating Transparent Text via Vertex AI...");

    try {
        const { text, stylePrompt, layout } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'No text provided' },
                { status: 400 }
            );
        }

        const auth = await getAuthClient();
        const accessToken = await auth.getAccessToken();

        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        // Construct layout instruction
        let layoutInstruction = "";
        if (layout === 'vertical') {
            layoutInstruction = "The text must be arranged vertically, stacked in a column.";
        } else if (layout === 'horizontal') {
            layoutInstruction = "The text must be arranged horizontally in a single or double line.";
        }

        const prompt = `Generate a text overlay image. Text: '${text}'. Style: ${stylePrompt || 'bold, white'}. ${layoutInstruction}

        BACKGROUND INSTRUCTIONS:
        The background must be **SOLID MAGENTA** (Hex Color #FF00FF).

        CRITICAL NEGATIVE CONSTRAINTS:
        - NO SHADOWS on the background.
        - NO GRADIENTS.
        - NO CHECKERBOARD PATTERNS.
        - NO OBJECTS, NO PEOPLE, NO AVATARS.
        - Text should be FLAT against the background.

        The output should look like text floating in a perfectly flat solid magenta field.`;

        // Build request body for Vertex AI
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
                candidateCount: 1
            }
        };

        // Helper function for retry logic
        const generateWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
            try {
                console.log(`📡 Calling Vertex AI endpoint: ${VERTEX_AI_ENDPOINT}`);

                const response = await fetch(VERTEX_AI_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Vertex AI error response:', errorText);

                    if (response.status === 429) {
                        throw new Error('429 Rate limit exceeded');
                    }
                    throw new Error(`Vertex AI request failed: ${response.status} - ${errorText}`);
                }

                return await response.json();
            } catch (error: any) {
                if (retries > 0 && error.message?.includes('429')) {
                    console.log(`⚠️ Quota hit (429). Retrying in ${delay / 1000}s... (${retries} retries left)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const result = await generateWithRetry();
        const imagePart = result.candidates?.[0]?.content?.parts?.[0];

        if (!imagePart || !imagePart.inlineData) {
            throw new Error("No image returned. Check Project Quota.");
        }

        console.log("✅ Text Image Generated, processing chroma key...");

        // Process Image (Chroma Key MAGENTA to Transparent)
        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

        const { data, info } = await sharp(imageBuffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Iterate and make MAGENTA pixels transparent
        // Magenta is R=255, G=0, B=255. We use improved dominance model.
        let transparentPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Improved Chroma Key: Dominance Model
            // Criteria:
            // 1. Green must be relatively low (it's the opposite of Magenta)
            // 2. Red and Blue must be significantly higher than Green
            // 3. Red and Blue should be somewhat close to each other

            const margin = 30; // How much R/B must exceed G
            const balance = 60; // How close R and B must be

            if (
                g < 150 &&                  // Green isn't too bright (prevents nuking white)
                r > g + margin &&           // Red dominates Green
                b > g + margin &&           // Blue dominates Green
                Math.abs(r - b) < balance   // Red and Blue are balanced (Magenta-ish)
            ) {
                data[i + 3] = 0; // Transparent
                transparentPixels++;
            }
        }
        console.log(`Chroma Key: Made ${transparentPixels} pixels transparent out of ${data.length / 4}`);

        const processedBuffer = await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toBuffer();

        const base64Image = `data:image/png;base64,${processedBuffer.toString('base64')}`;

        return NextResponse.json({ imageUrl: base64Image });

    } catch (error: any) {
        console.error("❌ TEXT GENERATION FAILED:", error);
        return NextResponse.json(
            { error: error.message, details: error.toString() },
            { status: 500 }
        );
    }
}
