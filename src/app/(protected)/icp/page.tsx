'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { GlassInput } from "@/components/GlassInput";
import { ProgressBar } from "@/components/ProgressBar";
import { CircularProgress } from "@/components/CircularProgress";
import { SuggestionChip } from "@/components/SuggestionChip";
import { AutosaveIndicator } from "@/components/AutosaveIndicator";
import { SixSHeatMap } from "@/components/SixSHeatMap";
import { useApp } from "@/context/AppContext";
import { questions, coreDesires, sixSOptions } from "@/data/questions";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { generateICPSuggestions } from "@/lib/api";
import { createICPSession, updateICPSession } from "@/lib/database-service";
import { useToast } from "@/hooks/use-toast";

interface ICPProps {
  hideNavigation?: boolean;
}

export default function ICPPage({ hideNavigation = false }: ICPProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    appState,
    updateICPAnswer,
    setCurrentQuestion,
    setCompleted,
    setSelectedCoreDesire,
    setSelectedSixS,
    initializeSession,
    lastSaved,
    saving,
  } = useApp();

  const [currentAnswer, setCurrentAnswer] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isCompletingInterview, setIsCompletingInterview] = useState(false);
  const initializingRef = useRef(false); // Guard against multiple initializations
  const currentQ = appState.gravityICP.currentQuestion;
  const question = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;

  // Initialize session on mount if needed
  useEffect(() => {
    const init = async () => {
      if (appState.userId && !appState.sessionId && !initializingRef.current) {
        console.log('Initializing session for user:', appState.userId);
        initializingRef.current = true;
        await initializeSession();
        initializingRef.current = false;
      }
    };
    init();
  }, [appState.userId, appState.sessionId, initializeSession]);

  // Load current answer when question changes
  useEffect(() => {
    setCurrentAnswer(appState.gravityICP.answers[currentQ] || "");
  }, [currentQ, appState.gravityICP.answers]);

  // Safety timeout to prevent stuck UI
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCompletingInterview) {
      timeout = setTimeout(() => {
        console.warn('Safety timeout triggered: Resetting completion state');
        setIsCompletingInterview(false);
        toast({
          title: "Taking too long?",
          description: "The operation timed out. Please try again.",
          variant: "destructive",
        });
      }, 15000);
    }
    return () => clearTimeout(timeout);
  }, [isCompletingInterview, toast]);

  // Load AI suggestions for each question
  const loadAISuggestions = useCallback(async () => {
    // Skip for special selection questions (Q7 and Q11)
    if (currentQ === 6 || currentQ === 10) {
      setAiSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const suggestions = await generateICPSuggestions(
        currentQ,
        appState.gravityICP.answers.slice(0, currentQ)
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [currentQ, appState.gravityICP.answers]);

  useEffect(() => {
    loadAISuggestions();
  }, [loadAISuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentAnswer((prev) => {
      const current = prev || "";
      // Check if suggestion is already in the answer
      if (current.includes(suggestion)) {
        // Remove it
        return current.replace(suggestion, "").replace(/\s\s+/g, " ").trim();
      } else {
        // Add it
        const trimmed = current.trim();
        return trimmed ? `${trimmed} ${suggestion}` : suggestion;
      }
    });
  };

  const handleSelectAll = () => {
    const newSuggestions = aiSuggestions.filter(s => !currentAnswer.includes(s));
    if (newSuggestions.length === 0) return;

    setCurrentAnswer((prev) => {
      const trimmed = prev.trim();
      const toAdd = newSuggestions.join(" ");
      return trimmed ? `${trimmed} ${toAdd}` : toAdd;
    });
  };

  const handleCoreDesireSelect = (desire: typeof coreDesires[0]) => {
    setSelectedCoreDesire(desire);
    updateICPAnswer(currentQ, desire.name);
    setCurrentAnswer(desire.name);
  };

  const handleSixSSelect = (sixS: typeof sixSOptions[0]) => {
    setSelectedSixS(sixS);
    updateICPAnswer(currentQ, sixS.name);
    setCurrentAnswer(sixS.name);
  };

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQuestion(currentQ - 1);
    }
  };

  const handleContinue = useCallback(async () => {
    // Prevent multiple submissions
    if (isCompletingInterview) {
      console.log('Interview completion already in progress, ignoring duplicate request');
      return;
    }

    // Save current answer
    if (currentAnswer.trim()) {
      updateICPAnswer(currentQ, currentAnswer.trim());
    }

    // Navigate to next question or complete
    if (isLastQuestion) {
      console.log('Last question completed, beginning interview completion process');
      setIsCompletingInterview(true);

      // Ensure session is persisted BEFORE navigating
      let sessionId = appState.sessionId;

      if (!sessionId) {
        console.warn('No session ID found, attempting to initialize now...');
        // Try to initialize session immediately
        if (appState.userId && appState.userName) {
          try {
            const newSession = await createICPSession(
              appState.userId,
              appState.userName,
              appState.gravityICP.answers,
              currentQ
            );
            if (newSession) {
              console.log('Recovered: Created new session immediately:', newSession.id);
              sessionId = newSession.id;
              // Update context asynchronously
              initializeSession();
            }
          } catch (e) {
            console.error('Failed to recover session:', e);
          }
        }
      }

      if (sessionId) {
        try {
          console.log('Updating session in database:', sessionId);

          // Add timeout to prevent hanging
          const updatePromise = updateICPSession(sessionId, {
            completed: true,
            current_question: currentQ,
            core_desire: appState.selectedCoreDesire,
            six_s: appState.selectedSixS,
          } as any);

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database update timed out')), 10000)
          );

          const result = await Promise.race([updatePromise, timeoutPromise]);

          console.log('Session update result:', result);

          if (!result) {
            throw new Error('Failed to update session in database');
          }

          console.log('Session marked complete in database:', sessionId);

          // Navigate to completion page
          router.push("/complete");
        } catch (err) {
          console.error('Error finalizing session:', err);

          // Fallback: Try to create a new session if update failed
          try {
            console.log('Attempting fallback: Creating new session...');
            if (appState.userId && appState.userName) {
              const newSession = await createICPSession(
                appState.userId,
                appState.userName,
                appState.gravityICP.answers,
                currentQ
              );

              if (newSession) {
                console.log('Fallback successful: Created new session', newSession.id);
                // Update session ID in context
                initializeSession(); // This might be async but we don't wait

                // Mark as completed locally
                setCompleted(true);
                router.push("/complete");
                return;
              }
            }
          } catch (fallbackErr) {
            console.error('Fallback failed:', fallbackErr);
          }

          // Show error to user
          toast({
            title: "Error Saving Session",
            description: "Failed to save. Please try again or refresh the page.",
            variant: "destructive",
          });
        } finally {
          setIsCompletingInterview(false);
        }
      } else {
        console.warn('No session ID found even after retry, cannot persist to database');
        setIsCompletingInterview(false);

        toast({
          title: "Session Error",
          description: "No session found. Please try completing the interview again.",
          variant: "destructive",
        });
        return;
      }

      // Mark as completed in app state
      console.log('Setting completed flag in app state');
      setCompleted(true);
      console.log('Completed flag set, navigating to /complete');

      // Navigate to completion page
      router.push("/complete");
    } else {
      setCurrentQuestion(currentQ + 1);
    }
  }, [currentAnswer, currentQ, isLastQuestion, isCompletingInterview, updateICPAnswer, setCompleted, setCurrentQuestion, router, appState.sessionId, appState.userId, appState.userName, appState.selectedCoreDesire, appState.selectedSixS, appState.gravityICP.answers, initializeSession, toast]);

  const canContinue = () => {
    if (question.type === "core-desire") {
      return appState.selectedCoreDesire !== null;
    }
    if (question.type === "six-s") {
      return appState.selectedSixS !== null;
    }
    return currentAnswer.trim().length > 0;
  };

  // Calculate Six S heat map scores based on selection
  const getSixSScores = () => {
    return sixSOptions.map((option) => ({
      ...option,
      score: option.name === appState.selectedSixS?.name ? 100 : 0,
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't allow keyboard shortcuts during interview completion
      if (isCompletingInterview) return;

      // Enter to continue (only if not in textarea or if Shift+Enter is not pressed)
      if (e.key === "Enter" && !e.shiftKey && canContinue()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleContinue();
        }
      }

      // Escape to go back
      if (e.key === "Escape" && currentQ > 0) {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQ, canContinue, handleContinue, isCompletingInterview]);

  return (
    <>

      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Show only left panel, right panel hidden */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT PANEL - Question & Input (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Bar */}
              <GlassPanel padding="md">
                <ProgressBar current={currentQ + 1} total={questions.length} showLabel />
              </GlassPanel>

              {/* Question Card */}
              <GlassPanel padding="lg" className="animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-g-accent">
                      Question {currentQ + 1} of {questions.length}
                    </span>
                    <AutosaveIndicator lastSaved={lastSaved || undefined} saving={saving} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-display text-g-heading mb-6">
                    {question.text}
                  </h2>
                </div>

                {/* Core Desire Selection (Question 7) */}
                {question.type === "core-desire" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {coreDesires.map((desire) => (
                      <button
                        key={desire.name}
                        onClick={() => handleCoreDesireSelect(desire)}
                        className={`glass-panel p-6 rounded-lg text-left transition-all duration-300 hover:scale-105 ${appState.selectedCoreDesire?.name === desire.name
                          ? "border-2 border-g-accent shadow-[0_0_30px_rgba(69,88,229,0.4)]"
                          : "border border-white/10 hover:border-white/20"
                          }`}
                      >
                        <h3 className="text-xl font-bold font-display text-g-heading mb-2">
                          {desire.name}
                        </h3>
                        <p className="text-sm text-g-text">{desire.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Six S Selection (Question 11) */}
                {question.type === "six-s" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {sixSOptions.map((sixS) => (
                      <button
                        key={sixS.name}
                        onClick={() => handleSixSSelect(sixS)}
                        className={`glass-panel p-6 rounded-lg text-left transition-all duration-300 hover:scale-105 ${appState.selectedSixS?.name === sixS.name
                          ? "border-2 border-g-accent shadow-[0_0_30px_rgba(69,88,229,0.4)]"
                          : "border border-white/10 hover:border-white/20"
                          }`}
                      >
                        <h3 className="text-lg font-bold text-g-heading mb-2">{sixS.name}</h3>
                        <p className="text-sm text-g-text">{sixS.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Text Input Questions */}
                {question.type === "text" && (
                  <>
                    {/* AI Suggestion Chips */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-g-muted">AI Suggestions (click to add):</p>
                        {aiSuggestions.length > 0 && (
                          <button
                            onClick={handleSelectAll}
                            className="text-xs text-g-accent hover:text-g-accent-hover transition-colors"
                          >
                            Select All
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {loadingSuggestions ? (
                          // Loading state - show pulsing placeholders
                          Array.from({ length: 3 }).map((_, idx) => (
                            <div
                              key={idx}
                              className="h-9 w-32 rounded-full bg-white/5 animate-pulse"
                            />
                          ))
                        ) : aiSuggestions.length > 0 ? (
                          // Display AI suggestions
                          aiSuggestions.map((suggestion, idx) => (
                            <SuggestionChip
                              key={idx}
                              text={suggestion}
                              selected={currentAnswer.includes(suggestion)}
                              onClick={() => handleSuggestionClick(suggestion)}
                            />
                          ))
                        ) : (
                          // Retry button if no suggestions loaded
                          <button
                            onClick={loadAISuggestions}
                            className="px-4 py-2 text-sm text-g-muted hover:text-g-text transition-colors"
                          >
                            Retry loading suggestions
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Textarea Input */}
                    <div className="mb-6">
                      <GlassInput
                        value={currentAnswer}
                        onChange={setCurrentAnswer}
                        placeholder="Type your answer here..."
                        multiline
                        rows={5}
                      />
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQ === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 text-g-text hover:text-g-heading transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <PrimaryButton
                    onClick={handleContinue}
                    disabled={!canContinue() || isCompletingInterview}
                    className="min-w-[140px]"
                  >
                    {isCompletingInterview ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        {isLastQuestion ? "Complete" : "Continue"}
                        {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </GlassPanel>
            </div>

            {/* RIGHT PANEL - Persona Summary (1/3 width, hidden on mobile) */}
            <div className="hidden lg:block space-y-6">
              {/* Circular Progress */}
              <GlassPanel padding="lg" className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-g-heading-2 mb-4">Your Progress</h3>
                <CircularProgress
                  current={appState.gravityICP.answers.filter((a) => a).length}
                  total={questions.length}
                />
                <p className="text-sm text-g-muted mt-4 text-center">
                  Questions answered with saved responses
                </p>
              </GlassPanel>

              {/* Core Desire Badge */}
              {appState.selectedCoreDesire && (
                <GlassPanel padding="md">
                  <h3 className="text-sm font-semibold text-g-heading-2 mb-3">Core Desire</h3>
                  <div className="glass-panel p-4 rounded-lg border-2 border-g-accent/50">
                    <p className="font-bold text-g-heading mb-1">
                      {appState.selectedCoreDesire.name}
                    </p>
                    <p className="text-xs text-g-text">{appState.selectedCoreDesire.description}</p>
                  </div>
                </GlassPanel>
              )}

              {/* Six S Heat Map */}
              {appState.selectedSixS && (
                <GlassPanel padding="md">
                  <SixSHeatMap items={getSixSScores()} selectedName={appState.selectedSixS.name} />
                </GlassPanel>
              )}

              {/* Validation Readiness */}
              <GlassPanel padding="md">
                <h3 className="text-sm font-semibold text-g-heading-2 mb-3">Readiness Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-g-text">Answers completed</span>
                    <span
                      className={
                        appState.gravityICP.answers.filter((a) => a).length === questions.length
                          ? "text-green-400"
                          : "text-g-muted"
                      }
                    >
                      {appState.gravityICP.answers.filter((a) => a).length}/{questions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-g-text">Core Desire selected</span>
                    <span className={appState.selectedCoreDesire ? "text-green-400" : "text-g-muted"}>
                      {appState.selectedCoreDesire ? "✓" : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-g-text">Primary emotion selected</span>
                    <span className={appState.selectedSixS ? "text-green-400" : "text-g-muted"}>
                      {appState.selectedSixS ? "✓" : "—"}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
