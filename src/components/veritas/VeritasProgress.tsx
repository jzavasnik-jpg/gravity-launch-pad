import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface VeritasStep {
  id: string;
  label: string;
  shortLabel: string;
  path: string;
  icon?: string;
}

const VERITAS_STEPS: VeritasStep[] = [
  { id: 'market-radar', label: 'Market Radar', shortLabel: 'Radar', path: '/veritas/market-radar', icon: '📡' },
  { id: 'strategy', label: 'AI Strategy', shortLabel: 'Strategy', path: '/veritas/strategy', icon: '🎯' },
  { id: 'content-composer', label: 'Content Composer', shortLabel: 'Script', path: '/veritas/content-composer', icon: '✍️' },
  { id: 'directors-cut', label: "Director's Cut", shortLabel: 'Storyboard', path: '/veritas/directors-cut', icon: '🎬' },
  { id: 'thumbnail-composer', label: 'Thumbnail', shortLabel: 'Thumb', path: '/veritas/thumbnail-composer', icon: '🖼️' },
  { id: 'export-studio', label: 'Export', shortLabel: 'Export', path: '/veritas/export-studio', icon: '📤' },
];

interface VeritasProgressProps {
  /** Show in compact mode (icons only) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Allow clicking to navigate */
  clickable?: boolean;
}

/**
 * VeritasProgress - Shows user's position in the Veritas content pipeline
 * 
 * Displays a horizontal step indicator showing:
 * - Completed steps (checkmark)
 * - Current step (highlighted)
 * - Upcoming steps (dimmed)
 */
export function VeritasProgress({ 
  compact = false, 
  className,
  clickable = true 
}: VeritasProgressProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Find current step index
  const currentIndex = VERITAS_STEPS.findIndex(step => 
    location.pathname.includes(step.path) || location.pathname.includes(step.id)
  );
  
  const handleStepClick = (step: VeritasStep, index: number) => {
    if (!clickable) return;
    // Only allow clicking on completed or current steps
    if (index <= currentIndex) {
      navigate(step.path);
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {VERITAS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => handleStepClick(step, index)}
                disabled={isUpcoming || !clickable}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all",
                  isCompleted && "bg-green-500/20 text-green-500 cursor-pointer hover:bg-green-500/30",
                  isCurrent && "bg-primary/20 text-primary ring-2 ring-primary/50",
                  isUpcoming && "bg-muted/50 text-muted-foreground cursor-not-allowed",
                  clickable && !isUpcoming && "hover:scale-105"
                )}
                title={step.label}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
              </button>
              
              {index < VERITAS_STEPS.length - 1 && (
                <ChevronRight className={cn(
                  "w-3 h-3",
                  index < currentIndex ? "text-green-500/50" : "text-muted-foreground/30"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {VERITAS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;
        
        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => handleStepClick(step, index)}
              disabled={isUpcoming || !clickable}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                isCompleted && "text-green-500 cursor-pointer hover:bg-green-500/10",
                isCurrent && "bg-primary/10 text-primary font-medium",
                isUpcoming && "text-muted-foreground cursor-not-allowed opacity-50",
                clickable && !isUpcoming && "hover:bg-primary/5"
              )}
            >
              {/* Step indicator */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                isCompleted && "bg-green-500 text-white",
                isCurrent && "bg-primary text-primary-foreground",
                isUpcoming && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
              </div>
              
              {/* Label (hidden on smaller screens) */}
              <span className="hidden md:inline text-sm whitespace-nowrap">
                {step.shortLabel}
              </span>
            </button>
            
            {/* Connector line */}
            {index < VERITAS_STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                index < currentIndex ? "bg-green-500/50" : "bg-border"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * VeritasProgressMinimal - Ultra-compact dot indicator
 */
export function VeritasProgressMinimal({ className }: { className?: string }) {
  const location = useLocation();
  
  const currentIndex = VERITAS_STEPS.findIndex(step => 
    location.pathname.includes(step.path) || location.pathname.includes(step.id)
  );

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {VERITAS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div
            key={step.id}
            className={cn(
              "rounded-full transition-all",
              isCurrent && "w-6 h-2 bg-primary",
              isCompleted && "w-2 h-2 bg-green-500",
              !isCurrent && !isCompleted && "w-2 h-2 bg-muted"
            )}
            title={step.label}
          />
        );
      })}
    </div>
  );
}

export default VeritasProgress;
