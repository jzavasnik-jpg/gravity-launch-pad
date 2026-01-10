import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlatformOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  bestPractices: string[];
  requirements: {
    videoLength?: string;
    aspectRatio?: string;
    hashtagLimit?: number;
    characterLimit?: number;
  };
}

const platforms: PlatformOption[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: "📱",
    description: "Short-form video platform optimized for discovery and virality",
    bestPractices: [
      "Hook viewers in first 3 seconds",
      "Use trending sounds and effects",
      "Post 1-3 times per day for best results",
      "Engage with comments immediately",
      "Use 3-5 relevant hashtags"
    ],
    requirements: {
      videoLength: "15-60 seconds (up to 10 min)",
      aspectRatio: "9:16 (vertical)",
      hashtagLimit: 5
    }
  },
  {
    id: "instagram-reels",
    name: "Instagram Reels",
    icon: "📷",
    description: "Instagram's short-form video feature, great for existing audiences",
    bestPractices: [
      "Use Instagram's native tools and effects",
      "Share to both Reels and Stories",
      "Include strong CTA in caption",
      "Cross-promote to feed",
      "Leverage existing follower base"
    ],
    requirements: {
      videoLength: "15-90 seconds",
      aspectRatio: "9:16 (vertical)",
      hashtagLimit: 30,
      characterLimit: 2200
    }
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    icon: "▶️",
    description: "YouTube's short-form content, benefits from long-form audience",
    bestPractices: [
      "Include #Shorts in title or description",
      "Link to long-form content",
      "Use strong thumbnail frames",
      "Optimize for suggested videos",
      "Build series for consistency"
    ],
    requirements: {
      videoLength: "Up to 60 seconds",
      aspectRatio: "9:16 (vertical)"
    }
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Professional network, ideal for B2B and thought leadership",
    bestPractices: [
      "Lead with professional insights",
      "Use data and case studies",
      "Engage in comments professionally",
      "Post during business hours",
      "Share industry expertise"
    ],
    requirements: {
      characterLimit: 3000,
      hashtagLimit: 3
    }
  },
  {
    id: "twitter-x",
    name: "Twitter/X",
    icon: "🐦",
    description: "Real-time platform for quick thoughts and engagement",
    bestPractices: [
      "Keep tweets concise and punchy",
      "Use threads for longer content",
      "Engage with replies quickly",
      "Tweet multiple times per day",
      "Use relevant trending topics"
    ],
    requirements: {
      characterLimit: 280,
      hashtagLimit: 2
    }
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👍",
    description: "Broad reach platform ideal for community building and diverse content formats",
    bestPractices: [
      "Use native video for higher reach",
      "Engage with comments to boost algorithm",
      "Post when your audience is most active",
      "Create shareable, emotional content",
      "Mix video, images, and text posts"
    ],
    requirements: {
      videoLength: "1-240 seconds (optimal: 15-90s)",
      aspectRatio: "16:9 or 1:1 (square)",
      characterLimit: 63206,
      hashtagLimit: 10
    }
  }
];

interface PlatformSelectorProps {
  selectedPlatform: string;
  onPlatformChange: (platformId: string) => void;
}

export function PlatformSelector({ selectedPlatform, onPlatformChange }: PlatformSelectorProps) {
  const selected = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={`cursor-pointer transition-all ${
              selectedPlatform === platform.id
                ? "ring-2 ring-g-accent border-g-accent shadow-lg shadow-g-accent/20"
                : "hover:border-g-accent/50 hover:shadow-md"
            }`}
            onClick={() => onPlatformChange(platform.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <CardTitle className="text-base font-sans font-semibold">{platform.name}</CardTitle>
                </div>
                {selectedPlatform === platform.id && (
                  <Badge variant="default">Selected</Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {platform.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Selected Platform Details */}
      {selected && (
        <Card className="bg-g-panel/30 border-g-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{selected.icon}</span>
              {selected.name} Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Requirements */}
            <div>
              <h4 className="font-semibold mb-2 text-sm text-g-heading-2">Requirements</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selected.requirements.videoLength && (
                  <div>
                    <span className="text-g-muted">Video Length:</span>{" "}
                    <span className="font-medium text-g-text">{selected.requirements.videoLength}</span>
                  </div>
                )}
                {selected.requirements.aspectRatio && (
                  <div>
                    <span className="text-g-muted">Aspect Ratio:</span>{" "}
                    <span className="font-medium text-g-text">{selected.requirements.aspectRatio}</span>
                  </div>
                )}
                {selected.requirements.characterLimit && (
                  <div>
                    <span className="text-g-muted">Character Limit:</span>{" "}
                    <span className="font-medium text-g-text">{selected.requirements.characterLimit}</span>
                  </div>
                )}
                {selected.requirements.hashtagLimit && (
                  <div>
                    <span className="text-g-muted">Hashtag Limit:</span>{" "}
                    <span className="font-medium text-g-text">{selected.requirements.hashtagLimit}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="font-semibold mb-2 text-sm text-g-heading-2">Best Practices</h4>
              <ul className="space-y-1 text-sm">
                {selected.bestPractices.map((practice, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-g-accent mt-0.5">•</span>
                    <span className="text-g-text">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
