import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold font-sans transition-all focus:outline-none focus:ring-2 focus:ring-g-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-g-accent text-g-text-inverse hover:bg-g-accent-2 shadow-sm",
        secondary: "border-transparent bg-g-chip text-g-text hover:bg-g-chip/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-[var(--g-border)] text-g-text hover:bg-white/10",
        glass: "glass-panel border-[var(--g-border)] text-g-text backdrop-blur-md",
        gradient: "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-g-text-inverse shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
