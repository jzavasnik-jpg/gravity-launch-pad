/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses ScriptDoctorPanel for AI-powered script editing suggestions.
 * See DirectorsCut.tsx for the new implementation.
 */
import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Video, Move3d, Layers, Image as ImageIcon } from 'lucide-react';

export function ActionPanel() {
    const { directorsCutState } = useProjectStore();
    const { activeSceneId, selectedLayerId, layers = [], scenes = [] } = directorsCutState || {};

    const selectedLayer = layers?.find(l => l.id === selectedLayerId);
    const activeScene = scenes?.find(s => s.id === activeSceneId);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 border-b border-border flex items-center px-4 bg-card">
                <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                    {selectedLayerId ? (
                        <>
                            <Layers className="w-4 h-4 text-primary" />
                            Layer Properties
                        </>
                    ) : (
                        <>
                            <Video className="w-4 h-4 text-primary" />
                            Scene Settings
                        </>
                    )}
                </h2>
            </div>

            <div className="flex-1 p-4 space-y-6">
                {selectedLayerId && selectedLayer ? (
                    // STATE B: Layer Selected
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Layer Name</Label>
                            <div className="text-sm font-medium text-foreground">{selectedLayer.name}</div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Asset Source</Label>
                            <div className="aspect-square w-full bg-muted rounded-lg border border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Click to Swap Asset</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Transform</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted p-2 rounded border border-border">
                                    <span className="text-[10px] text-muted-foreground block">Scale</span>
                                    <span className="text-sm font-mono text-foreground">100%</span>
                                </div>
                                <div className="bg-muted p-2 rounded border border-border">
                                    <span className="text-[10px] text-muted-foreground block">Rotation</span>
                                    <span className="text-sm font-mono text-foreground">0°</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STATE A: Scene Selected (Default)
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                        {activeScene ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">AI Visual Description</Label>
                                    <Textarea
                                        className="h-32 bg-muted border-border text-sm resize-none focus:ring-primary/50"
                                        placeholder="Describe the scene..."
                                        value={activeScene.script}
                                        readOnly // Identifying only for now
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Motion Presets</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 hover:text-foreground justify-start">
                                            <Move3d className="w-3 h-3 mr-2 text-primary" />
                                            Slow Zoom
                                        </Button>
                                        <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 hover:text-foreground justify-start">
                                            <Move3d className="w-3 h-3 mr-2 text-green-400" />
                                            Pan Follow
                                        </Button>
                                        <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 hover:text-foreground justify-start">
                                            <Move3d className="w-3 h-3 mr-2 text-orange-400" />
                                            Orbit
                                        </Button>
                                        <Button variant="outline" size="sm" className="bg-muted border-border hover:bg-muted/80 hover:text-foreground justify-start">
                                            <Move3d className="w-3 h-3 mr-2 text-pink-400" />
                                            Handheld
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Subject Action</Label>
                                    <Select>
                                        <SelectTrigger className="bg-muted border-border text-foreground">
                                            <SelectValue placeholder="Select action..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="talking">Talking to Camera</SelectItem>
                                            <SelectItem value="pointing">Pointing at Product</SelectItem>
                                            <SelectItem value="nodding">Nodding Agreement</SelectItem>
                                            <SelectItem value="typing">Typing on Laptop</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center pt-8">Select a scene from the timeline to edit.</div>
                        )}

                        <div className="pt-4 border-t border-border">
                            <Button className="w-full bg-gradient-to-r from-primary to-indigo-500 hover:opacity-90 text-primary-foreground border-0 shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]">
                                <Wand2 className="w-4 h-4 mr-2" />
                                Render Scene
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
