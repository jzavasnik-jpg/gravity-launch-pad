import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentFrameworks, PatternHook } from "@/data/content-frameworks";
import { Lightbulb, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FrameworkSuggestionsProps {
  platform?: string;
  gravitySixS?: string;
  onSelectFramework?: (framework: PatternHook) => void;
}

export function FrameworkSuggestions({ 
  platform, 
  gravitySixS,
  onSelectFramework 
}: FrameworkSuggestionsProps) {
  // Get relevant frameworks based on filters
  const getRelevantFrameworks = (): PatternHook[] => {
    // Normalize platform for case-insensitive matching
    const normalizedPlatform = platform ? 
      platform.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      undefined;
    
    if (normalizedPlatform && gravitySixS) {
      // Filter by both platform and emotion
      return contentFrameworks.hooks.filter(hook =>
        hook.bestForPlatforms.some(p => p.toLowerCase() === normalizedPlatform.toLowerCase()) &&
        hook.emotionMapping.includes(gravitySixS)
      ).sort((a, b) => b.viralPotential - a.viralPotential);
    } else if (normalizedPlatform) {
      return contentFrameworks.hooks.filter(hook =>
        hook.bestForPlatforms.some(p => p.toLowerCase() === normalizedPlatform.toLowerCase())
      ).sort((a, b) => b.viralPotential - a.viralPotential);
    } else if (gravitySixS) {
      return contentFrameworks.getFrameworksByEmotion(gravitySixS);
    }
    return contentFrameworks.getTopFrameworks(10);
  };

  const frameworks = getRelevantFrameworks();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-g-accent" />
          <CardTitle>Scroll-Stopping Frameworks</CardTitle>
        </div>
        <CardDescription>
          Proven content patterns to maximize engagement and virality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {frameworks.map((framework) => (
            <AccordionItem key={framework.id} value={framework.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3 text-left">
                    <span className="font-semibold text-g-heading-2">{framework.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {framework.viralPotential}/10 Viral Potential
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Description */}
                  <p className="text-sm text-g-text font-sans">
                    {framework.description}
                  </p>

                  {/* Example Hooks */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-g-heading-2 font-sans">Example Hooks:</h4>
                    <div className="space-y-2">
                      {framework.exampleHooks.map((hook, index) => (
                        <div
                          key={index}
                          className="p-3 glass-panel rounded-lg text-sm italic"
                        >
                          <span className="text-g-text font-sans">"{hook}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emotional Mapping */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-g-heading-2 font-sans">Emotional Mapping:</h4>
                    <div className="flex flex-wrap gap-2">
                      {framework.emotionMapping.map((emotion) => (
                        <Badge 
                          key={emotion} 
                          variant={emotion === gravitySixS ? "default" : "outline"}
                          className="text-xs"
                        >
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Best Platforms */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-g-heading-2 font-sans">Best For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {framework.bestForPlatforms.map((plat) => (
                        <Badge 
                          key={plat} 
                          variant={plat === platform ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {plat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {onSelectFramework && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectFramework(framework)}
                      className="w-full"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Use This Framework
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {frameworks.length === 0 && (
          <div className="text-center py-8 text-g-muted">
            <p className="font-sans">No frameworks match your current filters.</p>
            <p className="text-sm mt-2 font-sans">Try selecting a different platform or emotion.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
