import { ThumbnailConcept, ThumbnailConceptsResponse, ScriptGenerationResponse } from "@/types/thumbnail";

const API_BASE = 'http://localhost:3001';

export async function generateScript(topic: string, toneLevel: number, currentScript?: string): Promise<ScriptGenerationResponse> {
    console.log("Generating script with AI...");

    try {
        const toneDescription = toneLevel < 30 ? "Serious, authoritative, professional" :
            toneLevel > 70 ? "Humorous, energetic, entertaining" :
                "Balanced, engaging, conversational";

        const prompt = `
        You are a viral YouTube scriptwriter.
        Topic: "${topic}"
        Tone: ${toneDescription} (Level ${toneLevel}/100)
        ${currentScript ? `Rewrite the following script to match this tone:\n"${currentScript}"` : "Write a compelling 60-second script."}

        Structure:
        1. Hook (0-5s): Grab attention immediately.
        2. Setup (5-15s): Introduce the problem/stakes.
        3. Body (15-45s): Deliver value/story.
        4. CTA (45-60s): Call to action.

        Return ONLY valid JSON:
        { "script_text": "Full script content here..." }
        `;

        const response = await fetch(`${API_BASE}/api/openai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are an expert YouTube scriptwriter. Always return valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.statusText}`);
        }

        const data = await response.json();
        const parsedData = JSON.parse(data.choices[0]?.message?.content);

        // Post-Processing Safety Check: Enforce Text Rendering - REMOVED to prevent burn-in
        const concepts = parsedData.concepts || [];
        // No longer enforcing text rendering in the prompt


        return concepts;

    } catch (error) {
        console.error("Error generating script:", error);
        return { script_text: "Error generating script. Please try again." };
    }
}

