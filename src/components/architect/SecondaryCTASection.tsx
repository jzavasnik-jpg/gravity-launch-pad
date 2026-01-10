import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, MousePointer2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const SecondaryCTASection = () => {
    const { data, updateSection } = useArchitectStore();

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            const systemPrompt = `You are a direct response copywriter specializing in mid-page CTAs.

Create a compelling secondary call-to-action section with:
1. HEADLINE: A urgency-driven headline that re-engages scrollers (8-12 words)
2. SUBHEADLINE: Supporting copy that handles objections or adds value (15-25 words)
3. URGENCY TEXT: A scarcity or time-based element (10-15 words)

This CTA appears mid-page after social proof. It should:
- Catch scrollers who skipped the hero
- Address common objections
- Create urgency without being sleazy
- Feel like a "second chance" to act

Return as JSON: { "headline": "string", "subheadline": "string", "urgencyText": "string" }`;

            const userPrompt = `Current button text: ${data.secondaryCTA.buttonText || "Get Access Now"}
Any existing headline: ${data.secondaryCTA.headline || "Not set"}
Any existing subheadline: ${data.secondaryCTA.subheadline || "Not set"}

Generate compelling mid-page CTA copy that converts scrollers.`;

            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            if (!res.ok) throw new Error("Failed to generate copy");

            const aiData = await res.json();

            if (aiData.headline) {
                updateSection('secondaryCTA', {
                    generatedCopy: aiData,
                    headline: aiData.headline,
                    subheadline: aiData.subheadline || "",
                    urgencyText: aiData.urgencyText || ""
                });
                toast.success("CTA copy generated!");
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
                    <MousePointer2 className="w-5 h-5 text-primary" />
                    Step 6: Secondary CTA
                </h3>
                <p className="text-sm text-muted-foreground">
                    Catch the scrollers. This mid-page CTA re-engages visitors who didn't convert at the hero.
                </p>
            </div>

            {/* Headline */}
            <div className="space-y-3">
                <Label htmlFor="ctaHeadline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    CTA Headline
                </Label>
                <Textarea
                    id="ctaHeadline"
                    placeholder="Ready to transform your results?"
                    value={data.secondaryCTA.headline}
                    onChange={(e) => updateSection('secondaryCTA', { headline: e.target.value })}
                    className="font-bold text-lg min-h-[60px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                    Re-state the promise or create urgency.
                </p>
            </div>

            {/* Subheadline */}
            <div className="space-y-3">
                <Label htmlFor="ctaSubheadline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Supporting Copy
                </Label>
                <Textarea
                    id="ctaSubheadline"
                    placeholder="Join thousands of others who made the switch..."
                    value={data.secondaryCTA.subheadline}
                    onChange={(e) => updateSection('secondaryCTA', { subheadline: e.target.value })}
                    className="min-h-[60px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                    Handle objections or reinforce social proof.
                </p>
            </div>

            {/* Button Text */}
            <div className="space-y-3">
                <Label htmlFor="buttonText" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <MousePointer2 className="w-3 h-3" />
                    Button Text
                </Label>
                <Input
                    id="buttonText"
                    placeholder="Get Access Now"
                    value={data.secondaryCTA.buttonText}
                    onChange={(e) => updateSection('secondaryCTA', { buttonText: e.target.value })}
                    className="font-semibold"
                />
            </div>

            {/* Urgency Text */}
            <div className="space-y-3">
                <Label htmlFor="urgencyText" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Clock className="w-3 h-3 text-orange-500" />
                    Urgency Element (Optional)
                </Label>
                <Input
                    id="urgencyText"
                    placeholder="e.g. Only 17 spots left at this price"
                    value={data.secondaryCTA.urgencyText}
                    onChange={(e) => updateSection('secondaryCTA', { urgencyText: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                    Scarcity or time-based urgency. Use truthfully.
                </p>
            </div>

            {/* AI Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={isGenerating}
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
                        Generate CTA Copy with AI
                    </>
                )}
            </Button>

            {/* Tips Card */}
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-2">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Urgency Done Right
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Only use scarcity if it's real (limited seats, time-sensitive pricing)</li>
                    <li>• "Spots remaining" works better than countdown timers</li>
                    <li>• False urgency destroys trust—be honest</li>
                </ul>
            </div>

        </div>
    );
};
