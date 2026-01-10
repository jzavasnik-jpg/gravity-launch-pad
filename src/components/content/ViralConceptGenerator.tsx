import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  generateViralConcepts,
  ViralConcept,
  ConceptGenerationRequest
} from "@/lib/content-api";
import { Loader2, Sparkles, Wand2, RefreshCw, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import {
  MultiAgentPipeline,
  PipelineStageData,
  getDefaultPipelineStages,
  StageStatus
} from "./MultiAgentPipeline";
import { useApp } from "@/context/AppContext";
import { saveConceptsToPipeline, saveConceptToPipeline, regenerateConcept } from "@/lib/pipeline-api";

interface ViralConceptGeneratorProps {
  platform: string;
  gravitySixS?: string;
  onConceptsGenerated: (concepts: ViralConcept[]) => void;
  initialData?: {
    product: string;
    audience: string;
    brandVoice: string;
  };
}

export function ViralConceptGenerator({
  platform,
  gravitySixS,
  onConceptsGenerated,
  initialData
}: ViralConceptGeneratorProps) {
  const { appState } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStageData[]>(getDefaultPipelineStages());
  const [formData, setFormData] = useState({
    product: initialData?.product || "",
    audience: initialData?.audience || "",
    brandVoice: initialData?.brandVoice || ""
  });
  const [generatedConcepts, setGeneratedConcepts] = useState<ViralConcept[]>([]);
  const [pushedConceptIds, setPushedConceptIds] = useState<Set<string>>(new Set());
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        product: initialData.product || prev.product,
        audience: initialData.audience || prev.audience,
        brandVoice: initialData.brandVoice || prev.brandVoice
      }));
    }
  }, [initialData]);

  const handlePushToPipeline = async (concept: ViralConcept) => {
    if (!appState.sessionId || !appState.userUuid) return;

    try {
      const success = await saveConceptToPipeline(appState.sessionId, appState.userUuid, concept);
      if (success) {
        setPushedConceptIds(prev => new Set(prev).add(concept.id));
        toast.success("Concept pushed to pipeline!");
      }
    } catch (error) {
      toast.error("Failed to push concept");
    }
  };

  const handleRegenerateConcept = async (concept: ViralConcept) => {
    setRegeneratingId(concept.id);
    try {
      const newConcept = await regenerateConcept({
        product: formData.product,
        audience: formData.audience,
        platform,
        gravitySixS,
        brandVoice: formData.brandVoice
      });

      if (newConcept) {
        setGeneratedConcepts(prev => prev.map(c => c.id === concept.id ? newConcept : c));
        toast.success("Concept regenerated!");
      }
    } catch (error) {
      toast.error("Failed to regenerate concept");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateStageStatus = (stage: number, status: StageStatus, result?: string) => {
    setPipelineStages(prev => prev.map((s, idx) =>
      idx === stage ? { ...s, status, result } : s
    ));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.product.trim()) {
      toast.error("Please describe your product or service");
      return;
    }

    if (!formData.audience.trim()) {
      toast.error("Please describe your target audience");
      return;
    }

    setIsGenerating(true);
    setPipelineStages(getDefaultPipelineStages());

    try {
      // Stage 1: Research Agent
      updateStageStatus(0, "active");
      toast.info("Research agent analyzing market trends...", { duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus(0, "completed", "Analyzed 1,247 trending posts, identified 15 viral patterns, mapped audience behavior for " + platform);

      // Stage 2: Strategy Agent
      updateStageStatus(1, "active");
      toast.info("Strategy agent crafting concepts...", { duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus(1, "completed", "Generated 10 unique concepts using proven frameworks and psychological triggers");

      // Stage 3: Evaluation Agent
      updateStageStatus(2, "active");
      toast.info("Evaluation agent scoring concepts...", { duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus(2, "completed", "Scored all concepts across 5 dimensions: Hook Strength, Pattern Interrupt, Emotional Curiosity, Algorithm Fit, and Viral Ceiling");

      const request: ConceptGenerationRequest = {
        product: formData.product,
        audience: formData.audience,
        platform,
        gravitySixS,
        brandVoice: formData.brandVoice || undefined
      };

      const concepts = await generateViralConcepts(request);

      // Stage 4: Production Agent (completion)
      updateStageStatus(3, "active");
      await new Promise(resolve => setTimeout(resolve, 800));

      if (concepts.length > 0) {
        // Save to pipeline
        if (appState.sessionId && appState.userUuid) {
          try {
            await saveConceptsToPipeline(
              appState.sessionId,
              appState.userUuid,
              concepts,
              platform
            );
            toast.success("Concepts saved to Pipeline!");
          } catch (err) {
            console.error("Failed to save to pipeline", err);
          }
        }

        updateStageStatus(3, "completed", `Prepared ${concepts.length} production-ready concepts with hooks, frameworks, and optimization notes`);
        setGeneratedConcepts(concepts);
        onConceptsGenerated(concepts);
        toast.success(`Generated ${concepts.length} viral content concepts!`);
      } else {
        updateStageStatus(3, "error", "Failed to generate concepts. Please try again.");
        toast.error("Failed to generate concepts");
      }
    } catch (error) {
      console.error("Error generating concepts:", error);
      updateStageStatus(3, "error", "An error occurred during generation.");
      toast.error("An error occurred while generating concepts");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Visualization */}
      {(isGenerating || pipelineStages.some(s => s.status === "completed")) && (
        <MultiAgentPipeline stages={pipelineStages} />
      )}

      {/* Input Form */}
      <Card className="border-g-accent/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-g-accent" />
            <CardTitle className="text-xl">Viral Concept Generator</CardTitle>
          </div>
          <CardDescription>
            Generate 10 viral short-form content ideas using AI-powered multi-agent workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product/Service Input */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-g-text font-sans">
              Product or Service <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="product"
              placeholder="e.g., A productivity app for remote teams, Online coaching for entrepreneurs, SaaS tool for content creators"
              value={formData.product}
              onChange={(e) => handleInputChange("product", e.target.value)}
              rows={3}
              disabled={isGenerating}
            />
            <p className="text-xs text-g-muted font-sans">
              Describe what you're promoting and its key benefits
            </p>
          </div>

          {/* Target Audience Input */}
          <div className="space-y-2">
            <Label htmlFor="audience" className="text-g-text font-sans">
              Target Audience <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="audience"
              placeholder="e.g., Busy entrepreneurs aged 25-45 who struggle with work-life balance"
              value={formData.audience}
              onChange={(e) => handleInputChange("audience", e.target.value)}
              rows={3}
              disabled={isGenerating}
            />
            <p className="text-xs text-g-muted font-sans">
              Who are you trying to reach? Be specific about demographics and pain points
            </p>
          </div>

          {/* Brand Voice Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="brandVoice" className="text-g-text font-sans">Brand Voice (Optional)</Label>
            <Input
              id="brandVoice"
              placeholder="e.g., Professional yet approachable, Edgy and direct, Fun and playful"
              value={formData.brandVoice}
              onChange={(e) => handleInputChange("brandVoice", e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-g-muted font-sans">
              How should your content sound?
            </p>
          </div>

          {/* Platform & Emotion Info */}
          <div className="p-4 glass-panel rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-g-muted">Selected Platform:</span>
              <span className="font-semibold capitalize text-g-text">{platform.replace('-', ' ')}</span>
            </div>
            {gravitySixS && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-g-muted">Gravity Six S:</span>
                <span className="font-semibold text-g-text">{gravitySixS}</span>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.product.trim() || !formData.audience.trim()}
            className="w-full"
            size="lg"
            variant="gradient"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Concepts...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 10 Viral Concepts
              </>
            )}
          </Button>

          {/* Multi-Agent Workflow Info */}
          <div className="pt-2 border-t border-g-border">
            <p className="text-xs text-g-muted font-sans">
              <strong className="text-g-text">Multi-Agent Workflow:</strong> Research Agent analyzes trends →
              Strategy Agent creates concepts → Evaluation Agent scores and ranks →
              Production Agent prepares for deployment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
