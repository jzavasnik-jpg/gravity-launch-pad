/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * The Director's Cut page now uses PhonePreview for visual preview instead of a Konva canvas.
 * See DirectorsCut.tsx for the new implementation.
 */
import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Transformer, Group } from 'react-konva';
import { useProjectStore, Layer as LayerType } from '@/store/projectStore';
import { useApp } from '@/context/AppContext';
import { Move, ZoomIn, Lock, Eye, EyeOff, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper to load image
const useImage = (url: string) => {
    const [image, setImage] = React.useState<HTMLImageElement | undefined>(undefined);
    useEffect(() => {
        if (!url) return;
        const img = new window.Image();
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);
    return image;
};

const URLImage = ({ src, x, y, width, height, isSelected, onSelect, onChange, draggable }: any) => {
    const image = useImage(src);
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <KonvaImage
                image={image}
                x={x}
                y={y}
                width={width}
                height={height}
                draggable={draggable}
                ref={shapeRef}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

export function MainStageCanvas() {
    const { appState } = useApp(); // Need appState for avatar data
    const { campaignMode, directorsCutState, setDirectorsCutState, strategyContext, visualMessengerState } = useProjectStore();
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 800, height: 450 });

    // Initialize Layers based on Campaign Mode
    useEffect(() => {
        if (directorsCutState.layers.length === 0) {
            const initialLayers: LayerType[] = [];

            // Background is always present
            initialLayers.push({ id: 'bg', type: 'background', name: 'Background', isLocked: true, isVisible: true, zIndex: 0 });

            if (campaignMode === 'direct_authority') {
                initialLayers.push({ id: 'prod', type: 'product', name: 'Product', isLocked: false, isVisible: true, zIndex: 1 });
                initialLayers.push({ id: 'subj', type: 'subject', name: 'Subject (You)', isLocked: false, isVisible: true, zIndex: 2 });
            } else {
                initialLayers.push({ id: 'prod', type: 'product', name: 'Product', isLocked: false, isVisible: true, zIndex: 1 });
                initialLayers.push({ id: 'mentee', type: 'mentee', name: 'Mentee (James)', isLocked: false, isVisible: true, zIndex: 2 });
                initialLayers.push({ id: 'guide', type: 'guide', name: 'Guide (You)', isLocked: false, isVisible: true, zIndex: 3 });
            }

            setDirectorsCutState({ layers: initialLayers });
        }
    }, [campaignMode, directorsCutState.layers.length, setDirectorsCutState]);

    // Helper to resolve layer image
    const getLayerImage = (layer: LayerType) => {
        switch (layer.type) {
            case 'subject':
            case 'guide':
                return visualMessengerState.currentUrl;
            case 'mentee':
                // In a real app, this would be the avatar's face specifically. 
                // Using avatarData photo for now.
                return appState.avatarData?.photo_url;
            case 'product':
                // Default to first selected asset if available
                return strategyContext?.selectedAssets[0]?.url;
            case 'background':
                // Placeholder or default BG
                return "https://placehold.co/1920x1080/1a1a1a/333.png?text=Background&font=roboto";
            default:
                return undefined;
        }
    };

    // Handle Resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleSelectLayer = (id: string) => {
        setDirectorsCutState({ selectedLayerId: id });
    };

    return (
        <div className="relative w-full h-full bg-background flex items-center justify-center" ref={containerRef}>
            {/* Canvas Area */}
            <div className="shadow-2xl border border-border">
                <Stage width={dimensions.width * 0.8} height={dimensions.height * 0.8} ref={stageRef}>
                    <Layer>
                        {/* Placeholder Background */}
                        <Rect
                            x={0}
                            y={0}
                            width={dimensions.width * 0.8}
                            height={dimensions.height * 0.8}
                            fill="#000"
                        />

                        {/* Render Layers */}
                        {directorsCutState.layers
                            .sort((a, b) => a.zIndex - b.zIndex)
                            .map((layer) => {
                                if (!layer.isVisible) return null;

                                const imageSrc = getLayerImage(layer);

                                return (
                                    <Group
                                        key={layer.id}
                                        draggable={!layer.isLocked}
                                        onClick={() => handleSelectLayer(layer.id)}
                                        onTap={() => handleSelectLayer(layer.id)}
                                    >
                                        {imageSrc ? (
                                            <URLImage
                                                src={imageSrc}
                                                x={100 + layer.zIndex * 50}
                                                y={100 + layer.zIndex * 30}
                                                width={400}
                                                height={225}
                                                isSelected={layer.id === directorsCutState.selectedLayerId}
                                                onSelect={() => handleSelectLayer(layer.id)}
                                                onChange={() => { }} // Handle transform updates later
                                                draggable={!layer.isLocked}
                                            />
                                        ) : (
                                            <Rect
                                                x={100 + layer.zIndex * 50}
                                                y={100 + layer.zIndex * 30}
                                                width={200}
                                                height={150}
                                                fill={layer.id === directorsCutState.selectedLayerId ? '#3b82f6' : '#333'}
                                                opacity={0.5}
                                                stroke={layer.id === directorsCutState.selectedLayerId ? '#60a5fa' : 'transparent'}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </Group>
                                );
                            })}
                    </Layer>
                </Stage>
            </div>

            {/* Camera Puck Overlay */}
            <div className="absolute top-4 right-4 bg-card/80 p-2 rounded-lg border border-border backdrop-blur-sm">
                <div className="text-[10px] text-muted-foreground font-mono mb-2 text-center">CAMERA</div>
                <div className="w-24 h-24 bg-muted rounded-full border border-border relative flex items-center justify-center cursor-move group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className="w-full h-px bg-foreground" />
                        <div className="h-full w-px bg-foreground absolute" />
                    </div>
                    {/* The Puck */}
                    <div
                        className="w-8 h-8 bg-primary rounded-full shadow-lg shadow-primary/20 border-2 border-primary/20 transform transition-transform group-active:scale-95"
                        style={{
                            transform: `translate(${directorsCutState.cameraState.pan.x}px, ${directorsCutState.cameraState.pan.y}px)`
                        }}
                    />
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <ZoomIn className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] font-mono text-primary flex items-center">100%</span>
                </div>
            </div>

            {/* Layer Controls Overlay (Bottom Left) */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                {directorsCutState.layers.map(layer => (
                    <div
                        key={layer.id}
                        onClick={() => handleSelectLayer(layer.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md backdrop-blur-md border transition-all cursor-pointer ${layer.id === directorsCutState.selectedLayerId
                            ? 'bg-primary/20 border-primary/50 text-foreground'
                            : 'bg-card/60 border-border text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${layer.isVisible ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs font-medium min-w-[80px]">{layer.name}</span>
                        <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-foreground">
                                {layer.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-foreground">
                                {layer.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
