import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium font-sans ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-g-accent text-g-text-inverse hover:bg-g-accent-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "glass-panel border-[var(--g-border)] text-g-text hover:bg-white/10 hover:border-g-accent/50",
        secondary: "bg-g-chip text-g-text hover:bg-g-chip/80",
        ghost: "text-g-text hover:bg-white/10",
        link: "text-g-accent underline-offset-4 hover:underline hover:text-g-accent-2",
        glass: "glass-panel text-g-text hover:bg-white/10 hover:border-g-accent/50 shadow-md",
        gradient: "bg-gradient-to-r from-g-accent to-g-accent-2 text-g-text-inverse hover:opacity-90 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
