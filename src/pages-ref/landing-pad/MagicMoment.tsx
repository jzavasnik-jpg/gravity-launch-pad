import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useArchitectStore } from "@/store/architectStore";
import { useProjectStore } from "@/store/projectStore";
import { Sparkles, Rocket, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ICPContext {
    coreDesire: string | null;
    sixS: string | null;
    idealCustomer: string | null;
    successLooksLike: string | null;
    problemSolved: string | null;
    transformationPromise: string | null;
    objections: string | null;
    motivations: string | null;
    marketingStatements: {
        solution_statement: string | null;
        usp_statement: string | null;
        transformation_statement: string | null;
    } | null;
}

interface SetupData {
    avatarName: string;
    productName: string;
    productPrice: string;
    productDescription: string;
    primaryColor: string;
    painPoints: string[];
    icpContext?: ICPContext;
}

const GENERATION_STEPS = [
    { id: "hero", label: "Crafting Hero Section", duration: 2000 },
    { id: "problem", label: "Agitating Pain Points", duration: 2500 },
    { id: "social", label: "Building Social Proof", duration: 2000 },
    { id: "transformation", label: "Mapping Transformation", duration: 2500 },
    { id: "value", label: "Stacking the Value", duration: 2000 },
    { id: "cta", label: "Writing Call-to-Action", duration: 1500 },
    { id: "footer", label: "Finalizing Footer", duration: 1000 },
];

export function MagicMoment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateSection, reset } = useArchitectStore();
    const { strategyContext } = useProjectStore();

    const setupData = (location.state as { setupData: SetupData })?.setupData;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!setupData) {
            toast.error("Setup data missing. Redirecting...");
            navigate('/landing-pad');
            return;
        }

        // Start the generation process
        generateLandingPage();
    }, []);

    const generateLandingPage = async () => {
        // Reset architect store for fresh generation
        reset();

        const painPoints = setupData.painPoints.length > 0
            ? setupData.painPoints
            : strategyContext?.painPoints || ["Time wasted on manual tasks", "Struggling to scale", "Overwhelmed by complexity"];

        // Process each step with simulated delays
        for (let i = 0; i < GENERATION_STEPS.length; i++) {
            setCurrentStepIndex(i);

            // Simulate AI generation time
            await new Promise(resolve => setTimeout(resolve, GENERATION_STEPS[i].duration));

            // Generate content for each section
            const step = GENERATION_STEPS[i];

            try {
                switch (step.id) {
                    case "hero":
                        await generateHeroSection(setupData);
                        break;
                    case "problem":
                        await generateProblemSection(setupData, painPoints);
                        break;
                    case "social":
                        generateSocialProofSection();
                        break;
                    case "transformation":
                        await generateTransformationSection(setupData, painPoints);
                        break;
                    case "value":
                        await generateValueSection(setupData);
                        break;
                    case "cta":
                        generateCTASection(setupData);
                        break;
                    case "footer":
                        generateFooterSection(setupData);
                        break;
                }
            } catch (error) {
                console.error(`Error generating ${step.id}:`, error);
                // Continue with fallback content
            }

            setCompletedSteps(prev => [...prev, step.id]);
        }

        setIsComplete(true);

        // Auto-navigate after a brief pause
        setTimeout(() => {
            navigate('/landing-pad/editor');
        }, 1500);
    };

    const generateHeroSection = async (data: SetupData) => {
        const icpContext = data.icpContext;
        const marketingStatements = icpContext?.marketingStatements;

        // Try to call AI with rich ICP context
        try {
            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `Generate high-converting hero section copy for a landing page.

Return JSON: { "eyebrow": "string (5-10 words)", "headline": "string (powerful, benefit-driven)", "subheadline": "string (supporting detail)" }

The copy should:
- Hook the reader immediately
- Speak directly to their core desire
- Promise a specific transformation
- Feel personal and relevant`,
                    userPrompt: `Product: ${data.productName}
Price: $${data.productPrice}
Description: ${data.productDescription || 'Digital product'}
Core Desire: ${icpContext?.coreDesire || 'not specified'}
Primary Emotion (Six S): ${icpContext?.sixS || 'not specified'}
Transformation Promise: ${icpContext?.transformationPromise || 'not specified'}
USP: ${marketingStatements?.usp_statement || 'not specified'}
Solution Statement: ${marketingStatements?.solution_statement || 'not specified'}`
                })
            });

            if (res.ok) {
                const aiData = await res.json();
                updateSection('hero', {
                    eyebrow: aiData.eyebrow || "Transform Your Results Today",
                    headline: aiData.headline || `Finally, ${data.productName} That Actually Works`,
                    subheadline: aiData.subheadline || data.productDescription || "Transform your results without the overwhelm.",
                    ctaPrimary: `Get ${data.productName} for $${data.productPrice}`,
                    generatedCopy: aiData
                });
                return;
            }
        } catch (e) {
            // Fallback to template
        }

        updateSection('hero', {
            eyebrow: "Transform Your Results Today",
            headline: `Finally, ${data.productName} That Actually Works`,
            subheadline: data.productDescription || marketingStatements?.solution_statement || "Transform your results without the overwhelm.",
            ctaPrimary: `Get ${data.productName} for $${data.productPrice}`,
            generatedCopy: {
                eyebrow: "Transform Your Results Today",
                headline: `Finally, ${data.productName} That Actually Works`,
                subheadline: data.productDescription || "Transform your results without the overwhelm.",
            }
        });
    };

    const generateProblemSection = async (data: SetupData, painPoints: string[]) => {
        const mainPain = painPoints[0] || "Struggling to get results";

        try {
            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `Generate problem-agitate copy that twists the knife. Return JSON: { "headline": "string", "body": "string with HTML <br> tags" }. Do NOT include any specific persona or avatar names in the copy.`,
                    userPrompt: `Pain point: ${mainPain}, Product: ${data.productName}`
                })
            });

            if (res.ok) {
                const aiData = await res.json();
                updateSection('problemAgitate', {
                    painPoint: mainPain,
                    consequence: "Lost time, lost money, lost opportunities.",
                    generatedCopy: aiData
                });
                return;
            }
        } catch (e) {
            // Fallback
        }

        updateSection('problemAgitate', {
            painPoint: mainPain,
            consequence: "Lost time, lost money, lost opportunities.",
            generatedCopy: {
                headline: `${mainPain}... Sound Familiar?`,
                body: `You're not alone. Every day, people just like you face this exact struggle.<br><br>The frustration builds. The doubt creeps in. You start to wonder if there's even a solution.<br><br>There is. And it's closer than you think.`
            }
        });
    };

    const generateSocialProofSection = () => {
        updateSection('socialProof', {
            testimonials: [
                {
                    id: "t1",
                    name: "Sarah M.",
                    role: "Course Creator",
                    quote: "This completely changed how I approach my business. The results speak for themselves."
                },
                {
                    id: "t2",
                    name: "James K.",
                    role: "Digital Entrepreneur",
                    quote: "I was skeptical at first, but within 30 days I saw a complete transformation."
                }
            ],
            metrics: [
                { id: "m1", value: "10,000+", label: "Happy Customers" },
                { id: "m2", value: "$5M+", label: "Revenue Generated" },
                { id: "m3", value: "4.9/5", label: "Average Rating" }
            ],
            logos: [],
            generatedCopy: {
                headline: "Join Thousands Who Made The Switch",
                subheadline: "Real results from real people just like you"
            }
        });
    };

    const generateTransformationSection = async (data: SetupData, painPoints: string[]) => {
        try {
            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `Generate before/after transformation copy. Return JSON: { "headline": "string", "beforeList": ["string",...], "afterList": ["string",...], "bridgeText": "string" }. Do NOT include any specific persona or avatar names in the copy.`,
                    userPrompt: `Product: ${data.productName}, Pain points: ${painPoints.join(", ")}`
                })
            });

            if (res.ok) {
                const aiData = await res.json();
                updateSection('transformation', {
                    beforeState: painPoints.join("\n"),
                    afterState: "Success, freedom, results",
                    timeline: "In just 30 days",
                    generatedCopy: aiData
                });
                return;
            }
        } catch (e) {
            // Fallback
        }

        updateSection('transformation', {
            beforeState: painPoints.join("\n"),
            afterState: "Success, freedom, results",
            timeline: "In just 30 days",
            generatedCopy: {
                headline: "Your Transformation Starts Here",
                beforeList: [
                    "Overwhelmed and stuck",
                    "Wasting time on what doesn't work",
                    "Watching others succeed",
                    "Doubting if it's possible"
                ],
                afterList: [
                    "Clear and confident",
                    "Focused on proven strategies",
                    "Celebrating your wins",
                    "Knowing exactly what to do next"
                ],
                bridgeText: `${data.productName} is the bridge between where you are and where you want to be.`
            }
        });
    };

    const generateValueSection = async (data: SetupData) => {
        const basePrice = parseInt(data.productPrice) || 997;
        const icpContext = data.icpContext;

        // Try AI-generated value stack based on ICP context
        try {
            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `You are a digital product pricing strategist. Generate a compelling value stack for a landing page.

Return ONLY a JSON object with this structure:
{
    "items": [
        { "name": "Deliverable name", "value": 1997 },
        { "name": "Second deliverable", "value": 497 },
        { "name": "Third deliverable", "value": 297 },
        { "name": "Bonus item", "value": 197 }
    ]
}

Rules:
- Create 4-6 items that feel valuable and specific to the product
- Total perceived value should be 3-5x the actual price
- Include a mix of: core product, templates/tools, community/support, bonuses
- Values should be believable but compelling
- Names should be specific and benefit-focused, not generic`,
                    userPrompt: `Product: ${data.productName}
Price: $${data.productPrice}
Description: ${data.productDescription || 'Digital product/course'}
Core Desire: ${icpContext?.coreDesire || 'not specified'}
Transformation Promise: ${icpContext?.transformationPromise || 'not specified'}
Problem Solved: ${icpContext?.problemSolved || 'not specified'}

Generate a value stack that makes $${data.productPrice} feel like a steal. Do NOT include any specific persona or avatar names.`
                })
            });

            if (res.ok) {
                const aiData = await res.json();
                if (aiData.items && Array.isArray(aiData.items)) {
                    updateSection('valueStack', {
                        items: aiData.items.map((item: any, idx: number) => ({
                            id: `v${idx + 1}`,
                            name: item.name,
                            value: item.value
                        })),
                        yourPrice: basePrice
                    });
                    return;
                }
            }
        } catch (e) {
            console.error("AI value stack generation failed:", e);
        }

        // Fallback to template-based value stack
        updateSection('valueStack', {
            items: [
                { id: "v1", name: `${data.productName} Core Program`, value: basePrice * 2 },
                { id: "v2", name: "Implementation Templates & Swipe Files", value: 497 },
                { id: "v3", name: "Private Community Access", value: 297 },
                { id: "v4", name: "Bonus: Quick-Start Training Modules", value: 397 }
            ],
            yourPrice: basePrice
        });
    };

    const generateCTASection = (data: SetupData) => {
        updateSection('secondaryCTA', {
            headline: "Ready to Transform Your Results?",
            subheadline: "Join thousands who took the leap and never looked back.",
            buttonText: `Get ${data.productName} Now`,
            urgencyText: "Limited spots available at this price",
            generatedCopy: {
                headline: "Ready to Transform Your Results?",
                subheadline: "Join thousands who took the leap and never looked back.",
                urgencyText: "Limited spots available at this price"
            }
        });
    };

    const generateFooterSection = (data: SetupData) => {
        updateSection('footer', {
            companyName: data.productName.split(" ")[0] || "Your Company",
            tagline: "Helping you succeed",
            contactEmail: "support@example.com",
            copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
            legalLinks: [
                { id: "privacy", label: "Privacy Policy", url: "/privacy" },
                { id: "terms", label: "Terms of Service", url: "/terms" }
            ]
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/landing-pad')}
                    className="mr-3"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-3">
                    <h1 className="font-display text-lg font-bold">Landing Pad</h1>
                    <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Content Header */}
                <div className="text-center space-y-4">
                    <div className={cn(
                        "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center transition-all duration-500",
                        isComplete
                            ? "bg-emerald-500/20"
                            : "bg-primary/20 animate-pulse"
                    )}>
                        {isComplete ? (
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        ) : (
                            <Sparkles className="w-10 h-10 text-primary animate-spin" />
                        )}
                    </div>
                    <h1 className="text-2xl font-display font-bold">
                        {isComplete ? "Your Landing Page is Ready!" : "Creating Your Landing Page..."}
                    </h1>
                    <p className="text-muted-foreground">
                        {isComplete
                            ? "Redirecting to editor..."
                            : "Sit back while we craft your high-converting page"}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-6 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)]">
                    <div className="space-y-3">
                        {GENERATION_STEPS.map((step, index) => {
                            const isCompleted = completedSteps.includes(step.id);
                            const isCurrent = index === currentStepIndex && !isComplete;

                            return (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                                        isCompleted && "bg-emerald-500/10",
                                        isCurrent && "bg-primary/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                        isCompleted && "bg-emerald-500",
                                        isCurrent && "bg-primary animate-pulse",
                                        !isCompleted && !isCurrent && "bg-muted"
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        ) : isCurrent ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        isCompleted && "text-emerald-400",
                                        isCurrent && "text-primary",
                                        !isCompleted && !isCurrent && "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Product Info Card */}
                {setupData && (
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Building for: <span className="text-foreground font-medium">{setupData.avatarName}</span></p>
                        <p>Product: <span className="text-foreground font-medium">{setupData.productName}</span></p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
