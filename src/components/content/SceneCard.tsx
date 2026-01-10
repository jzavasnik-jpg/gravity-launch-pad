import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GripVertical,
  Clock,
  Trash2,
  User,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  Camera,
  Link,
  ImagePlus,
  X,
  Package,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SceneLabel, SceneReferenceImage, Asset } from '@/store/projectStore';
import { ASSET_DRAG_TYPE } from '@/components/content/ProductAssetsPanel';

interface SceneCardProps {
  id: string;
  index: number;
  label: SceneLabel;
  script: string;
  imagePrompt?: string; // Visual description
  speaker?: 'guide' | 'mentee';
  durationEstimate: number;
  showSpeaker: boolean; // true for transformation_narrative mode
  ctaUrl?: string; // CTA destination URL (for CTA scenes)
  referenceImages?: SceneReferenceImage[]; // Reference images from asset library
  availableAssets?: Asset[]; // Available assets to pick from
  onChange: (updates: { script?: string; speaker?: 'guide' | 'mentee'; label?: SceneLabel; imagePrompt?: string; ctaUrl?: string; referenceImages?: SceneReferenceImage[] }) => void;
  onDelete: () => void;
  onDragStart?: () => void;
  isActive?: boolean;
  onClick?: () => void;
}

// Label colors - cyan-only for primary, semantic for others
const labelColors: Record<SceneLabel, string> = {
  'HOOK': 'bg-primary/20 text-primary border-primary/30',
  'PAIN': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'SOLUTION': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'CTA': 'bg-primary/20 text-primary border-primary/30',
  'TRANSITION': 'bg-muted text-muted-foreground border-border',
};

const labelOptions: SceneLabel[] = ['HOOK', 'PAIN', 'SOLUTION', 'CTA', 'TRANSITION'];

