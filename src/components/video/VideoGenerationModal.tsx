import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, Video, Image as ImageIcon, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { getGoogleAccessToken, getPresentation, getSlideThumbnail } from "@/lib/google-slides-api";
import { animateImage, generateVoiceover } from "@/lib/video-render-api";
import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPresentationId?: string;
    initialScript?: string;
}

interface SlideRenderItem {
    id: string;
    objectId: string;
    thumbnailUrl?: string;
    prompt: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    videoUrl?: string;
}

export function VideoGenerationModal({
    isOpen,
    onClose,
    initialPresentationId = "",
    initialScript = ""
}: VideoGenerationModalProps) {
    const [presentationId, setPresentationId] = useState(initialPresentationId);
    const [loading, setLoading] = useState(false);
    const [slides, setSlides] = useState<SlideRenderItem[]>([]);
    const [currentStep, setCurrentStep] = useState<'input' | 'configure' | 'rendering'>('input');
    const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

    // Step 1: Fetch Slides
    const handleFetchSlides = async () => {
        if (!presentationId) {
            toast.error("Please enter a Presentation ID");
            return;
        }

        setLoading(true);
        try {
            const token = await getGoogleAccessToken();
            if (!token) throw new Error("Failed to get Google Access Token");

            // Get Presentation
            const presentation = await getPresentation(token, presentationId);

            // Get Thumbnails for each slide
            const slideItems: SlideRenderItem[] = [];

            for (const page of presentation.slides || []) {
                const url = await getSlideThumbnail(token, presentationId, page.objectId);
                slideItems.push({
                    id: page.objectId,
                    objectId: page.objectId,
                    thumbnailUrl: url,
                    prompt: "Cinematic, high quality, 4k, moving camera", // Default prompt
                    status: 'pending'
                });
            }

            setSlides(slideItems);
            setCurrentStep('configure');
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to fetch slides: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Render Videos
    const handleRender = async () => {
        setCurrentStep('rendering');

        // Generate Voiceover first (optional)
        if (initialScript && !voiceoverUrl) {
            setIsGeneratingVoice(true);
            try {
                const blob = await generateVoiceover(initialScript);
                const url = URL.createObjectURL(blob);
                setVoiceoverUrl(url);
            } catch (error) {
                console.error("Voiceover failed:", error);
                toast.error("Voiceover generation failed");
            } finally {
                setIsGeneratingVoice(false);
            }
        }

        // Generate Videos sequentially (to avoid rate limits)
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            if (!slide.thumbnailUrl) continue;

            // Update status
            setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'generating' } : s));

            try {
                const videoUrl = await animateImage(slide.thumbnailUrl, slide.prompt);

                setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', videoUrl } : s));
            } catch (error) {
                console.error(`Slide ${i} failed:`, error);
                setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'failed' } : s));
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display">AI Video Generator</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Step 1: Input */}
                    {currentStep === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Google Slides Presentation ID</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={presentationId}
                                        onChange={(e) => setPresentationId(e.target.value)}
                                        placeholder="e.g. 1xXyZ..."
                                    />
                                    <PrimaryButton onClick={handleFetchSlides} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : "Fetch Slides"}
                                    </PrimaryButton>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Copy the ID from your Google Slides URL: docs.google.com/presentation/d/<strong>ID_HERE</strong>/edit
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configure */}
                    {currentStep === 'configure' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {slides.map((slide, index) => (
                                    <GlassPanel key={slide.id} className="p-4 space-y-3">
                                        <div className="aspect-video bg-black/10 rounded-md overflow-hidden relative">
                                            {slide.thumbnailUrl ? (
                                                <img src={slide.thumbnailUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <ImageIcon className="text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                                Slide {index + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Animation Prompt</label>
                                            <Textarea
                                                value={slide.prompt}
                                                onChange={(e) => {
                                                    const newSlides = [...slides];
                                                    newSlides[index].prompt = e.target.value;
                                                    setSlides(newSlides);
                                                }}
                                                className="h-20 text-xs"
                                            />
                                        </div>
                                    </GlassPanel>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setCurrentStep('input')}>Back</Button>
                                <PrimaryButton onClick={handleRender}>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Render Video
                                </PrimaryButton>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Rendering / Results */}
                    {currentStep === 'rendering' && (
                        <div className="space-y-6">
                            {/* Voiceover Section */}
                            <GlassPanel className="p-4">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    Voiceover
                                    {isGeneratingVoice && <Loader2 className="w-3 h-3 animate-spin" />}
                                </h3>
                                {voiceoverUrl ? (
                                    <audio controls src={voiceoverUrl} className="w-full" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {isGeneratingVoice ? "Generating voiceover..." : "Waiting..."}
                                    </p>
                                )}
                            </GlassPanel>

                            {/* Video Clips */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {slides.map((slide, index) => (
                                    <GlassPanel key={slide.id} className="p-4 space-y-3">
                                        <div className="aspect-video bg-black/10 rounded-md overflow-hidden relative">
                                            {slide.status === 'completed' && slide.videoUrl ? (
                                                <video controls src={slide.videoUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full relative">
                                                    {slide.thumbnailUrl && (
                                                        <img src={slide.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                                    )}
                                                    <div className="z-10 flex flex-col items-center">
                                                        {slide.status === 'generating' ? (
                                                            <>
                                                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                                                <span className="text-xs font-medium">Animating...</span>
                                                            </>
                                                        ) : slide.status === 'failed' ? (
                                                            <span className="text-red-500 font-medium">Failed</span>
                                                        ) : (
                                                            <span className="text-muted-foreground font-medium">Pending</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
                                                Slide {index + 1}
                                            </div>
                                        </div>
                                    </GlassPanel>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={onClose}>Close</Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
