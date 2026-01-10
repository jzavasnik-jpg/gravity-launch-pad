import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Zap, Type, MousePointer, Link } from "lucide-react";
import { toast } from "sonner";

export const HeroSection = () => {
    const { data, updateSection } = useArchitectStore();
    const { strategyContext } = useProjectStore();

    const [isGenerating, setIsGenerating] = useState(false);

    // Pull avatar name from strategy context if available
    const avatarName = strategyContext?.avatarName || "Your Customer";
    const painPoints = strategyContext?.painPoints || [];

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            const systemPrompt = `You are a world-class direct response copywriter. Create a compelling hero section for a landing page.

The hero section must:
1. EYEBROW: A short attention-grabbing phrase that calls out the target audience (5-8 words max)
2. HEADLINE: A bold, benefit-driven headline that promises a transformation (10-15 words max)
3. SUBHEADLINE: Supporting copy that addresses objections and adds credibility (15-25 words)

Use these copywriting principles:
- Lead with the desired outcome, not the product
- Be specific with numbers and timeframes when possible
- Address the #1 objection in the subheadline
- Create urgency without being pushy

Return the response as JSON: { "eyebrow": "string", "headline": "string", "subheadline": "string" }`;

            const userPrompt = `Target Avatar: ${avatarName}
Pain Points: ${painPoints.join(", ") || "Not specified"}
Current Eyebrow: ${data.hero.eyebrow}
Current Headline: ${data.hero.headline}
Current Subheadline: ${data.hero.subheadline}

Generate compelling hero copy that speaks directly to this avatar's deepest desires and frustrations.`;

            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            if (!res.ok) throw new Error("Failed to generate copy");

            const aiData = await res.json();

            if (aiData.eyebrow && aiData.headline && aiData.subheadline) {
                updateSection('hero', {
                    generatedCopy: aiData,
                    eyebrow: aiData.eyebrow,
                    headline: aiData.headline,
                    subheadline: aiData.subheadline
                });
                toast.success("Hero copy generated!");
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
                    <Zap className="w-5 h-5 text-primary" />
                    Step 1: Hero Section
                </h3>
                <p className="text-sm text-muted-foreground">
                    The first thing visitors see. Make it count with a compelling headline and clear value proposition.
                </p>
            </div>

            {/* Eyebrow */}
            <div className="space-y-3">
                <Label htmlFor="eyebrow" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Type className="w-3 h-3" />
                    Eyebrow Text
                </Label>
                <Input
                    id="eyebrow"
                    placeholder={`e.g. "Attention ${avatarName}s"`}
                    value={data.hero.eyebrow}
                    onChange={(e) => updateSection('hero', { eyebrow: e.target.value })}
                    className="font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                    Small text above the headline that calls out your audience.
                </p>
            </div>

            {/* Headline */}
            <div className="space-y-3">
                <Label htmlFor="headline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Main Headline
                </Label>
                <Textarea
                    id="headline"
                    placeholder="The Big Promise That Solves Their Problem"
                    value={data.hero.headline}
                    onChange={(e) => updateSection('hero', { headline: e.target.value })}
                    className="font-bold text-lg min-h-[80px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                    Your bold promise. Lead with the transformation, not the product.
                </p>
            </div>

            {/* Subheadline */}
            <div className="space-y-3">
                <Label htmlFor="subheadline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Supporting Subheadline
                </Label>
                <Textarea
                    id="subheadline"
                    placeholder="Address objections and add credibility..."
                    value={data.hero.subheadline}
                    onChange={(e) => updateSection('hero', { subheadline: e.target.value })}
                    className="min-h-[60px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                    Handle the "yeah but..." in their head. Be specific.
                </p>
            </div>

            {/* CTA Button Text */}
            <div className="space-y-3">
                <Label htmlFor="ctaPrimary" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <MousePointer className="w-3 h-3" />
                    Primary CTA Button
                </Label>
                <Input
                    id="ctaPrimary"
                    placeholder="Get Started Free"
                    value={data.hero.ctaPrimary}
                    onChange={(e) => updateSection('hero', { ctaPrimary: e.target.value })}
                    className="font-semibold"
                />
                <p className="text-[10px] text-muted-foreground">
                    Action-oriented. What do they get when they click?
                </p>
            </div>

            {/* CTA URL */}
            <div className="space-y-3">
                <Label htmlFor="ctaUrl" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Link className="w-3 h-3" />
                    CTA Destination URL
                </Label>
                <Input
                    id="ctaUrl"
                    placeholder="https://your-checkout.com/buy"
                    value={data.hero.ctaUrl}
                    onChange={(e) => updateSection('hero', { ctaUrl: e.target.value })}
                    className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                    Where visitors go when they click the CTA button (checkout page, signup form, etc.)
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
                        Generate Hero Copy with AI
                    </>
                )}
            </Button>

            {/* Tips Card */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Pro Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Lead with "What they GET" not "What you SELL"</li>
                    <li>• Use specific numbers: "In 30 days" beats "quickly"</li>
                    <li>• Address the #1 objection in your subheadline</li>
                </ul>
            </div>

        </div>
    );
};
