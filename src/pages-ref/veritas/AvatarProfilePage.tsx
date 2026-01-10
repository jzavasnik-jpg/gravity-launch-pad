import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    ArrowRight,
    ArrowLeft,
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
    RefreshCw,
    Save,
    Undo2,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { generateAvatar } from '@/lib/api';
import { toast } from 'sonner';
import { SIX_S_DEFINITIONS, normalizeSixSCategory, getSixSIconForKey, normalizeAvatarMatrixKey, SIX_S_TO_DISPLAY_LABEL } from '@/lib/six-s-constants';
import type { SixS } from '@/lib/six-s-constants';

interface PainPointsMatrix {
    Significance?: { score: number; challenges: string[] };
    Safe?: { score: number; challenges: string[] };
    Supported?: { score: number; challenges: string[] };
    Successful?: { score: number; challenges: string[] };
    'Surprise-and-delight'?: { score: number; challenges: string[] };
    Sharing?: { score: number; challenges: string[] };
}

export function AvatarProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { appState, setAvatarData, setAvatarDataList } = useApp();
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [expandedPainPoints, setExpandedPainPoints] = useState(true);

    // Preview mode: holds regenerated avatar before user confirms save
    const [previewAvatar, setPreviewAvatar] = useState<any>(null);
    const [originalAvatar, setOriginalAvatar] = useState<any>(null);

    useEffect(() => {
        const loadAvatarData = async () => {
            if (!id || !appState.avatarDataList) return;

            const avatar = appState.avatarDataList.find(a => a.id === id);
            if (avatar) {
                setAvatarData(avatar);
                setOriginalAvatar(avatar);
            }
            setLoading(false);
        };

        loadAvatarData();
    }, [id, appState.avatarDataList, setAvatarData]);

    const handleRegenerate = async () => {
        if (!appState.sessionId || !appState.avatarData) {
            toast.error('Session not found. Please complete the ICP interview first.');
            return;
        }

        setRegenerating(true);
        try {
            const newAvatar = await generateAvatar(
                appState.gravityICP.answers,
                appState.selectedCoreDesire,
                appState.selectedSixS,
                appState.avatarData.gender as 'male' | 'female',
                undefined,
                appState.sessionId
            );

            // Store the current avatar as original (if not already set)
            if (!originalAvatar) {
                setOriginalAvatar(appState.avatarData);
            }

            // Set the new avatar as preview (not saved yet)
            setPreviewAvatar(newAvatar);

            // Update current view to show the new avatar
            setAvatarData(newAvatar);

            toast.success('New avatar generated! Review and choose to Save or Revert.');
        } catch (error) {
            toast.error('Failed to regenerate avatar. Please try again.');
            console.error(error);
        } finally {
            setRegenerating(false);
        }
    };

    const handleSaveNewAvatar = () => {
        if (!previewAvatar) return;

        // Add the new avatar to the list (keeps original if it was saved)
        const isOriginalInList = appState.avatarDataList.some(a => a.id === originalAvatar?.id);

        if (isOriginalInList) {
            // Original was saved - add new avatar as a NEW entry, keep original
            setAvatarDataList([previewAvatar, ...appState.avatarDataList]);
        } else {
            // Original wasn't saved - just replace with the new one
            setAvatarDataList([previewAvatar, ...appState.avatarDataList.filter(a => a.id !== originalAvatar?.id)]);
        }

        // Clear preview state
        setPreviewAvatar(null);
        setOriginalAvatar(previewAvatar);

        toast.success(`${previewAvatar.name} has been saved!`);

        // Navigate to the new avatar's profile
        navigate(`/avatar/${previewAvatar.id}`);
    };

    const handleRevertAvatar = () => {
        if (!originalAvatar) return;

        // Restore the original avatar
        setAvatarData(originalAvatar);
        setPreviewAvatar(null);

        toast.info('Reverted to original avatar.');
    };

    // Check if we're in preview mode (have a regenerated avatar that's not saved)
    const isPreviewMode = previewAvatar !== null;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!appState.avatarData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Avatar not found.</p>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const avatar = appState.avatarData;

    // Get the avatar's full story
    const getAvatarStory = () => {
        if (avatar.story) return avatar.story;

        // Construct from daily challenges and dreams
        if (avatar.daily_challenges?.length > 0) {
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

    // Get Six S info
    const sixSName = appState.selectedSixS?.name || avatar.primary_six_s;
    const normalizedSixS = sixSName ? normalizeSixSCategory(sixSName) : null;
    const sixSDef = normalizedSixS ? SIX_S_DEFINITIONS[normalizedSixS] : null;

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
                            onClick={() => navigate('/dashboard')}
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
                    <div className="flex items-center gap-3">
                        {isPreviewMode ? (
                            <>
                                {/* Preview Mode: Save / Revert buttons */}
                                <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10 px-3 py-1">
                                    Preview Mode
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRevertAvatar}
                                    className="border-border hover:border-red-500/50 hover:bg-red-500/5 text-muted-foreground hover:text-red-400"
                                >
                                    <Undo2 className="w-4 h-4 mr-2" />
                                    Revert
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNewAvatar}
                                    className="bg-green-600 text-white hover:bg-green-500 shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)]"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save New Avatar
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* Normal Mode: Regenerate / Next buttons */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={regenerating}
                                            className="border-border hover:border-primary/50 hover:bg-primary/5"
                                        >
                                            {regenerating ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                            )}
                                            Regenerate
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-card border-border">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-foreground font-display">
                                                Regenerate Avatar?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-muted-foreground">
                                                This will generate a new avatar profile based on your ICP answers.
                                                You can preview the new avatar and choose to save it or revert back.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleRegenerate}
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                Generate New
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button
                                    onClick={() => navigate('/veritas/product-strategy')}
                                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                                >
                                    Next: Product Strategy <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* TOP ROW: Avatar Card (Left) + Dreams/Challenges/Triggers (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Hero Card with Photo, Name, Story, Core Desire, Primary Emotion */}
                    <Card className="overflow-hidden bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)]">
                        {/* Photo Section */}
                        <div className="relative aspect-[16/9]">
                            <img
                                src={avatar.photo_url}
                                alt={avatar.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h2 className="text-3xl font-display font-bold text-white mb-1">
                                    {avatar.name}
                                </h2>
                                <div className="flex items-center gap-3 text-white/80 text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        {avatar.occupation}
                                    </span>
                                    <span>•</span>
                                    <span>{avatar.age} years old</span>
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
                                        {avatar.core_desire || appState.selectedCoreDesire?.name || 'Financial Freedom'}
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
                            <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
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
                            <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
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
                            <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
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
                    </div>
                </div>

                {/* BOTTOM ROW: Pain Points Matrix (2-column grid) */}
                <Card className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
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

// Pain Points Matrix Grid (2 columns)
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
