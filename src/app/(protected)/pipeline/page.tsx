'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GlassPanel } from "@/components/GlassPanel";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  FileText,
  Zap,
  Loader2,
  ArrowRight,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import type {
  AvatarSeed,
  ValidatedIdea,
  ContentRoot,
  ContentUpcycle
} from "@/lib/pipeline-types";
import {
  validatePipeline,
  generatePipeline,
  upcyclePipeline,
  getOrCreateAvatarSeed,
  getMockValidatedIdea,
  pipelineStages
} from "@/lib/pipeline-api";
import { AssetService } from "@/lib/asset-service";
import { Asset } from "@/lib/asset-types";

type PipelineStage = 'avatar' | 'validation' | 'generate' | 'upcycle';

export default function PipelinePage() {
  const router = useRouter();
  const { appState } = useApp();
  const { user, isEmailVerified, hasProAccess } = useAuth();
  const [loading, setLoading] = useState(false);

  // Pipeline data
  const [avatarSeed, setAvatarSeed] = useState<AvatarSeed | null>(null);
  const [validatedIdea, setValidatedIdea] = useState<ValidatedIdea | null>(null);
  const [contentRoot, setContentRoot] = useState<ContentRoot | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [contentUpcycles, setContentUpcycles] = useState<ContentUpcycle[]>([]);

  // UI state
  const [activeStage, setActiveStage] = useState<PipelineStage>('avatar');
  const [selectedRootPlatform, setSelectedRootPlatform] = useState<string>('twitter');

  // Avatar loading state
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Use auth context for PRO access (single source of truth)
  const isProUser = hasProAccess;

  // Load avatar seed on mount with timeout and error handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const loadAvatarSeed = async () => {
      // Validate required context
      if (!appState.sessionId || !appState.userUuid) {
        console.error('[Pipeline] Missing session or user context', {
          hasSessionId: !!appState.sessionId,
          hasUserUuid: !!appState.userUuid,
          hasUserId: !!appState.userId
        });
        setAvatarLoadError('Missing session or user context. Please try completing your ICP again.');
        setAvatarLoading(false);
        return;
      }

      // Validate ICP completion (defensive check)
      if (!appState.gravityICP.completed) {
        console.error('[Pipeline] ICP not completed but user reached Pipeline page');
        setAvatarLoadError('ICP session not marked as complete. Please complete your ICP interview.');
        setAvatarLoading(false);
        return;
      }

      console.log('[Pipeline] Loading avatar seed', {
        sessionId: appState.sessionId,
        userUuid: appState.userUuid,
        retryCount
      });

      setAvatarLoading(true);
      setAvatarLoadError(null);

      // Set a 5-second timeout for loading
      timeoutId = setTimeout(() => {
        if (!cancelled && avatarLoading) {
          console.error('[Pipeline] Avatar seed loading timed out after 5 seconds');
          setAvatarLoadError('Loading timed out. The server may be slow or unavailable.');
          setAvatarLoading(false);
        }
      }, 5000);

      try {
        const seed = await getOrCreateAvatarSeed(appState.sessionId, appState.userUuid);

        if (cancelled) {
          console.log('[Pipeline] Load cancelled (component unmounted)');
          return;
        }

        clearTimeout(timeoutId);

        if (seed) {
          console.log('[Pipeline] Avatar seed loaded successfully', { id: seed.id });
          setAvatarSeed(seed);
          setAvatarLoadError(null);
        } else {
          console.error('[Pipeline] Avatar seed loading returned null');
          setAvatarLoadError('Could not load avatar data. Try completing your ICP again or contact support.');
        }
      } catch (error) {
        if (cancelled) return;

        clearTimeout(timeoutId);
        console.error('[Pipeline] Error loading avatar seed', {
          error: error instanceof Error ? error.message : String(error)
        });
        setAvatarLoadError('An error occurred while loading avatar data. Please try again.');
      } finally {
        if (!cancelled) {
          setAvatarLoading(false);
        }
      }
    };

    loadAvatarSeed();

    // Cleanup function
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // avatarLoading is managed within the effect and shouldn't trigger re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.sessionId, appState.userUuid, appState.gravityICP.completed, retryCount]);

  // Retry handler
  const handleRetryLoadAvatar = () => {
    console.log('[Pipeline] Retrying avatar seed load');
    setRetryCount(prev => prev + 1);
  };

  // Check if user completed ICP
  const hasCompletedICP = appState.gravityICP.completed;

  if (!hasCompletedICP) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <GlassPanel>
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-g-muted" />
              <h2 className="text-2xl font-bold mb-2 text-g-heading">Complete Your ICP First</h2>
              <p className="text-g-muted mb-6">
                The content pipeline requires your ICP avatar data to generate personalized content.
              </p>
              <Button onClick={() => router.push('/icp')} variant="gradient">
                Start ICP Interview
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (!isProUser) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <GlassPanel>
            <div className="text-center py-12">
              <Zap className="w-16 h-16 mx-auto mb-4 text-g-muted" />
              <h2 className="text-2xl font-bold mb-2 text-g-heading">PRO Feature</h2>
              <p className="text-g-muted mb-6">
                The content pipeline is available with the PRO plan.
              </p>
              <Button onClick={() => router.push('/beta-content')} variant="gradient">
                View PRO Features
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  const handleValidate = async () => {
    if (!avatarSeed) {
      toast.error('Avatar seed not found. Please complete ICP first.');
      return;
    }

    setLoading(true);
    try {
      const result = await validatePipeline({
        avatar_seed_id: avatarSeed.id,
        use_external_agents: true,
        external_agents: ['perplexity', 'reddit', 'youtube']
      });

      setValidatedIdea(result.validated_idea);
      setActiveStage('validation');
      toast.success('Market validation complete! Review the insights below.');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!validatedIdea) {
      toast.error('Please complete validation first.');
      return;
    }

    setLoading(true);
    try {
      const response = await generatePipeline({
        validated_idea_id: validatedIdea.id,
        platform: selectedRootPlatform as 'twitter' | 'tiktok' | 'linkedin' | 'instagram' | 'youtube' | 'facebook',
        selected_hook_id: selectedHookId || undefined,
        product_assets: Array.from(selectedAssetIds)
      });

      setContentRoot(response.content_root);
      setActiveStage('upcycle');
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpcycle = async () => {
    if (!contentRoot) {
      toast.error('Please generate root content first.');
      return;
    }

    setLoading(true);
    try {
      const platforms = ['linkedin', 'instagram', 'facebook', 'tiktok', 'youtube'].filter(
        p => p !== selectedRootPlatform
      );

      const result = await upcyclePipeline({
        content_root_id: contentRoot.id,
        target_platforms: platforms
      });

      setContentUpcycles(result.content_upcycles);
      setActiveStage('upcycle');
      toast.success(`Content upcycled to ${platforms.length} platforms!`);
    } catch (error) {
      console.error('Upcycle error:', error);
      toast.error('Failed to upcycle content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StageIndicator = ({ stage, label, completed }: { stage: PipelineStage; label: string; completed: boolean }) => {
    const isCurrent = activeStage === stage;
    return (
      <div className="flex items-center gap-2">
        {completed ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : isCurrent ? (
          <Circle className="w-6 h-6 text-g-accent animate-pulse" />
        ) : (
          <Circle className="w-6 h-6 text-g-muted" />
        )}
        <span className={isCurrent ? 'font-bold text-g-heading' : 'text-g-muted'}>
          {label}
        </span>
      </div>
    );
  };

  return (
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
                Content Pipeline
              </h1>
              <Badge variant="gradient">NEW</Badge>
            </div>
            <p className="text-g-muted font-sans">
              Modular, scalable content generation from avatar to multi-platform
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Progress Pipeline */}
        <GlassPanel>
          <div className="flex items-center justify-between gap-4">
            <StageIndicator stage="avatar" label="1. Avatar Seed" completed={!!avatarSeed} />
            <ChevronRight className="w-5 h-5 text-g-muted" />
            <StageIndicator stage="validation" label="2. Market Validation" completed={!!validatedIdea} />
            <ChevronRight className="w-5 h-5 text-g-muted" />
            <StageIndicator stage="generate" label="3. Root Content" completed={!!contentRoot} />
            <ChevronRight className="w-5 h-5 text-g-muted" />
            <StageIndicator stage="upcycle" label="4. Multi-Platform Upcycle" completed={contentUpcycles.length > 0} />
          </div>
        </GlassPanel>

        {/* Main Content */}
        <Tabs value={activeStage} onValueChange={(v) => setActiveStage(v as PipelineStage)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="avatar">Avatar Seed</TabsTrigger>
            <TabsTrigger value="validation" disabled={!avatarSeed}>Validation</TabsTrigger>
            <TabsTrigger value="generate" disabled={!validatedIdea}>Root Content</TabsTrigger>
            <TabsTrigger value="upcycle" disabled={!contentRoot}>Upcycle</TabsTrigger>
          </TabsList>

          {/* Stage 1: Avatar Seed */}
          <TabsContent value="avatar">
            <GlassPanel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Avatar Seed Data</h2>
                  <p className="text-g-muted">
                    Foundation from your 14 Gravity questions, ICP, and emotional mapping
                  </p>
                </div>

                {avatarLoadError ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-800">
                      <Circle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Failed to Load Avatar Data
                      </h3>
                      <p className="text-red-700 dark:text-red-300 mb-4">
                        {avatarLoadError}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleRetryLoadAvatar}
                          variant="outline"
                          className="border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Retry Loading
                        </Button>
                        <Button
                          onClick={() => router.push('/icp')}
                          variant="gradient"
                        >
                          Complete ICP Again
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : avatarLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-g-muted" />
                    <p className="text-g-muted">Loading avatar data...</p>
                    <p className="text-sm text-g-muted mt-2">This should take less than 5 seconds</p>
                  </div>
                ) : avatarSeed ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Avatar Profile</CardTitle>
                        <CardDescription>
                          {avatarSeed.avatar_name || 'Avatar Name'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-g-muted">Core Desire:</span>
                          <span className="font-semibold">{appState.selectedCoreDesire?.name || avatarSeed.core_desire || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-g-muted">Six S:</span>
                          <span className="font-semibold">{appState.selectedSixS?.name || avatarSeed.six_s || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-g-muted">ICP Completed:</span>
                          <span className="font-semibold">{hasCompletedICP ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-g-muted">Avatar ID:</span>
                          <span className="font-mono text-xs text-g-muted">{avatarSeed.id.substring(0, 8)}...</span>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleValidate}
                        disabled={loading}
                        variant="gradient"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            Start Market Validation
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-6 border border-yellow-200 dark:border-yellow-800">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        No Avatar Data Found
                      </h3>
                      <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        We couldn't find avatar data for your session. Please try loading again.
                      </p>
                      <Button onClick={handleRetryLoadAvatar} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retry Loading
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
          </TabsContent>

          {/* Stage 2: Market Validation */}
          <TabsContent value="validation">
            <GlassPanel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Market Validation Results</h2>
                  <p className="text-g-muted">
                    Multi-agent research, validated hooks, angles, and psychological triggers
                  </p>
                </div>

                {validatedIdea ? (
                  <div className="space-y-6">
                    {/* Top Hooks */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Top Recommended Hooks</h3>
                      <div className="grid gap-3">
                        {validatedIdea.hooks.slice(0, 3).map((hook) => (
                          <Card
                            key={hook.id}
                            className={selectedHookId === hook.id ? 'border-g-accent' : ''}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() => setSelectedHookId(hook.id)}
                                >
                                  <p className="font-semibold mb-2">{hook.text}</p>
                                  <div className="flex gap-2 mb-2">
                                    <Badge variant="outline">{hook.framework}</Badge>
                                    <Badge variant="secondary">{hook.emotional_trigger}</Badge>
                                  </div>
                                  <p className="text-sm text-g-muted">{hook.reasoning}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-g-accent">{hook.score}</div>
                                    <div className="text-xs text-g-muted">score</div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    className="whitespace-nowrap"
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Regenerate
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Agent Insights */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Agent Research Insights</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Gravity Research</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <span className="text-g-muted">Frameworks:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {validatedIdea.gravity_research.frameworks_recommended.map(fw => (
                                  <Badge key={fw} variant="outline" className="text-xs">{fw}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">External Research</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {validatedIdea.external_research.perplexity && (
                              <div>
                                <span className="text-g-muted">Trending:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {validatedIdea.external_research.perplexity.trending_topics.map(topic => (
                                    <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button variant="outline" onClick={() => setActiveStage('avatar')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Avatar
                      </Button>
                      <div className="space-x-2">
                        <label className="text-sm text-g-muted mr-2">Root Platform:</label>
                        <select
                          value={selectedRootPlatform}
                          onChange={(e) => setSelectedRootPlatform(e.target.value)}
                          className="px-3 py-2 rounded-md border border-g-border bg-g-background text-g-text"
                        >
                          <option value="twitter">Twitter/X</option>
                          <option value="tiktok">TikTok</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                        <Button
                          onClick={handleGenerate}
                          disabled={loading}
                          variant="gradient"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              Generate Root Content
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                    <p className="text-g-muted mb-4">No validation data yet</p>
                    <Button onClick={handleValidate} variant="gradient">
                      Start Validation
                    </Button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </TabsContent>

          {/* Stage 3: Root Content */}
          <TabsContent value="generate">
            <GlassPanel>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Root Content Generated</h2>
                    <p className="text-g-muted">
                      Native-format content for your selected root platform
                    </p>
                  </div>
                  {contentRoot && (
                    <Badge className="bg-g-accent text-g-text-inverse">
                      Root: {contentRoot.root_platform}
                    </Badge>
                  )}
                </div>

                {contentRoot ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{contentRoot.title}</CardTitle>
                        <CardDescription>Framework: {contentRoot.selected_framework}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Hook:</h4>
                          <p className="text-g-text">{contentRoot.hook}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Body:</h4>
                          <p className="text-g-text whitespace-pre-wrap">{contentRoot.body}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">CTA:</h4>
                          <p className="text-g-text">{contentRoot.cta}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStage('validation')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Validation
                      </Button>
                      <Button
                        onClick={handleUpcycle}
                        disabled={loading}
                        variant="gradient"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Upcycling...
                          </>
                        ) : (
                          <>
                            Upcycle to All Platforms
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                    <p className="text-g-muted mb-4">No root content generated yet</p>
                    <Button onClick={handleGenerate} variant="gradient">
                      Generate Content
                    </Button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </TabsContent>

          {/* Stage 4: Multi-Platform Upcycle */}
          <TabsContent value="upcycle">
            <GlassPanel>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Multi-Platform Content</h2>
                  <p className="text-g-muted">
                    Optimized versions for each platform with proper constraints and formatting
                  </p>
                </div>

                {contentUpcycles.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {contentUpcycles.map((upcycle) => (
                      <Card key={upcycle.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{upcycle.target_platform}</span>
                            <Badge variant="outline">Upcycled</Badge>
                          </CardTitle>
                          <CardDescription>{upcycle.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h5 className="text-xs font-semibold text-g-muted mb-1">Hook:</h5>
                            <p className="text-sm">{upcycle.hook}</p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-g-muted mb-1">Body:</h5>
                            <p className="text-sm line-clamp-3">{upcycle.body}</p>
                          </div>
                          {upcycle.hashtags.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-g-muted mb-1">Hashtags:</h5>
                              <div className="flex flex-wrap gap-1">
                                {upcycle.hashtags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full">
                            Copy Content
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-16 h-16 mx-auto mb-4 text-g-muted" />
                    <p className="text-g-muted mb-4">No upcycled content yet</p>
                    <Button onClick={handleUpcycle} variant="gradient">
                      Upcycle Content
                    </Button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
