'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Heart,
  Loader2,
  Target,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Quote,
  Brain,
} from 'lucide-react';
import {
  SIX_S_DEFINITIONS,
  normalizeSixSCategory,
  getSixSIconForKey,
  normalizeAvatarMatrixKey,
  SIX_S_TO_DISPLAY_LABEL,
} from '@/lib/six-s-constants';
import type { SixS } from '@/lib/six-s-constants';

interface PainPointsMatrix {
  Significance?: { score: number; challenges: string[] };
  Safe?: { score: number; challenges: string[] };
  Supported?: { score: number; challenges: string[] };
  Successful?: { score: number; challenges: string[] };
  'Surprise-and-delight'?: { score: number; challenges: string[] };
  Sharing?: { score: number; challenges: string[] };
}

interface Avatar {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  photo_url?: string;
  story?: string;
  pain_points?: string[];
  pain_points_matrix?: PainPointsMatrix;
  dreams?: string[];
  daily_challenges?: string[];
  buying_triggers?: string[];
  core_desire?: string;
  primary_six_s?: string;
}

interface MarketingStatement {
  id: string;
  solution_statement?: string;
  usp_statement?: string;
  transformation_statement?: string;
  product_name?: string;
}

interface SessionData {
  id: string;
  core_desire?: string;
  six_s?: string;
  answers?: string[];
}

