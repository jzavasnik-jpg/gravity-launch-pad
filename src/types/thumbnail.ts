export type AnalyzeScriptPayload = {
    script_text: string;
    reference_avatar_url?: string;
};

export type ScriptGenerationPayload = {
    topic: string;
    tone_level: number; // 0 (Serious) to 100 (Humorous)
    current_script?: string; // For rewriting
};

export type ScriptGenerationResponse = {
    script_text: string;
};

export interface ThumbnailConcept {
    id: string;
    title?: string;
    description: string;
    image_prompt: string;
    hook_text?: string;
    text_overlay?: string;
    color_palette?: string[];
    layout?: string;
} // Optional hook suggestion

export type ThumbnailConceptsResponse = {
    concepts: ThumbnailConcept[];
};

export type GenerateBasePayload = {
    concept_id: string;
    image_prompt: string;
    reference_avatar_url: string;
    hook_text_overlay: string;
};
