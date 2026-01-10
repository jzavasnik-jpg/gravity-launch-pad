import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Image as ImageIcon,
  Film,
  Wand2,
  Settings,
  PlayCircle,
  Palette,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene, SceneStatus } from '@/store/projectStore';

export type VisualStyle = 'cinematic' | 'bold' | 'minimal' | 'documentary';

interface GenerationPanelProps {
  scenes: Scene[];
  visualStyle: VisualStyle;
  onVisualStyleChange: (style: VisualStyle) => void;
  onGenerateAllImages: () => void;
  onGenerateAllVideos: () => void;
  isGenerating: boolean;
  generationProgress: { current: number; total: number; type: 'image' | 'video' } | null;
}

// Visual style configurations
const visualStyles: Record<VisualStyle, { name: string; description: string; preview: string }> = {
  cinematic: {
    name: 'Cinematic',
    description: 'Dramatic lighting, film grain, letterbox aspect',
    preview: 'bg-gradient-to-br from-amber-900/40 via-black to-blue-900/40'
  },
  bold: {
    name: 'Bold & Vibrant',
    description: 'High saturation, strong contrast, attention-grabbing',
    preview: 'bg-gradient-to-br from-pink-500/40 via-purple-500/40 to-cyan-500/40'
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean, simple, lots of negative space',
    preview: 'bg-gradient-to-br from-gray-100/40 via-white/30 to-gray-200/40'
  },
  documentary: {
    name: 'Documentary',
    description: 'Natural lighting, authentic feel, realistic',
    preview: 'bg-gradient-to-br from-stone-700/40 via-stone-600/30 to-stone-800/40'
  }
};

export function GenerationPanel({
  scenes,
  visualStyle,
  onVisualStyleChange,
  onGenerateAllImages,
  onGenerateAllVideos,
  isGenerating,
  generationProgress
}: GenerationPanelProps) {
  // Calculate scene statistics
  const stats = {
    total: scenes.length,
    withImages: scenes.filter(s => s.status === 'image_ready' || s.status === 'video_generating' || s.status === 'video_ready').length,
    withVideos: scenes.filter(s => s.status === 'video_ready').length,
    thumbnailCandidates: scenes.filter(s => s.thumbnailCandidate).length
  };

  const allImagesReady = stats.withImages === stats.total && stats.total > 0;
  const allVideosReady = stats.withVideos === stats.total && stats.total > 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">AI Director</h3>
            <p className="text-sm text-muted-foreground">Generate images & videos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Scene Statistics */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Scene Status
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{stats.withImages}</p>
              <p className="text-sm text-muted-foreground">Images Ready</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{stats.withVideos}</p>
              <p className="text-sm text-muted-foreground">Videos Ready</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Thumbnail candidates:</span>
            <span className="text-foreground font-medium">{stats.thumbnailCandidates} selected</span>
          </div>
        </div>

        {/* Visual Style Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Visual Style
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(visualStyles) as VisualStyle[]).map((style) => {
              const config = visualStyles[style];
              const isSelected = visualStyle === style;
              return (
                <button
                  key={style}
                  onClick={() => onVisualStyleChange(style)}
                  className={cn(
                    "relative p-3 rounded-xl border transition-all text-left",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_-5px_rgba(79,209,255,0.3)]"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {/* Preview swatch */}
                  <div className={cn(
                    "w-full h-8 rounded-md mb-2",
                    config.preview
                  )} />
                  <p className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {config.name}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {config.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && generationProgress && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-base font-medium text-foreground">
                Generating {generationProgress.type === 'image' ? 'Images' : 'Videos'}...
              </span>
            </div>
            <Progress
              value={(generationProgress.current / generationProgress.total) * 100}
              className="h-2"
            />
            <p className="text-sm text-muted-foreground text-center">
              {generationProgress.current} of {generationProgress.total} complete
            </p>
          </div>
        )}

        {/* Generation Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Batch Generation
          </h4>

          <Button
            className={cn(
              "w-full h-12",
              allImagesReady
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:bg-primary/90"
            )}
            onClick={onGenerateAllImages}
            disabled={isGenerating || scenes.length === 0}
          >
            {isGenerating && generationProgress?.type === 'image' ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5 mr-2" />
            )}
            {allImagesReady ? 'All Images Ready ✓' : `Generate All Images (${stats.total - stats.withImages} remaining)`}
          </Button>

          <Button
            variant="outline"
            className={cn(
              "w-full h-12 border-primary/30",
              allVideosReady
                ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400"
                : "text-foreground hover:bg-primary/10"
            )}
            onClick={onGenerateAllVideos}
            disabled={isGenerating || !allImagesReady}
          >
            {isGenerating && generationProgress?.type === 'video' ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Film className="w-5 h-5 mr-2" />
            )}
            {allVideosReady ? 'All Videos Ready ✓' : `Generate All Videos (${stats.total - stats.withVideos} remaining)`}
          </Button>

          {!allImagesReady && (
            <p className="text-sm text-muted-foreground text-center">
              Generate all images before creating videos
            </p>
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-medium text-foreground">Quick Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Click the ⭐ star to mark scenes as thumbnail candidates
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Edit image prompts for more control over generated visuals
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Visual style affects all newly generated images
            </li>
          </ul>
        </div>
      </div>

      {/* Footer: Preview Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full border-primary/30 text-foreground hover:bg-primary/10"
          disabled={stats.withVideos === 0}
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Preview Full Video
        </Button>
      </div>
    </div>
  );
}

export default GenerationPanel;
