'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useProjectStore, Scene } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Star,
  Film
} from 'lucide-react';
import { ConceptPicker } from '@/components/thumbnail/ConceptPicker';
import { generateThumbnailConcepts } from '@/lib/thumbnail-service';
import { ThumbnailConcept } from '@/types/thumbnail';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ThumbnailComposerPage() {
  const router = useRouter();
  const { appState, setHeaderActions } = useApp();
  const {
    scriptBody,
    thumbnailState,
    setThumbnailState,
    strategyContext,
    generatedHooks,
    selectedHookId,
    customHookText,
    directorsCutState
  } = useProjectStore();

  const selectedProductAssets = strategyContext?.selectedAssets || [];
  const { avatarData } = appState;

  // Get scenes with generated images from Director's Cut
  const scenesWithImages = (directorsCutState?.scenes || []).filter(
    (s: Scene) => s.generatedImageUrl
  );
  const thumbnailCandidates = scenesWithImages.filter((s: Scene) => s.thumbnailCandidate);

  // Use scriptBody from projectStore
  const currentScript = scriptBody || appState.currentScript;

  // Local state for UI loading only
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSceneImage, setSelectedSceneImage] = useState<string | null>(null);

  // Destructure from store
  const { concepts, selectedConcept } = thumbnailState;

  // Auto-analyze on mount if script exists AND no concepts yet
  useEffect(() => {
    if (currentScript && concepts.length === 0 && !isAnalyzing) {
      handleAnalyze();
    }
  }, [currentScript, concepts.length, isAnalyzing]);

  // Inject header actions
  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-4">
        <div className="text-right mr-2">
          <p className="text-xs text-muted-foreground">Scene Images</p>
          <p className="text-sm font-mono text-foreground">{scenesWithImages.length} available</p>
        </div>
        <Button
          onClick={handleAnalyze}
          variant="outline"
          size="sm"
          disabled={isAnalyzing}
          className="border-primary/30 text-foreground hover:bg-primary/10"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isAnalyzing && 'animate-spin')} />
          Regenerate
        </Button>
      </div>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, isAnalyzing, scenesWithImages.length]);

  const handleAnalyze = async () => {
    if (!currentScript) return;

    setIsAnalyzing(true);
    try {
      // Strip HTML tags from script for analysis
      const plainTextScript = currentScript.replace(/<[^>]*>?/gm, '');

      // Determine the target hook
      let existingHook = customHookText;
      if (!existingHook && selectedHookId) {
        const selectedHook = generatedHooks.find(h => h.id === selectedHookId);
        if (selectedHook) existingHook = selectedHook.text;
      }

      const generatedConcepts = await generateThumbnailConcepts(
        plainTextScript,
        selectedProductAssets || [],
        existingHook
      );

      setThumbnailState({ concepts: generatedConcepts });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate concepts.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectConcept = async (concept: ThumbnailConcept) => {
    // Update store immediately with selection
    setThumbnailState({
      selectedConcept: concept,
      hookText: concept.hook_text ? concept.hook_text.toUpperCase() : "HOOK",
      // If a scene image was selected, use it as bgImage
      bgImage: selectedSceneImage || thumbnailState.bgImage
    });

    // Navigate to Stage 2: Interactive Canvas
    router.push(`/veritas/thumbnail/${concept.id}/edit`);
  };

  const handleSelectSceneImage = (scene: Scene) => {
    if (scene.generatedImageUrl) {
      setSelectedSceneImage(scene.generatedImageUrl);
      setThumbnailState({ bgImage: scene.generatedImageUrl });
      toast.success(`Selected image from Scene ${directorsCutState?.scenes?.indexOf(scene)! + 1}`);
    }
  };

  if (!currentScript) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center p-6">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground">No Script Found</h2>
          <p className="text-muted-foreground">Please create a script in the Content Composer first.</p>
          <Button
            onClick={() => router.push('/veritas/content-composer')}
            className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
          >
            Go to Content Composer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sub-header */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b border-border">
        <Button
          onClick={() => router.push('/veritas/directors-cut')}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Thumbnail Composer</h1>
            <p className="text-sm text-muted-foreground">Create your video thumbnail</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {avatarData?.name || "Avatar"} / {selectedProductAssets?.length || 0} Assets
          </span>
        </div>
      </div>

      {/* Scene Images Rail - Only show if there are images from Director's Cut */}
      {scenesWithImages.length > 0 && (
        <div className="border-b border-border bg-card/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Scene Images from Director's Cut
              </h3>
              <span className="text-xs text-muted-foreground">
                {thumbnailCandidates.length} marked as thumbnail candidates
              </span>
            </div>

            {/* Horizontal scroll rail */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {scenesWithImages.map((scene: Scene, index: number) => {
                const sceneIndex = directorsCutState?.scenes?.indexOf(scene) || index;
                const isSelected = selectedSceneImage === scene.generatedImageUrl;

                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSelectSceneImage(scene)}
                    className={cn(
                      "relative flex-shrink-0 w-24 aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                        : "border-transparent hover:border-primary/50"
                    )}
                  >
                    <img
                      src={scene.generatedImageUrl}
                      alt={`Scene ${sceneIndex + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay with scene info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                      <div className="flex items-center justify-between">
                        <Badge className="text-[8px] bg-black/50 border-0 px-1 py-0">
                          {scene.label}
                        </Badge>
                        {scene.thumbnailCandidate && (
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Add more CTA */}
              {scenesWithImages.length < 4 && (
                <button
                  onClick={() => router.push('/veritas/directors-cut')}
                  className="flex-shrink-0 w-24 aspect-[9/16] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <Film className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center px-2">
                    Generate more images
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Concept Selection */}
      <div className="flex-1 overflow-y-auto">
        {isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">
              Analyzing script and generating concepts...
            </p>
          </div>
        ) : (
          <ConceptPicker
            concepts={concepts}
            onSelect={handleSelectConcept}
            isGenerating={isGenerating}
          />
        )}
      </div>

      {/* Empty State for no scene images */}
      {scenesWithImages.length === 0 && !isAnalyzing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-card/95 backdrop-blur-xl border border-primary/25 rounded-xl px-6 py-4 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No scene images yet</p>
              <p className="text-xs text-muted-foreground">Generate images in Director's Cut to use as thumbnail backgrounds</p>
            </div>
            <Button
              onClick={() => router.push('/veritas/directors-cut')}
              className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Director's Cut
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
