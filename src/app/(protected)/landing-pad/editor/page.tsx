'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useArchitectStore } from "@/store/architectStore";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Rocket,
    Zap,
    AlertCircle,
    Star,
    ArrowRight,
    DollarSign,
    MousePointer2,
    Building2,
    CheckCircle,
    Circle,
    Edit,
    Monitor,
    Smartphone,
    Download,
    Eye,
    RotateCcw,
    ChevronLeft
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalPaletteEditor } from "@/components/landing-pad/GlobalPaletteEditor";

// Editor Components
import { HeroSection } from "@/components/architect/HeroSection";
import { ProblemAgitateSection } from "@/components/architect/ProblemAgitateSection";
import { SocialProofSection } from "@/components/architect/SocialProofSection";
import { TransformationSection } from "@/components/architect/TransformationSection";
import { ValueStackSection } from "@/components/architect/ValueStackSection";
import { SecondaryCTASection } from "@/components/architect/SecondaryCTASection";
import { FooterSection } from "@/components/architect/FooterSection";

// Preview Components
import { HeroRef } from "@/components/architect/preview/HeroRef";
import { ProblemRef } from "@/components/architect/preview/ProblemRef";
import { SocialProofRef } from "@/components/architect/preview/SocialProofRef";
import { TransformationRef } from "@/components/architect/preview/TransformationRef";
import { ValueStackRef } from "@/components/architect/preview/ValueStackRef";
import { SecondaryCTARef } from "@/components/architect/preview/SecondaryCTARef";
import { FooterRef } from "@/components/architect/preview/FooterRef";

interface Section {
    id: string;
    label: string;
    icon: React.ElementType;
    editor: React.ComponentType;
    preview: React.ComponentType;
}

const SECTIONS: Section[] = [
    { id: "hero", label: "Hero", icon: Zap, editor: HeroSection, preview: HeroRef },
    { id: "problem", label: "Problem", icon: AlertCircle, editor: ProblemAgitateSection, preview: ProblemRef },
    { id: "social", label: "Social Proof", icon: Star, editor: SocialProofSection, preview: SocialProofRef },
    { id: "transformation", label: "Transformation", icon: ArrowRight, editor: TransformationSection, preview: TransformationRef },
    { id: "value", label: "Value Stack", icon: DollarSign, editor: ValueStackSection, preview: ValueStackRef },
    { id: "cta", label: "Secondary CTA", icon: MousePointer2, editor: SecondaryCTASection, preview: SecondaryCTARef },
    { id: "footer", label: "Footer", icon: Building2, editor: FooterSection, preview: FooterRef },
];

export default function LandingPadEditorPage() {
    const router = useRouter();
    const { setHeaderActions } = useApp();
    const { data, reset } = useArchitectStore();

    const [activeSection, setActiveSection] = useState("hero");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [completedSections, setCompletedSections] = useState<string[]>([]);

    // Check which sections have content
    useEffect(() => {
        const completed: string[] = [];

        if (data.hero.headline) completed.push("hero");
        if (data.problemAgitate.generatedCopy.headline) completed.push("problem");
        if (data.socialProof.testimonials.length > 0 || data.socialProof.generatedCopy.headline) completed.push("social");
        if (data.transformation.generatedCopy.headline || data.transformation.beforeState) completed.push("transformation");
        if (data.valueStack.items.length > 0) completed.push("value");
        if (data.secondaryCTA.headline) completed.push("cta");
        if (data.footer.companyName) completed.push("footer");

        setCompletedSections(completed);
    }, [data]);

    // Set up header actions
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-3">
                {/* Global Style Editor (Colors & Fonts) */}
                <GlobalPaletteEditor />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (confirm("Reset all sections? This cannot be undone.")) {
                            reset();
                        }
                    }}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/landing-pad/preview', '_blank')}
                >
                    <Eye className="w-4 h-4 mr-2" />
                    Full Preview
                </Button>
                <Button
                    className="bg-gradient-to-r from-primary to-cyan-400 text-black font-bold shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                    size="sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>
        );

        return () => setHeaderActions(null);
    }, [setHeaderActions, reset]);

    const currentSection = SECTIONS.find(s => s.id === activeSection);
    const EditorComponent = currentSection?.editor;
    const PreviewComponent = currentSection?.preview;

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-background flex flex-col overflow-hidden">
            {/* Sub-Header */}
            <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/landing-pad')}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Rocket className="w-4 h-4 text-primary" />
                    </div>
                    <h1 className="font-display text-sm font-bold tracking-tight">Landing Pad Editor</h1>
                    <span className="text-xs text-muted-foreground font-mono">
                        {completedSections.length}/{SECTIONS.length} sections
                    </span>
                </div>

                {/* Preview Mode Toggle */}
                <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "desktop" | "mobile")}>
                    <TabsList className="h-8">
                        <TabsTrigger value="desktop" className="text-xs h-7 px-3">
                            <Monitor className="w-3 h-3 mr-1" />
                            Desktop
                        </TabsTrigger>
                        <TabsTrigger value="mobile" className="text-xs h-7 px-3">
                            <Smartphone className="w-3 h-3 mr-1" />
                            Mobile
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            {/* 3-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Section Navigation */}
                <aside className="w-56 border-r border-border bg-background flex-shrink-0 overflow-y-auto">
                    <nav className="p-3 space-y-1">
                        {SECTIONS.map((section, index) => {
                            const isActive = activeSection === section.id;
                            const isCompleted = completedSections.includes(section.id);
                            const Icon = section.icon;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 flex-shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    <span className="flex-1 font-medium truncate">
                                        {index + 1}. {section.label}
                                    </span>
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : isActive ? (
                                        <Edit className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Circle className="w-4 h-4 opacity-20" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Progress Summary */}
                    <div className="p-4 border-t border-border">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-mono text-foreground">
                                    {Math.round((completedSections.length / SECTIONS.length) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                                    style={{ width: `${(completedSections.length / SECTIONS.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* CENTER: Live Preview */}
                <main className="flex-1 bg-stone-100 dark:bg-stone-900 overflow-y-auto flex justify-center p-6">
                    <div
                        className={cn(
                            "bg-white dark:bg-black shadow-2xl transition-all duration-300 origin-top overflow-hidden",
                            previewMode === "mobile"
                                ? "w-[375px] rounded-3xl border-[8px] border-gray-800"
                                : "w-full max-w-4xl"
                        )}
                    >
                        {PreviewComponent && <PreviewComponent />}
                    </div>
                </main>

                {/* RIGHT: Section Editor */}
                <aside className="w-96 border-l border-border bg-background flex-shrink-0 flex flex-col overflow-hidden">
                    {/* Editor Header */}
                    <div className="h-12 border-b border-border flex items-center px-4 bg-card/50 shrink-0">
                        <h2 className="font-display text-sm font-semibold flex items-center gap-2">
                            {currentSection && <currentSection.icon className="w-4 h-4 text-primary" />}
                            Edit: {currentSection?.label}
                        </h2>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {EditorComponent && <EditorComponent />}
                    </div>

                    {/* Editor Footer - Next Section */}
                    <div className="p-4 border-t border-border bg-card/50">
                        <Button
                            onClick={() => {
                                const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
                                if (currentIndex < SECTIONS.length - 1) {
                                    setActiveSection(SECTIONS[currentIndex + 1].id);
                                }
                            }}
                            disabled={SECTIONS.findIndex(s => s.id === activeSection) === SECTIONS.length - 1}
                            className="w-full"
                            variant="outline"
                        >
                            Next Section
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
