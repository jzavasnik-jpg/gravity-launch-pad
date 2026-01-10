import { GlassPanel } from "@/components/GlassPanel";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CircularProgress } from "@/components/CircularProgress";
import { AvatarGalleryCard, PLACEHOLDER_AVATARS, AvatarCardData } from "@/components/AvatarGalleryCard";
import { AuthModal } from "@/components/AuthModal";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, TrendingUp, User, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getIncompleteICPSession, getAllUserSessions, getLatestICPSession, getAllAvatarsBySessionId } from "@/lib/database-service";

const Index = () => {
  const { appState, resetState, setUserInfo, setPlanType, initializeSession, hydrateSessionData } = useApp();
  const { user, userRecord, isAuthenticated, isEmailVerified, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [incompleteSession, setIncompleteSession] = useState<any>(null);
  const [hasAnySessions, setHasAnySessions] = useState(false);
  const [latestAvatars, setLatestAvatars] = useState<AvatarCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for user info and incomplete sessions on mount
  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        setShowAuthModal(true);
        setLoading(false);
      } else if (user && userRecord) {
        setUserInfo(user.uid, userRecord.name || user.email?.split('@')[0] || 'User', user.email);

        if (userRecord.plan_type === 'pro') {
          setPlanType('pro');
        }

        // Check for any previous sessions
        const allSessions = await getAllUserSessions(user.uid);
        if (allSessions && allSessions.length > 0) {
          setHasAnySessions(true);
        }

        // Check for incomplete session
        const incomplete = await getIncompleteICPSession(user.uid);
        console.log('[Index] Incomplete session:', incomplete);
        if (incomplete) {
          setIncompleteSession(incomplete);
        }

        // Fetch latest session (complete or incomplete) for avatars and progress
        const latestSession = await getLatestICPSession(user.uid);
        console.log('[Index] Latest session:', latestSession);

        if (latestSession) {
          // 1. Try to get avatars from the latest session
          let avatars = await getAllAvatarsBySessionId(latestSession.id);

          // 2. If no avatars in latest, and we have other sessions, check them
          if ((!avatars || avatars.length === 0) && allSessions && allSessions.length > 0) {
            console.log('[Index] No avatars in latest session, checking previous sessions...');
            // Sort sessions by date desc just to be sure
            const sortedSessions = [...allSessions].sort((a, b) =>
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );

            for (const session of sortedSessions) {
              if (session.id === latestSession.id) continue; // Skip the one we already checked
              const sessionAvatars = await getAllAvatarsBySessionId(session.id);
              if (sessionAvatars && sessionAvatars.length > 0) {
                avatars = sessionAvatars;
                console.log('[Index] Found avatars in previous session:', session.id);
                break; // Found some, stop looking
              }
            }
          }

          console.log('[Index] Final avatars list:', avatars);
          if (avatars && avatars.length > 0) {
            const avatarData: AvatarCardData[] = avatars.slice(0, 2).map(avatar => ({ // Show top 2
              photo_url: avatar.photo_url || "",
              name: avatar.name,
              age: avatar.age || 0,
              gender: avatar.gender || "",
              occupation: avatar.occupation || "",
              topInsight: (avatar.pain_points && Array.isArray(avatar.pain_points) && avatar.pain_points[0]) ||
                (avatar.dreams && Array.isArray(avatar.dreams) && avatar.dreams[0]) ||
                "No insights available",
              isPlaceholder: false,
            }));
            setLatestAvatars(avatarData);
          }
        }

        setLoading(false);
      }
    };

    checkUserStatus();
  }, [isAuthenticated, user, userRecord, authLoading, setUserInfo, setPlanType]);

  const handleStartNewSession = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!isEmailVerified) {
      toast.error("Please verify your email before starting a session");
      return;
    }

    if (user && userRecord) {
      await initializeSession();
    }
    navigate('/icp');
  };

  const handleContinueSession = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!isEmailVerified) {
      toast.error("Please verify your email to continue");
      return;
    }

    if (incompleteSession) {
      hydrateSessionData(incompleteSession);
      navigate('/icp');
    }
  };

  const handleResumeSession = () => {
    // Logic to resume a completed session
    // For now, we navigate to Dashboard as the "last state" for a completed flow
    // Ideally, we'd store the exact last visited route in the session metadata
    navigate('/dashboard');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-6">
        <AuthModal isOpen={showAuthModal} onClose={() => !isAuthenticated && setShowAuthModal(false)} />

        <div className="w-full max-w-6xl">
          {isAuthenticated && !isEmailVerified && user?.email && (
            <div className="mb-8">
              <EmailVerificationAlert email={user.email} />
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            {userRecord?.name && (
              <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-4">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-g-text">Welcome back, {userRecord.name}!</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-g-accent" />
              <span className="text-sm text-g-text">AI-Powered Market Validation</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-g-heading mb-6 leading-tight">
              Gravity Product Launcher
            </h1>

            <p className="text-lg sm:text-xl text-g-text max-w-2xl mx-auto mb-8 leading-relaxed">
              Discover your ideal customer through AI-guided interviews and validate your market with precision
            </p>

            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Always show Start New */}
                <PrimaryButton
                  size="lg"
                  onClick={handleStartNewSession}
                  className="hover-scale bg-gradient-to-r from-g-accent to-purple-500"
                  disabled={!isEmailVerified}
                >
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
                    onClick={() => navigate('/icp/review')}
                    className="hover-scale"
                    variant="outline"
                    disabled={!isEmailVerified}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Review ICP
                  </PrimaryButton>
                )}
              </div>
            ) : (
              <PrimaryButton
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="hover-scale"
              >
                Get Started
              </PrimaryButton>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
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
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    View All Details →
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading avatars...</div>
              ) : (
                <>
                  <AvatarGalleryCard
                    avatars={latestAvatars.length > 0 ? latestAvatars : PLACEHOLDER_AVATARS}
                    onViewDetails={latestAvatars.length > 0 ? (_avatar) => navigate('/dashboard') : undefined}
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
    </>
  );
};

export default Index;
