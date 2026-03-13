'use client';

import { GlassPanel } from "@/components/GlassPanel";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CircularProgress } from "@/components/CircularProgress";
import { AvatarGalleryCard, PLACEHOLDER_AVATARS, AvatarCardData } from "@/components/AvatarGalleryCard";
import { Button } from "@/components/ui/button";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Sparkles, Target, TrendingUp, User, FileText, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function HomePage() {
  const { appState, initializeSession, hydrateSessionData } = useApp();
  const { user, userRecord, session, isEmailVerified } = useAuth();
  const router = useRouter();
  const [incompleteSession, setIncompleteSession] = useState<any>(null);
  const [hasAnySessions, setHasAnySessions] = useState(false);
  const [latestAvatars, setLatestAvatars] = useState<AvatarCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data via API route
  useEffect(() => {
    const loadHomeData = async () => {
      const token = session?.access_token;
      if (!token) {
        console.log('[Home] No auth token, waiting...');
        return;
      }

      try {
        // Fetch home data via API
        const response = await fetch('/api/home', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch home data');
        }

        const data = await response.json();

        setIncompleteSession(data.incompleteSession);
        setHasAnySessions(data.hasAnySessions);

        if (data.avatars && data.avatars.length > 0) {
          const avatarData: AvatarCardData[] = data.avatars.slice(0, 2).map((avatar: any) => ({
            id: avatar.id,
            photo_url: avatar.photo_url || "",
            name: avatar.name,
            age: avatar.age || 0,
            gender: avatar.gender || "",
            occupation: avatar.occupation || "",
            topInsight: (avatar.pain_points && Array.isArray(avatar.pain_points) && avatar.pain_points[0]) ||
              (avatar.dreams && Array.isArray(avatar.dreams) && avatar.dreams[0]) ||
              "No insights available",
            pain_points: avatar.pain_points || [],
            daily_challenges: avatar.daily_challenges || [],
            dreams: avatar.dreams || [],
            buying_triggers: avatar.buying_triggers || [],
            pain_points_matrix: avatar.pain_points_matrix || {},
            six_s_scores: avatar.six_s_scores || {},
            isPlaceholder: false,
          }));
          setLatestAvatars(avatarData);
        }
      } catch (error) {
        console.error('[Home] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [session]);

  const handleStartNewSession = async () => {
    if (!isEmailVerified) {
      toast.error("Please verify your email before starting a session");
      return;
    }

    await initializeSession();
    router.push('/icp');
  };

  const handleContinueSession = () => {
    if (!isEmailVerified) {
      toast.error("Please verify your email to continue");
      return;
    }

    if (incompleteSession) {
      hydrateSessionData(incompleteSession);
      router.push('/icp');
    }
  };

  const handleResumeSession = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          {userRecord?.name && (
            <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-4">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Welcome back, {userRecord.name}!</span>
            </div>
          )}

          <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Market Validation</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-foreground mb-6 leading-tight">
            Launch
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover your ideal customer through AI-guided interviews and validate your market with precision
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Always show Start New */}
            <PrimaryButton
              size="lg"
              onClick={handleStartNewSession}
              className="hover-scale"
              disabled={!isEmailVerified}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start New ICP Interview
            </PrimaryButton>

            {/* Conditional Second Button */}
            {incompleteSession ? (
              <PrimaryButton
                size="lg"
                onClick={handleContinueSession}
                className="hover-scale"
                disabled={!isEmailVerified}
              >
                Continue ICP Interview
              </PrimaryButton>
            ) : hasAnySessions ? (
              <PrimaryButton
                size="lg"
                onClick={handleResumeSession}
                className="hover-scale"
                disabled={!isEmailVerified}
              >
                Resume Session
              </PrimaryButton>
            ) : null}

            {/* Review ICP Button - shown when user has any sessions */}
            {hasAnySessions && (
              <PrimaryButton
                size="lg"
                onClick={() => router.push('/icp/review')}
                className="hover-scale"
              >
                <FileText className="w-4 h-4 mr-2" />
                Review ICP
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FloatingCard intensity="medium" className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold font-display text-foreground mb-2">
              14 Core Questions
            </h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive interview framework to uncover deep customer insights
            </p>
          </FloatingCard>

          <FloatingCard intensity="medium" className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold font-display text-foreground mb-2">
              Emotional Mapping
            </h3>
            <p className="text-sm text-muted-foreground">
              Identify the Six S emotions that drive your customer's decisions
            </p>
          </FloatingCard>

          <FloatingCard intensity="medium" className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold font-display text-foreground mb-2">
              Auto-Save Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              Never lose your work with automatic session restoration
            </p>
          </FloatingCard>
        </div>

        {/* Demo Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FloatingCard intensity="subtle" className="p-6">
            <h3 className="text-lg font-semibold font-display text-foreground mb-4">Progress Tracker</h3>
            <div className="flex justify-center">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <CircularProgress
                  current={incompleteSession?.answers?.filter((a: any) => a).length || (hasAnySessions ? 14 : 0)}
                  total={14}
                />
              )}
            </div>
            <p className="text-xs text-center mt-4 text-muted-foreground">
              {incompleteSession ? "Session In Progress" : hasAnySessions ? "Last Session Completed" : "No Active Session"}
            </p>
          </FloatingCard>

          <FloatingCard intensity="subtle" className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-display text-foreground">
                {latestAvatars.length > 0 ? "Recent Avatars" : "Example Customer Avatars"}
              </h3>
              {latestAvatars.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading avatars...</div>
            ) : (
              <>
                <AvatarGalleryCard
                  avatars={latestAvatars.length > 0 ? latestAvatars : PLACEHOLDER_AVATARS}
                  onViewDetails={latestAvatars.length > 0 ? (avatar) => router.push(`/avatar/${avatar.id}`) : undefined}
                />

                {latestAvatars.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Complete your ICP interview to generate personalized customer avatars
                  </p>
                )}
              </>
            )}
          </FloatingCard>
        </div>
      </div>
    </div>
  );
}
