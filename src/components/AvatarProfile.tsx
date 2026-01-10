import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Target,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateAvatar } from "@/lib/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import {
  SIX_S_DEFINITIONS,
  getSixSIconForKey,
  normalizeAvatarMatrixKey,
  SIX_S_TO_DISPLAY_LABEL,
} from "@/lib/six-s-constants";
import type { SixS } from "@/lib/six-s-constants";

interface PainPointsMatrix {
  Significance?: { score: number; challenges: string[] };
  Safe?: { score: number; challenges: string[] };
  Supported?: { score: number; challenges: string[] };
  Successful?: { score: number; challenges: string[] };
  "Surprise-and-delight"?: { score: number; challenges: string[] };
  Sharing?: { score: number; challenges: string[] };
}

interface AvatarProfileProps {
  avatar: {
    id?: string;
    name: string;
    age?: number;
    gender?: string;
    occupation?: string;
    photo_url?: string;
    story?: string;
    pain_points?: string[];
    pain_points_matrix?: PainPointsMatrix;
    dreams?: string[];
    daily_challenges?: string[];
    buying_triggers?: string[];
  };
  onRegenerateComplete?: (newAvatar: any) => void;
  showRegenerateButton?: boolean;
}

export const AvatarProfile: React.FC<AvatarProfileProps> = ({
  avatar,
  onRegenerateComplete,
  showRegenerateButton = true,
}) => {
  const { appState, setAvatarData } = useApp();
  const [expandedSections, setExpandedSections] = useState({
    pain_points: true,
    dreams: true,
    daily_challenges: true,
    buying_triggers: true,
  });
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!appState.sessionId) {
      toast.error("Session not found. Please complete the ICP interview first.");
      return;
    }

    setRegenerating(true);
    try {
      const newAvatar = await generateAvatar(
        appState.gravityICP.answers,
        appState.selectedCoreDesire,
        appState.selectedSixS,
        avatar.gender as "male" | "female",
        undefined,
        appState.sessionId
      );

      // Update context
      setAvatarData(newAvatar);

      // Call callback if provided
      if (onRegenerateComplete) {
        onRegenerateComplete(newAvatar);
      }

      toast.success(`${avatar.name}'s profile has been regenerated!`);
    } catch (error) {
      toast.error("Failed to regenerate avatar. Please try again.");
      console.error(error);
    } finally {
      setRegenerating(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Section component with proper design tokens
  const Section = ({
    title,
    icon,
    items,
    sectionKey,
  }: {
    title: string;
    icon: React.ReactNode;
    items?: string[];
    sectionKey: keyof typeof expandedSections;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          {expandedSections[sectionKey] ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "grid transition-all duration-300",
            expandedSections[sectionKey]
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <ul className="space-y-2 overflow-hidden pl-11">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="text-muted-foreground text-sm flex items-start leading-relaxed"
              >
                <span className="text-primary mr-2 mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Six S Pain Points Matrix with icons and proper styling
  const PainPointsMatrixSection = ({ matrix }: { matrix?: PainPointsMatrix }) => {
    if (!matrix || Object.keys(matrix).length === 0) return null;

    const sixSOrder = [
      "Significance",
      "Safe",
      "Supported",
      "Successful",
      "Surprise-and-delight",
      "Sharing",
    ];

    return (
      <div className="space-y-4">
        <button
          onClick={() => toggleSection("pain_points")}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              Pain Points (Six S Framework)
            </h3>
          </div>
          {expandedSections.pain_points ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "grid transition-all duration-300",
            expandedSections.pain_points
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden space-y-3 pl-11">
            {sixSOrder.map((dimension) => {
              const data = matrix[dimension as keyof PainPointsMatrix];
              if (!data) return null;

              const sixSKey = normalizeAvatarMatrixKey(dimension);
              const icon = getSixSIconForKey(dimension);
              const definition = sixSKey ? SIX_S_DEFINITIONS[sixSKey] : null;

              // Calculate color based on score
              const getScoreColor = (score: number) => {
                if (score >= 8) return "text-red-400";
                if (score >= 6) return "text-yellow-400";
                if (score >= 4) return "text-green-400";
                return "text-muted-foreground";
              };

              return (
                <Card
                  key={dimension}
                  className="p-4 bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <h4 className="font-display font-medium text-foreground text-sm">
                          {sixSKey ? SIX_S_TO_DISPLAY_LABEL[sixSKey] : dimension}
                        </h4>
                        {definition && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {definition.question.slice(0, 50)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        getScoreColor(data.score)
                      )}
                    >
                      {data.score}/10
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {data.challenges.map((challenge, idx) => (
                      <li
                        key={idx}
                        className="text-muted-foreground flex items-start text-sm"
                      >
                        <span className="text-primary mr-2 mt-0.5">•</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Generate story for avatar with multiple fallbacks
  const generateStory = () => {
    if (avatar.story && avatar.story.trim()) return avatar.story;

    // LLM generates full sentences, use them directly
    if (avatar.daily_challenges && avatar.daily_challenges.length > 0) {
      const challenge = avatar.daily_challenges[0];
      const dream = avatar.dreams?.[0];
      if (dream) return `${challenge} ${dream}`;
      return challenge;
    }

    // Fallback story
    return `${avatar.name} is ${
      avatar.age ? `a ${avatar.age}-year-old` : "an"
    } ${avatar.occupation || "professional"}. ${
      avatar.dreams && avatar.dreams.length > 0
        ? `They aspire to ${avatar.dreams[0]}.`
        : "They are focused on personal and professional growth."
    }`;
  };

  // Get top insight quote from pain points
  const getTopInsight = () => {
    if (avatar.pain_points_matrix) {
      const dimensions = [
        "Significance",
        "Safe",
        "Supported",
        "Successful",
        "Surprise-and-delight",
        "Sharing",
      ] as const;
      for (const dim of dimensions) {
        const data = avatar.pain_points_matrix[dim];
        if (data && data.challenges && data.challenges.length > 0) {
          return data.challenges[0];
        }
      }
    }
    if (avatar.pain_points && avatar.pain_points.length > 0) {
      return avatar.pain_points[0];
    }
    return null;
  };

  const topInsight = getTopInsight();

  return (
    <Card className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)] space-y-6">
      {/* Header with Avatar - Compact Layout */}
      <div className="flex gap-4">
        <img
          src={avatar.photo_url}
          alt={avatar.name}
          className="w-20 h-20 rounded-xl object-cover ring-2 ring-primary/20 flex-shrink-0"
        />
        <div className="flex-1 text-left">
          <h2 className="font-display font-semibold text-2xl text-foreground mb-1">
            {avatar.name}
          </h2>
          {avatar.gender && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase text-muted-foreground border-border/50 mb-2"
            >
              {avatar.gender}
            </Badge>
          )}
          {(avatar.age || avatar.occupation) && (
            <p className="text-sm text-muted-foreground">
              {avatar.age && `${avatar.age}`}
              {avatar.age && avatar.occupation && " • "}
              {avatar.occupation}
            </p>
          )}
        </div>
      </div>

      {/* Story Section */}
      <div className="space-y-2">
        <p className="text-muted-foreground leading-relaxed">{generateStory()}</p>
      </div>

      {/* Top Insight Quote */}
      {topInsight && (
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
          <p className="text-sm text-muted-foreground italic">"{topInsight}"</p>
        </div>
      )}

      {/* Regenerate Button with Confirmation Dialog */}
      {showRegenerateButton && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={regenerating}
                className="border-border hover:border-primary/50 hover:bg-primary/5"
              >
                {regenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate Avatar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground font-display">
                  Regenerate {avatar.name}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will create a new avatar profile based on your ICP answers.
                  The current avatar data including pain points, dreams, and
                  challenges will be replaced with newly generated content.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">
                  Keep Current
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerate}
                  className="bg-gradient-to-r from-primary to-indigo-500 text-white"
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="h-px bg-border/50" />

      {/* Collapsible Sections */}
      <div className="space-y-6">
        {avatar.pain_points_matrix ? (
          <PainPointsMatrixSection matrix={avatar.pain_points_matrix} />
        ) : (
          <Section
            title="Pain Points"
            icon={<Target className="w-4 h-4 text-primary" />}
            items={avatar.pain_points}
            sectionKey="pain_points"
          />
        )}
        <Section
          title="Dreams & Aspirations"
          icon={<Sparkles className="w-4 h-4 text-primary" />}
          items={avatar.dreams}
          sectionKey="dreams"
        />
        <Section
          title="Daily Challenges"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          items={avatar.daily_challenges}
          sectionKey="daily_challenges"
        />
        <Section
          title="Buying Triggers"
          icon={<ShoppingCart className="w-4 h-4 text-primary" />}
          items={avatar.buying_triggers}
          sectionKey="buying_triggers"
        />
      </div>
    </Card>
  );
};
