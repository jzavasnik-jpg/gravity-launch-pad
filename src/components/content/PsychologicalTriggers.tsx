import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  psychologicalTriggers, 
  psychologicalTriggerDatabase,
  PsychologicalTrigger 
} from "@/data/psychological-triggers";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Brain, AlertTriangle, TrendingUp, Info } from "lucide-react";

interface PsychologicalTriggersProps {
  selectedTriggerIds?: string[];
  gravitySixS?: string;
  showRecommendations?: boolean;
  platform?: string;
  contentGoal?: 'awareness' | 'engagement' | 'conversion';
}

export function PsychologicalTriggers({ 
  selectedTriggerIds = [],
  gravitySixS,
  showRecommendations = false,
  platform,
  contentGoal = 'engagement'
}: PsychologicalTriggersProps) {
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set());

  const toggleTrigger = (triggerId: string) => {
    setExpandedTriggers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(triggerId)) {
        newSet.delete(triggerId);
      } else {
        newSet.add(triggerId);
      }
      return newSet;
    });
  };

  // Get recommended triggers if applicable
  const recommendedTriggers = showRecommendations && gravitySixS && platform
    ? psychologicalTriggerDatabase.recommendTriggersForConcept(platform, gravitySixS, contentGoal)
    : [];

  // Get triggers to display
  const triggersToDisplay = gravitySixS
    ? psychologicalTriggerDatabase.getTriggersByGravitySixS(gravitySixS)
    : psychologicalTriggers;

  const getStrengthColor = (level: number) => {
    if (level >= 9) return "text-red-500";
    if (level >= 8) return "text-orange-500";
    if (level >= 7) return "text-yellow-500";
    return "text-blue-500";
  };

  const getStrengthBadgeVariant = (level: number): "default" | "secondary" | "destructive" | "outline" => {
    if (level >= 9) return "destructive";
    if (level >= 8) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-g-accent" />
          <h3 className="text-2xl font-bold font-display text-g-heading">Psychological Triggers Database</h3>
        </div>
        <p className="text-g-muted font-sans">
          Proven patterns for emotional hooks mapped to the Gravity Six S framework
        </p>
      </div>

      {/* Recommendations Section */}
      {showRecommendations && recommendedTriggers.length > 0 && (
        <Card className="border-g-accent bg-g-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-g-accent" />
              Recommended for Your Content
            </CardTitle>
            <CardDescription>
              Based on {platform && `${platform}, `}{gravitySixS && `${gravitySixS} emotion, `}and {contentGoal} goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedTriggers.map(trigger => (
                <div key={trigger.id} className="p-3 glass-panel rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-g-heading-2 font-sans">{trigger.name}</h4>
                        <Badge variant={getStrengthBadgeVariant(trigger.strengthLevel)}>
                          Strength: {trigger.strengthLevel}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-g-text font-sans">{trigger.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-g-muted font-sans mt-2">
                    <strong className="text-g-text">Example:</strong> {trigger.exampleApplications[0]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Triggers */}
      <div className="space-y-3">
        {triggersToDisplay.map(trigger => {
          const isSelected = selectedTriggerIds.includes(trigger.id);
          const isExpanded = expandedTriggers.has(trigger.id);
          const isRecommended = recommendedTriggers.some(t => t.id === trigger.id);

          return (
            <Card 
              key={trigger.id}
              className={`transition-all ${
                isSelected ? "ring-2 ring-g-accent border-g-accent" : ""
              } ${isRecommended ? "border-g-accent/50" : ""}`}
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleTrigger(trigger.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{trigger.name}</CardTitle>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Applied
                          </Badge>
                        )}
                        {isRecommended && !isSelected && (
                          <Badge variant="outline" className="text-xs border-g-accent text-g-accent">
                            Recommended
                          </Badge>
                        )}
                        <Badge 
                          variant={getStrengthBadgeVariant(trigger.strengthLevel)}
                          className="text-xs"
                        >
                          {trigger.strengthLevel}/10
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {trigger.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trigger.gravitySixS.map(sixS => (
                          <Badge key={sixS} variant="secondary" className="text-xs">
                            {sixS}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Mechanism */}
                    <div>
                      <h5 className="text-sm font-semibold mb-1 flex items-center gap-1 text-g-heading-2 font-sans">
                        <Info className="w-3 h-3" />
                        How It Works
                      </h5>
                      <p className="text-sm text-g-text font-sans">{trigger.mechanism}</p>
                    </div>

                    {/* Example Applications */}
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-g-heading-2 font-sans">Example Applications</h5>
                      <ul className="space-y-1.5">
                        {trigger.exampleApplications.map((example, idx) => (
                          <li key={idx} className="text-sm text-g-text font-sans pl-4 relative">
                            <span className="absolute left-0 text-g-accent">•</span>
                            "{example}"
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ethical Considerations */}
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <h5 className="text-sm font-semibold mb-1 flex items-center gap-1 text-amber-400 font-sans">
                        <AlertTriangle className="w-3 h-3" />
                        Ethical Considerations
                      </h5>
                      <p className="text-xs text-amber-300 font-sans">
                        {trigger.ethicalConsiderations}
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="bg-g-panel/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold font-display text-g-heading">{triggersToDisplay.length}</div>
              <div className="text-xs text-g-muted font-sans">Total Triggers</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-g-heading">
                {triggersToDisplay.filter(t => t.strengthLevel >= 9).length}
              </div>
              <div className="text-xs text-g-muted font-sans">High Impact</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-g-heading">{selectedTriggerIds.length}</div>
              <div className="text-xs text-g-muted font-sans">Applied</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
