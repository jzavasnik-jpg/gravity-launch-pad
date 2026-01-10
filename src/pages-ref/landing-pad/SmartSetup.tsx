import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { useArchitectStore, ColorPalette } from "@/store/architectStore";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ColorPalettePicker } from "@/components/landing-pad/ColorPalettePicker";
import { AvatarSelector } from "@/components/landing-pad/AvatarSelector";
import {
    getICPSession,
    getMarketingStatementsByAvatarId,
    getAllUserSessions,
    updateAvatarSessionId,
    ICPSession,
    MarketingStatement
} from "@/lib/database-service";
import {
    Rocket,
    User,
    Package,
    DollarSign,
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    Check,
    Sparkles,
    Wand2,
    Loader2,
    Lightbulb,
    Layers,
    Plus,
    Trash2,
    GraduationCap,
    Cloud,
    ShoppingBag,
    RefreshCw,
    AlertTriangle,
    Link
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarData {
    id: string;
    name: string;
    photo_url?: string;
    occupation?: string;
    pain_points?: string[];
    icp_session_id: string | null;  // Can be null for orphaned avatars
}

type ProductType = 'course' | 'saas' | 'digital_product' | 'service';

interface PricingTier {
    id: string;
    name: string;
    price: string;
    billingCycle: 'monthly' | 'annual' | 'one_time';
    features: string[];
    isPopular?: boolean;
}

interface ValueStackItem {
    id: string;
    name: string;
    value: number;
    description?: string;
}

interface SetupData {
    avatarId: string | null;
    avatarName: string;
    productName: string;
    productDescription: string;
    painPoints: string[];
    // ICP-derived data
    icpAnswers: string[];
    coreDesire: string | null;
    sixS: string | null;
    marketingStatements: MarketingStatement | null;
    // Product type & pricing
    productType: ProductType;
    // For courses/digital products
    oneTimePrice: string;
    valueStack: ValueStackItem[];
    // For SaaS
    pricingTiers: PricingTier[];
}

const PRODUCT_TYPES: { value: ProductType; label: string; description: string; icon: React.ElementType }[] = [
    { value: 'course', label: 'Course / Program', description: 'Online course, coaching program, or educational product', icon: GraduationCap },
    { value: 'saas', label: 'SaaS / Software', description: 'Software as a service with recurring billing', icon: Cloud },
    { value: 'digital_product', label: 'Digital or Physical Product', description: 'Ebook, template, physical goods, or any product', icon: Package },
    { value: 'service', label: 'Service / Consulting', description: 'Done-for-you service or consulting package', icon: ShoppingBag },
];

const DEFAULT_SAAS_TIERS: PricingTier[] = [
    { id: 'starter', name: 'Starter', price: '29', billingCycle: 'monthly', features: ['Feature 1', 'Feature 2'], isPopular: false },
    { id: 'pro', name: 'Pro', price: '79', billingCycle: 'monthly', features: ['Everything in Starter', 'Feature 3', 'Feature 4'], isPopular: true },
    { id: 'enterprise', name: 'Enterprise', price: '199', billingCycle: 'monthly', features: ['Everything in Pro', 'Feature 5', 'Priority Support'], isPopular: false },
];

export function SmartSetup() {
    const navigate = useNavigate();
    const { strategyContext } = useProjectStore();
    const { updateSection, setBrandSetup, colorPalette } = useArchitectStore();
    const { appState } = useApp();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarData | null>(null);
    const [isLoadingSessionData, setIsLoadingSessionData] = useState(false);
    const [isGeneratingPricing, setIsGeneratingPricing] = useState(false);
    const [isGeneratingValueStack, setIsGeneratingValueStack] = useState(false);
    const [aiPricingReasoning, setAiPricingReasoning] = useState<string | null>(null);
    const [availableSessions, setAvailableSessions] = useState<{id: string; date: string}[]>([]);
    const [showSessionRepair, setShowSessionRepair] = useState(false);
    const [isRepairingSession, setIsRepairingSession] = useState(false);

    const [setupData, setSetupData] = useState<SetupData>({
        avatarId: null,
        avatarName: "",
        productName: "",
        productDescription: "",
        painPoints: [],
        icpAnswers: [],
        coreDesire: null,
        sixS: null,
        marketingStatements: null,
        productType: 'course',
        oneTimePrice: "",
        valueStack: [],
        pricingTiers: DEFAULT_SAAS_TIERS
    });

    // Pre-populate from current avatar in AppContext or strategy context
    useEffect(() => {
        if (appState.avatarData) {
            const avatar = appState.avatarData;
            // Use the avatar's own icp_session_id if available, not appState.sessionId
            setSelectedAvatar({
                id: avatar.id,
                name: avatar.name,
                photo_url: avatar.photo_url,
                occupation: avatar.occupation,
                pain_points: avatar.pain_points,
                icp_session_id: avatar.icp_session_id || appState.sessionId || ''
            });
            setSetupData(prev => ({
                ...prev,
                avatarId: avatar.id,
                avatarName: avatar.name || prev.avatarName,
                painPoints: avatar.pain_points || prev.painPoints
            }));
        } else if (strategyContext) {
            setSetupData(prev => ({
                ...prev,
                avatarName: strategyContext.avatarName || prev.avatarName,
                painPoints: strategyContext.painPoints || prev.painPoints
            }));
        }
    }, [appState.avatarData, appState.sessionId, strategyContext]);

    // Load ICP session data and marketing statements for an avatar
    const loadSessionData = async (avatar: AvatarData) => {
        console.log('[SmartSetup] loadSessionData called with avatar:', {
            id: avatar.id,
            name: avatar.name,
            icp_session_id: avatar.icp_session_id
        });

        if (!avatar.icp_session_id) {
            console.warn('[SmartSetup] Avatar has no icp_session_id, attempting to load marketing statements only');
            console.warn('[SmartSetup] This avatar may need its icp_session_id repaired in Firebase');

            // Load available sessions for repair option
            if (appState.userId) {
                try {
                    const sessions = await getAllUserSessions(appState.userId);
                    if (sessions && sessions.length > 0) {
                        setAvailableSessions(sessions.filter(s => s.completed).map(s => ({
                            id: s.id,
                            date: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown date'
                        })));
                        setShowSessionRepair(true);
                    }
                } catch (error) {
                    console.error('[SmartSetup] Error loading available sessions:', error);
                }
            }

            // Try to at least load marketing statements (linked by avatar_id, not session)
            try {
                const statements = await getMarketingStatementsByAvatarId(avatar.id);
                console.log('[SmartSetup] Marketing statements for avatar without session:', statements);
                const latestStatement = statements && statements.length > 0 ? statements[0] : null;

                let description = "";
                let productName = "";

                if (latestStatement) {
                    // Extract product name from marketing statement if available
                    productName = latestStatement.product_name || "";
                    console.log('[SmartSetup] Product name from marketing statement:', productName);

                    const parts = [
                        latestStatement.solution_statement,
                        latestStatement.transformation_statement
                    ].filter(Boolean);
                    description = parts.join(" ");
                }

                setSetupData(prev => ({
                    ...prev,
                    avatarId: avatar.id,
                    avatarName: avatar.name,
                    painPoints: avatar.pain_points || [],
                    productName: productName || prev.productName,
                    productDescription: description || prev.productDescription,
                    marketingStatements: latestStatement
                }));

                if (latestStatement) {
                    if (productName) {
                        toast.success(`Loaded product details for ${avatar.name}`);
                    } else {
                        toast.success("Loaded marketing statements for " + avatar.name);
                    }
                } else {
                    toast.warning(`${avatar.name} has no linked ICP session. Some data cannot be loaded.`);
                }
            } catch (error) {
                console.error('[SmartSetup] Error loading marketing statements:', error);
                setSetupData(prev => ({
                    ...prev,
                    avatarId: avatar.id,
                    avatarName: avatar.name,
                    painPoints: avatar.pain_points || []
                }));
            }
            return;
        } else {
            // Avatar has session ID, hide repair UI
            setShowSessionRepair(false);
        }

        setIsLoadingSessionData(true);
        try {
            console.log('[SmartSetup] Fetching ICP session:', avatar.icp_session_id);
            const session = await getICPSession(avatar.icp_session_id);
            console.log('[SmartSetup] ICP session result:', session);

            const statements = await getMarketingStatementsByAvatarId(avatar.id);
            console.log('[SmartSetup] Marketing statements:', statements);
            const latestStatement = statements && statements.length > 0 ? statements[0] : null;

            if (session) {
                const answers = session.answers || [];
                console.log('[SmartSetup] Session answers:', answers);
                console.log('[SmartSetup] Product name (answers[9]):', answers[9]);
                console.log('[SmartSetup] Marketing statement product_name:', latestStatement?.product_name);

                // Prioritize product_name from marketing statement, then fall back to ICP answers
                const productName = latestStatement?.product_name || answers[9] || "";

                let description = "";
                if (latestStatement) {
                    const parts = [
                        latestStatement.solution_statement,
                        latestStatement.transformation_statement
                    ].filter(Boolean);
                    description = parts.join(" ");
                } else if (answers[8]) {
                    description = answers[8];
                }

                setSetupData(prev => ({
                    ...prev,
                    avatarId: avatar.id,
                    avatarName: avatar.name,
                    painPoints: avatar.pain_points || [],
                    productName: productName || prev.productName,
                    productDescription: description || prev.productDescription,
                    icpAnswers: answers,
                    coreDesire: session.core_desire?.name || null,
                    sixS: session.six_s?.name || null,
                    marketingStatements: latestStatement
                }));

                if (productName) {
                    toast.success("Pre-filled product details from your ICP session");
                }
            } else {
                // No session found, but we might still have marketing statements
                let description = "";
                let productName = "";

                if (latestStatement) {
                    productName = latestStatement.product_name || "";
                    const parts = [
                        latestStatement.solution_statement,
                        latestStatement.transformation_statement
                    ].filter(Boolean);
                    description = parts.join(" ");
                }

                setSetupData(prev => ({
                    ...prev,
                    avatarId: avatar.id,
                    avatarName: avatar.name,
                    painPoints: avatar.pain_points || [],
                    productName: productName || prev.productName,
                    productDescription: description || prev.productDescription,
                    marketingStatements: latestStatement
                }));

                if (productName) {
                    toast.success("Loaded product details from marketing statements");
                }
            }
        } catch (error) {
            console.error("Error loading session data:", error);
            setSetupData(prev => ({
                ...prev,
                avatarId: avatar.id,
                avatarName: avatar.name,
                painPoints: avatar.pain_points || []
            }));
        } finally {
            setIsLoadingSessionData(false);
        }
    };

    const handleAvatarSelect = (avatar: AvatarData) => {
        console.log('[SmartSetup] handleAvatarSelect called:', {
            avatarName: avatar.name,
            avatarId: avatar.id,
            icp_session_id: avatar.icp_session_id,
            hasSessionId: !!avatar.icp_session_id
        });
        setSelectedAvatar(avatar);
        setAiPricingReasoning(null);
        loadSessionData(avatar);
    };

    const handleSessionSwitch = (sessionId: string, avatars: AvatarData[]) => {
        setAiPricingReasoning(null);
        console.log(`Switched to session ${sessionId} with ${avatars.length} avatars`);
    };

    // Repair avatar's missing session ID
    const handleRepairSessionId = async (sessionId: string) => {
        if (!selectedAvatar) return;

        setIsRepairingSession(true);
        try {
            const success = await updateAvatarSessionId(selectedAvatar.id, sessionId);
            if (success) {
                // Update the local avatar with the new session ID
                const repairedAvatar = { ...selectedAvatar, icp_session_id: sessionId };
                setSelectedAvatar(repairedAvatar);
                setShowSessionRepair(false);
                toast.success(`Linked ${selectedAvatar.name} to ICP session`);

                // Reload session data with the repaired avatar
                loadSessionData(repairedAvatar);
            } else {
                toast.error("Failed to repair session link. Please try again.");
            }
        } catch (error) {
            console.error('[SmartSetup] Error repairing session ID:', error);
            toast.error("Failed to repair session link");
        } finally {
            setIsRepairingSession(false);
        }
    };

    // AI-Assisted Pricing Generation
    const generateAIPricing = async () => {
        if (!setupData.productName) {
            toast.error("Please enter a product name first");
            return;
        }

        setIsGeneratingPricing(true);
        setAiPricingReasoning(null);

        try {
            const isSaaS = setupData.productType === 'saas';

            const response = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: isSaaS
                        ? `You are an expert SaaS pricing strategist. Generate tiered pricing recommendations.

Return ONLY a JSON object:
{
    "tiers": [
        {
            "name": "Starter",
            "monthlyPrice": "29",
            "annualPrice": "290",
            "features": ["Feature 1", "Feature 2", "Feature 3"],
            "targetUser": "Who this tier is for"
        },
        {
            "name": "Pro",
            "monthlyPrice": "79",
            "annualPrice": "790",
            "features": ["Everything in Starter", "Feature 4", "Feature 5"],
            "targetUser": "Who this tier is for",
            "isPopular": true
        },
        {
            "name": "Enterprise",
            "monthlyPrice": "199",
            "annualPrice": "1990",
            "features": ["Everything in Pro", "Feature 6", "Priority Support"],
            "targetUser": "Who this tier is for"
        }
    ],
    "reasoning": "2-3 sentence explanation of why this pricing structure works for this product and market"
}

Consider:
- Market positioning and competitive analysis
- Value-based pricing principles
- Psychology of tiered pricing (good-better-best)
- Annual discount typically 15-20%`
                        : `You are an expert pricing strategist for digital products and courses.

Return ONLY a JSON object:
{
    "price": "997",
    "reasoning": "2-3 sentence explanation of why this price point works",
    "priceAnchors": {
        "lowEnd": "497",
        "recommended": "997",
        "premium": "1997"
    },
    "paymentPlanOption": {
        "payments": 3,
        "amount": "397"
    }
}

Consider:
- Transformation value delivered
- Target audience's investment capacity
- Industry standards for similar products
- Price anchoring psychology
- Core desire: ${setupData.coreDesire || 'not specified'}`,
                    userPrompt: `Product: ${setupData.productName}
Type: ${setupData.productType}
Description: ${setupData.productDescription || 'Not provided'}
Target Avatar: ${setupData.avatarName}
Pain Points: ${setupData.painPoints.join(', ') || 'Not specified'}
Problem Solved: ${setupData.icpAnswers[8] || 'Not specified'}
Transformation Promise: ${setupData.icpAnswers[13] || 'Not specified'}
Core Desire: ${setupData.coreDesire || 'Not specified'}
Primary Emotion (Six S): ${setupData.sixS || 'Not specified'}

Generate optimal pricing recommendations.`
                })
            });

            if (!response.ok) throw new Error("API request failed");

            const data = await response.json();

            if (isSaaS && data.tiers) {
                const newTiers: PricingTier[] = data.tiers.map((tier: any, idx: number) => ({
                    id: tier.name.toLowerCase().replace(/\s+/g, '_'),
                    name: tier.name,
                    price: tier.monthlyPrice,
                    billingCycle: 'monthly' as const,
                    features: tier.features || [],
                    isPopular: tier.isPopular || false
                }));
                setSetupData(prev => ({ ...prev, pricingTiers: newTiers }));
                setAiPricingReasoning(data.reasoning || "Tiered pricing optimized for your target market.");
                toast.success("AI generated tiered pricing!");
            } else if (data.price) {
                setSetupData(prev => ({ ...prev, oneTimePrice: data.price }));
                setAiPricingReasoning(data.reasoning || "Price optimized based on product value and market positioning.");
                toast.success("AI pricing recommendation ready!");
            }
        } catch (error) {
            console.error("Error generating pricing:", error);
            toast.error("Failed to generate pricing. Please enter manually.");
        } finally {
            setIsGeneratingPricing(false);
        }
    };

    // AI-Assisted Value Stack Generation
    const generateAIValueStack = async () => {
        if (!setupData.productName || !setupData.oneTimePrice) {
            toast.error("Please enter product name and price first");
            return;
        }

        setIsGeneratingValueStack(true);

        try {
            const response = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `You are a digital product pricing strategist creating a compelling value stack.

Return ONLY a JSON object:
{
    "items": [
        { "name": "Core Program Name", "value": 1997, "description": "What this delivers" },
        { "name": "Bonus/Template Name", "value": 497, "description": "What this delivers" },
        { "name": "Community/Support Name", "value": 297, "description": "What this delivers" },
        { "name": "Additional Bonus", "value": 197, "description": "What this delivers" }
    ],
    "totalValue": 2988,
    "reasoning": "Why this value stack is compelling"
}

Rules:
- Create 4-6 specific, benefit-focused items
- Total perceived value should be 3-5x the actual price ($${setupData.oneTimePrice})
- Names should be specific to this product, not generic
- Include mix of: core product, templates/tools, community/support, bonuses
- Values should be believable but compelling`,
                    userPrompt: `Product: ${setupData.productName}
Price: $${setupData.oneTimePrice}
Type: ${setupData.productType}
Avatar: ${setupData.avatarName}
Description: ${setupData.productDescription || 'Digital product'}
Core Desire: ${setupData.coreDesire || 'Not specified'}
Transformation: ${setupData.icpAnswers[13] || 'Not specified'}
Problem Solved: ${setupData.icpAnswers[8] || 'Not specified'}

Generate a value stack that makes $${setupData.oneTimePrice} feel like a steal.`
                })
            });

            if (!response.ok) throw new Error("API request failed");

            const data = await response.json();

            if (data.items && Array.isArray(data.items)) {
                const valueStack: ValueStackItem[] = data.items.map((item: any, idx: number) => ({
                    id: `v${idx + 1}`,
                    name: item.name,
                    value: item.value,
                    description: item.description
                }));
                setSetupData(prev => ({ ...prev, valueStack }));
                toast.success("AI generated your value stack!");
            }
        } catch (error) {
            console.error("Error generating value stack:", error);
            toast.error("Failed to generate value stack. Please add items manually.");
        } finally {
            setIsGeneratingValueStack(false);
        }
    };

    // Value Stack Management
    const addValueStackItem = () => {
        const newItem: ValueStackItem = {
            id: `v${Date.now()}`,
            name: "",
            value: 0
        };
        setSetupData(prev => ({
            ...prev,
            valueStack: [...prev.valueStack, newItem]
        }));
    };

    const updateValueStackItem = (id: string, field: keyof ValueStackItem, value: any) => {
        setSetupData(prev => ({
            ...prev,
            valueStack: prev.valueStack.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const removeValueStackItem = (id: string) => {
        setSetupData(prev => ({
            ...prev,
            valueStack: prev.valueStack.filter(item => item.id !== id)
        }));
    };

    // Pricing Tier Management
    const updatePricingTier = (id: string, field: keyof PricingTier, value: any) => {
        setSetupData(prev => ({
            ...prev,
            pricingTiers: prev.pricingTiers.map(tier =>
                tier.id === id ? { ...tier, [field]: value } : tier
            )
        }));
    };

    const handleContinue = () => {
        if (step === 1) {
            if (!setupData.avatarName) {
                toast.error("Please enter your avatar name");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!setupData.productName) {
                toast.error("Please enter product name");
                return;
            }
            setStep(3);
        } else {
            // Validate pricing based on product type
            if (setupData.productType === 'saas') {
                const hasValidTiers = setupData.pricingTiers.some(t => t.price && parseFloat(t.price) > 0);
                if (!hasValidTiers) {
                    toast.error("Please configure at least one pricing tier");
                    return;
                }
            } else {
                if (!setupData.oneTimePrice) {
                    toast.error("Please enter your product price");
                    return;
                }
            }

            // Store setup data
            updateSection('hero', {
                eyebrow: `Attention ${setupData.avatarName}s`
            });

            setBrandSetup({
                avatarName: setupData.avatarName,
                productName: setupData.productName,
                productPrice: setupData.productType === 'saas'
                    ? setupData.pricingTiers.find(t => t.isPopular)?.price || setupData.pricingTiers[1]?.price || '79'
                    : setupData.oneTimePrice,
                productDescription: setupData.productDescription
            });

            // Navigate with full context
            navigate('/landing-pad/generate', {
                state: {
                    setupData: {
                        ...setupData,
                        colorPalette,
                        icpContext: {
                            coreDesire: setupData.coreDesire,
                            sixS: setupData.sixS,
                            idealCustomer: setupData.icpAnswers[1] || null,
                            successLooksLike: setupData.icpAnswers[2] || null,
                            problemSolved: setupData.icpAnswers[8] || null,
                            transformationPromise: setupData.icpAnswers[13] || null,
                            objections: setupData.icpAnswers[11] || null,
                            motivations: setupData.icpAnswers[12] || null,
                            marketingStatements: setupData.marketingStatements
                        }
                    }
                }
            });
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((step - 1) as 1 | 2 | 3);
        }
    };

    const totalValueStackValue = setupData.valueStack.reduce((sum, item) => sum + (item.value || 0), 0);
    const valueStackDiscount = setupData.oneTimePrice && totalValueStackValue > 0
        ? Math.round(((totalValueStackValue - parseFloat(setupData.oneTimePrice)) / totalValueStackValue) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="mr-1"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-bold">Landing Pad</h1>
                        <p className="text-xs text-muted-foreground">Smart Setup</p>
                    </div>
                </div>

                {/* Progress Indicator - 3 Steps */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map((s, idx) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                step > s ? "bg-emerald-500 text-white" :
                                    step === s ? "bg-primary text-primary-foreground" :
                                        "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {idx < 2 && (
                                <div className="w-8 h-0.5 bg-muted mx-1">
                                    <div className={cn(
                                        "h-full transition-all",
                                        step > s ? "bg-emerald-500 w-full" : "bg-primary w-0"
                                    )} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-2xl space-y-8">
                    {step === 1 && (
                        /* Step 1: Avatar Confirmation */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-display font-bold">Who are you building for?</h2>
                                <p className="text-muted-foreground">
                                    Select your target avatar so we can personalize everything.
                                </p>
                            </div>

                            <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-6 space-y-4 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                                <AvatarSelector
                                    selectedAvatar={selectedAvatar}
                                    onAvatarSelect={handleAvatarSelect}
                                    onSessionSwitch={handleSessionSwitch}
                                    disableSessionWarnings={true}
                                />

                                {/* Session Repair UI - shown when avatar has no session ID */}
                                {showSessionRepair && selectedAvatar && availableSessions.length > 0 && (
                                    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm text-orange-400">
                                                    {selectedAvatar.name} is not linked to an ICP session
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Marketing data and product details cannot be loaded. Link this avatar to a session to restore full functionality.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Select the ICP session to link:</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSessions.map((session) => (
                                                    <Button
                                                        key={session.id}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRepairSessionId(session.id)}
                                                        disabled={isRepairingSession}
                                                        className="text-xs"
                                                    >
                                                        {isRepairingSession ? (
                                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Link className="w-3 h-3 mr-1" />
                                                        )}
                                                        Session from {session.date}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-4 border-t border-border">
                                    <Label htmlFor="avatarName">Avatar Name</Label>
                                    <Input
                                        id="avatarName"
                                        placeholder="e.g. Burnt-Out Course Creator"
                                        value={setupData.avatarName}
                                        onChange={(e) => setSetupData({ ...setupData, avatarName: e.target.value })}
                                        className="text-lg"
                                    />
                                </div>

                                {setupData.painPoints.length > 0 && (
                                    <div className="space-y-2 pt-4 border-t border-border">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Known Pain Points
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {setupData.painPoints.map((pain, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                >
                                                    {pain.length > 40 ? pain.slice(0, 40) + "..." : pain}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        /* Step 2: Product Details */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-display font-bold">What are you selling?</h2>
                                <p className="text-muted-foreground">
                                    Tell us about your product to craft the perfect pitch.
                                </p>
                            </div>

                            <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-6 space-y-6 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                                {isLoadingSessionData && (
                                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground">Loading from ICP session...</span>
                                    </div>
                                )}

                                {setupData.icpAnswers.length > 0 && !isLoadingSessionData && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm text-emerald-400">Pre-filled from your ICP session</span>
                                    </div>
                                )}

                                {/* Product Type Selection */}
                                <div className="space-y-3">
                                    <Label>Product Type</Label>
                                    <RadioGroup
                                        value={setupData.productType}
                                        onValueChange={(value) => setSetupData({ ...setupData, productType: value as ProductType })}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        {PRODUCT_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <div key={type.value}>
                                                    <RadioGroupItem
                                                        value={type.value}
                                                        id={type.value}
                                                        className="peer sr-only"
                                                    />
                                                    <Label
                                                        htmlFor={type.value}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                            setupData.productType === type.value
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/50"
                                                        )}
                                                    >
                                                        <Icon className={cn(
                                                            "w-6 h-6",
                                                            setupData.productType === type.value ? "text-primary" : "text-muted-foreground"
                                                        )} />
                                                        <span className="font-medium text-sm">{type.label}</span>
                                                        <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name</Label>
                                    <Input
                                        id="productName"
                                        placeholder="e.g. Course Creator Accelerator"
                                        value={setupData.productName}
                                        onChange={(e) => setSetupData({ ...setupData, productName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="productDescription">Description</Label>
                                    <Textarea
                                        id="productDescription"
                                        placeholder="What does your product help people achieve?"
                                        value={setupData.productDescription}
                                        onChange={(e) => setSetupData({ ...setupData, productDescription: e.target.value })}
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <ColorPalettePicker
                                        productName={setupData.productName}
                                        productDescription={setupData.productDescription}
                                        avatarName={setupData.avatarName}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        /* Step 3: Offer Builder */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Layers className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-display font-bold">Build Your Offer</h2>
                                <p className="text-muted-foreground">
                                    {setupData.productType === 'saas'
                                        ? "Configure your pricing tiers for maximum conversion"
                                        : "Set your price and build a compelling value stack"}
                                </p>
                            </div>

                            <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-6 space-y-6 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                                {/* AI Pricing Assistant */}
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Wand2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">AI Pricing Strategist</p>
                                            <p className="text-xs text-muted-foreground">
                                                Get intelligent pricing recommendations based on your product and market
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={generateAIPricing}
                                        disabled={isGeneratingPricing || !setupData.productName}
                                        size="sm"
                                    >
                                        {isGeneratingPricing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Pricing
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* AI Reasoning Display */}
                                {aiPricingReasoning && (
                                    <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                        <div className="flex items-start gap-2">
                                            <Lightbulb className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-emerald-400">{aiPricingReasoning}</p>
                                        </div>
                                    </div>
                                )}

                                {setupData.productType === 'saas' ? (
                                    /* SaaS Tiered Pricing */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Pricing Tiers</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newId = `tier-${Date.now()}`;
                                                    setSetupData(prev => ({
                                                        ...prev,
                                                        pricingTiers: [...prev.pricingTiers, {
                                                            id: newId,
                                                            name: 'New Tier',
                                                            price: '99',
                                                            features: ['Feature 1', 'Feature 2'],
                                                            isPopular: false
                                                        }]
                                                    }));
                                                }}
                                                className="h-7 text-xs"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add Tier
                                            </Button>
                                        </div>
                                        <div className="grid gap-4">
                                            {setupData.pricingTiers.map((tier) => (
                                                <div
                                                    key={tier.id}
                                                    className={cn(
                                                        "p-4 rounded-lg border transition-all",
                                                        tier.isPopular
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <Input
                                                            value={tier.name}
                                                            onChange={(e) => updatePricingTier(tier.id, 'name', e.target.value)}
                                                            className="w-32 h-8 text-sm font-medium"
                                                            placeholder="Tier name"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant={tier.isPopular ? "default" : "outline"}
                                                                size="sm"
                                                                className="h-7 text-xs"
                                                                onClick={() => {
                                                                    // Set this as popular, unset others
                                                                    setSetupData(prev => ({
                                                                        ...prev,
                                                                        pricingTiers: prev.pricingTiers.map(t => ({
                                                                            ...t,
                                                                            isPopular: t.id === tier.id
                                                                        }))
                                                                    }));
                                                                }}
                                                            >
                                                                {tier.isPopular ? "★ Popular" : "Set Popular"}
                                                            </Button>
                                                            {setupData.pricingTiers.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => {
                                                                        setSetupData(prev => ({
                                                                            ...prev,
                                                                            pricingTiers: prev.pricingTiers.filter(t => t.id !== tier.id)
                                                                        }));
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center">
                                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={tier.price}
                                                                onChange={(e) => updatePricingTier(tier.id, 'price', e.target.value)}
                                                                className="w-20 h-8"
                                                                placeholder="79"
                                                            />
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">/month</span>
                                                    </div>
                                                    <div className="mt-3">
                                                        <Textarea
                                                            value={tier.features.join('\n')}
                                                            onChange={(e) => updatePricingTier(tier.id, 'features', e.target.value.split('\n'))}
                                                            placeholder="Enter features (one per line)"
                                                            className="text-xs min-h-[60px]"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* One-Time Pricing + Value Stack */
                                    <div className="space-y-6">
                                        {/* Price Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Your Price</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    placeholder="997"
                                                    value={setupData.oneTimePrice}
                                                    onChange={(e) => setSetupData({ ...setupData, oneTimePrice: e.target.value })}
                                                    className="pl-8 text-lg"
                                                />
                                            </div>
                                        </div>

                                        {/* Value Stack */}
                                        <div className="space-y-3 pt-4 border-t border-border">
                                            <div className="flex items-center justify-between">
                                                <Label>Value Stack</Label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateAIValueStack}
                                                        disabled={isGeneratingValueStack || !setupData.oneTimePrice}
                                                        className="h-7 text-xs"
                                                    >
                                                        {isGeneratingValueStack ? (
                                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Wand2 className="w-3 h-3 mr-1" />
                                                        )}
                                                        AI Generate
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={addValueStackItem}
                                                        className="h-7 text-xs"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Item
                                                    </Button>
                                                </div>
                                            </div>

                                            {setupData.valueStack.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No value stack items yet</p>
                                                    <p className="text-xs">Add items or let AI generate them</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {setupData.valueStack.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                                                        >
                                                            <Input
                                                                value={item.name}
                                                                onChange={(e) => updateValueStackItem(item.id, 'name', e.target.value)}
                                                                placeholder="Deliverable name"
                                                                className="flex-1 h-8 text-sm"
                                                            />
                                                            <div className="flex items-center">
                                                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                                                <Input
                                                                    type="number"
                                                                    value={item.value || ''}
                                                                    onChange={(e) => updateValueStackItem(item.id, 'value', parseInt(e.target.value) || 0)}
                                                                    placeholder="Value"
                                                                    className="w-20 h-8 text-sm"
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeValueStackItem(item.id)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    {/* Value Stack Summary */}
                                                    {setupData.valueStack.length > 0 && (
                                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-muted-foreground">Total Value:</span>
                                                                <span className="text-lg font-bold text-foreground">
                                                                    ${totalValueStackValue.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-muted-foreground">Your Price:</span>
                                                                <span className="text-lg font-bold text-primary">
                                                                    ${setupData.oneTimePrice || '0'}
                                                                </span>
                                                            </div>
                                                            {valueStackDiscount > 0 && (
                                                                <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                                                                    <span className="text-sm text-muted-foreground">Savings:</span>
                                                                    <span className="text-sm font-bold text-emerald-500">
                                                                        {valueStackDiscount}% OFF
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4">
                        {step > 1 ? (
                            <Button variant="ghost" onClick={handleBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        <Button
                            onClick={handleContinue}
                            className="bg-gradient-to-r from-primary to-cyan-400 text-black font-bold px-8 shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                        >
                            {step < 3 ? (
                                <>
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Landing Page
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
