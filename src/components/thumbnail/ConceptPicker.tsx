import React from 'react';
import { ThumbnailConcept } from '@/types/thumbnail';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptPickerProps {
    concepts: ThumbnailConcept[];
    onSelect: (concept: ThumbnailConcept) => void;
    isGenerating: boolean;
}

export function ConceptPicker({ concepts, onSelect, isGenerating }: ConceptPickerProps) {
    return (
        <div className="w-full p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-display text-white">Choose Your Angle</h2>
                <p className="text-zinc-400">AI has analyzed your script and proposed 3 strategic directions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {concepts.map((concept, index) => (
                    <Card
                        key={concept.id}
                        className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 group relative overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="bg-black/50 border-white/10 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                                    Option {String.fromCharCode(65 + index)}
                                </Badge>
                                <Badge className="bg-purple-500/10 text-purple-400 border-0 font-mono text-[10px]">
                                    {concept.id.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-display text-xl text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                    {concept.title || `Concept ${String.fromCharCode(65 + index)}`}
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {concept.description}
                                </p>
                            </div>

                            {concept.hook_text && (
                                <div className="p-3 bg-black/50 rounded border border-white/5 space-y-1">
                                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Suggested Hook (Editable)</span>
                                    <input
                                        type="text"
                                        defaultValue={concept.hook_text}
                                        className="w-full bg-transparent border-b border-white/20 text-white font-bold font-sans tracking-tight focus:outline-none focus:border-purple-500 py-1"
                                        onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking input
                                        onChange={(e) => {
                                            // We'll attach the edited hook to the concept object in memory
                                            // This is a bit hacky but avoids complex state lifting for now
                                            concept.hook_text = e.target.value;
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer / Action */}
                        <div className="p-6 pt-0 mt-auto">
                            <Button
                                onClick={() => onSelect(concept)}
                                disabled={isGenerating}
                                className="w-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 hover:border-white transition-all group-hover:bg-white group-hover:text-black"
                            >
                                {isGenerating ? (
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Select Concept <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