export function SceneCard({
  id,
  index,
  label,
  script,
  imagePrompt,
  speaker,
  durationEstimate,
  showSpeaker,
  ctaUrl,
  referenceImages = [],
  availableAssets = [],
  onChange,
  onDelete,
  onDragStart,
  isActive = false,
  onClick
}: SceneCardProps) {
  const [isVisualExpanded, setIsVisualExpanded] = useState(true);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Extract a clean display name from asset
  const getAssetDisplayName = (asset: Asset): string => {
    // Prefer title, then name if it's not a path/URL
    if (asset.title) return asset.title;
    if (asset.name && !asset.name.includes('/') && !asset.name.startsWith('http')) {
      return asset.name;
    }
    // Extract filename from URL or path
    if (asset.url) {
      try {
        const url = new URL(asset.url);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop() || 'Image';
        // Remove extension and decode
        const cleanName = decodeURIComponent(filename.replace(/\.[^.]+$/, ''));
        // Truncate if too long
        return cleanName.length > 30 ? cleanName.substring(0, 27) + '...' : cleanName;
      } catch {
        // Not a valid URL, try as path
        const filename = asset.url.split('/').pop() || 'Image';
        return filename.replace(/\.[^.]+$/, '');
      }
    }
    return 'Image';
  };

  // Add reference image from asset
  const handleAddReferenceImage = (asset: Asset) => {
    const newRef: SceneReferenceImage = {
      id: `ref_${Date.now()}`,
      url: asset.url,
      name: getAssetDisplayName(asset),
      assetId: asset.id
    };
    onChange({ referenceImages: [...referenceImages, newRef] });
    setIsAssetPickerOpen(false);
  };

  // Remove reference image
  const handleRemoveReferenceImage = (refId: string) => {
    onChange({ referenceImages: referenceImages.filter(r => r.id !== refId) });
  };

  // Get assets not already added as references
  const availableToAdd = availableAssets.filter(
    asset => !referenceImages.some(ref => ref.assetId === asset.id)
  );

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if it's an asset being dragged
    if (e.dataTransfer.types.includes(ASSET_DRAG_TYPE)) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Get the dragged asset data
    const assetData = e.dataTransfer.getData(ASSET_DRAG_TYPE);
    if (!assetData) return;

    try {
      const asset: Asset = JSON.parse(assetData);

      // Check if already added
      if (referenceImages.some(ref => ref.assetId === asset.id)) {
        return;
      }

      // Add as reference image - use the signed URL (already signed in ProductAssetsPanel)
      const newRef: SceneReferenceImage = {
        id: `ref_${Date.now()}`,
        url: asset.url || asset.thumbnail_url,
        name: getAssetDisplayName(asset),
        assetId: asset.id
      };
      onChange({ referenceImages: [...referenceImages, newRef] });

      // Expand the visual section to show the added image
      setIsVisualExpanded(true);
    } catch {
      // Failed to parse dropped asset - ignore
    }
  };

  // Calculate word count and estimated read time
  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(3, Math.ceil(wordCount / 2.5));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "bg-card/85 backdrop-blur-xl border rounded-xl",
        "transition-all duration-300",
        isDragOver
          ? "border-primary ring-2 ring-primary/50 shadow-[0_0_80px_-5px_rgba(79,209,255,0.5),0_30px_60px_-15px_rgba(0,0,0,0.9)]"
          : isActive
            ? "border-primary/40 shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_30px_60px_-15px_rgba(0,0,0,0.9)]"
            : "border-primary/25 shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_25px_50px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_50px_-5px_rgba(79,209,255,0.35)]",
        "hover:-translate-y-1"
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={onDragStart}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Scene Number */}
          <span className="text-sm font-mono text-muted-foreground">
            SCENE {index + 1}:
          </span>

          {/* Label Selector */}
          <Select
            value={label}
            onValueChange={(val: SceneLabel) => onChange({ label: val })}
          >
            <SelectTrigger className={cn(
              "h-8 w-auto px-3 text-sm font-display font-medium uppercase tracking-wider border",
              labelColors[label]
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {labelOptions.map(opt => (
                <SelectItem key={opt} value={opt} className="text-sm">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <Clock className="w-4 h-4" />
            ~{estimatedSeconds}s
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Speaker Selector (only for Transformation Narrative mode) */}
        {showSpeaker && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speaker:</span>
            <Select
              value={speaker || 'guide'}
              onValueChange={(val: 'guide' | 'mentee') => onChange({ speaker: val })}
            >
              <SelectTrigger className="h-9 w-[160px] bg-muted border-border text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="guide">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Guide (You)
                  </div>
                </SelectItem>
                <SelectItem value="mentee">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Mentee
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Visual Description Section */}
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisualExpanded(!isVisualExpanded);
            }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Camera className="w-4 h-4 text-primary" />
            <span className="uppercase tracking-wider">Visual</span>
            {isVisualExpanded ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
            {!isVisualExpanded && imagePrompt && (
              <span className="text-sm text-muted-foreground/70 truncate max-w-[200px] ml-2">
                {imagePrompt.slice(0, 50)}...
              </span>
            )}
          </button>

          <AnimatePresence>
            {isVisualExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Textarea
                    value={imagePrompt || ''}
                    onChange={(e) => onChange({ imagePrompt: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-muted/50 border-border/50 text-sm resize-none min-h-[60px] font-sans focus:ring-primary focus:border-primary italic text-muted-foreground placeholder:text-muted-foreground/50"
                    placeholder="Describe what the viewer sees: setting, props, expressions, camera angle, lighting..."
                  />
                  <div className="absolute top-2 right-2">
                    <Eye className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </div>
                {imagePrompt && (
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    This visual description will be used for AI image generation in Director's Cut
                  </p>
                )}

                {/* Reference Images Section */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="uppercase tracking-wider">Reference Images</span>
                      {referenceImages.length > 0 && (
                        <span className="text-sm bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {referenceImages.length}
                        </span>
                      )}
                    </div>

                    {/* Add Reference Image Button */}
                    <Popover open={isAssetPickerOpen} onOpenChange={setIsAssetPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-sm text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ImagePlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-72 p-3 bg-card border-border"
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Select from Asset Library
                        </div>
                        {availableAssets.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No assets available. Add product images in the Asset Library panel first.
                          </p>
                        ) : availableToAdd.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            All assets already added to this scene
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {availableToAdd.map(asset => (
                              <button
                                key={asset.id}
                                onClick={() => handleAddReferenceImage(asset)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                                  <img
                                    src={asset.url}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {asset.name}
                                  </p>
                                  {asset.role && (
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {asset.role.replace('_', ' ')}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reference Images Grid */}
                  {referenceImages.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {referenceImages.map(ref => (
                        <div
                          key={ref.id}
                          className="relative group"
                          title={ref.name}
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted transition-all group-hover:border-primary/30">
                            <img
                              src={ref.url}
                              alt={ref.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Remove button - always visible with opacity, full on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveReferenceImage(ref.id);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive/80 border border-destructive text-destructive-foreground rounded-full flex items-center justify-center transition-all hover:bg-destructive hover:scale-110 opacity-70 group-hover:opacity-100"
                            title="Remove reference"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-sm text-muted-foreground truncate w-16 mt-1 text-center">
                            {ref.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-all",
                      isDragOver
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground/70"
                    )}>
                      <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <p className="text-sm italic">
                        {isDragOver ? "Drop to add reference image" : "Drag & drop or click Add"}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reference Images Strip - Always visible when collapsed and has images */}
          {!isVisualExpanded && referenceImages.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              <Package className="w-3 h-3 text-primary flex-shrink-0" />
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {referenceImages.map(ref => (
                  <div
                    key={ref.id}
                    className="relative group flex-shrink-0"
                    title={ref.name}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden border border-border bg-muted">
                      <img
                        src={ref.url}
                        alt={ref.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Remove button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveReferenceImage(ref.id);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      title="Remove"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0">
                {referenceImages.length} ref{referenceImages.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Script Textarea */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="uppercase tracking-wider">Script</span>
          </div>
          <Textarea
            value={script}
            onChange={(e) => onChange({ script: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border-border text-base resize-none min-h-[80px] font-sans focus:ring-primary focus:border-primary"
            placeholder="Write your script for this scene..."
          />
        </div>

        {/* CTA URL Input (only for CTA scenes) */}
        {label === 'CTA' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Link className="w-4 h-4 text-primary" />
              <span className="uppercase tracking-wider">CTA Destination URL</span>
              <span className="text-sm text-muted-foreground/70">(optional)</span>
            </div>
            <Input
              value={ctaUrl || ''}
              onChange={(e) => onChange({ ctaUrl: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border-border text-base font-mono focus:ring-primary focus:border-primary"
              placeholder="https://your-checkout.com/buy"
            />
            <p className="text-sm text-muted-foreground/70">
              Where viewers should go when they click your CTA button
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/30">
          <span>{wordCount} words</span>
          <span>~{estimatedSeconds}s read time</span>
        </div>
      </div>
    </motion.div>
  );
}

export default SceneCard;
