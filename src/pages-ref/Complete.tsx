import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";
import { Check, Download, RotateCcw, Loader2, FileText } from "lucide-react";
import { MagicLoader } from "@/components/ui/MagicLoader";
import { format } from "date-fns";
import { generateAvatar, generateMarketingStatements } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { saveAvatar, saveMarketingStatements, saveGeneratedAsset, updateICPSession, getAllAvatarsBySessionId } from "@/lib/database-service";

// Helper function to detect gender from question 1 answer
function detectGender(answer: string): 'male' | 'female' | 'both' {
  const lowerAnswer = answer.toLowerCase();

  // More comprehensive gender keywords
  const maleKeywords = /\b(male|man|men|boy|boys|guy|guys|gentleman|gentlemen|father|dad|husband|son|brother|he|his|him|mr\.|sir)\b/i;
  const femaleKeywords = /\b(female|woman|women|girl|girls|lady|ladies|mother|mom|wife|daughter|sister|she|her|hers|ms\.|mrs\.|miss)\b/i;

  const hasMale = maleKeywords.test(lowerAnswer);
  const hasFemale = femaleKeywords.test(lowerAnswer);

  // Default to 'both' unless explicitly specified
  if (hasMale && !hasFemale) return 'male';
  if (hasFemale && !hasMale) return 'female';

  // If both mentioned or neither mentioned, generate both
  return 'both';
}

