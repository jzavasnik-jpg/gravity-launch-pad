import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Lightbulb, Target, Zap, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MagicLoaderCategory = 'strategy' | 'content' | 'avatar' | 'marketing' | 'general';

interface MagicLoaderProps {
  category?: MagicLoaderCategory;
  className?: string;
  title?: string;
  subtitle?: string;
}

const MESSAGES_BY_CATEGORY: Record<MagicLoaderCategory, string[]> = {
  strategy: [
    "Analyzing emotional patterns in your market...",
    "Connecting psychological triggers to content angles...",
    "Discovering high-impact opportunities...",
    "Mapping your audience's hidden desires...",
    "Crafting positioning that resonates deeply...",
    "Finding the gaps your competitors missed...",
  ],
  content: [
    "Crafting attention-grabbing hooks...",
    "Weaving your story with emotional resonance...",
    "Fine-tuning the narrative arc...",
    "Building momentum in your message...",
    "Adding the finishing touches...",
    "Making every word count...",
  ],
  avatar: [
    "Building your ideal customer profile...",
    "Mapping pain points to solutions...",
    "Creating a vivid persona...",
    "Understanding their deepest desires...",
    "Uncovering hidden motivations...",
    "Bringing your avatar to life...",
  ],
  marketing: [
    "Generating compelling messaging...",
    "Aligning your USP with customer needs...",
    "Crafting transformation statements...",
    "Finding the perfect positioning...",
    "Making your offer irresistible...",
    "Polishing your brand voice...",
  ],
  general: [
    "Working on something amazing...",
    "Processing your request...",
    "Almost there...",
    "Putting the pieces together...",
    "Making magic happen...",
    "Just a moment longer...",
  ],
};

const ICONS_BY_CATEGORY: Record<MagicLoaderCategory, typeof Brain> = {
  strategy: Target,
  content: Palette,
  avatar: Sparkles,
  marketing: Zap,
  general: Brain,
};

export function MagicLoader({
  category = 'general',
  className,
  title,
  subtitle
}: MagicLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messages = MESSAGES_BY_CATEGORY[category];
  const IconComponent = ICONS_BY_CATEGORY[category];

  // Rotate messages every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-8",
      className
    )}>
      {/* Animated Icon Container */}
      <motion.div
        className="relative mb-8"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />

        {/* Icon container */}
        <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <IconComponent className="w-10 h-10 text-primary" />
        </div>

        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            initial={{
              x: 0,
              y: 0,
              opacity: 0
            }}
            animate={{
              x: [0, (i - 1) * 30, 0],
              y: [0, -40 - i * 10, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
          />
        ))}
      </motion.div>

      {/* Title */}
      {title && (
        <h2 className="text-xl font-display font-bold text-foreground mb-2 text-center">
          {title}
        </h2>
      )}

      {/* Rotating Message */}
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-muted-foreground text-center"
          >
            {messages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground/70 mt-4 text-center">
          {subtitle}
        </p>
      )}

      {/* Animated dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Full-page variant for overlay use
export function MagicLoaderOverlay(props: MagicLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-8 shadow-[0_0_60px_-10px_rgba(79,209,255,0.3)] max-w-md">
        <MagicLoader {...props} />
      </div>
    </div>
  );
}

// Inline compact variant
export function MagicLoaderInline({
  category = 'general',
  className
}: Pick<MagicLoaderProps, 'category' | 'className'>) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messages = MESSAGES_BY_CATEGORY[category];
  const IconComponent = ICONS_BY_CATEGORY[category];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <IconComponent className="w-5 h-5 text-primary" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentMessageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm text-muted-foreground"
        >
          {messages[currentMessageIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
