import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Zap,
  MessageSquare,
  Clock,
  TrendingUp,
  Target,
  Volume2,
  Wand2,
  Film,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Scene {
  id: string;
  label: string;
  script: string;
  duration: string;
}

interface ScriptDoctorPanelProps {
  activeScene: Scene | null;
  onApplySuggestion: (suggestion: string) => void;
  onRegenerate: () => void;
  isProcessing?: boolean;
}

interface AIActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}

function AIActionButton({ icon, label, description, onClick, disabled }: AIActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all duration-200",
        "bg-card/50 border-border hover:border-primary/50 hover:bg-primary/5",
        "group flex items-start gap-3",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div>
        <span className="text-sm font-medium text-foreground block">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </button>
  );
}

// Suggestions based on segment type
const segmentSuggestions: Record<string, { icon: React.ReactNode; label: string; description: string; prompt: string }[]> = {
  'HOOK': [
    { icon: <Zap className="w-4 h-4 text-primary" />, label: "Add pattern interrupt", description: "Start with something unexpected", prompt: "pattern_interrupt" },
    { icon: <AlertCircle className="w-4 h-4 text-primary" />, label: "Make it controversial", description: "Add a bold claim", prompt: "controversial" },
    { icon: <MessageSquare className="w-4 h-4 text-primary" />, label: "Start with a question", description: "Engage viewer curiosity", prompt: "question_hook" },
    { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: "Use trending format", description: "POV, storytime, etc.", prompt: "trending" },
  ],
  'PAIN POINT': [
    { icon: <Target className="w-4 h-4 text-primary" />, label: "Make it relatable", description: "Use 'you' language", prompt: "relatable" },
    { icon: <Volume2 className="w-4 h-4 text-primary" />, label: "Add emotional weight", description: "Amplify the struggle", prompt: "emotional" },
    { icon: <Clock className="w-4 h-4 text-primary" />, label: "Add urgency", description: "Time-sensitive framing", prompt: "urgency" },
  ],
  'PAIN': [
    { icon: <Target className="w-4 h-4 text-primary" />, label: "Make it relatable", description: "Use 'you' language", prompt: "relatable" },
    { icon: <Volume2 className="w-4 h-4 text-primary" />, label: "Add emotional weight", description: "Amplify the struggle", prompt: "emotional" },
    { icon: <Clock className="w-4 h-4 text-primary" />, label: "Add urgency", description: "Time-sensitive framing", prompt: "urgency" },
  ],
  'SOLUTION': [
    { icon: <Sparkles className="w-4 h-4 text-primary" />, label: "Add credibility", description: "Include proof or stats", prompt: "credibility" },
    { icon: <MessageSquare className="w-4 h-4 text-primary" />, label: "Simplify explanation", description: "Make it crystal clear", prompt: "simplify" },
    { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: "Show transformation", description: "Before/after framing", prompt: "transformation" },
  ],
  'CTA': [
    { icon: <Zap className="w-4 h-4 text-primary" />, label: "Add urgency", description: "Limited time/spots", prompt: "cta_urgency" },
    { icon: <Target className="w-4 h-4 text-primary" />, label: "Include bonus", description: "Add extra value", prompt: "bonus" },
    { icon: <MessageSquare className="w-4 h-4 text-primary" />, label: "Reduce friction", description: "Make action easy", prompt: "friction" },
  ],
};

// Universal suggestions for any segment
const universalSuggestions = [
  { icon: <Clock className="w-4 h-4 text-primary" />, label: "Shorten script", description: "Under 3 seconds", prompt: "shorten" },
  { icon: <Volume2 className="w-4 h-4 text-primary" />, label: "Match avatar voice", description: "Align with persona", prompt: "voice_match" },
  { icon: <MessageSquare className="w-4 h-4 text-primary" />, label: "Make conversational", description: "Less formal tone", prompt: "conversational" },
];

export function ScriptDoctorPanel({
  activeScene,
  onApplySuggestion,
  onRegenerate,
  isProcessing = false
}: ScriptDoctorPanelProps) {
  const suggestions = activeScene
    ? segmentSuggestions[activeScene.label.toUpperCase()] || universalSuggestions
    : [];

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Panel Header - Following CLAUDE.md pattern */}
      <div className="h-14 border-b border-border flex items-center px-4 bg-card flex-shrink-0">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          Script Doctor
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeScene ? (
          <>
            {/* Current Script Preview */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">
                Current Script
              </label>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-display font-medium bg-primary/20 text-primary mb-2">
                  {activeScene.label}
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {activeScene.script || <span className="text-muted-foreground italic">No script yet...</span>}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <span>{activeScene.script.split(' ').filter(Boolean).length} words</span>
                  <span>{activeScene.duration}</span>
                </div>
              </div>
            </div>

            {/* Segment-Specific Suggestions */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">
                AI Suggestions for {activeScene.label}
              </label>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <AIActionButton
                    key={index}
                    icon={suggestion.icon}
                    label={suggestion.label}
                    description={suggestion.description}
                    onClick={() => onApplySuggestion(suggestion.prompt)}
                    disabled={isProcessing}
                  />
                ))}
              </div>
            </div>

            {/* Universal Actions */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </label>
              <div className="space-y-2">
                {universalSuggestions.map((suggestion, index) => (
                  <AIActionButton
                    key={index}
                    icon={suggestion.icon}
                    label={suggestion.label}
                    description={suggestion.description}
                    onClick={() => onApplySuggestion(suggestion.prompt)}
                    disabled={isProcessing}
                  />
                ))}
              </div>
            </div>

            {/* Regenerate Button - Cyan solid, NO gradient */}
            <Button
              className="w-full bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
              onClick={onRegenerate}
              disabled={isProcessing}
            >
              <Wand2 className={cn("w-4 h-4 mr-2", isProcessing && "animate-spin")} />
              {isProcessing ? "Regenerating..." : "Regenerate Segment"}
            </Button>
          </>
        ) : (
          /* Empty State - Following CLAUDE.md pattern */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              No Segment Selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Click on a script card to select it and see AI-powered suggestions for improvement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScriptDoctorPanel;
