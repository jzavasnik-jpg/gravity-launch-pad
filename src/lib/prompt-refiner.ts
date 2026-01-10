// import { OpenAI } from 'openai'; // Removed to avoid dependency issues

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function refinePromptWithUserInstruction(
    currentPrompt: string,
    userInstruction: string,
    newAssets: any[] = []
): Promise<string> {
    if (!OPENAI_API_KEY) {
        console.warn("Missing OpenAI Key for prompt refinement");
        return currentPrompt + " " + userInstruction;
    }

    const systemPrompt = `
    You are an expert Prompt Engineer for Google's Gemini 3 Pro model.
    Your task is to UPDATE an existing image generation prompt based on the user's natural language instruction.
    
    EXISTING PROMPT:
    "${currentPrompt}"

    USER INSTRUCTION:
    "${userInstruction}"

    NEW ASSETS ADDED:
    ${newAssets.map(a => `- ${a.name}`).join('\n')}

    RULES:
    1. **CRITICAL: IDENTITY LOCKING**: If the original prompt contains "Using the attached image as a strict reference...", you MUST keep this phrase at the start. DO NOT remove it.
    RULES:
    1. **CRITICAL: IDENTITY LOCKING**: If the original prompt contains "Using the attached image as a strict reference...", you MUST keep this phrase at the start. DO NOT remove it.
    2. **CRITICAL: NO TEXT**: Do NOT include any instructions to render text (e.g., 'Render the text...'). The image should be clean of any text overlay.
    3. **CRITICAL: CONSISTENCY**: Always keep the image identical (composition, lighting, pose, background) except for the specific changes asked for.
    4. **CRITICAL: SAFE COMPOSITION**: Ensure the result is a "Wide Shot" or "Medium Shot" with the subject centered. Avoid close-ups that might crop the face in 16:9.
    5. Keep the core style and technical specs of the original prompt.
    6. Integrate the user's change naturally into the narrative.
    7. If new assets are added, mention them in the prompt (e.g., "holding the [Asset Name]").
    8. Output ONLY the new prompt text. No explanations.
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0]?.message?.content || currentPrompt;

    } catch (error) {
        console.error("Failed to refine prompt:", error);
        return currentPrompt;
    }
}
