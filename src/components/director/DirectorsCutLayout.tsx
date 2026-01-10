/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses a new architecture with ScriptEditCard, ScriptDoctorPanel,
 * and PhonePreview components instead. See DirectorsCut.tsx for the new implementation.
 */
import React from 'react';
import { cn } from "@/lib/utils";

interface DirectorsCutLayoutProps {
    header: React.ReactNode;
    timeline: React.ReactNode;
    actionPanel: React.ReactNode;
    mainStage: React.ReactNode;
}

export function DirectorsCutLayout({
    header,
    timeline,
    actionPanel,
    mainStage
}: DirectorsCutLayoutProps) {
    return (
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden text-foreground">
            {/* Top Bar (Header) */}
            <div className="h-16 border-b border-border flex-none z-50 bg-background/95 backdrop-blur">
                {header}
            </div>

            {/* Middle Section (Stage + Sidebar) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center Canvas (Main Stage) */}
                <div className="flex-1 relative bg-muted/30 overflow-hidden flex items-center justify-center">
                    {mainStage}
                </div>

                {/* Right Sidebar (Action Panel) - Floating Card Effect */}
                <div className={cn(
                    "w-80 flex-none overflow-y-auto",
                    "bg-card/85 backdrop-blur-xl border-l border-primary/25",
                    "shadow-[inset_4px_0_20px_-10px_rgba(79,209,255,0.15)]"
                )}>
                    {actionPanel}
                </div>
            </div>

            {/* Bottom Rail (Timeline) - Floating Card Effect */}
            <div className={cn(
                "h-64 flex-none z-40",
                "bg-card/85 backdrop-blur-xl border-t border-primary/25",
                "shadow-[inset_0_4px_20px_-10px_rgba(79,209,255,0.15)]"
            )}>
                {timeline}
            </div>
        </div>
    );
}
