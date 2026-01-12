'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Share2,
    Download,
    Youtube,
    Linkedin,
    Instagram,
    Facebook,
    Check,
    ArrowLeft,
    Film,
    Image,
    FileText,
    Play,
    Pause,
    Copy,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/projectStore';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

// Platform configuration with aspect ratios and specs
const PLATFORMS = [
    {
        id: 'youtube',
        name: "YouTube",
        icon: Youtube,
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'MP4 (H.264)',
        description: 'Long-form video content'
    },
    {
        id: 'youtube-shorts',
        name: "YouTube Shorts",
        icon: Youtube,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        format: 'MP4 (H.264)',
        description: 'Vertical short-form'
    },
    {
        id: 'linkedin',
        name: "LinkedIn",
        icon: Linkedin,
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'MP4 (H.264)',
        description: 'Professional feed content'
    },
    {
        id: 'facebook',
        name: "Facebook",
        icon: Facebook,
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'MP4 (H.264)',
        description: 'Feed and Reels'
    },
    {
        id: 'instagram-feed',
        name: "Instagram Feed",
        icon: Instagram,
        aspectRatio: '4:5',
        resolution: '1080x1350',
        format: 'MP4 (H.264)',
        description: 'Feed posts'
    },
    {
        id: 'instagram-reels',
        name: "Instagram Reels",
        icon: Instagram,
        aspectRatio: '9:16',
        resolution: '1080x1920',
        format: 'MP4 (H.264)',
        description: 'Vertical Reels'
    },
    {
        id: 'tiktok',
        name: "TikTok",
        icon: () => (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
        ),
        aspectRatio: '9:16',
        resolution: '1080x1920',
        format: 'MP4 (H.264)',
        description: 'Vertical videos'
    },
    {
        id: 'x',
        name: "X (Twitter)",
        icon: () => (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        ),
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'MP4 (H.264)',
        description: 'Video tweets'
    },
];

