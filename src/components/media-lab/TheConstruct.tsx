import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Sparkles, Zap, MessageSquare } from "lucide-react";

interface TheConstructProps {
    mode?: 'idle' | 'thinking' | 'speaking' | 'generating';
}

export const TheConstruct = ({ mode = 'idle' }: TheConstructProps) => {
    const [localMode, setLocalMode] = useState(mode);

    useEffect(() => {
        setLocalMode(mode);
    }, [mode]);

    return (
        <div className="relative flex flex-col items-center w-full">
            {/* The Entity */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                {/* Outer Field */}
                <div className={cn(
                    "absolute inset-0 rounded-full border border-electric-cyan/10 transition-all duration-1000",
                    localMode === 'thinking' ? "scale-110 border-electric-cyan/30 animate-pulse" : "scale-100"
                )} />

                {/* Core Geometry */}
                <div className="relative w-16 h-16">
                    {/* Layer 1: The Cube */}
                    <div className={cn(
                        "absolute inset-0 border border-electric-cyan/50 backdrop-blur-sm transition-all duration-700 ease-in-out",
                        localMode === 'idle' && "rotate-45 animate-construct-float",
                        localMode === 'thinking' && "rotate-180 scale-75 border-electric-amber",
                        localMode === 'generating' && "rotate-[360deg] scale-110 border-electric-indigo animate-spin"
                    )} />

                    {/* Layer 2: The Prism */}
                    <div className={cn(
                        "absolute inset-2 border border-electric-indigo/50 transition-all duration-700 ease-in-out",
                        localMode === 'idle' && "-rotate-12 animate-construct-pulse",
                        localMode === 'thinking' && "rotate-90 scale-125 border-electric-amber/50",
                        localMode === 'generating' && "rotate-[-360deg] scale-50 border-electric-cyan"
                    )} />

                    {/* Layer 3: The Spark (Center) */}
                    <div className={cn(
                        "absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-[0_0_15px_white] transition-all duration-300",
                        localMode === 'thinking' && "bg-electric-amber shadow-[0_0_20px_#FFC700]",
                        localMode === 'generating' && "bg-electric-cyan shadow-[0_0_30px_#00F0FF] scale-150"
                    )} />
                </div>
            </div>

            {/* Dialogue / Generative UI Area */}
            <div className="w-full space-y-3">
                {/* Chat Bubble */}
                <div className="bg-void-surface border border-glass-stroke p-4 rounded-xl relative group hover:border-electric-indigo/30 transition-colors">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-void-surface border-t border-l border-glass-stroke rotate-45" />

                    <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-electric-cyan mt-0.5 shrink-0" />
                        <div className="space-y-2">
                            <p className="text-sm text-g-text leading-relaxed">
                                I've analyzed the <span className="text-electric-indigo">retention graph</span>. The drop-off at 0:03 suggests the hook is too slow.
                            </p>

                            {/* Generative UI: Action Suggestion */}
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-electric-indigo/10 hover:bg-electric-indigo/20 text-xs text-electric-indigo transition-colors w-full border border-electric-indigo/20">
                                <Zap className="w-3 h-3" />
                                Apply "Pattern Interrupt" Hook
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contextual Tools (Generative UI) */}
                <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 rounded-lg bg-void-depth border border-glass-stroke hover:border-electric-cyan/30 text-xs text-g-muted hover:text-electric-cyan transition-colors flex flex-col items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>Rewrite</span>
                    </button>
                    <button className="p-2 rounded-lg bg-void-depth border border-glass-stroke hover:border-electric-amber/30 text-xs text-g-muted hover:text-electric-amber transition-colors flex flex-col items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>Viral Check</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