const Complete = () => {
  const navigate = useNavigate();
  const { appState, resetState, setAvatarData, setAvatarDataList, setMarketingStatements } = useApp();
  const { toast } = useToast();
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatingMarketing, setGeneratingMarketing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionRecoveryInProgress, setSessionRecoveryInProgress] = useState(false);
  const generationStartedRef = useRef(false);

  // Redirect to home if not completed
  useEffect(() => {
    if (!appState.gravityICP.completed) {
      navigate("/");
    }
  }, [appState.gravityICP.completed, navigate]);

  // Save session to database and generate content
  useEffect(() => {
    async function generateContent() {
      // Prevent duplicate generation runs
      if (generationStartedRef.current) {
        console.log('Generation already in progress, skipping...');
        return;
      }

      console.log('=== COMPLETE PAGE: Starting content generation ===');
      console.log('Session ID:', appState.sessionId);
      console.log('User ID:', appState.userId);

      const hasValidAvatar = appState.avatarData && appState.avatarData.id && appState.avatarData.photo_url;
      const hasValidMarketing = appState.marketingStatements && appState.marketingStatements.id;

      if (hasValidAvatar && hasValidMarketing) {
        console.log('Content already generated, navigating to dashboard...');
        setTimeout(() => navigate("/dashboard"), 1000);
        return;
      }

      // Mark generation as started
      generationStartedRef.current = true;

      let sessionId = appState.sessionId;

      if (!sessionId && appState.userId) {
        console.warn("No session ID found, attempting to recover from database...");
        setSessionRecoveryInProgress(true);

        try {
          const { getLatestICPSession } = await import("@/lib/supabase-service");
          const latestSession = await getLatestICPSession(appState.userId);

          if (latestSession && latestSession.completed) {
            sessionId = latestSession.id;
            console.log('✅ Recovered session ID:', sessionId);
          } else {
            throw new Error('No completed session found');
          }
        } catch (err) {
          console.error("❌ Could not recover session:", err);
          toast({
            title: "Session Error",
            description: "Could not find your completed session. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => navigate("/"), 2000);
          return;
        } finally {
          setSessionRecoveryInProgress(false);
        }
      }

      if (!sessionId) {
        console.error("❌ No session ID available");
        toast({ title: "Session Missing", description: "Please complete the interview first.", variant: "destructive" });
        navigate("/");
        return;
      }

      // Mark session as completed in database
      if (sessionId) {
        await updateICPSession(sessionId, {
          completed: true,
          core_desire: appState.selectedCoreDesire,
          six_s: appState.selectedSixS,
        } as any);
      }

      // Generate avatar(s) based on gender from question 1
      if (!hasValidAvatar) {
        setGeneratingAvatar(true);
        try {
          // Detect gender from question 1 (index 1)
          const idealCustomerAnswer = appState.gravityICP.answers[1] || '';
          const detectedGender = detectGender(idealCustomerAnswer);

          console.log('🎨 Detected gender:', detectedGender, 'from answer:', idealCustomerAnswer);

          const avatarsToGenerate: Array<'male' | 'female'> =
            detectedGender === 'both' ? ['male', 'female'] : [detectedGender];

          const generatedAvatars = [];

          for (const gender of avatarsToGenerate) {
            console.log(`🎨 Generating ${gender} avatar with session ID:`, sessionId);
            const avatar = await generateAvatar(
              appState.gravityICP.answers,
              appState.selectedCoreDesire,
              appState.selectedSixS,
              gender,
              undefined,
              sessionId
            );

            console.log(`🎨 ${gender} avatar generation response:`, avatar);

            // Normalize data: ensure photo_url exists, arrays/objects default properly
            const normalizedAvatar = {
              ...avatar,
              gender,
              photo_url: avatar.photo_url || avatar.photo || '',
              daily_challenges: Array.isArray(avatar.daily_challenges) ? avatar.daily_challenges : [],
              buying_triggers: Array.isArray(avatar.buying_triggers) ? avatar.buying_triggers : [],
              pain_points_matrix: avatar.pain_points_matrix || {},
              six_s_scores: avatar.six_s_scores || {},
            };

            generatedAvatars.push(normalizedAvatar);
            console.log(`✅ ${gender} avatar generated:`, normalizedAvatar.name);
          }

          // Store all avatars
          setAvatarDataList(generatedAvatars);
          setAvatarData(generatedAvatars[0]); // Set first as primary

          console.log(`✅ Generated ${generatedAvatars.length} avatar(s)`);

          // Then generate marketing statements based on first avatar
          setGeneratingMarketing(true);
          console.log('📝 Generating marketing statements...');
          const marketing = await generateMarketingStatements(
            appState.gravityICP.answers,
            appState.selectedCoreDesire,
            appState.selectedSixS,
            generatedAvatars[0],
            generatedAvatars[0].id
          );

          console.log('📝 Marketing statements generated, saving to Firebase...');

          // Save marketing statements to Firebase
          if (marketing && generatedAvatars[0]?.id) {
            const savedMarketing = await saveMarketingStatements(generatedAvatars[0].id, marketing);
            if (savedMarketing) {
              console.log('✅ Marketing statements saved to Firebase');
              setMarketingStatements(savedMarketing);
            } else {
              console.warn('⚠️ Failed to save marketing statements to Firebase');
              setMarketingStatements(marketing); // Still set it in memory
            }
          } else {
            setMarketingStatements(marketing);
          }

          console.log('Marketing statements generation complete');

          toast({
            title: "Content Generated",
            description: "Your customer avatar and marketing statements are ready!",
          });

          // Redirect to dashboard after successful generation
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } catch (error) {
          console.error('Error generating content:', error);
          toast({
            title: "Generation Failed",
            description: "Unable to generate content. Please try again.",
            variant: "destructive",
          });
          setGeneratingAvatar(false);
          setGeneratingMarketing(false);
        }
      }
    }

    if (appState.gravityICP.completed) {
      generateContent();
    }
  }, [
    appState.gravityICP.completed,
    appState.avatarData,
    appState.marketingStatements,
    appState.sessionId,
    appState.userId,
    appState.gravityICP.answers,
    appState.selectedCoreDesire,
    appState.selectedSixS,
    setAvatarData,
    setMarketingStatements,
    navigate,
    toast,
    retryCount,
  ]);

  const handleRetryGeneration = () => {
    console.log('🔄 Manual retry triggered');
    setRetryCount(prev => prev + 1);
    setAvatarData(null);
    setMarketingStatements(null);
  };

  const handleDownloadSummary = () => {
    const summary = {
      completedAt: new Date().toISOString(),
      totalQuestions: 14,
      answersProvided: appState.gravityICP.answers.filter((a) => a).length,
      coreDesire: appState.selectedCoreDesire,
      primaryEmotion: appState.selectedSixS,
      answers: appState.gravityICP.answers.map((answer, index) => ({
        questionNumber: index + 1,
        answer: answer || "(Not answered)",
      })),
      avatarData: appState.avatarData,
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gravity-icp-summary-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    if (
      window.confirm(
        "Are you sure you want to start over? This will clear all your saved answers."
      )
    ) {
      resetState();
      navigate("/");
    }
  };

  const completedCount = appState.gravityICP.answers.filter((a) => a).length;

  return (
    <>

      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Success Animation or Loading State */}
          {sessionRecoveryInProgress || generatingAvatar || generatingMarketing ? (
            <div className="mb-12">
              <MagicLoader
                category={generatingMarketing ? "marketing" : "avatar"}
                title={sessionRecoveryInProgress ? "Connecting..." : generatingAvatar ? "Generating Your Avatar..." : "Creating Marketing Statements..."}
                subtitle="This usually takes 15-30 seconds"
              />
            </div>
          ) : (
            <div className="text-center mb-12 animate-scale-in">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[#4558E5] to-[#6E70FF] mb-6 shadow-[0_0_40px_rgba(69,88,229,0.5)]">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-g-heading mb-4 bg-gradient-to-r from-[#F0E7D6] to-[#DCCEB6] bg-clip-text text-transparent">
                Interview Complete!
              </h1>
              <p className="text-xl text-g-text max-w-2xl mx-auto">
                You've successfully completed the Gravity ICP interview. Your insights are ready for validation.
              </p>
            </div>
          )}

          {/* Summary Card */}
          <GlassPanel padding="lg" className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold font-display text-g-heading mb-6">
              Interview Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Questions Completed */}
              <div className="glass-panel p-6 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#4558E5] to-[#6E70FF] flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{completedCount}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-g-muted">Questions Answered</p>
                    <p className="text-xl font-semibold text-g-heading">
                      {completedCount} of 14 Complete ✓
                    </p>
                  </div>
                </div>
              </div>

              {/* Completion Time */}
              <div className="glass-panel p-6 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#6E70FF] to-[#4558E5] flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-g-muted">Completed On</p>
                    <p className="text-xl font-semibold text-g-heading">
                      {format(new Date(), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Desire & Six S */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {appState.selectedCoreDesire && (
                <div>
                  <p className="text-sm font-semibold text-g-heading-2 mb-3">Core Desire Market</p>
                  <div className="glass-panel p-4 rounded-lg border-2 border-g-accent/50">
                    <p className="font-bold text-g-heading text-lg mb-1">
                      {appState.selectedCoreDesire.name}
                    </p>
                    <p className="text-sm text-g-text">{appState.selectedCoreDesire.description}</p>
                  </div>
                </div>
              )}

              {appState.selectedSixS && (
                <div>
                  <p className="text-sm font-semibold text-g-heading-2 mb-3">Primary Emotion</p>
                  <div className="glass-panel p-4 rounded-lg border-2 border-g-accent/50">
                    <p className="font-bold text-g-heading text-lg mb-1">
                      {appState.selectedSixS.name}
                    </p>
                    <p className="text-sm text-g-text">{appState.selectedSixS.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              {!generatingAvatar && !generatingMarketing && !sessionRecoveryInProgress && !appState.avatarData && (
                <PrimaryButton onClick={handleRetryGeneration} size="lg" className="w-full sm:w-auto min-w-[200px]">
                  <RotateCcw className="w-5 h-5" />
                  Retry Generation
                </PrimaryButton>
              )}

              <PrimaryButton
                onClick={() => navigate("/icp/review")}
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
                disabled={generatingAvatar || generatingMarketing || sessionRecoveryInProgress}
              >
                <FileText className="w-5 h-5" />
                Review Answers
              </PrimaryButton>

              <PrimaryButton
                onClick={handleDownloadSummary}
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
                disabled={generatingAvatar || generatingMarketing || sessionRecoveryInProgress}
              >
                <Download className="w-5 h-5" />
                Download Summary
              </PrimaryButton>

              <button
                onClick={handleStartOver}
                className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-g-text border-2 border-white/20 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5" />
                Start Over
              </button>
            </div>
          </GlassPanel>

          {/* Next Steps */}
          <GlassPanel padding="md" className="text-center animate-fade-in">
            <p className="text-g-muted mb-4">
              Your ICP insights have been saved and are ready for market validation.
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-g-accent hover:text-g-accent-2 transition-colors font-medium"
            >
              ← Return to Dashboard
            </button>
          </GlassPanel>
        </div>
      </div>
    </>
  );
};

export default Complete;
