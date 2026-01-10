import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { useProjectStore } from "@/store/projectStore";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Flame, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Draggable Pain Point Item
const DraggablePainPoint = ({ id, text }: { id: string; text: string }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: { text }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "p-3 bg-card border rounded-md shadow-sm cursor-move flex items-center gap-2 text-sm hover:border-primary/50 transition-colors",
                isDragging && "opacity-50 ring-2 ring-primary"
            )}
        >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <span className="line-clamp-2">{text}</span>
        </div>
    );
};

// Drop Zone
const DropZone = ({ selectedPain }: { selectedPain: string }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'agitator-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all",
                isOver ? "border-red-500 bg-red-500/10 scale-[1.02]" : "border-muted",
                selectedPain ? "border-primary bg-primary/5" : "bg-muted/20"
            )}
        >
            {selectedPain ? (
                <div className="text-center">
                    <Flame className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-foreground">{selectedPain}</p>
                    <p className="text-xs text-muted-foreground mt-1">(Pain Point Selected)</p>
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Drag a Pain Point here</p>
                    <p className="text-xs opacity-70">to activate the Agitator</p>
                </div>
            )}
        </div>
    );
};

export const ProblemAgitateSection = () => {
    const { data, updateSection } = useArchitectStore();
    const { strategyContext } = useProjectStore();

    // Fallback Mock Data if Store is empty
    const painPoints = (strategyContext?.painPoints && strategyContext.painPoints.length > 0)
        ? strategyContext.painPoints
        : [
            "Losing $10k/mo in churn",
            "Wasting 20hrs/week on manual tasks",
            "Team is burnt out and quitting",
            "Competitors are stealing market share"
        ];

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        setActiveId(null);

        if (over && over.id === 'agitator-zone') {
            const text = active.data.current?.text;
            if (text) {
                updateSection('problemAgitate', { painPoint: text });
                toast.success("Pain point selected!");
            }
        }
    };

    const handleGenerate = async () => {
        if (!data.problemAgitate.painPoint || !data.problemAgitate.consequence) {
            toast.error("Please select a pain point and enter a consequence.");
            return;
        }

        setIsGenerating(true);

        try {
            const pain = data.problemAgitate.painPoint;
            const consequence = data.problemAgitate.consequence;

            const systemPrompt = `You are a direct response copywriter. Your job for this section is to 'Make the status quo painful.' Use short, punchy, impactful sentences. Take the provided pain point and consequence and write a 3-paragraph 'pacing and leading' script.
            
            Paragraph 1 (Pace): Acknowledge the current pain in a visceral way.
            Paragraph 2 (Agitate): Agitate the pain by showing the future consequences of inaction. Use the provided concrete loss.
            Paragraph 3 (Lead): Transition to the user's specific story or solution as the only way out.
            
            Return the response as a JSON object with this exact structure: { "headline": "string", "body": "string (with HTML <br> tags)" }`;

            const userPrompt = `Pain Point: ${pain}\nConsequence: ${consequence}`;

            const res = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            if (!res.ok) throw new Error("Failed to generate copy");

            const aiData = await res.json();

            if (aiData.headline && aiData.body) {
                updateSection('problemAgitate', { generatedCopy: aiData });
                toast.success("Copy generated successfully!");
            } else {
                throw new Error("Invalid AI response format");
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate copy. Is the backend running?");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                {/* Header */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Step 2: Make the Status Quo Painful</h3>
                    <p className="text-sm text-muted-foreground">
                        We need to twist the knife before we offer the bandage. Select a verified pain point from your research.
                    </p>
                </div>

                {/* 1. Pain Point Source */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Validated Pain Points</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {painPoints.map((pain, idx) => (
                            <DraggablePainPoint key={idx} id={`pain-${idx}`} text={pain} />
                        ))}
                    </div>
                </div>

                {/* 2. Drop Zone */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">The Agitator</Label>
                    <DropZone selectedPain={data.problemAgitate.painPoint} />
                </div>

                {/* 3. Consequence Input */}
                <div className="space-y-3">
                    <Label htmlFor="consequence">Concrete Consequence</Label>
                    <Input
                        id="consequence"
                        placeholder="e.g. You lose $50k in Q4 revenue."
                        value={data.problemAgitate.consequence}
                        onChange={(e) => updateSection('problemAgitate', { consequence: e.target.value })}
                        className="font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Be specific. What happens if they don't buy?
                    </p>
                </div>

                {/* 4. Action */}
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !data.problemAgitate.painPoint}
                    className="w-full h-12 text-md font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                >
                    {isGenerating ? "Agitating..." : "[ AGITATE PAIN WITH AI ]"}
                </Button>

                <DragOverlay>
                    {activeId ? (
                        <div className="p-3 bg-card border rounded-md shadow-xl opacity-90 w-64 rotate-3 cursor-grabbing">
                            Dragging...
                        </div>
                    ) : null}
                </DragOverlay>

            </div>
        </DndContext>
    );
};
