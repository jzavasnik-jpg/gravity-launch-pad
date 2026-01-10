import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

const glowStyles = {
  subtle: 'border-primary/15 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2),0_20px_40px_-15px_rgba(0,0,0,0.7)]',
  medium: 'border-primary/25 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_0_20px_-5px_rgba(99,102,241,0.2),0_25px_50px_-15px_rgba(0,0,0,0.8)]',
  strong: 'border-primary/40 shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_0_30px_-5px_rgba(99,102,241,0.3),0_30px_60px_-15px_rgba(0,0,0,0.9)]',
};

const hoverGlowStyles = {
  subtle: 'hover:shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]',
  medium: 'hover:shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_0_30px_-5px_rgba(99,102,241,0.3),0_30px_60px_-15px_rgba(0,0,0,0.9)]',
  strong: 'hover:shadow-[0_0_80px_-5px_rgba(79,209,255,0.5),0_0_40px_-5px_rgba(99,102,241,0.4),0_35px_70px_-15px_rgba(0,0,0,0.95)]',
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
