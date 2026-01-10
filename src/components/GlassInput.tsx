import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export const GlassInput = React.forwardRef<
  HTMLTextAreaElement | HTMLInputElement,
  GlassInputProps
>(({ value, onChange, placeholder, multiline = false, rows = 5, className, onKeyPress, autoFocus }, ref) => {
  const commonClasses = cn(
    "glass-input w-full rounded-lg px-4 py-3 text-base font-sans",
    "transition-all duration-200",
    "placeholder:text-g-text/50",
    className
  );

  if (multiline) {
    return (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(commonClasses, "resize-none")}
        onKeyDown={onKeyPress}
        autoFocus={autoFocus}
      />
    );
  }

  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={commonClasses}
      onKeyDown={onKeyPress}
      autoFocus={autoFocus}
    />
  );
});

GlassInput.displayName = "GlassInput";
