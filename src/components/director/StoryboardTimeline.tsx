/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses ScriptEditCard components in a vertical timeline layout.
 * See DirectorsCut.tsx for the new implementation.
 */
import { useProjectStore, Scene } from '@/store/projectStore';
import { cn } from "@/lib/utils";
import { GripVertical, Clock, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';





function SortableSceneCard({ scene, isActive, onClick }: { scene: Scene; isActive: boolean; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: scene.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group flex-none w-48 aspect-video bg-card/40 rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:border-primary/50",
                isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
            onClick={onClick}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 bg-background/50 rounded">
                <GripVertical className="w-4 h-4 text-foreground" />
            </div>

            {/* Thumbnail Image */}
            {scene.thumbnail ? (
                <img src={scene.thumbnail} alt="Scene" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-xs text-muted-foreground font-mono px-4 text-center">{scene.script}</span>
                </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-2 right-2 z-10">
                {scene.status === 'generating' && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
                {scene.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {scene.status === 'draft' && <Circle className="w-4 h-4 text-muted-foreground" />}
            </div>

            {/* Duration */}
            <div className="absolute bottom-2 right-2 z-10 bg-background/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {scene.duration}
            </div>

            {/* Active Indicator */}
            {isActive && (
                <div className="absolute inset-0 border-2 border-primary pointer-events-none rounded-lg" />
            )}
        </div>
    );
}

export function StoryboardTimeline() {
    const { directorsCutState, setDirectorsCutState } = useProjectStore();
    // Use scenes from store instead of local state mock
    const scenes = directorsCutState?.scenes || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = scenes.findIndex((item) => item.id === active.id);
            const newIndex = scenes.findIndex((item) => item.id === over.id);

            // Create new array and update store
            const newScenes = arrayMove(scenes, oldIndex, newIndex);
            setDirectorsCutState({ scenes: newScenes });
        }
    };

    const handleSceneClick = (id: string) => {
        setDirectorsCutState({ activeSceneId: id });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Timeline Sequence</span>
                <span className="text-xs font-mono text-muted-foreground">{scenes.length} Scenes</span>
            </div>

            <div className="flex-1 overflow-x-auto p-4 flex items-center gap-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={scenes.map(s => s.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {scenes.map((scene) => (
                            <SortableSceneCard
                                key={scene.id}
                                scene={scene}
                                isActive={directorsCutState.activeSceneId === scene.id}
                                onClick={() => handleSceneClick(scene.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {scenes.length === 0 && (
                    <div className="text-sm text-muted-foreground font-mono px-4">No scenes generated. Go back to Content Composer.</div>
                )}
            </div>
        </div>
    );
}
