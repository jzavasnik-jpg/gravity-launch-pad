import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Loader2,
  Sparkles,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

export interface PlatformContent {
  platform: string;
  platformName: string;
  icon: string;
  content: {
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
    caption: string;
  };
  metadata: {
    characterCount: number;
    hashtagCount: number;
    estimatedLength?: string;
  };
}

interface MultiPlatformContentGeneratorProps {
  gravitySixS?: string;
  selectedPlatforms: string[];
  onContentUpdate?: (content: PlatformContent[]) => void;
}

export function MultiPlatformContentGenerator({
  gravitySixS,
  selectedPlatforms,
  onContentUpdate
}: MultiPlatformContentGeneratorProps) {
  const { appState } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<PlatformContent[]>([]);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("");

  const platformDetails = {
    "tiktok": { name: "TikTok", icon: "📱" },
    "instagram-reels": { name: "Instagram", icon: "📷" },
    "youtube-shorts": { name: "YouTube", icon: "▶️" },
    "linkedin": { name: "LinkedIn", icon: "💼" },
    "twitter-x": { name: "Twitter/X", icon: "🐦" },
    "facebook": { name: "Facebook", icon: "👍" },
  };

  const generateContentForPlatform = (platformId: string): PlatformContent => {
    const platform = platformDetails[platformId as keyof typeof platformDetails];

    // Platform-specific prompt structures and best practices
    const platformPrompts: Record<string, any> = {
      "tiktok": {
        hook: "POV: You just discovered the secret to [solve pain point] in 3 seconds",
        body: "Here's what nobody tells you about achieving your goals... [Emotional trigger] This changed everything for me. Start with [actionable step 1], then [step 2], and finally [step 3]. The results? Mind-blowing.",
        cta: "Save this for later! 👆 Follow for more tips!",
        hashtags: ["#fyp", "#viral", "#trending", "#lifehack", "#motivation"],
        characterLimit: 2200,
        videoLength: "15-60 seconds"
      },
      "instagram-reels": {
        hook: "The moment I realized everything I knew about [topic] was wrong...",
        body: "Let me break this down for you. [Emotional connection] Three things that made all the difference: 1️⃣ [Insight 1] 2️⃣ [Insight 2] 3️⃣ [Insight 3]. Swipe through for the full guide.",
        cta: "💾 Save this! Share with someone who needs to see this 👇",
        hashtags: ["#reels", "#explore", "#trending", "#transformation", "#inspo"],
        characterLimit: 2200,
        videoLength: "15-90 seconds"
      },
      "youtube-shorts": {
        hook: "This ONE thing changed my entire approach to [goal]",
        body: "[Build curiosity] Most people get this wrong. Here's the truth... [Value delivery] The secret is in [unique angle]. Watch until the end to see the full framework.",
        cta: "👍 Like if this helped! Subscribe for more → #Shorts",
        hashtags: ["#Shorts", "#YouTubeShorts"],
        videoLength: "Up to 60 seconds"
      },
      "linkedin": {
        hook: "After 5 years in [industry], here's what I learned the hard way about [professional topic]",
        body: `[Professional insight]\n\nKey takeaways:\n• [Professional point 1]\n• [Data-driven insight 2]\n• [Actionable strategy 3]\n\nThe impact? [Quantifiable result]\n\n[Industry perspective or thought leadership]`,
        cta: "What's been your experience with this? Share in the comments below.",
        hashtags: ["#Leadership", "#Professional Development", "#BusinessStrategy"],
        characterLimit: 3000
      },
      "twitter-x": {
        hook: "Hot take: [Controversial but valuable opinion about industry/niche]",
        body: "Here's why: [Concise reasoning] The data shows [stat]. The real opportunity is [insight]. Thread 🧵",
        cta: "RT if you agree 🔄",
        hashtags: ["#trending", "#insight"],
        characterLimit: 280
      },
      "facebook": {
        hook: "Can we talk about something that's been on my mind? [Relatable situation]",
        body: `[Emotional story opening]\n\nI've learned that [valuable insight]. Here's what worked for me:\n\n✨ [Benefit 1]\n✨ [Benefit 2]\n✨ [Benefit 3]\n\n[Community building statement] Let's grow together!`,
        cta: "👇 Drop a ❤️ if this resonates with you! Share with your friends who need to hear this.",
        hashtags: ["#Community", "#Growth", "#Inspiration"],
        videoLength: "15-90 seconds optimal"
      }
    };

    const promptData = platformPrompts[platformId];
    const fullCaption = `${promptData.hook}\n\n${promptData.body}\n\n${promptData.cta}`;

    return {
      platform: platformId,
      platformName: platform.name,
      icon: platform.icon,
      content: {
        hook: promptData.hook,
        body: promptData.body,
        cta: promptData.cta,
        hashtags: promptData.hashtags,
        caption: fullCaption,
      },
      metadata: {
        characterCount: fullCaption.length,
        hashtagCount: promptData.hashtags.length,
        estimatedLength: promptData.videoLength,
      }
    };
  };

  const handleGenerateContent = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please link at least one social platform first");
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation (in production, this would call the actual API)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const content = selectedPlatforms.map(platformId =>
      generateContentForPlatform(platformId)
    );

    setGeneratedContent(content);
    if (onContentUpdate) {
      onContentUpdate(content);
    }
    setActiveTab(content[0]?.platform || "");
    setIsGenerating(false);

    toast.success(`Generated content for ${content.length} platform(s)`);
  };

  const handleContentChange = (platformId: string, field: keyof PlatformContent['content'], value: string) => {
    const updatedContent = generatedContent.map(item => {
      if (item.platform === platformId) {
        const newContent = { ...item.content, [field]: value };
        // Update full caption if hook, body, or cta changes
        if (field === 'hook' || field === 'body' || field === 'cta') {
          newContent.caption = `${newContent.hook}\n\n${newContent.body}\n\n${newContent.cta}`;
        }
        return { ...item, content: newContent };
      }
      return item;
    });

    setGeneratedContent(updatedContent);
    if (onContentUpdate) {
      onContentUpdate(updatedContent);
    }
  };

  const handleCopyContent = (platformId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedStates({ ...copiedStates, [platformId]: true });
    toast.success("Copied to clipboard!");

    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [platformId]: false });
    }, 2000);
  };

  const handleDownload = (platform: PlatformContent) => {
    const content = `${platform.platformName} Content\n\n` +
      `Hook:\n${platform.content.hook}\n\n` +
      `Body:\n${platform.content.body}\n\n` +
      `CTA:\n${platform.content.cta}\n\n` +
      `Hashtags:\n${platform.content.hashtags.join(" ")}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform.platformName.toLowerCase()}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${platform.platformName} content`);
  };

  const handleDownloadAll = () => {
    generatedContent.forEach(platform => {
      setTimeout(() => handleDownload(platform), 100);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-g-accent" />
            Multi-Platform Content Generator
          </CardTitle>
          <CardDescription>
            Generate optimized content for all your linked social platforms in one click
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedPlatforms.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-g-muted font-sans mb-2">
                      Ready to generate for {selectedPlatforms.length} platform(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlatforms.map(platformId => {
                        const platform = platformDetails[platformId as keyof typeof platformDetails];
                        return (
                          <Badge key={platformId} variant="glass">
                            {platform?.icon} {platform?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="w-full"
                  variant="gradient"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content for All Platforms
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-g-muted font-sans">
                  Link your social accounts to start generating content
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedContent.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Content</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAll}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${generatedContent.length}, 1fr)` }}>
                {generatedContent.map(platform => (
                  <TabsTrigger key={platform.platform} value={platform.platform}>
                    <span className="mr-1">{platform.icon}</span>
                    {platform.platformName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {generatedContent.map(platform => (
                <TabsContent key={platform.platform} value={platform.platform} className="space-y-4">
                  <div className="space-y-4">
                    {/* Hook */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Hook</label>
                      <Textarea
                        value={platform.content.hook}
                        onChange={(e) => handleContentChange(platform.platform, 'hook', e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Body</label>
                      <Textarea
                        value={platform.content.body}
                        onChange={(e) => handleContentChange(platform.platform, 'body', e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>

                    {/* CTA */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Call-to-Action</label>
                      <Textarea
                        value={platform.content.cta}
                        onChange={(e) => handleContentChange(platform.platform, 'cta', e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Hashtags */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-g-heading-2 font-sans">Hashtags</label>
                      <div className="flex flex-wrap gap-2 p-3 glass-panel rounded-lg">
                        {platform.content.hashtags.map((tag, idx) => (
                          <Badge key={idx} variant="glass">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Full Caption */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-g-heading-2 font-sans">Full Caption</label>
                      <Textarea
                        value={platform.content.caption}
                        readOnly
                        className="min-h-[200px]"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 p-4 glass-panel rounded-lg">
                      <div>
                        <p className="text-sm text-g-muted font-sans">Character Count</p>
                        <p className="text-lg font-semibold text-g-text font-sans">{platform.metadata.characterCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-g-muted font-sans">Hashtags</p>
                        <p className="text-lg font-semibold text-g-text font-sans">{platform.metadata.hashtagCount}</p>
                      </div>
                      {platform.metadata.estimatedLength && (
                        <div className="col-span-2">
                          <p className="text-sm text-g-muted font-sans">Estimated Video Length</p>
                          <p className="text-lg font-semibold text-g-text font-sans">{platform.metadata.estimatedLength}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCopyContent(platform.platform, platform.content.caption)}
                        className="flex-1"
                      >
                        {copiedStates[platform.platform] ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Caption
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(platform)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
