import * as React from "react";
import { Cloud, Check, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutosaveIndicatorProps {
  lastSaved?: Date;
  saving?: boolean;
  error?: boolean;
  className?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  lastSaved,
  saving = false,
  error = false,
  className,
}) => {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-g-muted", className)}>
      {error ? (
        <>
          <CloudOff className="w-4 h-4 text-red-400" />
          <span className="text-red-400">Save failed</span>
        </>
      ) : saving ? (
        <>
          <Cloud className="w-4 h-4 animate-pulse" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span>Saved {getTimeAgo(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
};
