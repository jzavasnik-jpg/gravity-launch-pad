import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Sparkles, Thermometer } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TEMPERATURE_DEFINITIONS } from '@/lib/six-s-constants';
import { Badge } from '@/components/ui/badge';

export function HookLab() {
    const { generatedHooks, selectedHookId, setSelectedHookId, isRegenerating, customHookText, setCustomHookText, contentStrategyState } = useProjectStore();
    const [isOpen, setIsOpen] = React.useState(true);

    // Get temperature context
    const selectedTemperature = contentStrategyState.selectedTemperature;
    const tempDef = selectedTemperature ? TEMPERATURE_DEFINITIONS[selectedTemperature] : null;

    if (generatedHooks.length === 0 && !isRegenerating) {
        return null; // Don't show if no hooks yet
    }

    return (
        <div className="border-b border-border bg-card">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-display font-medium text-foreground flex items-center gap-2">
                            Hook Lab
                            {isRegenerating && <Sparkles className="w-4 h-4 text-primary animate-spin ml-2" />}
                        </h3>
                        {tempDef && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-sm flex items-center gap-1",
                                    tempDef.color,
                                    tempDef.borderColor
                                )}
                            >
                                <span>{tempDef.emoji}</span>
                                {tempDef.label} Hooks
                            </Badge>
                        )}
                        <span className="text-muted-foreground text-sm font-normal">(AI Generated & Scored)</span>
                    </div>
                    <CollapsibleTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    {/* Temperature guidance banner */}
                    {tempDef && (
                        <div className={cn(
                            "mx-6 mt-4 p-3 rounded-lg border",
                            tempDef.bgColor,
                            tempDef.borderColor
                        )}>
                            <div className="flex items-start gap-2">
                                <Thermometer className={cn("w-5 h-5 mt-0.5 flex-shrink-0", tempDef.color)} />
                                <div className="text-sm">
                                    <p className={cn("font-medium mb-1", tempDef.color)}>
                                        {tempDef.hookDirection}
                                    </p>
                                    <p className="text-muted-foreground">
                                        CTA Style: <span className={tempDef.color}>{tempDef.ctaStyle}</span> — {tempDef.ctaExamples.slice(0, 2).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 space-y-3">
                        {isRegenerating ? (
                            <div className="space-y-3 opacity-50 pointer-events-none">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {generatedHooks.map((hook) => (
                                    <div
                                        key={hook.id}
                                        onClick={() => setSelectedHookId(hook.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group",
                                            selectedHookId === hook.id
                                                ? "bg-primary/10 border-primary/50"
                                                : "bg-muted/30 border-border hover:bg-muted/50 hover:border-border/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                            selectedHookId === hook.id
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground/50 group-hover:border-muted-foreground"
                                        )}>
                                            {selectedHookId === hook.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>

                                        <div className="flex-1 flex justify-between items-center gap-4">
                                            <span className={cn(
                                                "text-base",
                                                selectedHookId === hook.id ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {hook.text}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-sm font-mono whitespace-nowrap",
                                                    hook.score >= 90 ? "text-green-400" : "text-muted-foreground"
                                                )}>
                                                    {hook.score}
                                                </span>
                                                {selectedHookId === hook.id && (
                                                    <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Custom Hook Slot */}
                                <div
                                    onClick={() => setSelectedHookId('custom')}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group",
                                        selectedHookId === 'custom'
                                            ? "bg-primary/10 border-primary/50"
                                            : "bg-muted/30 border-border hover:bg-muted/50 hover:border-border/80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors mt-1",
                                        selectedHookId === 'custom'
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground/50 group-hover:border-muted-foreground"
                                    )}>
                                        {selectedHookId === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>

                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Write your own hook..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-base text-foreground placeholder:text-muted-foreground p-0"
                                            value={customHookText}
                                            onChange={(e) => setCustomHookText(e.target.value)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedHookId('custom');
                                            }}
                                        />
                                    </div>
                                    {selectedHookId === 'custom' && (
                                        <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
