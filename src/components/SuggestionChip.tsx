import * as React from "react";
import { cn } from "@/lib/utils";

interface SuggestionChipProps {
  text: string;
  onClick: () => void;
  selected?: boolean;
  className?: string;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  text,
  onClick,
  selected = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium",
        "transition-all duration-200",
        "border backdrop-blur-sm",
        selected
          ? "border-[#4558E5] bg-[#4558E5]/20 text-g-text-inverse shadow-[0_0_20px_rgba(69,88,229,0.4)]"
          : "border-white/10 bg-white/5 text-g-text hover:bg-white/10 hover:border-white/20",
        "focus:outline-none focus:ring-2 focus:ring-[#4558E5] focus:ring-offset-2 focus:ring-offset-[#0F101A]",
        className
      )}
    >
      {text}
    </button>
  );
};
