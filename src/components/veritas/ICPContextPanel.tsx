import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Target, 
  Heart, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  MessageSquareQuote,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  getICPAnswer, 
  getICPAnswerTruncated, 
  hasICPAnswer,
  ICP_QUESTION_LABELS 
} from '@/lib/icp-constants';
import { SIX_S_DEFINITIONS, DESIRE_MARKET_DEFINITIONS } from '@/lib/six-s-constants';
import type { SixS, DesireMarket } from '@/lib/six-s-constants';

interface ICPContextPanelProps {
  /** Show expanded view with all details */
  expanded?: boolean;
  /** Allow collapsing sections */
  collapsible?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

/**
 * ICPContextPanel - Displays the user's ICP (Ideal Customer Profile) context
 * 
 * Shows Core Desire, Primary Emotion (Six S), and key ICP answers to help
 * users understand how their Market Radar analysis connects to their ICP.
 * 
 * Design: Follows CLAUDE.md floating card effect with cyan-only accents.
 */
export function ICPContextPanel({ 
  expanded = false, 
  collapsible = true,
  className,
  compact = false 
}: ICPContextPanelProps) {
  const { appState } = useApp();
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Extract ICP data
  const coreDesire = appState.selectedCoreDesire;
  const primaryEmotion = appState.selectedSixS;
  const avatarName = appState.avatarData?.name || 'Your Avatar';
  const avatarPhoto = appState.avatarData?.photo_url;
  const answers = appState.gravityICP.answers;
  
  // Map Core Desire name to DesireMarket type for icon lookup
  const desireMarketKey = coreDesire?.name.toLowerCase() as DesireMarket | undefined;
  const desireMarketDef = desireMarketKey ? DESIRE_MARKET_DEFINITIONS[desireMarketKey] : null;
  
  // Map Six S name to SixS type for icon lookup
  const sixSKey = primaryEmotion?.name.toLowerCase().replace('-and-', '_').replace('surprise_delight', 'surprise') as SixS | undefined;
  // Handle the special case for "Surprise-and-delight" -> "surprise"
  const normalizedSixSKey = primaryEmotion?.name === 'Surprise-and-delight' ? 'surprise' : 
                           primaryEmotion?.name === 'Sharing' ? 'share' :
                           primaryEmotion?.name.toLowerCase() as SixS | undefined;
  const sixSDef = normalizedSixSKey ? SIX_S_DEFINITIONS[normalizedSixSKey] : null;
  
  // Check completeness
  const hasDesire = !!coreDesire;
  const hasEmotion = !!primaryEmotion;
  const hasPainPoint = hasICPAnswer(answers, 'DEEPEST_DESIRE');
  const hasAudience = hasICPAnswer(answers, 'TARGET_AUDIENCE');
  const hasProblem = hasICPAnswer(answers, 'SPECIFIC_PROBLEM');
  
  const completionScore = [hasDesire, hasEmotion, hasPainPoint, hasAudience, hasProblem].filter(Boolean).length;
  const isComplete = completionScore === 5;

  if (compact) {
    return (
      <Card className={cn(
        "p-3 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl",
        "shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]",
        className
      )}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {avatarPhoto ? (
              <img src={avatarPhoto} alt={avatarName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          
          {/* Quick Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{avatarName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {desireMarketDef && (
                <span className="text-xs text-muted-foreground">
                  {desireMarketDef.icon} {coreDesire?.name}
                </span>
              )}
              {sixSDef && (
                <span className="text-xs text-muted-foreground">
                  {sixSDef.icon} {primaryEmotion?.name}
                </span>
              )}
            </div>
          </div>
          
          {/* Status */}
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className="text-xs text-muted-foreground flex-shrink-0">
              {completionScore}/5
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl overflow-hidden",
      "shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]",
      className
    )}>
      {/* Header */}
      <div 
        className={cn(
          "p-4 border-b border-border/50 flex items-center justify-between",
          collapsible && "cursor-pointer hover:bg-primary/5 transition-colors"
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {avatarPhoto ? (
              <img src={avatarPhoto} alt={avatarName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground">
              ICP Context
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {avatarName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Completion Indicator */}
          {isComplete ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">
              <AlertCircle className="w-3 h-3 mr-1" />
              {completionScore}/5
            </Badge>
          )}
          
          {collapsible && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <AnimatePresence initial={false}>
        {(isExpanded || !collapsible) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              {/* Core Desire (Desire Market) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Core Desire
                  </span>
                </div>
                
                {coreDesire ? (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      {desireMarketDef && (
                        <span className="text-lg">{desireMarketDef.icon}</span>
                      )}
                      <span className="font-display font-semibold text-foreground">
                        {coreDesire.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {coreDesire.description}
                    </p>
                    {desireMarketDef && (
                      <p className="text-[10px] text-primary/70 mt-2 italic">
                        "{desireMarketDef.whatTheyMean}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Not selected in ICP
                    </p>
                  </div>
                )}
              </div>
              
              {/* Primary Emotion (Six S) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Primary Emotion
                  </span>
                </div>
                
                {primaryEmotion ? (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      {sixSDef && (
                        <span className="text-lg">{sixSDef.icon}</span>
                      )}
                      <span className="font-display font-semibold text-foreground">
                        {primaryEmotion.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {primaryEmotion.description}
                    </p>
                    {sixSDef && (
                      <p className="text-[10px] text-primary/70 mt-2 italic">
                        "{sixSDef.question}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Not selected in ICP
                    </p>
                  </div>
                )}
              </div>
              
              {/* Key ICP Insights */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key Insights
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Deepest Desire */}
                  {hasPainPoint && (
                    <InsightItem 
                      icon={<Zap className="w-3 h-3" />}
                      label="Deepest Desire"
                      value={getICPAnswerTruncated(answers, 'DEEPEST_DESIRE', 80)}
                    />
                  )}
                  
                  {/* Target Audience */}
                  {hasAudience && (
                    <InsightItem 
                      icon={<User className="w-3 h-3" />}
                      label="Audience"
                      value={getICPAnswerTruncated(answers, 'TARGET_AUDIENCE', 80)}
                    />
                  )}
                  
                  {/* Problem You Solve */}
                  {hasProblem && (
                    <InsightItem 
                      icon={<MessageSquareQuote className="w-3 h-3" />}
                      label="Problem"
                      value={getICPAnswerTruncated(answers, 'SPECIFIC_PROBLEM', 80)}
                    />
                  )}
                </div>
              </div>
              
              {/* Framework Name if available */}
              {hasICPAnswer(answers, 'FRAMEWORK_NAME') && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Your Method:</span>
                    <span className="text-sm font-medium text-primary">
                      {getICPAnswer(answers, 'FRAMEWORK_NAME')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * InsightItem - A single insight row in the ICP Context Panel
 */
function InsightItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <div className="p-2 rounded-md bg-muted/30 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

export default ICPContextPanel;