export default function ExportStudioPage() {
    const router = useRouter();
    const { setHeaderActions } = useApp();
    const {
        thumbnailState,
        directorsCutState,
        scriptBody,
        strategyContext,
        generatedHooks,
        selectedHookId
    } = useProjectStore();

    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube']);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'video' | 'thumbnail' | 'script'>('video');
    const [isPlaying, setIsPlaying] = useState(false);

    // Get data from store
    const { scenes, visualStyle } = directorsCutState;
    const { bgImage, hooks } = thumbnailState;
    const selectedHook = generatedHooks.find(h => h.id === selectedHookId);

    // Calculate total duration
    const totalDuration = scenes.reduce((acc, scene) => acc + (scene.durationEstimate || 0), 0);
    const scenesWithMedia = scenes.filter(s => s.generatedImageUrl || s.generatedVideoUrl);

    // Toggle platform selection
    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    // Handle export
    const handleExport = useCallback(() => {
        if (selectedPlatforms.length === 0) {
            toast.error("Please select at least one platform");
            return;
        }

        setIsExporting(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsExporting(false);
                    toast.success(`Export complete for ${selectedPlatforms.length} platform(s)!`);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);
    }, [selectedPlatforms]);

    // Copy script to clipboard
    const handleCopyScript = useCallback(() => {
        navigator.clipboard.writeText(scriptBody);
        toast.success("Script copied to clipboard!");
    }, [scriptBody]);

    // Inject header actions
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                    <p className="text-xs text-muted-foreground">Selected Platforms</p>
                    <p className="text-sm font-mono text-foreground">{selectedPlatforms.length}</p>
                </div>
                <Button
                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                    onClick={handleExport}
                    disabled={isExporting || selectedPlatforms.length === 0}
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Export All
                        </>
                    )}
                </Button>
            </div>
        );

        return () => setHeaderActions(null);
    }, [selectedPlatforms, isExporting, handleExport, setHeaderActions]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Sub-header with back navigation */}
            <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/veritas/directors-cut')}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-semibold text-foreground">Export Studio</h1>
                        <p className="text-xs text-muted-foreground">Finalize and distribute your content</p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Preview & Assets */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: 'video', label: 'Video Preview', icon: Film },
                            { id: 'thumbnail', label: 'Thumbnail', icon: Image },
                            { id: 'script', label: 'Script', icon: FileText },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-primary/10 text-primary border border-primary/25'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content based on active tab */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'video' && (
                            <motion.div
                                key="video"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Video Preview */}
                                <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl overflow-hidden shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
                                    <div className="aspect-video bg-black relative group">
                                        {scenesWithMedia.length > 0 ? (
                                            <>
                                                <img
                                                    src={scenesWithMedia[0]?.generatedImageUrl || bgImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Play overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setIsPlaying(!isPlaying)}
                                                        className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_30px_rgba(79,209,255,0.5)]"
                                                    >
                                                        {isPlaying ? (
                                                            <Pause className="w-6 h-6 text-primary-foreground" />
                                                        ) : (
                                                            <Play className="w-6 h-6 text-primary-foreground ml-1" />
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                                <Film className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-sans">No video content generated yet</p>
                                                <p className="text-xs mt-1">Generate images in Director's Cut first</p>
                                            </div>
                                        )}

                                        {/* Export Progress Overlay */}
                                        {isExporting && (
                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                                                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mb-4">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 0.1 }}
                                                    />
                                                </div>
                                                <span className="text-sm font-mono text-primary animate-pulse">
                                                    Rendering... {progress}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Info Bar */}
                                    <div className="p-4 border-t border-border bg-card">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-display font-semibold text-foreground">
                                                    {strategyContext?.avatarName || 'Untitled'} - {selectedHook?.text?.slice(0, 30) || 'Content'}...
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {scenes.length} scenes • {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')} duration • {visualStyle} style
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    scenesWithMedia.length === scenes.length
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                }`}>
                                                    {scenesWithMedia.length}/{scenes.length} Ready
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scene Thumbnails */}
                                <div>
                                    <h3 className="text-sm font-display font-semibold text-foreground mb-3">Scene Timeline</h3>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {scenes.map((scene, index) => (
                                            <div
                                                key={scene.id}
                                                className="flex-shrink-0 w-32 bg-card border border-border rounded-lg overflow-hidden"
                                            >
                                                <div className="aspect-video bg-muted relative">
                                                    {scene.generatedImageUrl ? (
                                                        <img
                                                            src={scene.generatedImageUrl}
                                                            alt={`Scene ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Film className="w-6 h-6 text-muted-foreground/50" />
                                                        </div>
                                                    )}
                                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-mono text-white">
                                                        {scene.label}
                                                    </span>
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {scene.script?.slice(0, 40)}...
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'thumbnail' && (
                            <motion.div
                                key="thumbnail"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Thumbnail Preview */}
                                <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl overflow-hidden shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
                                    <div className="aspect-video bg-black relative">
                                        {bgImage && !bgImage.includes('placehold') ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={bgImage}
                                                    alt="Thumbnail"
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Render hook layers */}
                                                {hooks.map((hook) => (
                                                    <div
                                                        key={hook.id}
                                                        className="absolute"
                                                        style={{
                                                            left: `${hook.x * 100}%`,
                                                            top: `${hook.y * 100}%`,
                                                            transform: `translate(-50%, -50%) scale(${hook.scale})`,
                                                            width: '40%'
                                                        }}
                                                    >
                                                        <img
                                                            src={hook.url}
                                                            alt="Hook"
                                                            className="w-full h-auto"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                                <Image className="w-12 h-12 mb-3 opacity-50" />
                                                <p className="text-sm font-sans">No thumbnail generated yet</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => router.push('/veritas/thumbnail-composer')}
                                                >
                                                    Create Thumbnail
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-border bg-card">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-display font-semibold text-foreground">
                                                    Thumbnail
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {hooks.length} text layer(s)
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push('/veritas/thumbnail-composer')}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'script' && (
                            <motion.div
                                key="script"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Script Preview */}
                                <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl overflow-hidden shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
                                    <div className="p-4 border-b border-border flex items-center justify-between">
                                        <h3 className="text-sm font-display font-semibold text-foreground">
                                            Full Script
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyScript}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="p-4 max-h-96 overflow-y-auto">
                                        {scriptBody ? (
                                            <div className="space-y-4">
                                                {scenes.map((scene, index) => (
                                                    <div key={scene.id} className="border-l-2 border-primary/30 pl-4">
                                                        <span className="text-xs font-mono text-primary uppercase">
                                                            {scene.label}
                                                        </span>
                                                        <p className="text-sm text-foreground mt-1 font-sans leading-relaxed">
                                                            {scene.script}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm font-sans">No script generated yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Panel - Platform Selection */}
                <div className="w-96 border-l border-border bg-card/50 p-6 overflow-y-auto">
                    <h2 className="text-lg font-display font-semibold text-foreground mb-1">Platform Presets</h2>
                    <p className="text-xs text-muted-foreground mb-6">Select platforms to export optimized versions</p>

                    <div className="space-y-2">
                        {PLATFORMS.map((platform) => {
                            const isSelected = selectedPlatforms.includes(platform.id);
                            const IconComponent = platform.icon;

                            return (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`w-full p-4 rounded-xl border flex items-start gap-3 transition-all ${
                                        isSelected
                                            ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_-5px_rgba(79,209,255,0.3)]'
                                            : 'bg-card border-border hover:border-primary/20 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'bg-primary/20' : 'bg-muted'
                                    }`}>
                                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-display font-medium ${
                                                isSelected ? 'text-foreground' : 'text-muted-foreground'
                                            }`}>
                                                {platform.name}
                                            </span>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {platform.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {platform.aspectRatio}
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {platform.resolution}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Export Info */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                        <h3 className="text-sm font-display font-medium text-foreground mb-2">Export Summary</h3>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Platforms selected</span>
                                <span className="font-mono text-foreground">{selectedPlatforms.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Video duration</span>
                                <span className="font-mono text-foreground">{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Scenes ready</span>
                                <span className="font-mono text-foreground">{scenesWithMedia.length}/{scenes.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-3">
                        <Button
                            className="w-full bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90 h-12"
                            onClick={handleExport}
                            disabled={isExporting || selectedPlatforms.length === 0}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing... {progress}%
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Video
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-border hover:border-primary/40 hover:bg-primary/5 h-12"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Link
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
