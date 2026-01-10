import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Star, Plus, Trash2, Quote, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SocialProofSection = () => {
    const { data, updateSection } = useArchitectStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const addTestimonial = () => {
        const newTestimonial = {
            id: `testimonial_${Date.now()}`,
            name: "",
            role: "",
            quote: "",
        };
        updateSection('socialProof', {
            testimonials: [...data.socialProof.testimonials, newTestimonial]
        });
    };

    const updateTestimonial = (id: string, updates: Partial<typeof data.socialProof.testimonials[0]>) => {
        updateSection('socialProof', {
            testimonials: data.socialProof.testimonials.map(t =>
                t.id === id ? { ...t, ...updates } : t
            )
        });
    };

    const removeTestimonial = (id: string) => {
        updateSection('socialProof', {
            testimonials: data.socialProof.testimonials.filter(t => t.id !== id)
        });
    };

    const addMetric = () => {
        const newMetric = {
            id: `metric_${Date.now()}`,
            value: "",
            label: "",
        };
        updateSection('socialProof', {
            metrics: [...data.socialProof.metrics, newMetric]
        });
    };

    const updateMetric = (id: string, updates: Partial<typeof data.socialProof.metrics[0]>) => {
        updateSection('socialProof', {
            metrics: data.socialProof.metrics.map(m =>
                m.id === id ? { ...m, ...updates } : m
            )
        });
    };

    const removeMetric = (id: string) => {
        updateSection('socialProof', {
            metrics: data.socialProof.metrics.filter(m => m.id !== id)
        });
    };

    const handleGenerate = async () => {
        if (data.socialProof.testimonials.length === 0 && data.socialProof.metrics.length === 0) {
            toast.error("Add at least one testimonial or metric first.");
            return;
        }

        setIsGenerating(true);

        try {
            const systemPrompt = `You are a direct response copywriter. Create a compelling social proof section headline and subheadline.

The social proof section should:
1. HEADLINE: A short, impactful phrase that frames the testimonials/results (5-10 words)
2. SUBHEADLINE: Supporting context that builds credibility (10-20 words)

Return the response as JSON: { "headline": "string", "subheadline": "string" }`;

            const userPrompt = `Testimonials provided: ${data.socialProof.testimonials.length}
Metrics provided: ${data.socialProof.metrics.map(m => `${m.value} ${m.label}`).join(", ") || "None"}

Generate a headline and subheadline that frames this social proof compellingly.`;

            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            if (!res.ok) throw new Error("Failed to generate copy");

            const aiData = await res.json();

            if (aiData.headline && aiData.subheadline) {
                updateSection('socialProof', { generatedCopy: aiData });
                toast.success("Social proof copy generated!");
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
                    <Star className="w-5 h-5 text-primary" />
                    Step 3: Social Proof
                </h3>
                <p className="text-sm text-muted-foreground">
                    Show that others have succeeded. Testimonials and metrics build trust instantly.
                </p>
            </div>

            {/* Metrics Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Key Metrics
                    </Label>
                    <Button variant="ghost" size="sm" onClick={addMetric}>
                        <Plus className="w-4 h-4 mr-1" /> Add Metric
                    </Button>
                </div>

                {data.socialProof.metrics.length === 0 ? (
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No metrics added yet</p>
                        <p className="text-xs text-muted-foreground/70">e.g., "10,000+ Students", "$5M Revenue Generated"</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.socialProof.metrics.map((metric) => (
                            <div key={metric.id} className="flex items-center gap-2 p-3 bg-card border rounded-lg">
                                <Input
                                    placeholder="10,000+"
                                    value={metric.value}
                                    onChange={(e) => updateMetric(metric.id, { value: e.target.value })}
                                    className="w-28 font-bold text-primary"
                                />
                                <Input
                                    placeholder="Happy Customers"
                                    value={metric.label}
                                    onChange={(e) => updateMetric(metric.id, { label: e.target.value })}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeMetric(metric.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Testimonials Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                        <Quote className="w-3 h-3" />
                        Testimonials
                    </Label>
                    <Button variant="ghost" size="sm" onClick={addTestimonial}>
                        <Plus className="w-4 h-4 mr-1" /> Add Testimonial
                    </Button>
                </div>

                {data.socialProof.testimonials.length === 0 ? (
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <Quote className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No testimonials added yet</p>
                        <p className="text-xs text-muted-foreground/70">Real testimonials convert better than anything</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.socialProof.testimonials.map((testimonial, idx) => (
                            <div key={testimonial.id} className={cn(
                                "p-4 bg-card border rounded-lg space-y-3",
                                "border-l-4 border-l-primary/50"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-muted-foreground">
                                        Testimonial #{idx + 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTestimonial(testimonial.id)}
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="What did they say about their transformation?"
                                    value={testimonial.quote}
                                    onChange={(e) => updateTestimonial(testimonial.id, { quote: e.target.value })}
                                    className="min-h-[80px] resize-none italic"
                                />
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Name"
                                        value={testimonial.name}
                                        onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Role / Company"
                                        value={testimonial.role}
                                        onChange={(e) => updateTestimonial(testimonial.id, { role: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={isGenerating || (data.socialProof.testimonials.length === 0 && data.socialProof.metrics.length === 0)}
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
                        Generate Section Headline with AI
                    </>
                )}
            </Button>

        </div>
    );
};
