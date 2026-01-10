import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore, Scene, SceneStatus } from '@/store/projectStore';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Film,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// New Storyboard components
import { SceneStoryboardCard } from '@/components/director/SceneStoryboardCard';
import { GenerationPanel, VisualStyle } from '@/components/director/GenerationPanel';
import { ActiveScenePreview } from '@/components/director/ActiveScenePreview';

// Placeholder for Kling API - will be implemented in Phase 3
async function generateImageForScene(_scene: Scene, _visualStyle: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  // Return placeholder image
  return `https://picsum.photos/seed/${Date.now()}/540/960`;
}

async function generateVideoForScene(_scene: Scene, _imageUrl: string): Promise<string> {
  // Simulate API delay (videos take longer)
  await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
  // Return placeholder video (in real implementation, this would be from Kling API)
  return `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`;
}

export function DirectorsCut() {
  const navigate = useNavigate();
  const { setHeaderActions } = useApp();
  const {
    directorsCutState,
    setDirectorsCutState,
    syncScenesFromScript,
    strategyContext
  } = useProjectStore();

  // Local state
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    type: 'image' | 'video';
  } | null>(null);

  // Get scenes from store
  const scenes = directorsCutState?.scenes || [];
  const visualStyle = directorsCutState?.visualStyle || 'cinematic';

  // Initialize scenes from store on mount
  useEffect(() => {
    syncScenesFromScript();

    if (scenes.length > 0 && !activeSceneId) {
      setActiveSceneId(scenes[0].id);
    }
  }, []);

  // Update active scene when scenes change
  useEffect(() => {
    if (scenes.length > 0 && !activeSceneId) {
      setActiveSceneId(scenes[0].id);
    }
  }, [scenes.length]);

  // Calculate total duration
  const totalDuration = scenes.reduce((sum, s) => sum + (s.durationEstimate || 0), 0);

  // Handlers
  const handleVisualStyleChange = useCallback((style: VisualStyle) => {
    setDirectorsCutState({ visualStyle: style });
  }, [setDirectorsCutState]);

  const handleUpdateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    const updatedScenes = scenes.map(s =>
      s.id === sceneId ? { ...s, ...updates } : s
    );
    setDirectorsCutState({ scenes: updatedScenes });
  }, [scenes, setDirectorsCutState]);

  const handleToggleThumbnailCandidate = useCallback((sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      handleUpdateScene(sceneId, { thumbnailCandidate: !scene.thumbnailCandidate });

      // Update thumbnailSourceSceneIds
      const currentIds = directorsCutState?.thumbnailSourceSceneIds || [];
      const newIds = scene.thumbnailCandidate
        ? currentIds.filter(id => id !== sceneId)
        : [...currentIds, sceneId];
      setDirectorsCutState({ thumbnailSourceSceneIds: newIds });
    }
  }, [scenes, directorsCutState?.thumbnailSourceSceneIds, handleUpdateScene, setDirectorsCutState]);

  const handleGenerateImage = useCallback(async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Update status to generating
    handleUpdateScene(sceneId, { status: 'image_generating' });

    try {
      const imageUrl = await generateImageForScene(scene, visualStyle);
      handleUpdateScene(sceneId, {
        status: 'image_ready',
        generatedImageUrl: imageUrl
      });
      toast.success(`Image generated for Scene ${scenes.findIndex(s => s.id === sceneId) + 1}`);
    } catch (error) {
      handleUpdateScene(sceneId, { status: 'draft' });
      toast.error('Failed to generate image');
    }
  }, [scenes, visualStyle, handleUpdateScene]);

  const handleGenerateVideo = useCallback(async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.generatedImageUrl) {
      toast.error('Please generate an image first');
      return;
    }

    // Update status to generating
    handleUpdateScene(sceneId, { status: 'video_generating' });

    try {
      const videoUrl = await generateVideoForScene(scene, scene.generatedImageUrl);
      handleUpdateScene(sceneId, {
        status: 'video_ready',
        generatedVideoUrl: videoUrl
      });
      toast.success(`Video generated for Scene ${scenes.findIndex(s => s.id === sceneId) + 1}`);
    } catch (error) {
      handleUpdateScene(sceneId, { status: 'image_ready' });
      toast.error('Failed to generate video');
    }
  }, [scenes, handleUpdateScene]);

  const handleGenerateAllImages = useCallback(async () => {
    const scenesNeedingImages = scenes.filter(s => s.status === 'draft');
    if (scenesNeedingImages.length === 0) {
      toast.info('All scenes already have images');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: scenesNeedingImages.length, type: 'image' });

    for (let i = 0; i < scenesNeedingImages.length; i++) {
      const scene = scenesNeedingImages[i];
      setGenerationProgress({ current: i, total: scenesNeedingImages.length, type: 'image' });

      // Update status
      handleUpdateScene(scene.id, { status: 'image_generating' });

      try {
        const imageUrl = await generateImageForScene(scene, visualStyle);
        handleUpdateScene(scene.id, {
          status: 'image_ready',
          generatedImageUrl: imageUrl
        });
      } catch (error) {
        handleUpdateScene(scene.id, { status: 'draft' });
        toast.error(`Failed to generate image for Scene ${scenes.indexOf(scene) + 1}`);
      }

      setGenerationProgress({ current: i + 1, total: scenesNeedingImages.length, type: 'image' });
    }

    setIsGenerating(false);
    setGenerationProgress(null);
    toast.success('All images generated!');
  }, [scenes, visualStyle, handleUpdateScene]);

  const handleGenerateAllVideos = useCallback(async () => {
    const scenesNeedingVideos = scenes.filter(s =>
      s.status === 'image_ready' && s.generatedImageUrl
    );

    if (scenesNeedingVideos.length === 0) {
      toast.info('All scenes with images already have videos');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: scenesNeedingVideos.length, type: 'video' });

    for (let i = 0; i < scenesNeedingVideos.length; i++) {
      const scene = scenesNeedingVideos[i];
      setGenerationProgress({ current: i, total: scenesNeedingVideos.length, type: 'video' });

      handleUpdateScene(scene.id, { status: 'video_generating' });

      try {
        const videoUrl = await generateVideoForScene(scene, scene.generatedImageUrl!);
        handleUpdateScene(scene.id, {
          status: 'video_ready',
          generatedVideoUrl: videoUrl
        });
      } catch (error) {
        handleUpdateScene(scene.id, { status: 'image_ready' });
        toast.error(`Failed to generate video for Scene ${scenes.indexOf(scene) + 1}`);
      }

      setGenerationProgress({ current: i + 1, total: scenesNeedingVideos.length, type: 'video' });
    }

    setIsGenerating(false);
    setGenerationProgress(null);
    toast.success('All videos generated!');
  }, [scenes, handleUpdateScene]);

  const handleNext = useCallback(() => {
    // Navigate to Thumbnail Composer
    navigate('/veritas/thumbnail-composer');
  }, [navigate]);

  // Navigate to previous scene
  const handlePreviousScene = useCallback(() => {
    const currentIndex = scenes.findIndex(s => s.id === activeSceneId);
    if (currentIndex > 0) {
      setActiveSceneId(scenes[currentIndex - 1].id);
    }
  }, [scenes, activeSceneId]);

  // Navigate to next scene
  const handleNextScene = useCallback(() => {
    const currentIndex = scenes.findIndex(s => s.id === activeSceneId);
    if (currentIndex < scenes.length - 1) {
      setActiveSceneId(scenes[currentIndex + 1].id);
    }
  }, [scenes, activeSceneId]);

  // Get active scene
  const activeScene = scenes.find(s => s.id === activeSceneId) || null;
  const activeSceneIndex = scenes.findIndex(s => s.id === activeSceneId);

  // Inject header actions
  useEffect(() => {
    const scenesWithImages = scenes.filter(s =>
      s.status === 'image_ready' || s.status === 'video_generating' || s.status === 'video_ready'
    ).length;

    setHeaderActions(
      <div className="flex items-center gap-4">
        {/* Progress indicator */}
        <div className="text-right mr-2">
          <p className="text-sm text-muted-foreground">Images Generated</p>
          <p className="text-base font-mono text-foreground">{scenesWithImages} / {scenes.length}</p>
        </div>

        {/* Next Step Button */}
        <Button
          className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)] hover:bg-primary/90"
          onClick={handleNext}
          disabled={scenesWithImages === 0}
        >
          Next: Thumbnails
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );

    return () => setHeaderActions(null);
  }, [scenes, setHeaderActions, handleNext]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sub-header with back navigation */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/veritas/content-composer')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Director's Cut</h1>
            <p className="text-base text-muted-foreground">Generate images and videos for your scenes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Duration</p>
            <p className="text-xl font-mono text-foreground">
              {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Scenes</p>
            <p className="text-xl font-mono text-foreground">{scenes.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Active Scene Preview + Scene Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Active Scene Preview - Large Main Card */}
            {scenes.length > 0 && (
              <ActiveScenePreview
                scene={activeScene}
                sceneIndex={activeSceneIndex}
                totalScenes={scenes.length}
                availableAssets={strategyContext?.selectedAssets || []}
                onGenerateImage={() => activeSceneId && handleGenerateImage(activeSceneId)}
                onGenerateVideo={() => activeSceneId && handleGenerateVideo(activeSceneId)}
                onToggleThumbnailCandidate={() => activeSceneId && handleToggleThumbnailCandidate(activeSceneId)}
                onUpdateScene={(updates) => activeSceneId && handleUpdateScene(activeSceneId, updates)}
                onPreviousScene={handlePreviousScene}
                onNextScene={handleNextScene}
              />
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Storyboard
              </h2>
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <Clock className="w-4 h-4" />
                Click on a scene to preview
              </div>
            </div>

            {/* Scene Cards Grid */}
            {scenes.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {scenes.map((scene, index) => (
                    <SceneStoryboardCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      isActive={activeSceneId === scene.id}
                      onSelect={() => setActiveSceneId(scene.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center py-16 text-center bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  No Scenes Yet
                </h3>
                <p className="text-base text-muted-foreground mb-6 max-w-sm">
                  Go back to Content Composer to create your script scenes first.
                </p>
                <Button
                  className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                  onClick={() => navigate('/veritas/content-composer')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Content Composer
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Generation Panel */}
        <aside className="w-80 border-l border-border flex-shrink-0">
          <GenerationPanel
            scenes={scenes}
            visualStyle={visualStyle}
            onVisualStyleChange={handleVisualStyleChange}
            onGenerateAllImages={handleGenerateAllImages}
            onGenerateAllVideos={handleGenerateAllVideos}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
          />
        </aside>
      </div>
    </div>
  );
}

export default DirectorsCut;
