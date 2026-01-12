'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { questions, coreDesires, sixSOptions } from "@/data/questions";
import { updateICPSession, getLatestICPSession } from "@/lib/database-service";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Save,
  FileText,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ICPReviewPage() {
  const router = useRouter();
  const {
    appState,
    updateICPAnswer,
    setSelectedCoreDesire,
    setSelectedSixS,
    hydrateSessionData,
  } = useApp();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadingFromDb, setLoadingFromDb] = useState(false);

  // Track if we've attempted to load from database to prevent infinite loop
  const hasAttemptedLoad = useRef(false);

  // Load from database if answers are not populated
  useEffect(() => {
    async function loadFromDatabase() {
      // Skip if we've already attempted to load
      if (hasAttemptedLoad.current) {
        return;
      }

      // Check if answers are empty and we have a userId
      const hasAnswers = appState.gravityICP.answers.some(a => a && a.trim());

      if (!hasAnswers && appState.userId) {
        hasAttemptedLoad.current = true; // Mark as attempted before async operation
        setLoadingFromDb(true);
        try {
          console.log('[ICPReview] Loading answers from database for user:', appState.userId);
          const latestSession = await getLatestICPSession(appState.userId);

          // Check if session has actual non-empty answers
          const hasRealAnswers = latestSession?.answers &&
            Array.isArray(latestSession.answers) &&
            latestSession.answers.some((a: string) => a && a.trim());

          if (latestSession && hasRealAnswers) {
            console.log('[ICPReview] Found session with answers:', latestSession.id);
            console.log('[ICPReview] Session answers:', latestSession.answers);
            hydrateSessionData(latestSession);
            toast.success("Loaded your ICP answers from the database");
          } else {
            console.log('[ICPReview] No session with non-empty answers found');
            console.log('[ICPReview] Session data:', latestSession);
            toast.info("No saved ICP answers found. Please complete an ICP interview first.");
          }
        } catch (error) {
          console.error('[ICPReview] Error loading from database:', error);
          toast.error("Failed to load ICP answers");
        } finally {
          setLoadingFromDb(false);
        }
      } else if (hasAnswers) {
        // If answers already exist, mark as attempted so we don't try again
        hasAttemptedLoad.current = true;
      }
    }

    loadFromDatabase();
  }, [appState.userId, appState.gravityICP.answers, hydrateSessionData]);

  // Track if ICP is complete
  const answeredCount = appState.gravityICP.answers.filter(Boolean).length;
  const isComplete = answeredCount === questions.length;

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(appState.gravityICP.answers[index] || "");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim()) {
      updateICPAnswer(index, editValue.trim());
      setHasUnsavedChanges(true);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleCoreDesireSelect = (desire: typeof coreDesires[0]) => {
    setSelectedCoreDesire(desire);
    updateICPAnswer(6, desire.name);
    setHasUnsavedChanges(true);
  };

  const handleSixSSelect = (sixS: typeof sixSOptions[0]) => {
    setSelectedSixS(sixS);
    updateICPAnswer(10, sixS.name);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = useCallback(async () => {
    if (!appState.sessionId) {
      toast.error("No session found. Please start a new ICP session.");
      return;
    }

    setSaving(true);
    try {
      await updateICPSession(appState.sessionId, {
        answers: appState.gravityICP.answers,
        core_desire: appState.selectedCoreDesire,
        six_s: appState.selectedSixS,
      } as any);
      setHasUnsavedChanges(false);
      toast.success("All changes saved successfully!");
    } catch (error) {
      console.error("Error saving ICP answers:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [appState.sessionId, appState.gravityICP.answers, appState.selectedCoreDesire, appState.selectedSixS]);

  // Render question card based on type
  const renderQuestionCard = (question: typeof questions[0], index: number) => {
    const answer = appState.gravityICP.answers[index];
    const isEditing = editingIndex === index;

    // Core Desire question (index 6)
    if (question.type === "core-desire") {
      return (
        <Card
          key={question.id}
          className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-primary">
                  Question {index + 1}
                </span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Core Desire
                </Badge>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                {question.text}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreDesires.map((desire) => (
              <button
                key={desire.name}
                onClick={() => handleCoreDesireSelect(desire)}
                className={cn(
                  "p-4 rounded-lg text-left transition-all duration-300",
                  appState.selectedCoreDesire?.name === desire.name
                    ? "bg-primary/20 border-2 border-primary shadow-[0_0_20px_-5px_rgba(79,209,255,0.3)]"
                    : "bg-muted/50 border border-border hover:border-primary/50"
                )}
              >
                <p className="font-semibold text-foreground mb-1">{desire.name}</p>
                <p className="text-xs text-muted-foreground">{desire.description}</p>
              </button>
            ))}
          </div>
        </Card>
      );
    }

    // Six S question (index 10)
    if (question.type === "six-s") {
      return (
        <Card
          key={question.id}
          className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-primary">
                  Question {index + 1}
                </span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Six S
                </Badge>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                {question.text}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sixSOptions.map((sixS) => (
              <button
                key={sixS.name}
                onClick={() => handleSixSSelect(sixS)}
                className={cn(
                  "p-4 rounded-lg text-left transition-all duration-300",
                  appState.selectedSixS?.name === sixS.name
                    ? "bg-primary/20 border-2 border-primary shadow-[0_0_20px_-5px_rgba(79,209,255,0.3)]"
                    : "bg-muted/50 border border-border hover:border-primary/50"
                )}
              >
                <p className="font-semibold text-foreground mb-1">{sixS.name}</p>
                <p className="text-xs text-muted-foreground">{sixS.description}</p>
              </button>
            ))}
          </div>
        </Card>
      );
    }

    // Text question (default)
    return (
      <Card
        key={question.id}
        className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-primary">
                Question {index + 1}
              </span>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-3">
              {question.text}
            </h3>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Enter your answer..."
                    className="min-h-[100px] bg-background/50 border-border focus:border-primary/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(index)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {answer ? (
                    <p className="text-foreground/90 whitespace-pre-wrap">{answer}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No answer provided yet</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    );
  };

  // Show loading state while fetching from database
  if (loadingFromDb) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your ICP answers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                ICP Review
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review and edit your Ideal Customer Profile answers
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || !hasUnsavedChanges}
            className={cn(
              "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90",
              !hasUnsavedChanges && "opacity-50"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {hasUnsavedChanges ? "Save Changes" : "All Saved"}
          </Button>
        </div>
      </div>

      {/* Completion Status */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isComplete ? "bg-green-500/20" : "bg-yellow-500/20"
            )}>
              {isComplete ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-display font-semibold",
                isComplete ? "text-green-400" : "text-yellow-400"
              )}>
                {isComplete ? "ICP Complete" : `${answeredCount}/${questions.length} Questions Answered`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isComplete
                  ? "All questions have been answered. You can edit any response below."
                  : "Complete all questions to unlock the full experience."}
              </p>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  isComplete ? "bg-green-400" : "bg-primary"
                )}
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Questions List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {questions.map((question, index) => renderQuestionCard(question, index))}
      </div>

      {/* Footer Actions */}
      <div className="max-w-4xl mx-auto mt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="border-border hover:border-primary/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        {hasUnsavedChanges && (
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All Changes
          </Button>
        )}
      </div>
    </div>
  );
}
