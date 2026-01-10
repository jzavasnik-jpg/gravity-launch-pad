import React from 'react';
import { Film, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Scene {
  id: string;
  label: string;
  script: string;
  duration: string;
  thumbnail?: string;
}

interface PhonePreviewProps {
  activeScene: Scene | null;
  allScenes: Scene[];
  isPlaying?: boolean;
  isMuted?: boolean;
  onTogglePlay?: () => void;
  onToggleMute?: () => void;
}

export function PhonePreview({
  activeScene,
  allScenes,
  isPlaying = false,
  isMuted = true,
  onTogglePlay,
  onToggleMute
}: PhonePreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Phone Frame - matches ThumbnailEditPage pattern */}
      <div className="relative">
        {/* Smartphone Frame */}
        <div className="w-[300px] aspect-[9/16] bg-background rounded-[2.5rem] border-[6px] border-muted overflow-hidden relative shadow-[0_0_60px_-15px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
          {/* Notch */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-background z-20 flex justify-center">
            <div className="w-28 h-5 bg-muted rounded-b-2xl" />
          </div>

          {/* Content Area */}
          <div className="h-full pt-7 bg-card flex flex-col relative overflow-hidden">
            {/* Video/Thumbnail Background */}
            {activeScene?.thumbnail ? (
              <img
                src={activeScene.thumbnail}
                alt="Scene preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-muted to-background flex items-center justify-center">
                <div className="text-center">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground font-sans">Preview</p>
                </div>
              </div>
            )}

            {/* Script Overlay - TikTok/Reels style captions */}
            {activeScene && activeScene.script && (
              <div className="absolute bottom-20 left-4 right-4 z-10">
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-foreground text-base font-display font-bold leading-tight text-center drop-shadow-lg">
                    {activeScene.script}
                  </p>
                </div>
              </div>
            )}

            {/* Segment Label Badge */}
            {activeScene && (
              <div className="absolute top-10 left-3 z-10">
                <span className="px-2 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider bg-primary/80 text-primary-foreground">
                  {activeScene.label}
                </span>
              </div>
            )}

            {/* Duration Badge */}
            {activeScene && (
              <div className="absolute top-10 right-3 z-10">
                <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-background/60 text-foreground">
                  {activeScene.duration}
                </span>
              </div>
            )}

            {/* TikTok-style Side Actions */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
              <div className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-foreground text-lg">❤️</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-foreground text-lg">💬</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-foreground text-lg">↗️</span>
              </div>
            </div>

            {/* Bottom Progress Indicators */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex gap-1">
                {allScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      scene.id === activeScene?.id
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Playback Controls - Below phone */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-card border border-border hover:bg-muted"
            onClick={onToggleMute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Scene Navigation Dots */}
      <div className="flex items-center gap-2 mt-6">
        {allScenes.map((scene) => (
          <button
            key={scene.id}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              scene.id === activeScene?.id
                ? "w-6 bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            title={scene.label}
          />
        ))}
      </div>
    </div>
  );
}

export default PhonePreview;
