'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface MediaLabLayoutProps {
    children: React.ReactNode;
    leftRail?: React.ReactNode;
    rightRail?: React.ReactNode;
    bottomBar?: React.ReactNode;
}

export const MediaLabLayout = ({
    children,
    leftRail,
    rightRail,
    bottomBar
}: MediaLabLayoutProps) => {

    return (
        <div className="min-h-screen bg-void text-g-text font-sans overflow-hidden flex flex-col dark">
            {/* Top Bar */}


            {/* Main Workspace */}
            < div className="flex-1 flex overflow-hidden relative" >
                {/* Left Rail - Asset Bin */}
                < aside className="w-[280px] border-r border-glass-stroke bg-void-depth/50 backdrop-blur-sm flex flex-col z-40" >
                    <div className="p-4 border-b border-white/5 bg-void/50">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-g-muted/70">Assets</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {leftRail}
                    </div>
                </aside >

                {/* Center Canvas */}
                < main className="flex-1 relative overflow-hidden bg-void flex flex-col" >
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
                        {children}
                    </div>

                    {/* Bottom Bar - Timeline */}
                    {
                        bottomBar && (
                            <div className="h-[200px] border-t border-glass-stroke bg-void-depth/80 backdrop-blur-md z-30">
                                {bottomBar}
                            </div>
                        )
                    }
                </main >

                {/* Right Rail - The Construct */}
                < aside className="w-[320px] border-l border-glass-stroke bg-void-depth/30 backdrop-blur-sm flex flex-col z-40" >
                    <div className="p-4 border-b border-white/5 bg-void/50 flex justify-between items-center">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-electric-cyan/80">Sparky</h2>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-electric-cyan/50" />
                            <div className="w-1 h-1 rounded-full bg-electric-cyan/50" />
                            <div className="w-1 h-1 rounded-full bg-electric-cyan animate-pulse shadow-[0_0_5px_#00F0FF]" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 relative">
                        {rightRail}
                    </div>
                </aside >
            </div >
        </div >
    );
};
