import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Circle, Search, Lightbulb, BarChart3, Wand2 } from "lucide-react";

export type PipelineStage = "research" | "strategy" | "evaluation" | "production";
export type StageStatus = "pending" | "active" | "completed" | "error";

export interface PipelineStageData {
  stage: PipelineStage;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StageStatus;
  result?: string;
}

interface MultiAgentPipelineProps {
  stages: PipelineStageData[];
  currentStage?: PipelineStage;
}

export function MultiAgentPipeline({ stages, currentStage }: MultiAgentPipelineProps) {
  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "active":
        return <Loader2 className="w-5 h-5 text-g-accent animate-spin" />;
      case "error":
        return <Circle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-g-muted" />;
    }
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "active":
        return <Badge variant="default">In Progress</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="border-g-accent/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-g-accent" />
          Multi-Agent Research Pipeline
        </CardTitle>
        <CardDescription>
          AI agents working together to research, strategize, evaluate, and produce viral content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = stage.status === "active" || stage.stage === currentStage;
            
            return (
              <div key={stage.stage}>
                <div
                  className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                    isActive
                      ? "bg-g-accent/10 border-2 border-g-accent shadow-md"
                      : stage.status === "completed"
                      ? "bg-green-500/10 border border-green-500/30"
                      : "glass-panel"
                  }`}
                >
                  {/* Stage Icon and Status */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-3 rounded-full ${
                        isActive
                          ? "bg-g-accent/20"
                          : stage.status === "completed"
                          ? "bg-green-500/20"
                          : "bg-g-chip/50"
                      }`}
                    >
                      <StageIcon
                        className={`w-6 h-6 ${
                          isActive
                            ? "text-g-accent"
                            : stage.status === "completed"
                            ? "text-green-400"
                            : "text-g-muted"
                        }`}
                      />
                    </div>
                    {getStatusIcon(stage.status)}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base font-sans text-g-heading-2">
                          Stage {index + 1}: {stage.name}
                        </h4>
                        <p className="text-sm text-g-muted font-sans mt-1">
                          {stage.description}
                        </p>
                      </div>
                      {getStatusBadge(stage.status)}
                    </div>

                    {/* Stage Result */}
                    {stage.result && (
                      <div className="mt-3 p-3 glass-panel rounded-md">
                        <p className="text-sm text-g-text font-sans">{stage.result}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="ml-9 h-6 w-0.5 bg-g-border" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function getDefaultPipelineStages(): PipelineStageData[] {
  return [
    {
      stage: "research",
      name: "Research Agent",
      description: "Analyzing platform trends, audience behavior, and viral patterns",
      icon: Search,
      status: "pending"
    },
    {
      stage: "strategy",
      name: "Strategy Agent",
      description: "Creating concepts optimized for your audience and platform",
      icon: Lightbulb,
      status: "pending"
    },
    {
      stage: "evaluation",
      name: "Evaluation Agent",
      description: "Scoring concepts across multiple dimensions and ranking results",
      icon: BarChart3,
      status: "pending"
    },
    {
      stage: "production",
      name: "Production Agent",
      description: "Preparing top concepts for content generation and deployment",
      icon: Wand2,
      status: "pending"
    }
  ];
}
