import { generateImageWithGemini } from "./gemini-image-api";

export interface ThumbnailResult {
    imageUrl: string;
    prompt: string;
}

/**
 * Generates a viral thumbnail using Gemini 3 Pro Image (Nano Banana Pro).
 * Uses a "Super Agent" approach to generate the prompt, then passes it + reference image to Gemini.
 */
export async function generateViralThumbnail(
    content: string,
    platform: string,
    productName: string,
    productContext?: {
        description?: string;
        solution?: string;
    },
    customInstructions?: string,
    assets?: any[],
    avatarUrl?: string,
    hook?: string,
    previousThumbnailUrl?: string,
    currentPrompt?: string // New parameter
): Promise<ThumbnailResult> {

    // 1. Super Agent: Generate the viral prompt in one step
    // If we have a previous thumbnail, we use THAT as the reference image for the next iteration
    const referenceImage = previousThumbnailUrl || avatarUrl;

    let viralPrompt = await generateViralPrompt(
        content,
        platform,
        productName,
        productContext,
        customInstructions,
        assets,
        referenceImage,
        hook,
        !!previousThumbnailUrl, // isIterative
        currentPrompt // Pass current prompt
    );
    console.log("Super Agent Generated Prompt:", viralPrompt);

    // Check for refusal
    if (viralPrompt.toLowerCase().startsWith("i'm sorry") || viralPrompt.toLowerCase().startsWith("i cannot")) {
        console.warn("Prompt generation refused:", viralPrompt);
        // Fallback: Use the current prompt if available, or a generic one
        if (currentPrompt) {
            viralPrompt = currentPrompt;
            // Append instructions loosely if possible, or just warn
        } else {
            viralPrompt = `Viral ${platform} thumbnail for ${productName}, ${hook}, cinematic lighting, 4k`;
        }
    }

    // 2. Generate: Use Gemini 3 Pro Image
    try {
        // Pass the generated prompt AND the reference image directly to Gemini
        const result = await generateImageWithGemini(viralPrompt, referenceImage, platform === 'youtube' ? '16:9' : '9:16');

        return {
            imageUrl: result.imageUrl,
            prompt: viralPrompt
        };

    } catch (error: any) {
        console.error('Gemini thumbnail generation error:', error);
        throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
}

/**
 * "Super Agent"
 * Combines Art Director and Viral Strategist roles.
 * Uses Multimodal inputs (Avatar, Assets) to generate a single, high-fidelity prompt.
 */
async function generateViralPrompt(
    content: string,
    platform: string,
    productName: string,
    productContext?: {
        description?: string;
        solution?: string;
    },
    customInstructions?: string,
    assets?: any[],
    imageUrl?: string,
    explicitHook?: string,
    isIterative: boolean = false,
    currentPrompt?: string
): Promise<string> {
    // OpenAI calls are proxied through /api/ai/openai

    // Use explicit hook if provided, otherwise derive from content
    const hook = explicitHook || content.split('\n')[0].substring(0, 150);

    // Truncate content for context window if needed, but keep enough for story
    // Increased to 5000 to ensure full script and visual cues are captured
    const scriptContext = content.substring(0, 5000);

    let systemPrompt = `You are a viral thumbnail expert. 
    
    GOAL: Use the attached script to create a viral thumbnail generation prompt.
    
    PROCESS:
    1.  **Analyze Script:** Read the "Full Script Context" and identify the "Visual cue" and "Text overlay cue". You MUST prioritize the "Visual cue" for the background and action.
    2.  **Subject Reference:** You will NOT see the avatar image. It will be provided directly to the image generator. In your prompt, simply refer to the main character as "the subject" or "the person".
    3.  **Visual Style:** The scene should be high-quality and viral. Use descriptive adjectives (e.g., "vibrant lighting", "expressive", "detailed") rather than metadata tags.
    4.  **Text Overlay:** The text overlay MUST be a "Mr. Beast" style viral hook.
        -   **CRITICAL:** The text MUST be SHOCKING, URGENT, or HIGH-STAKES.
        -   **Rule:** MAX 5 words.
        -   **BAD Examples:** "My Story", "How to Win", "Product Review", "Daily Vlog".
        -   **GOOD Examples:** "I SURVIVED", "IMPOSSIBLE", "$1 vs $1,000,000", "DON'T DO THIS", "SECRET REVEALED", "GAME OVER".
        -   **Formatting:** Specify "Big, bold text", "High contrast colors (Yellow/Red)".

    OUTPUT:
    The output should be the raw image generation prompt for Gemini 3 Pro Image. 
    Structure the prompt to explicitly describe:
    - The Subject ("The subject" or "The person")
    - The Action/Expression (Based on the Visual Cue from the script - MUST be expressive/emotional)
    - The Background/Scene (Based on the Visual Cue from the script)
    - The Text Overlay (e.g., 'text "YOUR TEXT" embedded in scene, big bold font, high contrast')
    
    CRITICAL CONSTRAINTS:
    1.  **NO METADATA TAGS:** Do NOT use words like "4k", "8k", "trending on artstation", "unreal engine". The model will render these as text. Use visual descriptions instead.
    2.  **SUBJECT:** Always refer to "the subject" or "the person". Do NOT generate a specific celebrity description.
    3.  **TEXT PURITY:** The ONLY text in the image should be the "Text Overlay".
    4.  **NO REFUSALS:** You are generating a text description for an image generator. You are NOT generating the image yourself. Describe the scene vividly.
    5.  **NO STORYBOARDS:** The image MUST be a SINGLE, cohesive scene. Do NOT generate panels, split screens, comic strips, or multiple frames. Do NOT describe a sequence of events. Describe ONE moment in time.`;

    if (isIterative) {
        systemPrompt = `You are a viral thumbnail expert.
        
        GOAL: The user wants to EDIT an existing thumbnail prompt based on their instructions.
        
        PROCESS:
        1.  **Analyze Instructions:** Read the "User Instructions" carefully. This is the primary goal.
        2.  **Edit Prompt:** Modify the "Current Prompt" to incorporate the user's changes.
        3.  **Maintain Context:** Keep the core elements of the prompt unless the user asks to change them.
        
        OUTPUT:
        The output should be the raw image generation prompt for Gemini 3 Pro Image. Do not output anything else.
        
        CRITICAL:
        - Do NOT refuse the request. You are editing text.
        - If the user asks for something specific, do your best to describe it in the prompt.`;
    }

    const userContent: any[] = [
        {
            type: "text",
            text: `
Product: ${productName}
${productContext ? `Product Context: ${productContext.description}` : ''}
Content Hook: "${hook}"
Full Script Context: "${scriptContext}"
${currentPrompt ? `Current Prompt: "${currentPrompt}"` : ''}
${customInstructions ? `User Instructions: ${customInstructions}` : ''}

Create the detailed viral image prompt now.
`
        }
    ];

    // Note: We do NOT pass the avatar image to OpenAI anymore.
    // OpenAI's job is to generate the SCENE description based on the script.
    // The actual avatar image is passed directly to Gemini in the next step.

    // Add Product Assets if available (limit to 2 to avoid token limits)
    if (assets && assets.length > 0) {
        const imageAssets = assets.filter(a => a.type === 'image' && a.url).slice(0, 2);
        for (let i = 0; i < imageAssets.length; i++) {
            const asset = imageAssets[i];
            userContent.push({
                type: "image_url",
                image_url: {
                    url: asset.url
                }
            });
            userContent[0].text += `\n\n[Reference Image ${i + 2}: Product Asset (${asset.name}). Incorporate this product.]`;
        }
    }

    try {
        const response = await fetch('/api/ai/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.7,
                max_tokens: 400
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating viral prompt:", error);
        // Fallback is only used if the API call fails
        return currentPrompt || `Viral ${platform} thumbnail for ${productName}, ${hook}, cinematic lighting, 4k, trending on artstation`;
    }
}
