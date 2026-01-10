import React, { useState } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { PlatformSelector } from "@/components/content/PlatformSelector";
import { ViralConceptGenerator } from "@/components/content/ViralConceptGenerator";
import { ContentScoreDisplay, TopRecommendations } from "@/components/content/ContentScoreDisplay";
import { FrameworkSuggestions } from "@/components/content/FrameworkSuggestions";
import { PsychologicalTriggers } from "@/components/content/PsychologicalTriggers";
import { ContentIterationLoop } from "@/components/content/ContentIterationLoop";
import { MultiPlatformContentGenerator } from "@/components/content/MultiPlatformContentGenerator";
import { PaywallModal } from "@/components/PaywallModal";
import { SocialLinkingModal } from "@/components/SocialLinkingModal";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ViralConcept } from "@/lib/content-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Sparkles, BookOpen, Brain, RefreshCw, Lightbulb, Link2, Zap, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function BetaContentGenerator() {
  const navigate = useNavigate();
  const { appState, hasProAccess: legacyHasProAccess, setPlanType, setLinkedPlatforms } = useApp();
  const { user, isEmailVerified, hasProAccess } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");
  const [generatedConcepts, setGeneratedConcepts] = useState<ViralConcept[]>([]);
  const [activeTab, setActiveTab] = useState("setup");
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSocialLinking, setShowSocialLinking] = useState(false);

  // Use auth context for PRO access (single source of truth)
  const isProUser = hasProAccess;

  const handleConceptsGenerated = (concepts: ViralConcept[]) => {
    setGeneratedConcepts(concepts);
    setActiveTab("results");
  };

  // Get Gravity Six S from app state if available
  const gravitySixS = appState.selectedSixS?.name;

  // Handle tab change with feature gating
  const handleTabChange = (value: string) => {
    // Allow all tabs to be clicked - PRO features will show upgrade UI within the tab
    setActiveTab(value);
  };

  // Handle upgrade to PRO
  const handleUpgrade = () => {
    // In production, this would integrate with payment processor
    setPlanType('pro');
    setShowPaywall(false);
    toast.success("Welcome to PRO! Let's link your social accounts.");
    setShowSocialLinking(true);
  };

  // Handle social account linking
  const handleSaveSocialAccounts = (platforms: string[]) => {
    setLinkedPlatforms(platforms);
    toast.success("Social accounts linked successfully!");
  };

  return (
    <>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
      />
      <SocialLinkingModal
        isOpen={showSocialLinking}
        onClose={() => setShowSocialLinking(false)}
        linkedPlatforms={appState.linkedPlatforms}
        onSave={handleSaveSocialAccounts}
      />
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Email Verification Alert */}
          {!isEmailVerified && user?.email && (
            <EmailVerificationAlert email={user.email} />
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold font-display text-g-heading">
                  Beta Content Generator
                </h1>
                <Badge variant="gradient">
                  BETA
                </Badge>
                {isProUser && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-g-text-inverse">
                    <Zap className="w-3 h-3 mr-1" />
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-g-muted font-sans">
                AI-powered viral content ideation with multi-agent analysis
              </p>
            </div>
            <div className="flex gap-2">
              {isProUser && (
                <Button variant="glass" onClick={() => setShowSocialLinking(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Manage Social Accounts
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* About This Tool - Always Visible at Top */}
          <div className="sticky top-4 z-20 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 glass-panel rounded-lg border-2 border-purple-500/20 shadow-lg">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-g-heading-2 font-sans">About This Tool</h3>
                <p className="text-sm text-g-text font-sans mb-3">
                  The Beta Content Generator uses a multi-agent AI workflow inspired by professional content strategy:
                </p>
                <ul className="text-sm text-g-text font-sans space-y-1 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong className="text-g-heading">Research Agent:</strong> Analyzes platform trends, audience behavior, and viral patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong className="text-g-heading">Strategy Agent:</strong> Creates concepts optimized for your specific audience and platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong className="text-g-heading">Evaluation Agent:</strong> Scores each concept across Hook Strength, Pattern Interrupt, Emotional Curiosity, Algorithm Fit, and Viral Ceiling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong className="text-g-heading">Production Agent:</strong> Prepares top concepts for content generation and deployment</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="setup" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Setup & Generate
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  disabled={generatedConcepts.length === 0}
                  className="flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Results & Scores
                  {generatedConcepts.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {generatedConcepts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="frameworks" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Frameworks
                </TabsTrigger>
                <TabsTrigger value="triggers" className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Triggers
                </TabsTrigger>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="iteration" className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Iteration
                      {!isProUser && <Badge variant="outline" className="ml-1 text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">PRO</Badge>}
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!isProUser && (
                    <TooltipContent>
                      <p className="text-xs">Upgrade to PRO to access iteration loop features</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="multi-platform" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Multi-Platform
                      {!isProUser && <Badge variant="outline" className="ml-1 text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">PRO</Badge>}
                    </TabsTrigger>
                  </TooltipTrigger>
                  {!isProUser && (
                    <TooltipContent>
                      <p className="text-xs">Upgrade to PRO for multi-platform content generation</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TabsList>

              {/* Setup & Generate Tab */}
              <TabsContent value="setup" className="space-y-6">
                {/* Platform Selection */}
                <GlassPanel>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-g-heading mb-2">1. Select Your Platform</h2>
                      <p className="text-g-muted font-sans">
                        Choose where you want to publish your content
                      </p>
                    </div>
                    <PlatformSelector
                      selectedPlatform={selectedPlatform}
                      onPlatformChange={setSelectedPlatform}
                    />
                  </div>
                </GlassPanel>

                {/* Concept Generation */}
                <GlassPanel>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-g-heading mb-2">2. Generate Viral Concepts</h2>
                      <p className="text-g-muted font-sans">
                        Our AI agents will create and evaluate 10 viral content ideas
                      </p>
                    </div>
                    <ViralConceptGenerator
                      platform={selectedPlatform}
                      gravitySixS={gravitySixS}
                      onConceptsGenerated={handleConceptsGenerated}
                      initialData={{
                        product: `${appState.gravityICP.answers[9] || ''} - ${appState.gravityICP.answers[8] || ''} ${appState.gravityICP.answers[13] || ''}`.trim(),
                        audience: appState.gravityICP.answers[1] || '',
                        brandVoice: gravitySixS || ''
                      }}
                    />
                  </div>
                </GlassPanel>

                {/* Quick Access to Frameworks */}
                <div className="p-4 glass-panel rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-g-heading-2 font-sans">Need Inspiration?</h3>
                      <p className="text-sm text-g-muted font-sans">
                        Browse our scroll-stopping frameworks library
                      </p>
                    </div>
                    <Button variant="glass" onClick={() => setActiveTab("frameworks")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Frameworks
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Results & Scores Tab */}
              <TabsContent value="results" className="space-y-6">
                {generatedConcepts.length > 0 ? (
                  <>
                    {/* Top 3 Recommendations */}
                    <GlassPanel>
                      <TopRecommendations concepts={generatedConcepts} />
                    </GlassPanel>

                    {/* All Concepts */}
                    <GlassPanel>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">All Generated Concepts</h3>
                          <p className="text-muted-foreground">
                            Review all {generatedConcepts.length} concepts with detailed scoring
                          </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {generatedConcepts.map((concept, index) => (
                            <ContentScoreDisplay
                              key={concept.id}
                              concept={concept}
                              rank={index + 1}
                              isTopRecommendation={index < 3}
                            />
                          ))}
                        </div>
                      </div>
                    </GlassPanel>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" onClick={() => setActiveTab("setup")}>
                        Generate New Concepts
                      </Button>
                      <Button onClick={() => setActiveTab("frameworks")}>
                        Explore Frameworks
                      </Button>
                    </div>
                  </>
                ) : (
                  <GlassPanel>
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                      <h3 className="text-xl font-semibold mb-2 text-g-heading-2 font-sans">No Concepts Yet</h3>
                      <p className="text-g-muted font-sans mb-4">
                        Generate your first batch of viral content concepts
                      </p>
                      <Button onClick={() => setActiveTab("setup")} variant="gradient">
                        Start Generating
                      </Button>
                    </div>
                  </GlassPanel>
                )}
              </TabsContent>

              {/* Frameworks Library Tab */}
              <TabsContent value="frameworks" className="space-y-6">
                <GlassPanel>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-g-heading mb-2">Scroll-Stopping Frameworks</h2>
                      <p className="text-g-muted font-sans">
                        Proven content patterns with example hooks, emotional mapping, and platform optimization
                      </p>
                    </div>
                    <FrameworkSuggestions
                      platform={selectedPlatform}
                      gravitySixS={gravitySixS}
                    />
                  </div>
                </GlassPanel>
              </TabsContent>

              {/* Psychological Triggers Tab */}
              <TabsContent value="triggers" className="space-y-6">
                <GlassPanel>
                  <PsychologicalTriggers
                    selectedTriggerIds={generatedConcepts.flatMap(c => c.psychologicalTriggers)}
                    gravitySixS={gravitySixS}
                    showRecommendations={true}
                    platform={selectedPlatform}
                    contentGoal="engagement"
                  />
                </GlassPanel>
              </TabsContent>

              {/* Iteration Loop Tab */}
              <TabsContent value="iteration" className="space-y-6">
                <GlassPanel>
                  {isProUser ? (
                    <ContentIterationLoop
                      onReIterate={(concept) => {
                        // Navigate back to setup with pre-filled data
                        setActiveTab("setup");
                        toast.info(`Re-iterating on "${concept.title}". Adjust inputs and regenerate for improved concepts.`);
                      }}
                      onViewPerformance={(concept) => {
                        toast.info(`Performance details for "${concept.title}" would open here in production.`);
                      }}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Preview/Demo Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold font-display text-g-heading mb-2">Content Iteration Loop</h2>
                            <p className="text-g-muted font-sans">
                              Refine and improve your content based on performance data and feedback
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-g-text-inverse">
                            <Zap className="w-3 h-3 mr-1" />
                            PRO Feature
                          </Badge>
                        </div>
                      </div>

                      {/* Feature Preview */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10 flex items-center justify-center">
                          <div className="text-center p-6 glass-panel rounded-lg border border-primary/30 shadow-xl max-w-md">
                            <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
                            <h3 className="text-xl font-semibold mb-2 text-g-heading-2 font-sans">Unlock Iteration Features</h3>
                            <p className="text-g-muted font-sans mb-4 text-sm">
                              Continuously improve your content with AI-powered iteration based on real performance metrics
                            </p>
                            <Button onClick={() => setShowPaywall(true)} variant="gradient" size="lg">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade to PRO
                            </Button>
                          </div>
                        </div>

                        {/* Blurred Preview */}
                        <div className="opacity-30 blur-sm pointer-events-none">
                          <ContentIterationLoop
                            onReIterate={() => { }}
                            onViewPerformance={() => { }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              </TabsContent>

              {/* Multi-Platform Content Tab (PRO Feature) */}
              <TabsContent value="multi-platform" className="space-y-6">
                <GlassPanel>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold font-display text-g-heading mb-2">Multi-Platform Content Generation</h2>
                        <p className="text-g-muted font-sans">
                          Generate optimized content for all your linked social platforms simultaneously
                        </p>
                      </div>
                      {!isProUser && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-g-text-inverse">
                          <Zap className="w-3 h-3 mr-1" />
                          PRO Feature
                        </Badge>
                      )}
                    </div>

                    {/* Workflow Recommendation Banner */}
                    <div className="p-4 bg-gradient-to-r from-g-accent/10 to-blue-500/10 glass-panel rounded-lg border border-g-accent/30">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-g-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-g-heading-2 font-sans mb-1">💡 New: Modular Content Pipeline</h4>
                          <p className="text-sm text-g-text font-sans mb-2">
                            Try our new pipeline approach: Avatar → Market Validation → Root Content → Multi-Platform Upcycle.
                            This systematic workflow helps maintain authentic voice while optimizing for each platform.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/pipeline')}
                            className="mt-2"
                          >
                            Try Pipeline Workflow
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isProUser ? (
                      <>
                        {appState.linkedPlatforms.length > 0 ? (
                          <MultiPlatformContentGenerator
                            gravitySixS={gravitySixS}
                            selectedPlatforms={appState.linkedPlatforms}
                          />
                        ) : (
                          <div className="text-center py-12">
                            <Link2 className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                            <h3 className="text-xl font-semibold mb-2 text-g-heading-2 font-sans">No Social Accounts Linked</h3>
                            <p className="text-g-muted font-sans mb-4">
                              Link your social media accounts to start generating platform-specific content
                            </p>
                            <Button onClick={() => setShowSocialLinking(true)} variant="gradient">
                              <Link2 className="w-4 h-4 mr-2" />
                              Link Social Accounts
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10 flex items-center justify-center">
                          <div className="text-center p-8 glass-panel rounded-lg border border-primary/30 shadow-xl max-w-lg">
                            <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
                            <h3 className="text-2xl font-semibold mb-3 text-g-heading-2 font-sans">Unlock Multi-Platform Power</h3>
                            <p className="text-g-muted font-sans mb-4">
                              Generate optimized content for TikTok, Instagram, YouTube, LinkedIn, Twitter, and Facebook all at once
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                              <Badge variant="secondary" className="text-xs">TikTok</Badge>
                              <Badge variant="secondary" className="text-xs">Instagram</Badge>
                              <Badge variant="secondary" className="text-xs">YouTube</Badge>
                              <Badge variant="secondary" className="text-xs">LinkedIn</Badge>
                              <Badge variant="secondary" className="text-xs">Twitter</Badge>
                              <Badge variant="secondary" className="text-xs">Facebook</Badge>
                            </div>
                            <Button onClick={() => setShowPaywall(true)} variant="gradient" size="lg">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade to PRO
                            </Button>
                          </div>
                        </div>

                        {/* Blurred Preview - Empty State */}
                        <div className="opacity-20 blur-sm pointer-events-none">
                          <div className="text-center py-16">
                            <Link2 className="w-20 h-20 mx-auto mb-4 text-g-muted" />
                            <h3 className="text-xl font-semibold mb-2 text-g-heading-2 font-sans">Multi-Platform Content Generation</h3>
                            <p className="text-g-muted font-sans mb-6">
                              Generate content for multiple platforms with a single click
                            </p>
                            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                              {['TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter', 'Facebook'].map((platform) => (
                                <div key={platform} className="p-4 glass-panel rounded-lg">
                                  <div className="h-24 bg-muted rounded mb-2"></div>
                                  <p className="text-sm font-medium">{platform}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}
