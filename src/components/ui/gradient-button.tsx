"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          "victor-gradient-btn",
          "inline-flex items-center justify-center",
          "rounded-xl px-6 py-3",
          "text-[14px] font-medium text-white/90",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton }
export type { GradientButtonProps }
