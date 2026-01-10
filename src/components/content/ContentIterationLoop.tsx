import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Eye, 
  Heart, 
  Share2,
  MessageCircle,
  BarChart3
} from "lucide-react";
import { ViralConcept } from "@/lib/content-api";

export interface ContentPerformanceMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  conversionRate?: number;
  publishedDate: string;
  platform: string;
  status: "published" | "draft" | "scheduled";
}

export interface TrackedContent extends ViralConcept {
  performanceMetrics?: ContentPerformanceMetrics;
  iterationHistory?: {
    version: number;
    date: string;
    changes: string;
  }[];
}

interface ContentIterationLoopProps {
  trackedContent?: TrackedContent[];
  onReIterate?: (concept: TrackedContent) => void;
  onViewPerformance?: (concept: TrackedContent) => void;
}

export function ContentIterationLoop({ 
  trackedContent = [],
  onReIterate,
  onViewPerformance
}: ContentIterationLoopProps) {
  const [sortBy, setSortBy] = useState<"recent" | "performance">("recent");

  // Generate placeholder content if none provided
  const displayContent = trackedContent.length > 0 
    ? trackedContent 
    : getPlaceholderContent();

  const sortedContent = [...displayContent].sort((a, b) => {
    if (sortBy === "performance") {
      const aRate = a.performanceMetrics?.engagementRate || 0;
      const bRate = b.performanceMetrics?.engagementRate || 0;
      return bRate - aRate;
    }
    // Sort by date
    const aDate = new Date(a.performanceMetrics?.publishedDate || 0).getTime();
    const bDate = new Date(b.performanceMetrics?.publishedDate || 0).getTime();
    return bDate - aDate;
  });

  const getPerformanceStatus = (engagementRate: number) => {
    if (engagementRate >= 8) return { label: "Excellent", color: "text-green-400", variant: "default" as const };
    if (engagementRate >= 5) return { label: "Good", color: "text-blue-400", variant: "secondary" as const };
    if (engagementRate >= 3) return { label: "Average", color: "text-yellow-400", variant: "outline" as const };
    return { label: "Needs Improvement", color: "text-orange-400", variant: "destructive" as const };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-6 h-6 text-g-accent" />
            <h3 className="text-2xl font-bold font-display text-g-heading">Content Iteration Loop</h3>
          </div>
          <p className="text-g-muted font-sans">
            Track performance, analyze results, and re-iterate on concepts for continuous improvement
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Recent
          </Button>
          <Button
            variant={sortBy === "performance" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("performance")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </Button>
        </div>
      </div>

      {/* Feedback Loop Explanation */}
      <Card className="border-g-accent/30 bg-gradient-to-br from-g-accent/10 to-purple-500/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-g-accent/20 rounded-full">
              <RefreshCw className="w-6 h-6 text-g-accent" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2 text-g-heading-2 font-sans">How the Iteration Loop Works</h4>
              <div className="text-sm text-g-text font-sans space-y-1">
                <p>1. <strong className="text-g-heading">Generate & Publish:</strong> Create viral concepts and publish to your platforms</p>
                <p>2. <strong className="text-g-heading">Track Results:</strong> Monitor views, engagement, and conversions in real-time</p>
                <p>3. <strong className="text-g-heading">Analyze Performance:</strong> Identify patterns in high and low-performing content</p>
                <p>4. <strong className="text-g-heading">Re-Iterate:</strong> Use performance data to generate improved versions of underperforming concepts</p>
                <p>5. <strong className="text-g-heading">Feed Forward:</strong> System learns from your best-performing content to improve future suggestions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Aggregate metrics across all tracked content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-panel rounded-lg">
              <Eye className="w-5 h-5 mx-auto mb-2 text-g-muted" />
              <div className="text-2xl font-bold font-display text-g-heading">
                {formatNumber(displayContent.reduce((sum, c) => sum + (c.performanceMetrics?.views || 0), 0))}
              </div>
              <div className="text-xs text-g-muted font-sans">Total Views</div>
            </div>
            <div className="text-center p-4 glass-panel rounded-lg">
              <Heart className="w-5 h-5 mx-auto mb-2 text-g-muted" />
              <div className="text-2xl font-bold font-display text-g-heading">
                {formatNumber(displayContent.reduce((sum, c) => sum + (c.performanceMetrics?.likes || 0), 0))}
              </div>
              <div className="text-xs text-g-muted font-sans">Total Likes</div>
            </div>
            <div className="text-center p-4 glass-panel rounded-lg">
              <Share2 className="w-5 h-5 mx-auto mb-2 text-g-muted" />
              <div className="text-2xl font-bold font-display text-g-heading">
                {formatNumber(displayContent.reduce((sum, c) => sum + (c.performanceMetrics?.shares || 0), 0))}
              </div>
              <div className="text-xs text-g-muted font-sans">Total Shares</div>
            </div>
            <div className="text-center p-4 glass-panel rounded-lg">
              <MessageCircle className="w-5 h-5 mx-auto mb-2 text-g-muted" />
              <div className="text-2xl font-bold font-display text-g-heading">
                {formatNumber(displayContent.reduce((sum, c) => sum + (c.performanceMetrics?.comments || 0), 0))}
              </div>
              <div className="text-xs text-g-muted font-sans">Total Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-g-heading-2 font-sans">Tracked Content ({displayContent.length})</h4>
        
        {sortedContent.map((content) => {
          const metrics = content.performanceMetrics;
          if (!metrics) return null;

          const performanceStatus = getPerformanceStatus(metrics.engagementRate);
          const isUnderperforming = metrics.engagementRate < 3;

          return (
            <Card key={content.id} className={isUnderperforming ? "border-orange-400/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{content.title}</CardTitle>
                      <Badge variant={performanceStatus.variant}>
                        {performanceStatus.label}
                      </Badge>
                      <Badge variant="outline">{metrics.platform}</Badge>
                      {isUnderperforming && (
                        <Badge variant="outline" className="border-orange-400 text-orange-400">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Re-iterate Suggested
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{content.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Engagement Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-g-muted mb-1">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-g-text font-sans">{formatNumber(metrics.views)}</div>
                    <div className="text-xs text-g-muted font-sans">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-g-muted mb-1">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-g-text font-sans">{formatNumber(metrics.likes)}</div>
                    <div className="text-xs text-g-muted font-sans">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-g-muted mb-1">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-g-text font-sans">{formatNumber(metrics.shares)}</div>
                    <div className="text-xs text-g-muted font-sans">Shares</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-g-muted mb-1">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-g-text font-sans">{formatNumber(metrics.comments)}</div>
                    <div className="text-xs text-g-muted font-sans">Comments</div>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-g-muted font-sans">Engagement Rate</span>
                    <span className={`font-semibold font-sans ${performanceStatus.color}`}>
                      {metrics.engagementRate.toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={Math.min(metrics.engagementRate * 10, 100)} className="h-2" />
                </div>

                {/* Published Date and Iteration Info */}
                <div className="flex items-center justify-between text-sm text-g-muted font-sans">
                  <span>
                    Published: {new Date(metrics.publishedDate).toLocaleDateString()}
                  </span>
                  {content.iterationHistory && content.iterationHistory.length > 0 && (
                    <span>
                      Version {content.iterationHistory[content.iterationHistory.length - 1].version}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {onViewPerformance && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewPerformance(content)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  )}
                  {onReIterate && (
                    <Button 
                      variant={isUnderperforming ? "default" : "outline"}
                      size="sm"
                      onClick={() => onReIterate(content)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-Iterate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder Notice */}
      {trackedContent.length === 0 && (
        <Card className="border-dashed border-g-border">
          <CardContent className="pt-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-g-muted" />
            <h4 className="font-semibold mb-2 text-g-heading-2 font-sans">Performance Tracking Coming Soon</h4>
            <p className="text-sm text-g-muted font-sans mb-4">
              Connect your social media accounts to automatically track content performance and enable the iteration loop.
              The data shown above is placeholder data for demonstration purposes.
            </p>
            <Button variant="outline" disabled>
              Connect Platforms (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Placeholder content for demonstration
function getPlaceholderContent(): TrackedContent[] {
  return [
    {
      id: "tracked-1",
      title: "The Contradiction Hook",
      description: "Why entrepreneurs are doing marketing completely wrong",
      hook: "Everyone tells you to market this way. I did the opposite and 10xed my results.",
      platform: "tiktok",
      targetAudience: "Entrepreneurs",
      framework: "Contradiction",
      psychologicalTriggers: ["curiosity-gap", "pattern-recognition"],
      scores: {
        hookStrength: 92,
        patternInterrupt: 88,
        emotionalCuriosity: 90,
        algorithmFit: 85,
        viralCeiling: 89,
        overall: 89
      },
      reasoning: "Strong contradiction creates immediate curiosity",
      estimatedReach: "50K-200K views",
      performanceMetrics: {
        views: 125000,
        likes: 8900,
        shares: 450,
        comments: 320,
        engagementRate: 7.73,
        publishedDate: "2024-01-10",
        platform: "TikTok",
        status: "published"
      }
    },
    {
      id: "tracked-2",
      title: "The Real Numbers Story",
      description: "I tested 47 different approaches, only 3 worked",
      hook: "47 experiments. $10K spent. These 3 techniques changed everything.",
      platform: "instagram-reels",
      targetAudience: "Content Creators",
      framework: "Real Numbers",
      psychologicalTriggers: ["authority", "social-proof"],
      scores: {
        hookStrength: 88,
        patternInterrupt: 82,
        emotionalCuriosity: 85,
        algorithmFit: 90,
        viralCeiling: 86,
        overall: 86
      },
      reasoning: "Specific numbers build credibility",
      estimatedReach: "30K-150K views",
      performanceMetrics: {
        views: 45000,
        likes: 2100,
        shares: 150,
        comments: 89,
        engagementRate: 5.2,
        publishedDate: "2024-01-08",
        platform: "Instagram Reels",
        status: "published"
      }
    },
    {
      id: "tracked-3",
      title: "The Micro Tutorial",
      description: "3-step framework you can implement in 5 minutes",
      hook: "Copy this exact framework. It takes 5 minutes and changes everything.",
      platform: "youtube-shorts",
      targetAudience: "Marketers",
      framework: "Micro Tutorial",
      psychologicalTriggers: ["reciprocity", "progress-momentum"],
      scores: {
        hookStrength: 84,
        patternInterrupt: 80,
        emotionalCuriosity: 82,
        algorithmFit: 88,
        viralCeiling: 84,
        overall: 84
      },
      reasoning: "Quick-win tutorials drive high engagement",
      estimatedReach: "25K-120K views",
      performanceMetrics: {
        views: 18000,
        likes: 890,
        shares: 45,
        comments: 67,
        engagementRate: 5.57,
        publishedDate: "2024-01-05",
        platform: "YouTube Shorts",
        status: "published"
      }
    },
    {
      id: "tracked-4",
      title: "The Pattern Interrupt",
      description: "Stop everything. This changes how you should think about content",
      hook: "Stop. Delete your content plan. Here's why.",
      platform: "linkedin",
      targetAudience: "Business Owners",
      framework: "Pattern Interrupt",
      psychologicalTriggers: ["pattern-recognition", "fomo"],
      scores: {
        hookStrength: 91,
        patternInterrupt: 95,
        emotionalCuriosity: 86,
        algorithmFit: 82,
        viralCeiling: 88,
        overall: 88
      },
      reasoning: "Direct command breaks scroll pattern effectively",
      estimatedReach: "42K-185K views",
      performanceMetrics: {
        views: 8500,
        likes: 180,
        shares: 35,
        comments: 42,
        engagementRate: 3.02,
        publishedDate: "2024-01-03",
        platform: "LinkedIn",
        status: "published"
      }
    }
  ];
}
