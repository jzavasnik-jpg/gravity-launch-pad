import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useProjectStore } from '@/store/projectStore';

export function ToneSlider() {
    const { toneValue, setToneValue, regenerateContent, regenerateHooks, isRegenerating } = useProjectStore();

    const handleValueChange = (vals: number[]) => {
        setToneValue(vals[0]);
    };

    const handleValueCommit = () => {
        // No auto-regenerate
    };

    return (
        <div className="flex flex-col gap-3 w-72 p-4 bg-card border border-border rounded-lg">
            <div className="flex justify-between items-center">
                <span className="text-base font-medium text-foreground">Tone & Voice</span>
                <span className="text-sm text-muted-foreground">{toneValue}%</span>
            </div>

            <Slider
                value={[toneValue]}
                onValueChange={handleValueChange}
                max={100}
                step={10}
                className="py-2"
                disabled={isRegenerating}
            />

            <div className="flex justify-between text-sm text-muted-foreground font-mono uppercase mb-1">
                <span>Serious</span>
                <span>Humorous</span>
            </div>

            <button
                onClick={() => regenerateHooks()}
                disabled={isRegenerating}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isRegenerating ? (
                    <>
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Regenerating Hooks...
                    </>
                ) : (
                    'Regenerate Hooks'
                )}
            </button>
        </div>
    );
}
