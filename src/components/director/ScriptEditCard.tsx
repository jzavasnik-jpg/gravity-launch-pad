import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Trash2,
  Undo2,
  GripVertical,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScriptEditCardProps {
  id: string;
  label: string;
  script: string;
  duration: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onRevert?: () => void;
  isActive: boolean;
  onClick: () => void;
  isProcessing?: boolean;
  index: number;
}

// Label colors following cyan-only principle with semantic variants
const labelColors: Record<string, string> = {
  'HOOK': 'bg-primary/20 text-primary border-primary/30',
  'PAIN POINT': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'PAIN': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'SOLUTION': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'CTA': 'bg-primary/20 text-primary border-primary/30',
  'TRANSITION': 'bg-muted text-muted-foreground border-border',
};

export function ScriptEditCard({
  id,
  label,
  script,
  duration,
  onChange,
  onRegenerate,
  onDelete,
  onRevert,
  isActive,
  onClick,
  isProcessing = false,
  index
}: ScriptEditCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const labelColor = labelColors[label.toUpperCase()] || labelColors['TRANSITION'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        // Floating card effect from CLAUDE.md - CYAN ONLY
        "bg-card/85 backdrop-blur-xl border rounded-xl",
        "transition-all duration-300 cursor-pointer",
        isActive
          ? "border-primary/40 shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_30px_60px_-15px_rgba(0,0,0,0.9)]"
          : "border-primary/25 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_50px_-5px_rgba(79,209,255,0.35)]",
        "hover:-translate-y-1"
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />

          {/* Label Badge */}
          <Badge
            variant="outline"
            className={cn("font-display text-xs uppercase tracking-wider border", labelColor)}
          >
            {label}
          </Badge>

          {/* Duration */}
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {/* Revert */}
          {onRevert && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onRevert();
              }}
              disabled={isProcessing}
              title="Revert changes"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          )}

          {/* Regenerate with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={isProcessing}
                title="Regenerate script"
              >
                <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Regenerate Script?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will use AI to create a new script for this segment. Your current text will be replaced.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRegenerate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                disabled={isProcessing}
                title="Delete segment"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Delete Segment?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will remove this segment from your script. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4">
          <Textarea
            value={script}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border-border text-sm resize-none min-h-[100px] font-sans focus:ring-primary focus:border-primary"
            placeholder="Type your script for this segment..."
          />

          {/* Quick Stats */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{script.split(' ').filter(Boolean).length} words</span>
            <span>~{Math.ceil(script.split(' ').filter(Boolean).length / 2.5)}s read time</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default ScriptEditCard;
