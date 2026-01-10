import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Frown, Smile } from "lucide-react";
import { toast } from "sonner";

export const TransformationSection = () => {
    const { data, updateSection } = useArchitectStore();
    const { strategyContext } = useProjectStore();

    const [isGenerating, setIsGenerating] = useState(false);

    const painPoints = strategyContext?.painPoints || [];

    const handleGenerate = async () => {
        if (!data.transformation.beforeState && !data.transformation.afterState) {
            toast.error("Describe the before and after states first.");
            return;
        }

        setIsGenerating(true);

        try {
            const systemPrompt = `You are a direct response copywriter specializing in transformation stories.

Create a compelling before/after transformation section with:
1. HEADLINE: A powerful statement about the transformation (8-12 words)
2. BEFORE LIST: 4-5 bullet points describing the "before" state (pain, frustration, struggle)
3. AFTER LIST: 4-5 bullet points describing the "after" state (success, freedom, results)
4. BRIDGE TEXT: A short transitional sentence that connects the transformation to the product/solution

Rules:
- Mirror the language your avatar actually uses
- Be specific with outcomes ("saving 10 hours/week" not "saving time")
- Make the contrast stark and emotional

Return as JSON: { "headline": "string", "beforeList": ["string", ...], "afterList": ["string", ...], "bridgeText": "string" }`;

            const userPrompt = `Before State: ${data.transformation.beforeState}
After State: ${data.transformation.afterState}
Timeline: ${data.transformation.timeline || "Not specified"}
Known Pain Points: ${painPoints.join(", ") || "Not specified"}

Generate transformation copy that makes the contrast undeniable.`;

            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            if (!res.ok) throw new Error("Failed to generate copy");

            const aiData = await res.json();

            if (aiData.headline && aiData.beforeList && aiData.afterList) {
                updateSection('transformation', { generatedCopy: aiData });
                toast.success("Transformation copy generated!");
            } else {
                throw new Error("Invalid AI response format");
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate copy. Is the backend running?");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

            {/* Header */}
            <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    Step 4: The Transformation
                </h3>
                <p className="text-sm text-muted-foreground">
                    Paint a vivid picture of life before and after. This is where dreams are sold.
                </p>
            </div>

            {/* Before State */}
            <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Frown className="w-3 h-3 text-orange-500" />
                    The "Before" State
                </Label>
                <Textarea
                    placeholder="Describe their current painful reality... What frustrations do they face daily? What keeps them up at night?"
                    value={data.transformation.beforeState}
                    onChange={(e) => updateSection('transformation', { beforeState: e.target.value })}
                    className="min-h-[100px] resize-none border-orange-500/30 focus:border-orange-500/50"
                />
                <p className="text-[10px] text-muted-foreground">
                    Be specific. Use their exact words if you have testimonials.
                </p>

                {/* Quick pain point chips */}
                {painPoints.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {painPoints.slice(0, 4).map((pain, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    const current = data.transformation.beforeState;
                                    const updated = current ? `${current}\n• ${pain}` : `• ${pain}`;
                                    updateSection('transformation', { beforeState: updated });
                                }}
                                className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                                + {pain.slice(0, 30)}...
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Arrow Divider */}
            <div className="flex items-center justify-center py-2">
                <div className="flex-1 border-t border-dashed border-muted" />
                <ArrowRight className="w-8 h-8 mx-4 text-primary animate-pulse" />
                <div className="flex-1 border-t border-dashed border-muted" />
            </div>

            {/* After State */}
            <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Smile className="w-3 h-3 text-emerald-500" />
                    The "After" State
                </Label>
                <Textarea
                    placeholder="Describe their new reality... What does success look like? What can they finally do, have, or be?"
                    value={data.transformation.afterState}
                    onChange={(e) => updateSection('transformation', { afterState: e.target.value })}
                    className="min-h-[100px] resize-none border-emerald-500/30 focus:border-emerald-500/50"
                />
                <p className="text-[10px] text-muted-foreground">
                    Make it tangible. "6-figure launches" beats "success."
                </p>
            </div>

            {/* Timeline (Optional) */}
            <div className="space-y-3">
                <Label htmlFor="timeline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Transformation Timeline (Optional)
                </Label>
                <Input
                    id="timeline"
                    placeholder="e.g. In just 90 days..."
                    value={data.transformation.timeline}
                    onChange={(e) => updateSection('transformation', { timeline: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                    If you can promise a timeframe, it adds urgency and believability.
                </p>
            </div>

            {/* AI Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!data.transformation.beforeState && !data.transformation.afterState)}
                className="w-full h-12 text-md font-bold bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90 text-white shadow-lg shadow-primary/20"
            >
                {isGenerating ? (
                    <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Transformation Copy with AI
                    </>
                )}
            </Button>

            {/* Preview Generated Copy */}
            {data.transformation.generatedCopy.headline && (
                <div className="p-4 bg-card border border-primary/20 rounded-lg space-y-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Generated Preview</p>
                    <h4 className="text-lg font-bold">{data.transformation.generatedCopy.headline}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-orange-500">BEFORE:</p>
                            <ul className="space-y-1 text-muted-foreground">
                                {data.transformation.generatedCopy.beforeList.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-emerald-500">AFTER:</p>
                            <ul className="space-y-1 text-muted-foreground">
                                {data.transformation.generatedCopy.afterList.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {data.transformation.generatedCopy.bridgeText && (
                        <p className="text-sm italic text-center text-muted-foreground pt-2 border-t border-border">
                            "{data.transformation.generatedCopy.bridgeText}"
                        </p>
                    )}
                </div>
            )}

        </div>
    );
};
