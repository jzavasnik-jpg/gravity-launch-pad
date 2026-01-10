/**
 * RadarLoader - A radar sweep animation for Market Radar loading states
 *
 * Creates a scanning radar effect with rotating sweep line, concentric rings,
 * and pulsing dots to indicate market research in progress.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RadarLoaderProps {
    title?: string;
    subtitle?: string;
    messages?: string[];
    className?: string;
}

// Contextual messages for market research
const DEFAULT_MESSAGES = [
    "Scanning market conversations...",
    "Analyzing emotional patterns...",
    "Finding voice of customer insights...",
    "Mapping Six S emotional gaps...",
    "Discovering content angles...",
    "Extracting strategic insights...",
    "Processing real discussions...",
    "Identifying pain point clusters...",
];

export function RadarLoader({
    title = "Market Radar Active",
    subtitle,
    messages = DEFAULT_MESSAGES,
    className,
}: RadarLoaderProps) {
    const [messageIndex, setMessageIndex] = React.useState(0);

    // Rotate through messages
    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className={cn("flex flex-col items-center justify-center gap-8", className)}>
            {/* Radar Container */}
            <div className="relative w-64 h-64">
                {/* Background glow */}
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />

                {/* Concentric rings */}
                {[1, 2, 3, 4].map((ring) => (
                    <div
                        key={ring}
                        className="absolute rounded-full border border-primary/20"
                        style={{
                            inset: `${(4 - ring) * 16}px`,
                        }}
                    />
                ))}

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        className="w-3 h-3 rounded-full bg-primary"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [1, 0.5, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>

                {/* Radar sweep */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
                    style={{
                        background: 'linear-gradient(90deg, rgba(79, 209, 255, 0.8) 0%, transparent 100%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Sweep trail/glow */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left"
                    style={{
                        background: 'conic-gradient(from 0deg, rgba(79, 209, 255, 0.15) 0deg, transparent 60deg)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Blip dots - detected signals */}
                {[
                    { x: 30, y: 20, delay: 0 },
                    { x: 70, y: 35, delay: 0.5 },
                    { x: 45, y: 65, delay: 1 },
                    { x: 80, y: 70, delay: 1.5 },
                    { x: 25, y: 50, delay: 2 },
                ].map((blip, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary"
                        style={{
                            left: `${blip.x}%`,
                            top: `${blip.y}%`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.2, 1, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: blip.delay,
                            ease: "easeOut",
                        }}
                    />
                ))}

                {/* Outer ring pulse */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Text content */}
            <div className="text-center space-y-3">
                <h3 className="text-xl font-display font-semibold text-foreground">
                    {title}
                </h3>

                {subtitle && (
                    <p className="text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                )}

                {/* Rotating message */}
                <div className="h-6 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            className="text-primary text-sm font-medium"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {messages[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/**
 * Full-screen overlay version for use during research
 */
export function RadarLoaderOverlay({
    title,
    subtitle,
    messages,
    onClose,
}: RadarLoaderProps & { onClose?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex items-center justify-center"
        >
            <RadarLoader
                title={title}
                subtitle={subtitle}
                messages={messages}
            />
        </motion.div>
    );
}

export default RadarLoader;
