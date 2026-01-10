import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    Copy,
    Save,
    RefreshCw,
    Lightbulb,
    Target,
    Sparkles,
    Zap,
    Package,
    Users,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateMarketingStatements } from '@/lib/api';
import { saveMarketingStatements, getMarketingStatementsByAvatarId } from '@/lib/database-service';
import { cn } from '@/lib/utils';
import { MagicLoader, MagicLoaderOverlay } from '@/components/ui/MagicLoader';

interface MarketingStatements {
    solution_statement?: string;
    usp_statement?: string;
    transformation_statement?: string;
}

export function ProductStrategy() {
    const navigate = useNavigate();
    const { appState, setMarketingStatements, setHeaderActions } = useApp();
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statements, setStatements] = useState<MarketingStatements>({
        solution_statement: '',
        usp_statement: '',
        transformation_statement: '',
    });

    const hasStatements = statements.solution_statement || statements.usp_statement || statements.transformation_statement;

    // Inject header actions with Next button
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-3">
                <Button
                    onClick={() => navigate('/veritas/market-radar')}
                    disabled={!hasStatements}
                    className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                >
                    Next: Market Radar
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );
        return () => setHeaderActions(null);
    }, [setHeaderActions, navigate, hasStatements]);

    // Load marketing statements on mount
    useEffect(() => {
        const loadStatements = async () => {
            if (appState.marketingStatements) {
                setStatements(appState.marketingStatements);
                setLoading(false);
                return;
            }

            // Try to load from database
            if (appState.avatarData?.id) {
                try {
                    const savedStatements = await getMarketingStatementsByAvatarId(appState.avatarData.id);
                    if (savedStatements && savedStatements.length > 0) {
                        setStatements(savedStatements[0]);
                        setMarketingStatements(savedStatements[0]);
                    }
                } catch (error) {
                    console.error('Failed to load marketing statements:', error);
                }
            }
            setLoading(false);
        };

        loadStatements();
    }, [appState.avatarData?.id, appState.marketingStatements, setMarketingStatements]);

    const handleCopy = (text: string, label: string) => {
        if (!text) {
            toast.error(`No ${label} to copy`);
            return;
        }
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (appState.avatarData?.id) {
                await saveMarketingStatements(appState.avatarData.id, statements);
            }
            setMarketingStatements(statements);
            toast.success('Marketing statements saved!');
        } catch (error) {
            console.error('Error saving statements:', error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const newStatements = await generateMarketingStatements(
                appState.gravityICP.answers,
                appState.selectedCoreDesire,
                appState.selectedSixS,
                appState.avatarData
            );

            if (appState.avatarData?.id) {
                await saveMarketingStatements(appState.avatarData.id, newStatements);
            }

            setStatements(newStatements);
            setMarketingStatements(newStatements);
            toast.success('Marketing statements regenerated!');
        } catch (error) {
            toast.error('Failed to regenerate statements. Please try again.');
            console.error(error);
        } finally {
            setRegenerating(false);
        }
    };

    // Get completeness status
    const getCompletenessStatus = () => {
        let complete = 0;
        let total = 3;
        if (statements.solution_statement?.trim()) complete++;
        if (statements.usp_statement?.trim()) complete++;
        if (statements.transformation_statement?.trim()) complete++;
        return { complete, total, percentage: Math.round((complete / total) * 100) };
    };

    const completeness = getCompletenessStatus();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <MagicLoader
                    category="strategy"
                    title="Loading Product Strategy"
                    subtitle="Retrieving your marketing statements"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            {/* Regeneration Overlay */}
            {regenerating && (
                <MagicLoaderOverlay
                    category="marketing"
                    title="Regenerating Marketing Statements"
                    subtitle="Crafting compelling positioning for your product"
                />
            )}

            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-foreground">
                                Product Strategy
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Marketing statements and positioning for {appState.avatarData?.name || 'your avatar'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={regenerating || saving}
                            className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                        >
                            {regenerating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Regenerate All
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || regenerating}
                            className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Context Panel */}
                <div className="space-y-6">
                    {/* Completeness Card */}
                    <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                {completeness.percentage === 100 ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Completeness
                                </h3>
                                <p className="text-lg font-display font-semibold text-foreground">
                                    {completeness.complete}/{completeness.total} Statements
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-background/50 rounded-full h-2">
                            <div
                                className={cn(
                                    'h-2 rounded-full transition-all duration-500',
                                    completeness.percentage === 100 ? 'bg-green-400' : 'bg-primary'
                                )}
                                style={{ width: `${completeness.percentage}%` }}
                            />
                        </div>
                    </Card>

                    {/* Avatar Context */}
                    {appState.avatarData && (
                        <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Target Avatar
                                </h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {appState.avatarData.photo_url && (
                                    <img
                                        src={appState.avatarData.photo_url}
                                        alt={appState.avatarData.name}
                                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20"
                                    />
                                )}
                                <div>
                                    <p className="font-display font-semibold text-foreground">
                                        {appState.avatarData.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {appState.avatarData.occupation}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/avatar/${appState.avatarData?.id}`)}
                                className="mt-4 w-full text-primary hover:text-primary hover:bg-primary/10"
                            >
                                View Full Profile
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Card>
                    )}

                    {/* Quick Tips */}
                    <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Strategy Tips
                            </h3>
                        </div>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Solution Statement answers "What does this do?"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>USP differentiates you from competitors</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Transformation shows the "before → after"</span>
                            </li>
                        </ul>
                    </Card>

                    {/* Navigation */}
                    <Card className="p-5 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Next Steps
                            </h3>
                        </div>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/veritas/market-radar')}
                                className="w-full justify-start border-border hover:border-primary/50 hover:bg-primary/5"
                            >
                                <Target className="w-4 h-4 mr-2 text-primary" />
                                Validate with Market Radar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/landing-pad')}
                                className="w-full justify-start border-border hover:border-primary/50 hover:bg-primary/5"
                            >
                                <Package className="w-4 h-4 mr-2 text-primary" />
                                Build Landing Page
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Marketing Statements */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Solution Statement */}
                    <StatementCard
                        title="Solution Statement"
                        description="What problem does your product solve? Focus on the core value proposition."
                        icon={<Zap className="w-5 h-5 text-primary" />}
                        value={statements.solution_statement || ''}
                        onChange={(value) => setStatements(prev => ({ ...prev, solution_statement: value }))}
                        onCopy={() => handleCopy(statements.solution_statement || '', 'Solution Statement')}
                        placeholder="We help [target audience] achieve [desired outcome] by providing [unique solution]..."
                    />

                    {/* USP Statement */}
                    <StatementCard
                        title="Unique Selling Proposition"
                        description="What makes your offering uniquely valuable compared to alternatives?"
                        icon={<Sparkles className="w-5 h-5 text-primary" />}
                        value={statements.usp_statement || ''}
                        onChange={(value) => setStatements(prev => ({ ...prev, usp_statement: value }))}
                        onCopy={() => handleCopy(statements.usp_statement || '', 'USP Statement')}
                        placeholder="Unlike [competitors], we [unique differentiator] which means [benefit to customer]..."
                    />

                    {/* Transformation Statement */}
                    <StatementCard
                        title="Transformation Statement"
                        description="Describe the journey from pain to pleasure your customer experiences."
                        icon={<Target className="w-5 h-5 text-primary" />}
                        value={statements.transformation_statement || ''}
                        onChange={(value) => setStatements(prev => ({ ...prev, transformation_statement: value }))}
                        onCopy={() => handleCopy(statements.transformation_statement || '', 'Transformation Statement')}
                        placeholder="Go from [current painful state] to [desired future state] in [timeframe/method]..."
                    />

                    {/* Empty State */}
                    {!hasStatements && !regenerating && (
                        <Card className="p-8 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)] text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                                No Marketing Statements Yet
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                Generate AI-powered marketing statements based on your avatar's pain points and desires.
                            </p>
                            <Button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:bg-primary/90"
                            >
                                {regenerating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                Generate Statements
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// Statement Card Component
function StatementCard({
    title,
    description,
    icon,
    value,
    onChange,
    onCopy,
    placeholder,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    onCopy: () => void;
    placeholder: string;
}) {
    return (
        <Card className="p-6 bg-card/85 backdrop-blur-xl border-primary/25 shadow-[0_0_30px_-10px_rgba(79,209,255,0.2)] hover:shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)] transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-semibold text-foreground">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCopy}
                    className="text-muted-foreground hover:text-primary"
                >
                    <Copy className="w-4 h-4" />
                </Button>
            </div>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[120px] bg-background/50 border-border focus:border-primary/50 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                    {value.length} characters
                </span>
                {value && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                    </Badge>
                )}
            </div>
        </Card>
    );
}
