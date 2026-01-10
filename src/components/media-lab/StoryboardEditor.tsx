import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Image as ImageIcon, Type, Video } from "lucide-react";

interface Scene {
    id: string;
    type: 'video' | 'image' | 'text';
    content: string;
    duration: string;
}

export const StoryboardEditor = () => {
    const [scenes, setScenes] = useState<Scene[]>([
        { id: '1', type: 'video', content: 'Intro Hook', duration: '3s' },
        { id: '2', type: 'image', content: 'Product Shot', duration: '2s' },
        { id: '3', type: 'text', content: 'Value Prop Overlay', duration: '4s' },
    ]);

    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const newScenes = [...scenes];
        const draggedIndex = newScenes.findIndex(s => s.id === draggedId);
        const targetIndex = newScenes.findIndex(s => s.id === targetId);

        const [draggedItem] = newScenes.splice(draggedIndex, 1);
        newScenes.splice(targetIndex, 0, draggedItem);

        setScenes(newScenes);
        setDraggedId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-display text-g-heading">Storyboard</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric-indigo/10 text-electric-indigo text-xs font-medium hover:bg-electric-indigo/20 transition-colors">
                    <Plus className="w-3 h-3" />
                    Add Scene
                </button>
            </div>

            <div className="space-y-4">
                {scenes.map((scene, index) => (
                    <div
                        key={scene.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, scene.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, scene.id)}
                        className={cn(
                            "group relative flex items-center gap-4 p-4 rounded-xl bg-[#1A1B26] border border-electric-indigo/20 transition-all duration-300 shadow-[0_0_20px_rgba(94,106,210,0.05)]",
                            draggedId === scene.id ? "opacity-50 border-dashed border-electric-indigo" : "hover:border-electric-indigo hover:shadow-[0_0_25px_rgba(94,106,210,0.2)] hover:-translate-y-0.5"
                        )}
                    >
                        {/* Drag Handle */}
                        <div className="text-g-muted cursor-grab active:cursor-grabbing hover:text-g-text">
                            <GripVertical className="w-5 h-5" />
                        </div>

                        {/* Scene Number */}
                        <div className="w-6 h-6 rounded-full bg-void-depth flex items-center justify-center text-xs font-mono text-g-muted">
                            {index + 1}
                        </div>

                        {/* Content Preview */}
                        <div className="w-24 h-16 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 shadow-inner group-hover:border-electric-indigo/30 transition-colors">
                            {scene.type === 'video' && <Video className="w-6 h-6 text-g-muted group-hover:text-electric-indigo transition-colors" />}
                            {scene.type === 'image' && <ImageIcon className="w-6 h-6 text-g-muted group-hover:text-electric-indigo transition-colors" />}
                            {scene.type === 'text' && <Type className="w-6 h-6 text-g-muted group-hover:text-electric-indigo transition-colors" />}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                            <h4 className="font-medium text-g-text-inverse">{scene.content}</h4>
                            <p className="text-xs text-g-muted capitalize">{scene.type} • {scene.duration}</p>
                        </div>

                        {/* Magic Fill Trigger (Visual Only) */}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-full h-2 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-6 rounded-full bg-electric-cyan/20 flex items-center justify-center text-electric-cyan scale-0 group-hover:scale-100 transition-transform delay-100">
                                <Plus className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
