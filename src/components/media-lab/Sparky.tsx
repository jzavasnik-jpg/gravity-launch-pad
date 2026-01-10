import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { MessageSquare, Zap, Sparkles } from "lucide-react";

interface SparkyProps {
    mode?: 'idle' | 'thinking' | 'speaking' | 'excited';
    onGenerate?: () => void;
}

export const Sparky = ({ mode = 'idle', onGenerate }: SparkyProps) => {
    const [localMode, setLocalMode] = useState(mode);
    const [blink, setBlink] = useState(false);
    const [lookDirection, setLookDirection] = useState({ x: 0, y: 0 });

    // Sync props
    useEffect(() => {
        setLocalMode(mode);
    }, [mode]);

    // Random blinking
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                setBlink(true);
                setTimeout(() => setBlink(false), 150);
            }
        }, 3000);
        return () => clearInterval(blinkInterval);
    }, []);

    // Random looking around
    useEffect(() => {
        const lookInterval = setInterval(() => {
            if (Math.random() > 0.6 && localMode === 'idle') {
                setLookDirection({
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 5
                });
                setTimeout(() => setLookDirection({ x: 0, y: 0 }), 1000);
            }
        }, 4000);
        return () => clearInterval(lookInterval);
    }, [localMode]);

    return (
        <div className="relative flex flex-col items-center w-full">
            {/* Sparky's Head */}
            {/* Sparky's Container - Holographic Emitter */}
            <div className={cn(
                "relative w-64 h-64 flex items-center justify-center transition-transform duration-300",
                localMode === 'thinking' && "animate-bounce",
                localMode === 'excited' && "scale-110"
            )}>
                {/* Holographic Glow */}
                <div className="absolute inset-0 bg-electric-indigo/20 blur-3xl rounded-full animate-pulse" />

                {/* The Asset (Flipped) */}
                <div className="relative w-full h-full">
                    <img
                        src="/sparky.png"
                        alt="Sparky"
                        className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-x-[-1]"
                    />

                    {/* Overlay Eyes for Animation */}
                    <div className="absolute top-[42%] left-[45%] w-16 h-8 flex gap-3 z-20 transform -translate-x-1/2 -rotate-3">
                        {/* Left Eye */}
                        <div
                            className={cn(
                                "w-4 h-6 bg-electric-cyan rounded-full shadow-[0_0_10px_#00F0FF] transition-all duration-100",
                                blink ? "h-1 mt-3" : "",
                                localMode === 'thinking' && "animate-pulse h-3 w-3 rounded-sm",
                                localMode === 'excited' && "h-5 w-5 rounded-full"
                            )}
                            style={{ transform: `translate(${lookDirection.x}px, ${lookDirection.y}px)` }}
                        />
                        {/* Right Eye */}
                        <div
                            className={cn(
                                "w-4 h-6 bg-electric-cyan rounded-full shadow-[0_0_10px_#00F0FF] transition-all duration-100",
                                blink ? "h-1 mt-3" : "",
                                localMode === 'thinking' && "animate-pulse h-3 w-3 rounded-sm",
                                localMode === 'excited' && "h-5 w-5 rounded-full"
                            )}
                            style={{ transform: `translate(${lookDirection.x}px, ${lookDirection.y}px)` }}
                        />
                    </div>
                </div>

                {/* Status Indicator (Floating above head) */}
                <div className={cn(
                    "absolute top-4 right-12 w-3 h-3 rounded-full bg-electric-cyan shadow-[0_0_10px_#00F0FF] z-20 transition-all duration-300",
                    localMode === 'thinking' && "bg-electric-amber shadow-[0_0_10px_#FFC700] scale-125 animate-ping",
                    localMode === 'excited' && "bg-electric-rose shadow-[0_0_10px_#FF2E63] scale-125"
                )} />
            </div>

            {/* Dialogue Bubble */}
            <div className="mt-6 w-full relative group">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-void-surface border-t border-l border-glass-stroke rotate-45 z-10" />

                <div className="bg-void-surface border border-glass-stroke p-4 rounded-xl shadow-lg relative z-0 hover:border-electric-indigo/30 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            {localMode === 'excited' ? <Sparkles className="w-4 h-4 text-electric-amber" /> : <MessageSquare className="w-4 h-4 text-electric-indigo" />}
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-g-text leading-relaxed">
                                {localMode === 'idle' && "Yo! That hook is kinda boring. Want me to spice it up? 🌶️"}
                                {localMode === 'thinking' && "Hold on, crunching the viral data... 🧠"}
                                {localMode === 'excited' && "OMG! This thumbnail is gonna crush it! 🔥"}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={onGenerate}
                                    className="flex-1 py-1.5 rounded-lg bg-electric-indigo/10 hover:bg-electric-indigo/20 text-xs text-electric-indigo font-medium transition-colors border border-electric-indigo/20"
                                >
                                    Yes, spice it up!
                                </button>
                                <button className="px-3 py-1.5 rounded-lg bg-void-depth border border-glass-stroke hover:bg-void-depth/80 text-xs text-g-muted transition-colors">
                                    Nah
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
