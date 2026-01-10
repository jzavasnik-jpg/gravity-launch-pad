import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenerationStep {
    id: string;
    label: string;
}

interface StepProgressLoaderProps {
    title: string;
    subtitle?: string;
    steps: GenerationStep[];
    currentStepIndex: number;
    completedSteps: string[];
    isComplete?: boolean;
    completeTitle?: string;
    completeSubtitle?: string;
    className?: string;
}

export function StepProgressLoader({
    title,
    subtitle,
    steps,
    currentStepIndex,
    completedSteps,
    isComplete = false,
    completeTitle = "Complete!",
    completeSubtitle,
    className
}: StepProgressLoaderProps) {
    return (
        <div className={cn("w-full max-w-md space-y-6", className)}>
            {/* Header with animated icon */}
            <div className="text-center space-y-3">
                <div className={cn(
                    "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-500",
                    isComplete
                        ? "bg-emerald-500/20"
                        : "bg-primary/20 animate-pulse"
                )}>
                    {isComplete ? (
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    ) : (
                        <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    )}
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">
                    {isComplete ? completeTitle : title}
                </h2>
                {(subtitle || completeSubtitle) && (
                    <p className="text-sm text-muted-foreground">
                        {isComplete ? completeSubtitle : subtitle}
                    </p>
                )}
            </div>

            {/* Progress Steps */}
            <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-4 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                <div className="space-y-2">
                    {steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = index === currentStepIndex && !isComplete;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300",
                                    isCompleted && "bg-emerald-500/10",
                                    isCurrent && "bg-primary/10"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                                    isCompleted && "bg-emerald-500",
                                    isCurrent && "bg-primary animate-pulse",
                                    !isCompleted && !isCurrent && "bg-muted"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    isCompleted && "text-emerald-400",
                                    isCurrent && "text-primary",
                                    !isCompleted && !isCurrent && "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Helper hook for managing step progress with simulated timing
export function useStepProgress(steps: GenerationStep[], isActive: boolean) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    useEffect(() => {
        if (!isActive) {
            // Reset when not active
            setCurrentStepIndex(0);
            setCompletedSteps([]);
            return;
        }

        // Simulate step progression
        const stepDuration = 1500; // 1.5 seconds per step
        let stepIndex = 0;

        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                // Mark current step as completed
                setCompletedSteps(prev => [...prev, steps[stepIndex].id]);
                stepIndex++;
                setCurrentStepIndex(stepIndex);
            } else {
                clearInterval(interval);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [isActive, steps]);

    return { currentStepIndex, completedSteps };
}

// Full-screen overlay variant
interface StepProgressOverlayProps extends StepProgressLoaderProps {
    isVisible: boolean;
}

export function StepProgressOverlay({ isVisible, ...props }: StepProgressOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-8 shadow-[0_0_60px_-10px_rgba(79,209,255,0.3)]">
                <StepProgressLoader {...props} />
            </div>
        </div>
    );
}
