/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses setHeaderActions() pattern to inject header content
 * into the main AppLayout header. See DirectorsCut.tsx for the new implementation.
 */
import React from 'react';
import { Button } from "@/components/ui/button";
import { MonitorPlay, Download, Share2, Ratio } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function DirectorHeader() {
    return (
        <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-display font-bold text-primary">
                    Director's Cut
                </h1>
                <div className="h-6 w-px bg-border" />
                <span className="text-sm text-muted-foreground">Project: Alpha Launch</span>
            </div>

            <div className="flex items-center gap-6">
                {/* Aspect Ratio Toggle */}
                <div className="flex items-center gap-2">
                    <Ratio className="w-4 h-4 text-muted-foreground" />
                    <ToggleGroup type="single" defaultValue="9:16" className="bg-muted rounded-lg p-1">
                        <ToggleGroupItem value="9:16" size="sm" className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            9:16
                        </ToggleGroupItem>
                        <ToggleGroupItem value="1:1" size="sm" className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            1:1
                        </ToggleGroupItem>
                        <ToggleGroupItem value="16:9" size="sm" className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            16:9
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="h-6 w-px bg-border" />

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                        <MonitorPlay className="w-4 h-4 mr-2" />
                        Preview Full
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>
        </div>
    );
}
