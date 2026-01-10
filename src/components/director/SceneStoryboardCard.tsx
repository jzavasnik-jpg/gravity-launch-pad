import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  Star,
  Clock,
  Loader2,
  Check,
  Edit2,
  Play,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene, SceneLabel, SceneStatus } from '@/store/projectStore';

interface SceneStoryboardCardProps {
  scene: Scene;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

// Label colors - cyan-only for primary, semantic for others
const labelColors: Record<SceneLabel, string> = {
  'HOOK': 'bg-primary/20 text-primary border-primary/30',
  'PAIN': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'SOLUTION': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'CTA': 'bg-primary/20 text-primary border-primary/30',
  'TRANSITION': 'bg-muted text-muted-foreground border-border',
};

// Status indicators - compact versions
const statusConfig: Record<SceneStatus, { icon: React.ReactNode; color: string }> = {
  'draft': { icon: <Edit2 className="w-3 h-3" />, color: 'text-muted-foreground bg-muted/50' },
  'image_generating': { icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-primary bg-primary/10' },
  'image_ready': { icon: <ImageIcon className="w-3 h-3" />, color: 'text-emerald-400 bg-emerald-500/10' },
  'video_generating': { icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-primary bg-primary/10' },
  'video_ready': { icon: <Check className="w-3 h-3" />, color: 'text-emerald-400 bg-emerald-500/10' },
};

export function SceneStoryboardCard({
  scene,
  index,
  isActive,
  onSelect
}: SceneStoryboardCardProps) {
  const status = statusConfig[scene.status];
  const hasVideo = scene.status === 'video_ready' && scene.generatedVideoUrl;
  const hasImage = scene.generatedImageUrl;
  const referenceCount = (scene.referenceImages || []).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={cn(
        "bg-card/85 backdrop-blur-xl border rounded-xl overflow-hidden cursor-pointer relative group",
        "transition-all duration-300",
        isActive
          ? "border-primary/50 shadow-[0_0_50px_-5px_rgba(79,209,255,0.4),0_25px_50px_-15px_rgba(0,0,0,0.9)] ring-2 ring-primary/30"
          : "border-primary/20 shadow-[0_0_30px_-8px_rgba(79,209,255,0.2),0_20px_40px_-15px_rgba(0,0,0,0.7)] hover:shadow-[0_0_40px_-5px_rgba(79,209,255,0.3)] hover:border-primary/30 hover:-translate-y-0.5"
      )}
    >
      {/* Thumbnail Preview - 16:9 aspect ratio for compact view */}
      <div className="aspect-video relative bg-muted/30">
        {hasImage ? (
          <img
            src={scene.generatedImageUrl}
            alt={`Scene ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}

        {/* Video indicator overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Scene number badge - top left */}
        <div className="absolute top-1.5 left-1.5">
          <div className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-mono font-medium text-white">
              {index + 1}
            </span>
          </div>
        </div>

        {/* Status indicator - top right */}
        <div className="absolute top-1.5 right-1.5">
          <div className={cn(
            "w-6 h-6 rounded-md backdrop-blur-sm flex items-center justify-center",
            status.color
          )}>
            {status.icon}
          </div>
        </div>

        {/* Thumbnail star indicator - if marked as candidate */}
        {scene.thumbnailCandidate && (
          <div className="absolute bottom-1.5 right-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </div>
        )}

        {/* Reference images indicator - bottom left */}
        {referenceCount > 0 && (
          <div className="absolute bottom-1.5 left-1.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
              <Package className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-white">{referenceCount}</span>
            </div>
          </div>
        )}

        {/* Active indicator glow */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 rounded-t-xl" />
        )}
      </div>

      {/* Compact Info Bar */}
      <div className="p-2 flex items-center justify-between gap-2 border-t border-border/30">
        {/* Label badge */}
        <Badge className={cn(
          "text-[10px] px-1.5 py-0 h-5 uppercase tracking-wider border font-medium",
          labelColors[scene.label]
        )}>
          {scene.label}
        </Badge>

        {/* Duration */}
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <Clock className="w-3 h-3" />
          {scene.durationEstimate}s
        </div>
      </div>

      {/* Script preview - single line truncated */}
      <div className="px-2 pb-2">
        <p className="text-xs text-muted-foreground line-clamp-1">
          {scene.script || <span className="italic">No script</span>}
        </p>
      </div>
    </motion.div>
  );
}

export default SceneStoryboardCard;
