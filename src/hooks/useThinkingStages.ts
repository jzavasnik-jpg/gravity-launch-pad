import { useState, useCallback, useRef } from 'react';
import type { ThinkingStage } from '@/components/ui/ThinkingStages';

interface UseThinkingStagesOptions {
    stages: ThinkingStage[];
    onComplete?: () => void;
}

interface UseThinkingStagesReturn {
    currentStageIndex: number;
    completedStages: string[];
    isComplete: boolean;
    isRunning: boolean;
    startStages: () => void;
    advanceStage: () => void;
    completeCurrentStage: () => void;
    reset: () => void;
    runWithStages: <T>(task: () => Promise<T>) => Promise<T>;
}

/**
 * Hook to manage thinking stages state and progression
 *
 * Usage:
 * ```tsx
 * const { runWithStages, ...stageProps } = useThinkingStages({
 *   stages: SIX_S_ANALYSIS_STAGES,
 *   onComplete: () => console.log('Done!')
 * });
 *
 * // In your async function:
 * const result = await runWithStages(async () => {
 *   return await fetchData();
 * });
 *
 * // In your JSX:
 * <ThinkingStages stages={stages} {...stageProps} />
 * ```
 */
export function useThinkingStages({ stages, onComplete }: UseThinkingStagesOptions): UseThinkingStagesReturn {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [completedStages, setCompletedStages] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const stageTimerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const reset = useCallback(() => {
        if (stageTimerRef.current) {
            clearTimeout(stageTimerRef.current);
        }
        setCurrentStageIndex(0);
        setCompletedStages([]);
        setIsComplete(false);
        setIsRunning(false);
    }, []);

    const startStages = useCallback(() => {
        reset();
        setIsRunning(true);
        startTimeRef.current = Date.now();
    }, [reset]);

    const advanceStage = useCallback(() => {
        setCurrentStageIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= stages.length) {
                return prev;
            }
            return nextIndex;
        });
    }, [stages.length]);

    const completeCurrentStage = useCallback(() => {
        const currentStage = stages[currentStageIndex];
        if (currentStage && !completedStages.includes(currentStage.id)) {
            setCompletedStages(prev => [...prev, currentStage.id]);
        }
    }, [currentStageIndex, completedStages, stages]);

    /**
     * Run an async task while progressing through stages
     * Stages advance based on minDuration or automatically when task completes
     */
    const runWithStages = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
        startStages();

        // Start automatic stage progression based on minDuration
        let stageIndex = 0;
        const progressStages = async () => {
            for (let i = 0; i < stages.length; i++) {
                stageIndex = i;
                setCurrentStageIndex(i);

                const stage = stages[i];
                const minDuration = stage.minDuration || 2000;

                // Wait for minimum duration
                await new Promise(resolve => {
                    stageTimerRef.current = setTimeout(resolve, minDuration);
                });

                // Mark stage as complete
                setCompletedStages(prev => [...prev, stage.id]);
            }
        };

        // Run task and stage progression in parallel
        const [result] = await Promise.all([
            task(),
            progressStages()
        ]);

        // Ensure all stages are marked complete
        setCompletedStages(stages.map(s => s.id));
        setIsComplete(true);
        setIsRunning(false);

        onComplete?.();

        return result;
    }, [stages, startStages, onComplete]);

    return {
        currentStageIndex,
        completedStages,
        isComplete,
        isRunning,
        startStages,
        advanceStage,
        completeCurrentStage,
        reset,
        runWithStages,
    };
}

/**
 * Simpler version that just tracks time-based progress
 * Good for when you can't control the async function directly
 */
export function useSimpleThinkingStages(stages: ThinkingStage[]) {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [completedStages, setCompletedStages] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const stageTimersRef = useRef<NodeJS.Timeout[]>([]);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        stageTimersRef.current.forEach(t => clearTimeout(t));
        stageTimersRef.current = [];
        setCurrentStageIndex(0);
        setCompletedStages([]);
        setIsComplete(false);
        setIsRunning(false);
    }, []);

    const start = useCallback(() => {
        reset();
        setIsRunning(true);

        let elapsed = 0;
        stages.forEach((stage, index) => {
            const duration = stage.minDuration || 2000;

            // Set current stage after cumulative delay
            const stageTimer = setTimeout(() => {
                setCurrentStageIndex(index);
            }, elapsed);
            stageTimersRef.current.push(stageTimer);

            // Mark stage as complete after its duration
            const completeTimer = setTimeout(() => {
                setCompletedStages(prev => [...prev, stage.id]);
            }, elapsed + duration);
            stageTimersRef.current.push(completeTimer);

            elapsed += duration;
        });

        // Mark complete after all stages
        timerRef.current = setTimeout(() => {
            setIsComplete(true);
            setIsRunning(false);
        }, elapsed);
    }, [stages, reset]);

    const complete = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        stageTimersRef.current.forEach(t => clearTimeout(t));
        setCompletedStages(stages.map(s => s.id));
        setCurrentStageIndex(stages.length - 1);
        setIsComplete(true);
        setIsRunning(false);
    }, [stages]);

    return {
        stages,
        currentStageIndex,
        completedStages,
        isComplete,
        isRunning,
        start,
        complete,
        reset,
    };
}
