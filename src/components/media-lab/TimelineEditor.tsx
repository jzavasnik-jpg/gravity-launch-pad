import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ZoomIn, ZoomOut, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TimelineEditor = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Mock timeline data
    const tracks = [
        {
            id: 'video-1',
            type: 'video',
            name: 'Video Track',
            clips: [
                { id: 'c1', start: 0, duration: 5, color: 'bg-electric-indigo', name: 'Scene 1' },
                { id: 'c2', start: 5, duration: 4, color: 'bg-electric-cyan', name: 'Scene 2' },
                { id: 'c3', start: 9, duration: 6, color: 'bg-electric-rose', name: 'Scene 3' },
            ]
        },
        {
            id: 'audio-1',
            type: 'audio',
            name: 'Voiceover',
            clips: [
                { id: 'a1', start: 0, duration: 15, color: 'bg-electric-amber', name: 'AI Voiceover' }
            ]
        }
    ];

    return (
        <div className="h-full flex flex-col text-g-text select-none">
            {/* Toolbar */}
            <div className="h-10 border-b border-glass-stroke flex items-center px-4 justify-between bg-void-surface/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono ml-2 text-electric-cyan">
                        00:00:{currentTime.toString().padStart(2, '0')} / 00:00:15
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 border-r border-white/10 pr-4">
                        <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Split Clip">
                            <Scissors className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <ZoomOut className="w-3 h-3 text-g-muted" />
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                            className="w-20 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-electric-indigo"
                        />
                        <ZoomIn className="w-3 h-3 text-g-muted" />
                    </div>
                </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-void-depth">
                {/* Time Ruler */}
                <div className="h-6 border-b border-white/5 sticky top-0 bg-void-depth z-10 flex">
                    <div className="w-24 shrink-0 border-r border-white/5 bg-void-surface/30" />
                    <div className="flex-1 relative">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-white/5 text-[9px] text-g-muted pl-1 pt-1" style={{ left: `${i * 10 * zoomLevel}%` }}>
                                00:{i.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Track List */}
                <div className="flex flex-col">
                    {tracks.map(track => (
                        <div key={track.id} className="flex h-20 border-b border-white/5 group">
                            {/* Track Header */}
                            <div className="w-24 shrink-0 border-r border-white/5 bg-void-surface/30 p-2 flex flex-col justify-center gap-1">
                                <span className="text-xs font-medium truncate">{track.name}</span>
                                <div className="flex gap-1">
                                    <Volume2 className="w-3 h-3 text-g-muted cursor-pointer hover:text-white" />
                                </div>
                            </div>

                            {/* Track Content */}
                            <div className="flex-1 relative bg-black/20">
                                {track.clips.map(clip => (
                                    <div
                                        key={clip.id}
                                        className={cn(
                                            "absolute top-2 bottom-2 rounded-md border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-all",
                                            clip.color,
                                            track.type === 'audio' ? 'opacity-80' : 'opacity-100'
                                        )}
                                        style={{
                                            left: `${clip.start * 5 * zoomLevel}%`,
                                            width: `${clip.duration * 5 * zoomLevel}%`
                                        }}
                                    >
                                        <span className="text-[10px] font-bold text-white drop-shadow-md truncate px-1">
                                            {clip.name}
                                        </span>

                                        {/* Fake Waveform for Audio */}
                                        {track.type === 'audio' && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-30 gap-0.5">
                                                {[...Array(20)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 bg-white rounded-full"
                                                        style={{ height: `${30 + Math.random() * 60}%` }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-electric-rose z-20 pointer-events-none"
                    style={{ left: `calc(6rem + ${currentTime * 5 * zoomLevel}%)` }} // 6rem is w-24 header width
                >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-electric-rose transform rotate-45" />
                </div>
            </div>
        </div>
    );
};