export default function AvatarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [marketingStatements, setMarketingStatements] = useState<MarketingStatement[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPainPoints, setExpandedPainPoints] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    async function loadAvatarData() {
      if (!id || hasFetched) return;

      try {
        // Get auth token with retry
        let token: string | undefined;
        const { data: { session: authSession } } = await supabase.auth.getSession();
        token = authSession?.access_token;

        if (!token) {
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          token = retrySession?.access_token;
        }

        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        setHasFetched(true);

        // Fetch avatar via API
        const response = await fetch(`/api/avatar/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch avatar');
        }

        const data = await response.json();
        setAvatar(data.avatar);
        setMarketingStatements(data.marketingStatements || []);
        setSessionData(data.session);

      } catch (err) {
        console.error('[AvatarDetail] Error loading avatar:', err);
        setError('Failed to load avatar');
      } finally {
        setLoading(false);
      }
    }

    loadAvatarData();
  }, [id, hasFetched]);

  // Generate story for avatar
  const getAvatarStory = () => {
    if (!avatar) return '';
    if (avatar.story) return avatar.story;

    // Construct from daily challenges and dreams
    if (avatar.daily_challenges?.length) {
      const challenge = avatar.daily_challenges[0];
      const dream = avatar.dreams?.[0];
      if (dream) return `${challenge} ${dream}`;
      return challenge;
    }

    // Final fallback
    return `${avatar.name} is ${avatar.age ? `a ${avatar.age}-year-old` : 'an'} ${avatar.occupation || 'professional'} seeking transformation.`;
  };

  // Get top insight from pain points matrix
  const getTopInsight = () => {
    if (!avatar) return null;
    if (avatar.pain_points_matrix) {
      const dimensions = ['Significance', 'Safe', 'Supported', 'Successful', 'Surprise-and-delight', 'Sharing'] as const;
      for (const dim of dimensions) {
        const data = avatar.pain_points_matrix[dim];
        if (data && data.challenges && data.challenges.length > 0) {
          return data.challenges[0];
        }
      }
    }
    if (avatar.pain_points && avatar.pain_points.length > 0) {
      return avatar.pain_points[0];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading avatar profile...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || 'Avatar not found'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get Six S info - handle both string and object formats
  const sixSRaw: any = sessionData?.six_s || avatar.primary_six_s;
  const sixSName = typeof sixSRaw === 'string' ? sixSRaw : sixSRaw?.name;
  const normalizedSixS = sixSName ? normalizeSixSCategory(sixSName) : null;
  const sixSDef = normalizedSixS ? SIX_S_DEFINITIONS[normalizedSixS] : null;
  // Handle both string and object formats for core_desire
  const coreDesireRaw: any = sessionData?.core_desire || avatar.core_desire;
  const coreDesire = typeof coreDesireRaw === 'string' ? coreDesireRaw : coreDesireRaw?.name;
  const topInsight = getTopInsight();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Avatar Profile
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Customer persona for Market Radar validation
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/veritas/strategy')}
            className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] hover:bg-primary/90"
          >
            Next: Strategy <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP ROW: Avatar Card (Left) + Dreams/Challenges/Triggers (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Hero Card */}
          <Card className="overflow-hidden bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_40px_-8px_rgba(255,255,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
            {/* Photo Section */}
            <div className="relative aspect-[16/9]">
              {avatar.photo_url ? (
                <img
                  src={avatar.photo_url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-6xl font-display text-primary/50">
                    {avatar.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-3xl font-display font-bold text-white mb-1">
                  {avatar.name}
                </h2>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {avatar.occupation || 'Professional'}
                  </span>
                  {avatar.age && (
                    <>
                      <span>•</span>
                      <span>{avatar.age} years old</span>
                    </>
                  )}
                  {avatar.gender && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{avatar.gender}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Story + Psychological Profile */}
            <div className="p-6 space-y-5">
              {/* Avatar Story */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avatar Story
                  </h3>
                </div>
                <p className="text-foreground leading-relaxed text-sm">
                  {getAvatarStory()}
                </p>
              </div>

              {/* Core Desire + Primary Emotion side by side */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                {/* Core Desire */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Core Desire</span>
                  </div>
                  <p className="text-sm font-display font-semibold text-primary">
                    {coreDesire || 'Financial Freedom'}
                  </p>
                </div>

                {/* Primary Emotion */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {sixSDef ? (
                      <span className="text-base">{sixSDef.icon}</span>
                    ) : (
                      <Brain className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Primary Emotion</span>
                  </div>
                  <p className="text-sm font-display font-semibold text-primary">
                    {sixSDef?.label || sixSName || 'Significance'}
                  </p>
                </div>
              </div>

              {/* Top Insight Quote */}
              {topInsight && (
                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground italic">"{topInsight}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Right: Dreams, Daily Challenges, Buying Triggers */}
          <div className="space-y-5">
            {/* Dreams & Aspirations */}
            {avatar.dreams && avatar.dreams.length > 0 && (
              <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Dreams & Aspirations
                  </h3>
                </div>
                <ul className="space-y-2">
                  {avatar.dreams.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground text-sm flex items-start">
                      <span className="text-primary mr-2 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Daily Challenges */}
            {avatar.daily_challenges && avatar.daily_challenges.length > 0 && (
              <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Daily Challenges
                  </h3>
                </div>
                <ul className="space-y-2">
                  {avatar.daily_challenges.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground text-sm flex items-start">
                      <span className="text-primary mr-2 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Buying Triggers */}
            {avatar.buying_triggers && avatar.buying_triggers.length > 0 && (
              <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Buying Triggers
                  </h3>
                </div>
                <ul className="space-y-2">
                  {avatar.buying_triggers.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground text-sm flex items-start">
                      <span className="text-primary mr-2 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Marketing Statements (if any) */}
            {marketingStatements.length > 0 && (
              <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Marketing Messages
                  </h3>
                </div>
                <div className="space-y-3">
                  {marketingStatements.map((stmt) => (
                    <div key={stmt.id} className="space-y-2">
                      {stmt.usp_statement && (
                        <p className="text-sm text-foreground">
                          <span className="text-primary font-medium">USP:</span> {stmt.usp_statement}
                        </p>
                      )}
                      {stmt.solution_statement && (
                        <p className="text-sm text-muted-foreground">
                          <span className="text-primary/70 font-medium">Solution:</span> {stmt.solution_statement}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: Pain Points Matrix */}
        <Card className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]">
          <button
            onClick={() => setExpandedPainPoints(!expandedPainPoints)}
            className="flex items-center justify-between w-full text-left group mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                Pain Points (Six S Framework)
              </h3>
            </div>
            {expandedPainPoints ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <div className={cn(
            'grid transition-all duration-300',
            expandedPainPoints ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}>
            <div className="overflow-hidden">
              {avatar.pain_points_matrix ? (
                <PainPointsMatrixGrid matrix={avatar.pain_points_matrix} primarySixS={normalizedSixS} />
              ) : avatar.pain_points && avatar.pain_points.length > 0 ? (
                <ul className="space-y-2">
                  {avatar.pain_points.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground text-sm flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No pain points recorded.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Pain Points Matrix Grid Component
function PainPointsMatrixGrid({ matrix, primarySixS }: { matrix: PainPointsMatrix; primarySixS: SixS | null }) {
  const sixSOrder = [
    'Significance',
    'Safe',
    'Supported',
    'Successful',
    'Surprise-and-delight',
    'Sharing',
  ] as const;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score >= 6) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    if (score >= 4) return 'text-green-400 border-green-500/30 bg-green-500/10';
    return 'text-muted-foreground border-border bg-muted/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sixSOrder.map(dimension => {
        const data = matrix[dimension];
        if (!data) return null;

        const sixSKey = normalizeAvatarMatrixKey(dimension);
        const icon = getSixSIconForKey(dimension);
        const definition = sixSKey ? SIX_S_DEFINITIONS[sixSKey] : null;
        const isPrimary = sixSKey === primarySixS;

        return (
          <div
            key={dimension}
            className={cn(
              'p-4 border rounded-lg transition-colors',
              isPrimary
                ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/20'
                : 'bg-background/50 border-border/50 hover:border-primary/30'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-medium text-foreground text-sm">
                      {sixSKey ? SIX_S_TO_DISPLAY_LABEL[sixSKey] : dimension}
                    </h4>
                    {isPrimary && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        PRIMARY
                      </Badge>
                    )}
                  </div>
                  {definition && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {definition.question.slice(0, 45)}...
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('text-xs font-mono', getScoreColor(data.score))}
              >
                {data.score}/10
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {data.challenges.map((challenge, idx) => (
                <li key={idx} className="text-muted-foreground flex items-start text-sm">
                  <span className="text-primary mr-2 mt-0.5">•</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
