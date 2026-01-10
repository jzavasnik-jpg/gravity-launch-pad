import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ViralConcept } from "@/lib/content-api";
import { psychologicalTriggerDatabase } from "@/data/psychological-triggers";
import { Sparkles, TrendingUp, Brain, Zap, Target, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContentScoreDisplayProps {
  concept: ViralConcept;
  rank?: number;
  isTopRecommendation?: boolean;
}

export function ContentScoreDisplay({ 
  concept, 
  rank, 
  isTopRecommendation = false 
}: ContentScoreDisplayProps) {
  const scoreCategories = [
    {
      name: "Hook Strength",
      score: concept.scores.hookStrength,
      icon: Zap,
      description: "How well the hook captures attention"
    },
    {
      name: "Pattern Interrupt",
      score: concept.scores.patternInterrupt,
      icon: Sparkles,
      description: "Ability to break scroll patterns"
    },
    {
      name: "Emotional Curiosity",
      score: concept.scores.emotionalCuriosity,
      icon: Brain,
      description: "Emotional engagement and curiosity"
    },
    {
      name: "Algorithm Fit",
      score: concept.scores.algorithmFit,
      icon: Target,
      description: "Platform algorithm optimization"
    },
    {
      name: "Viral Ceiling",
      score: concept.scores.viralCeiling,
      icon: TrendingUp,
      description: "Maximum viral potential"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-400 to-emerald-500";
    if (score >= 80) return "from-blue-400 to-cyan-500";
    if (score >= 70) return "from-yellow-400 to-amber-500";
    return "from-orange-400 to-red-500";
  };

  return (
    <Card className={`${isTopRecommendation ? "ring-2 ring-g-accent shadow-xl shadow-g-accent/20" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {rank && (
                <Badge variant={rank <= 3 ? "default" : "secondary"}>
                  #{rank}
                </Badge>
              )}
              {isTopRecommendation && (
                <Badge variant="gradient">
                  Top Pick
                </Badge>
              )}
              <Badge variant="outline">{concept.framework}</Badge>
            </div>
            <CardTitle className="text-lg">{concept.title}</CardTitle>
            <CardDescription className="mt-1">{concept.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end ml-4">
            <div className={`text-3xl font-bold font-display ${getScoreColor(concept.scores.overall)}`}>
              {Math.round(concept.scores.overall)}
            </div>
            <span className="text-xs text-g-muted font-sans">Overall</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hook Preview */}
        <div className="p-3 glass-panel rounded-lg">
          <p className="text-sm font-medium mb-1 text-g-heading-2 font-sans">Hook:</p>
          <p className="text-sm italic text-g-text font-sans">"{concept.hook}"</p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-g-heading-2 font-sans">Score Breakdown</h4>
          {scoreCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-g-muted" />
                    <span className="text-g-text font-sans">{category.name}</span>
                  </div>
                  <span className={`font-semibold font-sans ${getScoreColor(category.score)}`}>
                    {Math.round(category.score)}
                  </span>
                </div>
                <Progress 
                  value={category.score} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>

        {/* Psychological Triggers */}
        {concept.psychologicalTriggers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-g-heading-2 font-sans">
              <Lightbulb className="w-4 h-4" />
              Psychological Triggers
            </h4>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {concept.psychologicalTriggers.map((triggerId) => {
                  const triggerData = psychologicalTriggerDatabase.getTriggerById(triggerId);
                  return (
                    <Tooltip key={triggerId}>
                      <TooltipTrigger>
                        <Badge variant="glass" className="text-xs cursor-help">
                          {triggerData?.name || triggerId}
                          {triggerData && triggerData.strengthLevel >= 9 && (
                            <span className="ml-1">🔥</span>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      {triggerData && (
                        <TooltipContent className="max-w-xs glass-panel">
                          <p className="font-semibold mb-1 text-g-heading">{triggerData.name}</p>
                          <p className="text-xs mb-2 text-g-text">{triggerData.description}</p>
                          <p className="text-xs text-g-muted">
                            Strength: {triggerData.strengthLevel}/10
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="p-3 bg-g-accent/10 rounded-lg border border-g-accent/20">
          <h4 className="text-sm font-semibold mb-1 text-g-heading-2 font-sans">Why This Works</h4>
          <p className="text-sm text-g-text font-sans">{concept.reasoning}</p>
        </div>

        {/* Estimated Reach */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-g-muted font-sans">Estimated Reach:</span>
          <span className="font-semibold text-g-text font-sans">{concept.estimatedReach}</span>
        </div>

        {/* Platform Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-g-muted font-sans">Optimized for:</span>
          <Badge variant="outline">{concept.platform}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopRecommendationsProps {
  concepts: ViralConcept[];
}

export function TopRecommendations({ concepts }: TopRecommendationsProps) {
  const topThree = concepts.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold font-display text-g-heading mb-2">🏆 Top 3 Recommendations</h3>
        <p className="text-g-muted font-sans">
          These concepts scored highest across all dimensions and have the strongest viral potential
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {topThree.map((concept, index) => (
          <ContentScoreDisplay
            key={concept.id}
            concept={concept}
            rank={index + 1}
            isTopRecommendation={true}
          />
        ))}
      </div>
    </div>
  );
}
