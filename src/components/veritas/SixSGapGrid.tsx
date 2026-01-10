import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { SIX_S_DEFINITIONS, getGapPriority } from '@/lib/six-s-constants';
import type { SixS } from '@/lib/six-s-constants';
import type { SixSGap } from '@/store/projectStore';

interface SixSGapCardProps {
  gap: SixSGap;
  index: number;
  isExpanded: boolean;
  isICPSelection: boolean;
  onToggle: () => void;
}

/**
 * SixSGapCard - Individual card for displaying a Six S emotional gap
 * 
 * Features:
 * - Highlights if this matches the user's ICP selection
 * - Floating card effect with cyan glow (per CLAUDE.md)
 * - Expandable to show evidence and guidance
 * - Priority-based coloring
 */
export function SixSGapCard({
  gap,
  index,
  isExpanded,
  isICPSelection,
  onToggle,
}: SixSGapCardProps) {
  const priorityInfo = getGapPriority(gap.gapScore);
  const sixSDef = SIX_S_DEFINITIONS[gap.category];

  // Safety check for missing definition
  if (!sixSDef) {
    console.warn(`Six S definition not found for category: ${gap.category}`);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* ICP Selection Indicator */}
      {isICPSelection && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge 
            className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 shadow-lg"
          >
            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
            ICP
          </Badge>
        </div>
      )}

      <Card
        className={cn(
          // Base floating card styling
          "p-4 bg-card/85 backdrop-blur-xl border rounded-xl cursor-pointer transition-all duration-300",
          // Glow effect
          "shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]",
          // Hover states
          "hover:-translate-y-1 hover:shadow-[0_0_40px_-8px_rgba(79,209,255,0.4)]",
          // Expanded state
          isExpanded
            ? "border-primary/40 shadow-[0_0_40px_-8px_rgba(79,209,255,0.4)]"
            : "border-primary/25 hover:border-primary/40",
          // ICP Selection highlight
          isICPSelection && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        onClick={onToggle}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <span className="text-2xl mb-2">{sixSDef.icon}</span>
          
          {/* Label */}
          <h4 className="text-sm font-display font-semibold text-foreground mb-1">
            {gap.label}
          </h4>
          
          {/* Gap Score */}
          <div className={cn("text-2xl font-bold", priorityInfo.color)}>
            {gap.gapScore}
          </div>
          
          {/* Priority Badge */}
          <Badge
            variant="outline"
            className={cn(
              "mt-2 text-[10px] uppercase tracking-wider border-0",
              priorityInfo.bgColor,
              priorityInfo.color
            )}
          >
            {priorityInfo.label}
          </Badge>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border/50 overflow-hidden"
            >
              {/* Question */}
              <p className="text-xs text-muted-foreground italic mb-3">
                "{sixSDef.question}"
              </p>
              
              {/* Instruction */}
              <p className="text-[10px] text-muted-foreground/70 mb-2">
                {priorityInfo.instruction}
              </p>
              
              {/* Voice of Customer Evidence */}
              {gap.voiceOfCustomer && gap.voiceOfCustomer.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Evidence:
                  </p>
                  {gap.voiceOfCustomer.slice(0, 2).map((quote, qi) => (
                    <p
                      key={qi}
                      className="text-[10px] text-muted-foreground/70 truncate"
                    >
                      "{quote}"
                    </p>
                  ))}
                </div>
              )}
              
              {/* ICP Selection Note */}
              {isICPSelection && (
                <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-[10px] text-primary font-medium">
                    ⭐ This is the primary emotion you selected during your ICP interview
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand/Collapse Indicator */}
        <div className="mt-3 flex justify-center">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface SixSGapGridProps {
  gaps: SixSGap[];
  expandedGap: SixS | null;
  setExpandedGap: (gap: SixS | null) => void;
  icpSelectedSixS?: string | null;
}

/**
 * SixSGapGrid - Grid of Six S gap analysis cards
 * 
 * Displays all Six S categories with their gap scores, sorted by score.
 * Highlights the user's ICP selection for visual continuity.
 */
export function SixSGapGrid({
  gaps,
  expandedGap,
  setExpandedGap,
  icpSelectedSixS,
}: SixSGapGridProps) {
  // Sort gaps by score (highest first)
  const sortedGaps = [...gaps].sort((a, b) => b.gapScore - a.gapScore);

  // Normalize ICP selection for comparison
  const normalizedICPSelection = icpSelectedSixS?.toLowerCase()
    .replace('surprise-and-delight', 'surprise')
    .replace('sharing', 'share');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {sortedGaps.map((gap, i) => {
        const isExpanded = expandedGap === gap.category;
        const isICPSelection = normalizedICPSelection === gap.category;

        return (
          <SixSGapCard
            key={gap.category}
            gap={gap}
            index={i}
            isExpanded={isExpanded}
            isICPSelection={isICPSelection}
            onToggle={() => setExpandedGap(isExpanded ? null : gap.category)}
          />
        );
      })}
    </div>
  );
}

export default SixSGapGrid;
