import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Brain, Sparkles, Lightbulb, Target, Zap, Search, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThinkingStage {
    id: string;
    label: string;
    description?: string;
    icon?: 'brain' | 'sparkles' | 'lightbulb' | 'target' | 'zap' | 'search' | 'chart';
    minDuration?: number; // Minimum time to show this stage (ms)
}

interface ThinkingStagesProps {
    stages: ThinkingStage[];
    currentStageIndex: number;
    completedStages: string[];
    isComplete: boolean;
    title?: string;
    subtitle?: string;
    completeTitle?: string;
    completeSubtitle?: string;
    className?: string;
}

const STAGE_ICONS = {
    brain: Brain,
    sparkles: Sparkles,
    lightbulb: Lightbulb,
    target: Target,
    zap: Zap,
    search: Search,
    chart: BarChart,
};

export function ThinkingStages({
    stages,
    currentStageIndex,
    completedStages,
    isComplete,
    title = "Deep Analysis in Progress...",
    subtitle = "Our AI is carefully analyzing your data",
    completeTitle = "Analysis Complete!",
    completeSubtitle = "Results are ready",
    className
}: ThinkingStagesProps) {
    return (
        <div className={cn("w-full max-w-md mx-auto space-y-6", className)}>
            {/* Header with animated icon */}
            <div className="text-center space-y-4">
                <motion.div
                    className={cn(
                        "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center transition-all duration-500",
                        isComplete
                            ? "bg-emerald-500/20 border border-emerald-500/30"
                            : "bg-primary/20 border border-primary/30"
                    )}
                    animate={isComplete ? {} : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {isComplete ? (
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    ) : (
                        <Brain className="w-10 h-10 text-primary animate-pulse" />
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={isComplete ? 'complete' : 'progress'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-xl font-display font-bold text-foreground">
                            {isComplete ? completeTitle : title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isComplete ? completeSubtitle : subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Steps */}
            <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-5 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                <div className="space-y-2">
                    {stages.map((stage, index) => {
                        const isCompleted = completedStages.includes(stage.id);
                        const isCurrent = index === currentStageIndex && !isComplete;
                        const isPending = !isCompleted && !isCurrent;
                        const IconComponent = stage.icon ? STAGE_ICONS[stage.icon] : null;

                        return (
                            <motion.div
                                key={stage.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                                    isCompleted && "bg-emerald-500/10",
                                    isCurrent && "bg-primary/10 border border-primary/20"
                                )}
                            >
                                {/* Status Icon */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                                    isCompleted && "bg-emerald-500",
                                    isCurrent && "bg-primary",
                                    isPending && "bg-muted"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    ) : IconComponent ? (
                                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground font-medium">{index + 1}</span>
                                    )}
                                </div>

                                {/* Label and Description */}
                                <div className="flex-1 min-w-0">
                                    <span className={cn(
                                        "text-sm font-medium block transition-colors",
                                        isCompleted && "text-emerald-400",
                                        isCurrent && "text-primary",
                                        isPending && "text-muted-foreground"
                                    )}>
                                        {stage.label}
                                    </span>
                                    {stage.description && isCurrent && (
                                        <motion.span
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-xs text-muted-foreground/70 block mt-0.5"
                                        >
                                            {stage.description}
                                        </motion.span>
                                    )}
                                </div>

                                {/* Thinking indicator for current stage */}
                                {isCurrent && (
                                    <motion.div
                                        className="flex gap-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: i * 0.2,
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                        width: isComplete
                            ? '100%'
                            : `${((completedStages.length + 0.5) / stages.length) * 100}%`
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

// Preset stage configurations for common use cases
export const MARKET_INTEL_STAGES: ThinkingStage[] = [
    { id: 'queries', label: 'Generating search queries', description: 'Creating targeted queries from your ICP', icon: 'search', minDuration: 2000 },
    { id: 'youtube', label: 'Scanning YouTube comments', description: 'Finding relevant discussions', icon: 'sparkles', minDuration: 3000 },
    { id: 'google', label: 'Searching forums & Q&A', description: 'Quora, Stack Exchange, Medium', icon: 'search', minDuration: 2500 },
    { id: 'reddit', label: 'Analyzing Reddit sentiment', description: 'Aggregating community insights', icon: 'chart', minDuration: 2000 },
    { id: 'scoring', label: 'Scoring relevance', description: 'Filtering by ICP alignment', icon: 'target', minDuration: 1500 },
];

export const SIX_S_ANALYSIS_STAGES: ThinkingStage[] = [
    { id: 'collect', label: 'Collecting voice of customer data', icon: 'search', minDuration: 1500 },
    { id: 'analyze', label: 'Deep analysis of emotional patterns', description: 'Using advanced reasoning', icon: 'brain', minDuration: 4000 },
    { id: 'score', label: 'Scoring Six S emotional gaps', description: 'Significance, Safe, Supported...', icon: 'chart', minDuration: 3000 },
    { id: 'evidence', label: 'Extracting market evidence', icon: 'lightbulb', minDuration: 2000 },
    { id: 'prioritize', label: 'Prioritizing opportunities', icon: 'target', minDuration: 1500 },
];

export const STRATEGY_GENERATION_STAGES: ThinkingStage[] = [
    { id: 'context', label: 'Building psychological profile', description: 'Core desires & emotional needs', icon: 'brain', minDuration: 2000 },
    { id: 'framework', label: 'Selecting content framework', description: 'Analyzing market fit', icon: 'lightbulb', minDuration: 3000 },
    { id: 'triggers', label: 'Crafting psychological triggers', description: 'Evidence-based hooks', icon: 'zap', minDuration: 3500 },
    { id: 'headlines', label: 'Generating headlines & CTAs', icon: 'sparkles', minDuration: 2500 },
    { id: 'refine', label: 'Refining recommendations', icon: 'target', minDuration: 2000 },
];

export const PAA_GENERATION_STAGES: ThinkingStage[] = [
    { id: 'context', label: 'Analyzing marketing context', icon: 'brain', minDuration: 1500 },
    { id: 'generate', label: 'Generating search questions', description: 'What your audience asks', icon: 'search', minDuration: 2500 },
    { id: 'validate', label: 'Validating relevance', icon: 'target', minDuration: 1500 },
];

// Deep Research stages - for AI-powered grounded web research
// Total time ~50-60 seconds for comprehensive research
export const DEEP_RESEARCH_STAGES: ThinkingStage[] = [
    { id: 'context', label: 'Building ICP context package', description: 'Compiling avatar, pain points & goals', icon: 'brain', minDuration: 4000 },
    { id: 'search', label: 'Deep web research', description: 'AI is searching Reddit, Quora, forums...', icon: 'search', minDuration: 18000 },
    { id: 'analyze', label: 'Analyzing emotional patterns', description: 'Mapping to Six S Framework', icon: 'sparkles', minDuration: 14000 },
    { id: 'evidence', label: 'Extracting voice of customer', description: 'Finding real quotes & pain points', icon: 'lightbulb', minDuration: 12000 },
    { id: 'strategy', label: 'Generating strategic insights', description: 'Content angles & opportunities', icon: 'target', minDuration: 8000 },
];
