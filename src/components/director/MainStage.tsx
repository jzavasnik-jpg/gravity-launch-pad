/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses PhonePreview for visual preview.
 * See DirectorsCut.tsx for the new implementation.
 */
import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useApp } from '@/context/AppContext';
import { Layers, Eye, Lock, Move, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Layer {
    id: string;
    name: string;
    type: 'guide' | 'mentee' | 'background' | 'asset';
    visible: boolean;
    locked: boolean;
    content?: string; // URL
}

export function MainStage() {
    const { campaignMode, visualMessengerState } = useProjectStore();
    const { appState } = useApp();
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

    // Initialize Layers based on Campaign Mode
    useEffect(() => {
        const initialLayers: Layer[] = [];

        // Background Layer (Always present)
        initialLayers.push({
            id: 'bg-layer',
            name: 'Background',
            type: 'background',
            visible: true,
            locked: true,
            content: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60' // Default abstract bg
        });

        if (campaignMode === 'direct_authority') {
            // Single Subject Layer
            initialLayers.push({
                id: 'subject-layer',
                name: 'Subject (You)',
                type: 'guide',
                visible: true,
                locked: false,
                content: visualMessengerState.currentUrl || 'https://github.com/shadcn.png'
            });
        } else {
            // Dual Character Layers
            initialLayers.push({
                id: 'mentee-layer',
                name: `Mentee (${appState.avatarData?.name || 'Avatar'})`,
                type: 'mentee',
                visible: true,
                locked: false,
                content: appState.avatarData?.photo_url
            });

            initialLayers.push({
                id: 'guide-layer',
                name: 'Guide (You)',
                type: 'guide',
                visible: true,
                locked: false,
                content: 'https://github.com/shadcn.png' // Mock user photo
            });
        }

        setLayers(initialLayers.reverse()); // Stack order: Top to Bottom
    }, [campaignMode, appState.avatarData, visualMessengerState]);

    const toggleVisibility = (id: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    };

    const toggleLock = (id: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
    };

    return (
        <div className="flex h-full bg-background">
            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center bg-muted/30 relative overflow-hidden p-8">
                <div className="aspect-video w-full max-w-4xl bg-card relative shadow-2xl border border-border rounded-lg overflow-hidden">
                    {/* Render Layers (Bottom to Top) */}
                    {[...layers].reverse().map(layer => (
                        layer.visible && (
                            <div
                                key={layer.id}
                                className={cn(
                                    "absolute inset-0 transition-all duration-300",
                                    layer.type === 'guide' && campaignMode === 'transformation_narrative' ? "w-1/2 left-1/2" : "", // Split screen logic mock
                                    layer.type === 'mentee' ? "w-1/2 left-0" : "",
                                    selectedLayerId === layer.id ? "ring-2 ring-primary z-10" : ""
                                )}
                                onClick={() => !layer.locked && setSelectedLayerId(layer.id)}
                            >
                                {layer.content ? (
                                    <img src={layer.content} alt={layer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Layer Panel (Right Sidebar) */}
            <div className="w-64 bg-background border-l border-border flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Layers</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {layers.map(layer => (
                        <div
                            key={layer.id}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors group",
                                selectedLayerId === layer.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
                            )}
                            onClick={() => setSelectedLayerId(layer.id)}
                        >
                            <div className="w-8 h-8 bg-card rounded overflow-hidden flex-shrink-0 border border-border">
                                {layer.content && <img src={layer.content} className="w-full h-full object-cover" />}
                            </div>
                            <span className={cn("flex-1 text-xs font-medium truncate", selectedLayerId === layer.id ? "text-primary" : "text-muted-foreground")}>
                                {layer.name}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}>
                                    <Eye className={cn("w-3 h-3", layer.visible ? "text-muted-foreground" : "text-muted-foreground/50")} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}>
                                    <Lock className={cn("w-3 h-3", layer.locked ? "text-muted-foreground" : "text-muted-foreground/50")} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
