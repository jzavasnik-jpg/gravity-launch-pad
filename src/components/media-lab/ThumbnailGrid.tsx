import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Edit2, Wand2, Play, Download, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Thumbnail {
    id: string;
    url: string;
    title: string;
    ctr: number;
    prompt?: string;
    platform?: string;
    created_at: string;
}

interface ThumbnailGridProps {
    thumbnails: Thumbnail[];
}

import { AssetEditor } from './AssetEditor';

export const ThumbnailGrid = ({ thumbnails }: ThumbnailGridProps) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {thumbnails.map((thumbnail) => (
                    <Card key={thumbnail.id} className="bg-black/40 border-purple-500/20 overflow-hidden group hover:border-purple-500/50 transition-all">
                        <div className="aspect-video relative overflow-hidden">
                            <img
                                src={thumbnail.url}
                                alt={thumbnail.prompt || thumbnail.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPreviewImage(thumbnail.url)}
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Motion Preview
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => window.open(thumbnail.url, '_blank')}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">{thumbnail.prompt || thumbnail.title}</p>
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                                    {thumbnail.platform || 'YouTube'}
                                </Badge>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(thumbnail.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Motion Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-purple-500/30" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/80"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Ken Burns Effect Container */}
                        <div className="w-full h-full overflow-hidden">
                            <img
                                src={previewImage}
                                alt="Motion Preview"
                                className="w-full h-full object-cover animate-ken-burns"
                                style={{
                                    animation: 'ken-burns 15s ease-out infinite alternate'
                                }}
                            />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                            <h3 className="text-xl font-bold text-white mb-2">Motion Preview</h3>
                            <p className="text-sm text-gray-300">Simulating video intro movement...</p>
                        </div>
                    </div>
                    <style>{`
                        @keyframes ken-burns {
                            0% { transform: scale(1.0) translate(0, 0); }
                            100% { transform: scale(1.15) translate(-2%, -2%); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

