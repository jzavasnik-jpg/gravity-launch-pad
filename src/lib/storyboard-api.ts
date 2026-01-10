import { Asset } from "./asset-types";
import { PainSynopsisResult } from "./pain-synopsis-api";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface StoryboardScene {
    sceneNumber: number;
    duration: "5s";
    scriptText: string;
    visualDescription: string;
    suggestedAssetType: "screenshot" | "product" | "generated" | "none";
    matchedAssetId?: string;
}

export interface Storyboard {
    totalScenes: number;
    scenes: StoryboardScene[];
    visualTheme: string;
    narrative: string;
}

export interface ScreenshotAnalysis {
    assetId: string;
    description: string;
    uiElements: string[];
    contentType: "ui" | "diagram" | "product" | "text" | "other";
}

/**
 * Analyzes a script and creates an intelligent storyboard
 * Breaks down the script into logical 5-second scenes with visual descriptions
 */
export async function createStoryboard(
    script: string,
    platform: string,
    availableAssets: Asset[],
    context?: {
        icpAnswers?: string[];
        painSynopsis?: PainSynopsisResult;
        marketingStatements?: any;
    }
): Promise<Storyboard> {
    if (!OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
    }

    const assetDescriptions = availableAssets.map(a => ({
        id: a.id,
        type: a.asset_type,
        title: a.title,
        description: a.description || "No description"
    }));

    let contextPrompt = "";
    if (context) {
        contextPrompt = `
**Context:**
${context.painSynopsis ? `- Target Audience: ${context.painSynopsis.psychologicalProfile.coreDesire}` : ''}
${context.painSynopsis ? `- Brand Voice: ${context.painSynopsis.psychologicalProfile.primaryEmotion}` : ''}
${context.marketingStatements ? `- USP: ${context.marketingStatements.uspStatement}` : ''}
${context.marketingStatements ? `- Solution: ${context.marketingStatements.solutionStatement}` : ''}
`;
    }

    const prompt = `You are an expert video storyboard director. Analyze this ${platform} video script and create a detailed storyboard.

**Script:**
${script}

**Available Assets:**
${JSON.stringify(assetDescriptions, null, 2)}
${contextPrompt}

**Instructions:**
1. Break the script into logical scenes (each ~5 seconds long)
2. For each scene:
   - Identify the key message/moment
   - Describe the ideal visual (what should be shown)
   - Suggest if a product asset, screenshot, or generated image works best
   - Match to an available asset if relevant
3. Ensure the scenes tell a cohesive story with good narrative flow
4. Create a visual theme that ties everything together
5. USE THE CONTEXT provided (Target Audience, USP, etc.) to tailor the visual descriptions.

Return JSON:
{
  "visualTheme": "Brief description of the overall visual style",
  "narrative": "The story arc this video tells",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "5s",
      "scriptText": "Exact text from script for this scene",
      "visualDescription": "Detailed description of what should be visually shown",
      "suggestedAssetType": "screenshot" | "product" | "generated" | "none",
      "matchedAssetId": "asset-id-if-applicable"
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert video storyboard director who creates compelling visual narratives.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content || '{}');

    return {
        totalScenes: result.scenes?.length || 0,
        scenes: result.scenes || [],
        visualTheme: result.visualTheme || "Modern and clean",
        narrative: result.narrative || ""
    };
}

/**
 * Analyzes a screenshot using GPT-4 Vision to understand its content
 */
export async function analyzeScreenshot(
    imageUrl: string,
    assetId: string
): Promise<ScreenshotAnalysis> {
    if (!OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this screenshot/image and describe what it shows. Identify:
1. Main content/purpose
2. Key UI elements or features visible
3. Type of content (UI, diagram, product photo, text, etc.)

Return JSON:
{
  "description": "Brief description of what this image shows",
  "uiElements": ["element1", "element2"],
  "contentType": "ui" | "diagram" | "product" | "text" | "other"
}`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                                detail: 'low' // Using low detail to save costs
                            }
                        }
                    ]
                }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content || '{}');

    return {
        assetId,
        description: result.description || "Unknown content",
        uiElements: result.uiElements || [],
        contentType: result.contentType || "other"
    };
}

/**
 * Matches available assets to storyboard scenes based on content analysis
 */
export function matchAssetsToScenes(
    storyboard: Storyboard,
    assets: Asset[],
    screenshotAnalyses: ScreenshotAnalysis[]
): StoryboardScene[] {
    const updatedScenes = [...storyboard.scenes];
    const usedAssets = new Set<string>();

    // First pass: Match explicitly suggested assets
    for (const scene of updatedScenes) {
        if (scene.matchedAssetId && assets.find(a => a.id === scene.matchedAssetId)) {
            usedAssets.add(scene.matchedAssetId);
        }
    }

    // Second pass: Intelligent matching for unmatched scenes
    for (const scene of updatedScenes) {
        if (scene.matchedAssetId) continue; // Already matched

        // Try to find a relevant asset based on:
        // 1. Screenshot analysis description matching
        // 2. Asset type matching suggested type
        const relevantAssets = assets.filter(a => !usedAssets.has(a.id));

        if (scene.suggestedAssetType === 'screenshot') {
            const screenshot = screenshotAnalyses.find(sa =>
                !usedAssets.has(sa.assetId) &&
                (sa.description.toLowerCase().includes(scene.scriptText.toLowerCase().split(' ')[0]) ||
                    scene.visualDescription.toLowerCase().includes(sa.contentType))
            );
            if (screenshot) {
                scene.matchedAssetId = screenshot.assetId;
                usedAssets.add(screenshot.assetId);
            }
        } else if (scene.suggestedAssetType === 'product') {
            const productAsset = relevantAssets.find(a => a.asset_type === 'image' || a.asset_type === 'video');
            if (productAsset) {
                scene.matchedAssetId = productAsset.id;
                usedAssets.add(productAsset.id);
            }
        }
    }

    return updatedScenes;
}
