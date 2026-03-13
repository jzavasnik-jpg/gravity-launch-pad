import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

const glowStyles = {
  subtle: 'border-border/60 shadow-[0_4px_12px_rgba(0,0,0,0.3),0_20px_40px_-15px_rgba(0,0,0,0.5)]',
  medium: 'border-border shadow-[0_4px_12px_rgba(0,0,0,0.4),0_25px_50px_-15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]',
  strong: 'border-border/150 shadow-[0_0_40px_-8px_rgba(255,255,255,0.06),0_25px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]',
};

const hoverGlowStyles = {
  subtle: 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_25px_50px_-15px_rgba(0,0,0,0.6)]',
  medium: 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_30px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]',
  strong: 'hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.08),0_30px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]',
};

export function FloatingCard({
  children,
  intensity = 'medium',
  className
}: FloatingCardProps) {
  return (
    <div className={cn(
      'bg-card/85 backdrop-blur-xl border rounded-xl',
      'hover:-translate-y-1 transition-all duration-400',
      glowStyles[intensity],
      hoverGlowStyles[intensity],
      className
    )}>
      {children}
    </div>
  );
}
