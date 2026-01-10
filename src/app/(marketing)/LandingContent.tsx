'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sparkles, Target, TrendingUp, User, FileText, Rocket, Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { getIncompleteICPSession, getAllUserSessions, getLatestICPSession, getAllAvatarsBySessionId } from "@/lib/database-service";

function LandingPageContent() {
  const { appState, resetState, setUserInfo, setPlanType, initializeSession, hydrateSessionData } = useApp();
  const { user, userRecord, isAuthenticated, isEmailVerified, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [incompleteSession, setIncompleteSession] = useState<any>(null);
  const [hasAnySessions, setHasAnySessions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        setLoading(false);
      } else if (user && userRecord) {
        setUserInfo(user.uid, userRecord.name || user.email?.split('@')[0] || 'User', user.email || undefined);

        if (userRecord.plan_type === 'pro') {
          setPlanType('pro');
        }

        const allSessions = await getAllUserSessions(user.uid);
        if (allSessions && allSessions.length > 0) {
          setHasAnySessions(true);
        }

        const incomplete = await getIncompleteICPSession(user.uid);
        if (incomplete) {
          setIncompleteSession(incomplete);
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
    router.push('/icp');
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
      router.push('/icp');
    }
  };

  const handleResumeSession = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_30%_0%,rgba(79,209,255,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_70%_100%,rgba(79,209,255,0.04)_0%,transparent_40%)]">
        <AuthModal isOpen={showAuthModal} onClose={() => !isAuthenticated && setShowAuthModal(false)} />

        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-6xl">
            {isAuthenticated && !isEmailVerified && user?.email && (
              <div className="mb-8">
                <EmailVerificationAlert email={user.email} />
              </div>
            )}

            <div className="text-center mb-16">
              {userRecord?.name && (
                <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border px-4 py-2 rounded-full mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Welcome back, {userRecord.name}!</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI-Powered Market Validation</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
                Launch Pad
                <span className="block text-primary">by Gravity</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Discover your ideal customer through AI-guided interviews and validate your market with precision
              </p>

              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    onClick={handleStartNewSession}
                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                    disabled={!isEmailVerified}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Start New ICP Interview
                  </Button>

                  {incompleteSession ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleContinueSession}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                      disabled={!isEmailVerified}
                    >
                      Continue ICP Interview
                    </Button>
                  ) : hasAnySessions ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleResumeSession}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                      disabled={!isEmailVerified}
                    >
                      Resume Session
                    </Button>
                  ) : null}

                  {hasAnySessions && (
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => router.push('/icp/review')}
                      disabled={!isEmailVerified}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Review ICP
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Get Started Free
                </Button>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <FloatingCard intensity="medium" className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
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
                <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
                  Emotional Mapping
                </h3>
                <p className="text-sm text-muted-foreground">
                  Identify the Six S emotions that drive your customer's decisions
                </p>
              </FloatingCard>

              <FloatingCard intensity="medium" className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
                  Market Intelligence
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered insights to validate and refine your product strategy
                </p>
              </FloatingCard>
            </div>

            {/* Value Props */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Trusted by product launchers and course creators worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LandingContent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <LandingPageContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