export async function generateThumbnailConcepts(
    scriptText: string,
    productAssets: any[] = [],
    existingHook?: string
): Promise<ThumbnailConcept[]> {
    console.log("🎨 Generating concepts with assets:", productAssets.length);
    console.log("   Target Hook:", existingHook);

    // 1. Prepare Context
    const firstScene = scriptText.substring(0, 500);
    const productContext = productAssets.length > 0
        ? `PRODUCT ASSETS AVAILABLE: ${productAssets.map(a => a.name).join(', ')}. The thumbnail MUST feature the product prominently.`
        : "No specific product assets provided.";

    const systemPrompt = `
### ROLE
You are the **Lead Creative Director** for a high-end visual production studio. Your goal is to write "Functional Art Prompts" for Google's Gemini 3 Pro Image model (codenamed Nano Banana Pro).

### YOUR INPUT
You will receive:
1. A **Video Script** (The context).
2. A list of **Available Assets** (Reference Images: User Avatar + Products).
3. A **Target Hook** (The text overlay strategy).

### YOUR OUTPUT
You must generate a JSON object containing a list of 3 distinct concepts.
Each concept must have an \`image_prompt\` that follows the "Golden Rules" below.

### CRITICAL RULES (THE "GOLDEN RULES")
1.  **NO TAG SOUP:** Do not use comma-separated lists like "best quality, 4k, trending on artstation." This is forbidden.
2.  **Natural Language:** Write in full, descriptive sentences. Talk to the AI like a human artist.
3.  **Identity Locking:** Since a reference image is provided, you MUST start the prompt by establishing the relationship. Use phrases like: "Using the attached image as a strict reference for facial features and build..."
4.  **Clean Composition:** The image must be "clean" of any text overlays. The text will be added dynamically later. Do NOT render any text in the image.
5.  **Multi-Asset Integration:** If multiple assets are provided (e.g., Avatar AND Product), you MUST describe the interaction. Example: "The subject (from reference 1) is holding the [Product Name] (from reference 2) in their hand..."
6.  **COMPOSITION SAFETY (CRITICAL):**
    *   **Wide Shot / Medium Shot ONLY:** NEVER use "Extreme Close-Up". The subject's entire head and shoulders MUST be visible with ample headroom.
    *   **Center the Subject:** Keep the main subject near the horizontal center (Safe Zone) so they are not cut off when the image is cropped to 16:9 or 9:16.
    *   **Rule of Thirds:** Place key elements (faces, products) along the vertical third lines, but avoid the extreme edges of the frame.
7.  **Viral Trend Injection:** You must analyze the script and choose a relevant "Viral Style" from the list below:
    *   *MrBeast Style:* High saturation, wide angle, shocked expression.
    *   *Cinematic Docu-Style:* Darker, moody, 35mm film grain.
    *   *Tech Reviewer:* Clean, Apple-style lighting.
8.  **Camera Metadata:** Always define the lens and lighting. (e.g., "Shot on 35mm film," "f/1.8 aperture," "Cinematic side lighting").

### THE FORMULA (Follow this structure strictly for \`image_prompt\`)
[Reference Trigger] + [Subject & Action] + [Asset Integration] + [Environment/Context] + [Lighting & Mood] + [Technical Specs]

### EXAMPLES

**Bad Prompt:**
"Space suit, man, cool, 8k, realistic, futuristic, space station background."

**Good Prompt (Use this style):**
"Using the attached image as a strict character reference, depict the same man wearing a weathered, white NASA spacesuit. He is holding the 'Gravity Launcher' device (from the second reference image) in his gloved hand. He is floating in a zero-gravity corridor of a futuristic space station. The scene is lit by harsh, cold blue emergency lights flickering from the ceiling (Cinematic Docu-Style). Shot on a 35mm wide-angle lens with a shallow depth of field."

### JSON OUTPUT FORMAT
{
  "concepts": [
    {
      "id": "1",
      "title": "Short Title",
      "description": "DETAILED Visual Strategy. Explain WHY this concept works, the mood, and the viral psychology behind it. Do not just summarize the prompt.",
      "hook_text": "THE HOOK",
      "image_prompt": "Using the attached image as a strict reference..."
    }
  ]
}
`;

    const userPrompt = `
Analyze this script and generate 3 viral thumbnail concepts.

**Script Opening:**
"${scriptText.substring(0, 500)}..."

**Available Assets:**
${productAssets.map((a, i) => `- Asset ${i + 1}: ${a.name} (${a.url})`).join('\n')}

**Target Hook (Use this or a strong variation):**
"${existingHook || 'Create a viral hook based on the script'}"

**Task:**
Write 3 concepts. For each, write a "Functional Art Prompt" for the \`image_prompt\` field following the Golden Rules and Formula above.
**CRITICAL:** Ensure you integrate the Product Assets if they are relevant to the script.
Ensure the hook text is punchy and viral.
`;

    try {
        const response = await fetch(`${API_BASE}/api/openai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        return result.concepts;

    } catch (error) {
        console.error("Error analyzing script:", error);
        return getMockConcepts().concepts;
    }
}

function getMockConcepts(): ThumbnailConceptsResponse {
    return {
        concepts: [
            {
                id: "mock-1",
                title: "The Literal Approach",
                description: "A direct representation of the problem described.",
                image_prompt: "A stressed professional sitting at a desk buried under piles of paperwork, looking overwhelmed, cinematic lighting, photorealistic, 8k.",
                hook_text: "Drowning in Work?",
                text_overlay: "Drowning in Work?",
                color_palette: ["#FF0000", "#000000", "#FFFFFF"],
                layout: "close-up"
            },
            {
                id: "mock-2",
                title: "The Metaphorical Trap",
                description: "Visualizing the hidden danger.",
                image_prompt: "A person in a business suit standing inside a giant bear trap made of gold, dramatic shadows, moody atmosphere, photorealistic.",
                hook_text: "The Golden Trap",
                text_overlay: "The Golden Trap",
                color_palette: ["#FFD700", "#1A1A1A", "#FFFFFF"],
                layout: "split"
            },
            {
                id: "mock-3",
                title: "Emotional Reaction",
                description: "Focusing on the feeling of realization.",
                image_prompt: "Close up of a person's face showing shock and realization, holding a burning contract, high contrast, dramatic lighting.",
                hook_text: "I Was Wrong.",
                text_overlay: "I Was Wrong.",
                color_palette: ["#0000FF", "#FFFFFF", "#000000"],
                layout: "wide"
            }
        ]
    };
}
