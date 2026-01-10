import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Image as ImageIcon,
  Film,
  Star,
  Clock,
  Loader2,
  Sparkles,
  Play,
  Check,
  Edit2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  X,
  FileText,
  Palette,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene, SceneLabel, SceneStatus, SceneReferenceImage, Asset } from '@/store/projectStore';
import { ASSET_DRAG_TYPE } from '@/components/content/ProductAssetsPanel';

interface ActiveScenePreviewProps {
  scene: Scene | null;
  sceneIndex: number;
  totalScenes: number;
  availableAssets?: Asset[];
  onGenerateImage: () => void;
  onGenerateVideo: () => void;
  onToggleThumbnailCandidate: () => void;
  onUpdateScene: (updates: Partial<Scene>) => void;
  onPreviousScene: () => void;
  onNextScene: () => void;
}

// Label colors - cyan-only for primary, semantic for others
const labelColors: Record<SceneLabel, string> = {
  'HOOK': 'bg-primary/20 text-primary border-primary/30',
  'PAIN': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'SOLUTION': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'CTA': 'bg-primary/20 text-primary border-primary/30',
  'TRANSITION': 'bg-muted text-muted-foreground border-border',
};

// Status indicators
const statusConfig: Record<SceneStatus, { label: string; color: string; icon: React.ReactNode }> = {
  'draft': { label: 'Draft', color: 'text-muted-foreground', icon: <Edit2 className="w-4 h-4" /> },
  'image_generating': { label: 'Generating Image...', color: 'text-primary', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  'image_ready': { label: 'Image Ready', color: 'text-emerald-400', icon: <Check className="w-4 h-4" /> },
  'video_generating': { label: 'Generating Video...', color: 'text-primary', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  'video_ready': { label: 'Video Ready', color: 'text-emerald-400', icon: <Check className="w-4 h-4" /> },
};

export function ActiveScenePreview({
  scene,
  sceneIndex,
  totalScenes,
  availableAssets = [],
  onGenerateImage,
  onGenerateVideo,
  onToggleThumbnailCandidate,
  onUpdateScene,
  onPreviousScene,
  onNextScene
}: ActiveScenePreviewProps) {
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState(scene?.script || '');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(scene?.imagePrompt || '');
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'visual'>('script');

  // Reset drafts when scene changes
  React.useEffect(() => {
    if (scene) {
      setScriptDraft(scene.script || '');
      setPromptDraft(scene.imagePrompt || '');
      setIsEditingScript(false);
      setIsEditingPrompt(false);
    }
  }, [scene?.id]);

  if (!scene) {
    return (
      <div className="bg-card/85 backdrop-blur-xl border border-primary/25 rounded-xl p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">Select a scene to edit</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[scene.status];
  const isGenerating = scene.status === 'image_generating' || scene.status === 'video_generating';
  const hasImage = scene.generatedImageUrl;
  const hasVideo = scene.generatedVideoUrl;
  const referenceImages = scene.referenceImages || [];

  // Get assets not already added as references
  const availableToAdd = availableAssets.filter(
    asset => !referenceImages.some(ref => ref.assetId === asset.id)
  );

  // Drag handlers for reference images
  const isAssetDrag = (e: React.DragEvent) => {
    return e.dataTransfer.types.includes(ASSET_DRAG_TYPE) ||
           e.dataTransfer.types.includes('text/plain');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isAssetDrag(e)) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const assetData = e.dataTransfer.getData('text/plain');
    const isOurDrag = e.dataTransfer.getData(ASSET_DRAG_TYPE);

    if (assetData && isOurDrag) {
      try {
        const asset: Asset = JSON.parse(assetData);
        if (!referenceImages.some(ref => ref.assetId === asset.id)) {
          handleAddReferenceImage(asset);
        }
      } catch (err) {
        console.error('Failed to parse dropped asset:', err);
      }
    }
  };

  const getAssetDisplayName = (asset: Asset): string => {
    if (asset.title) return asset.title;
    if (asset.name && !asset.name.includes('/') && !asset.name.startsWith('http')) {
      return asset.name;
    }
    if (asset.url) {
      try {
        const url = new URL(asset.url);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop() || 'Image';
        const cleanName = decodeURIComponent(filename.replace(/\.[^.]+$/, ''));
        return cleanName.length > 30 ? cleanName.substring(0, 27) + '...' : cleanName;
      } catch {
        const filename = asset.url.split('/').pop() || 'Image';
        return filename.replace(/\.[^.]+$/, '');
      }
    }
    return 'Image';
  };

  const handleAddReferenceImage = (asset: Asset) => {
    const newRef: SceneReferenceImage = {
      id: `ref_${Date.now()}`,
      url: asset.url,
      name: getAssetDisplayName(asset),
      assetId: asset.id
    };
    onUpdateScene({ referenceImages: [...referenceImages, newRef] });
    setIsAssetPickerOpen(false);
  };

  const handleRemoveReferenceImage = (refId: string) => {
    onUpdateScene({ referenceImages: referenceImages.filter(r => r.id !== refId) });
  };

  const handleSaveScript = () => {
    onUpdateScene({ script: scriptDraft });
    setIsEditingScript(false);
  };

  const handleSavePrompt = () => {
    onUpdateScene({ imagePrompt: promptDraft });
    setIsEditingPrompt(false);
  };

  return (
    <motion.div
      layout
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "bg-card/85 backdrop-blur-xl border rounded-xl overflow-hidden",
        "shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_30px_60px_-15px_rgba(0,0,0,0.9)]",
        isDragOver ? "border-primary ring-2 ring-primary/50" : "border-primary/40"
      )}
    >
      {/* Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 border-2 border-dashed border-primary">
            <Plus className="w-10 h-10 text-primary" />
          </div>
          <p className="text-xl font-medium text-primary">Drop to add reference image</p>
        </div>
      )}

      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onPreviousScene}
              disabled={sceneIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono text-foreground min-w-[3rem] text-center">
              {sceneIndex + 1} / {totalScenes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onNextScene}
              disabled={sceneIndex === totalScenes - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Badge className={cn("text-sm uppercase tracking-wider border", labelColors[scene.label])}>
            {scene.label}
          </Badge>

          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium",
            "bg-muted/50",
            status.color
          )}>
            {status.icon}
            <span className="hidden sm:inline">{status.label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <Clock className="w-4 h-4" />
            {scene.durationEstimate}s
          </div>
        </div>

        {/* Flag for Thumbnail Button */}
        <Button
          variant={scene.thumbnailCandidate ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-8",
            scene.thumbnailCandidate
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          onClick={onToggleThumbnailCandidate}
        >
          <Star className={cn("w-4 h-4 mr-1.5", scene.thumbnailCandidate && "fill-yellow-400")} />
          {scene.thumbnailCandidate ? "Thumbnail Flagged" : "Flag for Thumbnail"}
        </Button>
      </div>

      {/* Main Content - Image takes most space, edit panel on right */}
      <div className="flex" style={{ height: 'calc(70vh - 60px)', minHeight: '450px', maxHeight: '700px' }}>
        {/* Large Image/Video Preview - Takes majority of space */}
        <div className="flex-1 p-4 flex items-center justify-center bg-black/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {hasVideo ? (
                // Video Preview - Full size with action bar
                <div className="relative group flex flex-col items-center">
                  <video
                    src={scene.generatedVideoUrl}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    style={{ maxHeight: 'calc(70vh - 160px)' }}
                    muted
                    loop
                    autoPlay
                    controls
                  />
                  {/* Action bar below video */}
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={onGenerateImage}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Regenerate Image
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={onGenerateVideo}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Regenerate Video
                    </Button>
                  </div>
                </div>
              ) : hasImage ? (
                // Image Preview - Full size with action bar
                <div className="relative flex flex-col items-center">
                  <div className="relative group">
                    <img
                      src={scene.generatedImageUrl}
                      alt={`Scene ${sceneIndex + 1}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      style={{ maxHeight: 'calc(70vh - 160px)' }}
                    />
                    {/* Subtle hover overlay for quick video generation */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                        onClick={onGenerateVideo}
                        disabled={isGenerating}
                      >
                        <Film className="w-5 h-5 mr-2" />
                        Generate Video
                      </Button>
                    </div>
                  </div>
                  {/* Action bar below image */}
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={onGenerateImage}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Regenerate Image
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                      onClick={onGenerateVideo}
                      disabled={isGenerating}
                    >
                      <Film className="w-4 h-4 mr-1.5" />
                      Generate Video
                    </Button>
                  </div>
                </div>
              ) : (
                // Empty State - Centered
                <div className="flex flex-col items-center justify-center text-center">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-20 h-20 text-primary animate-spin mb-6" />
                      <span className="text-xl text-muted-foreground">
                        {scene.status === 'image_generating' ? 'Generating image...' : 'Generating video...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <ImageIcon className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-xl text-muted-foreground mb-6">
                        No image generated yet
                      </p>
                      <Button
                        size="lg"
                        className="bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)]"
                        onClick={onGenerateImage}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Image
                      </Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Edit Panel - Compact */}
        <div className="w-[340px] border-l border-border/50 flex flex-col bg-card/50">
          {/* Tab Switcher */}
          <div className="flex border-b border-border/50">
            <button
              onClick={() => setActiveTab('script')}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === 'script'
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-4 h-4" />
              Script
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === 'visual'
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette className="w-4 h-4" />
              Visual
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'script' ? (
              <>
                {/* Script Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Script
                    </h4>
                    {!isEditingScript && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditingScript(true)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingScript ? (
                    <div className="space-y-2">
                      <Textarea
                        value={scriptDraft}
                        onChange={(e) => setScriptDraft(e.target.value)}
                        className="bg-background border-border text-sm resize-none min-h-[120px]"
                        placeholder="Enter the script for this scene..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-sm bg-primary text-primary-foreground"
                          onClick={handleSaveScript}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-sm"
                          onClick={() => {
                            setScriptDraft(scene.script || '');
                            setIsEditingScript(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {scene.script || <span className="text-muted-foreground italic">No script content</span>}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Visual Prompt Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Image Prompt
                    </h4>
                    {!isEditingPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditingPrompt(true)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingPrompt ? (
                    <div className="space-y-2">
                      <Textarea
                        value={promptDraft}
                        onChange={(e) => setPromptDraft(e.target.value)}
                        className="bg-background border-border text-sm resize-none min-h-[100px]"
                        placeholder="Describe the visual style for this scene..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-sm bg-primary text-primary-foreground"
                          onClick={handleSavePrompt}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-sm"
                          onClick={() => {
                            setPromptDraft(scene.imagePrompt || '');
                            setIsEditingPrompt(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scene.imagePrompt || <span className="italic">AI will generate based on script and style.</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reference Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      References
                      {referenceImages.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {referenceImages.length}
                        </span>
                      )}
                    </h4>
                    <Popover open={isAssetPickerOpen} onOpenChange={setIsAssetPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-sm text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <ImagePlus className="w-3.5 h-3.5 mr-1" />
                          Add
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2 bg-card border-border" align="end">
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          Select from Asset Library
                        </div>
                        {availableAssets.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No assets available
                          </p>
                        ) : availableToAdd.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            All assets added
                          </p>
                        ) : (
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {availableToAdd.map(asset => (
                              <button
                                key={asset.id}
                                onClick={() => handleAddReferenceImage(asset)}
                                className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                  <img
                                    src={asset.url}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm font-medium text-foreground truncate flex-1">
                                  {asset.name}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {referenceImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {referenceImages.map(ref => (
                        <div
                          key={ref.id}
                          className="relative group"
                          title={ref.name}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted">
                            <img
                              src={ref.url}
                              alt={ref.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveReferenceImage(ref.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-card border border-border text-muted-foreground rounded-full flex items-center justify-center transition-all hover:bg-destructive hover:border-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/70 italic">
                      Drag product images here or click Add
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ActiveScenePreview;
