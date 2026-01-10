// Product Asset Manager Page
// View, search, and manage all product demo assets

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Video,
  Image,
  Film,
  Loader2,
  Play,
  Download,
  Trash2,
  Edit,
  Link2,
  Calendar,
  FileVideo,
  Upload,
  LayoutTemplate,
  Monitor
} from "lucide-react";
import { getProductAssets, createProductAsset, deleteProductAsset, ProductAsset } from "@/lib/database-service";
import { uploadAsset } from "@/lib/asset-service"; // Keep Firebase upload for now (TODO: migrate to B2)
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { AssetCreationWizard } from "@/components/assets/AssetCreationWizard";
import type { Asset, AssetType } from "@/lib/asset-types";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductAssets() {
  const navigate = useNavigate();
  const { appState } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | AssetType>("all");
  const [showWizard, setShowWizard] = useState(false);

  // Load assets from Supabase (metadata) - files stored in Backblaze B2
  useEffect(() => {
    async function loadAssets() {
      const userId = user?.uid || appState.userId;
      console.log('[ProductAssets] Loading assets for userId:', userId);

      if (!userId) {
        console.log('[ProductAssets] No userId available');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabaseAssets = await getProductAssets(userId);
        console.log('[ProductAssets] Supabase returned:', supabaseAssets.length, 'assets');

        // Map Supabase ProductAsset to local Asset type
        const mappedAssets: Asset[] = supabaseAssets.map((pa) => ({
          id: pa.id,
          user_uuid: pa.user_id,
          session_id: pa.session_id || undefined,
          asset_type: pa.asset_type as AssetType,
          title: pa.title,
          description: pa.description || undefined,
          storage_url: pa.storage_url || undefined,
          thumbnail_url: pa.thumbnail_url || undefined,
          file_size_bytes: pa.file_size_bytes || undefined,
          duration_seconds: pa.duration_seconds || undefined,
          status: pa.status || 'ready',
          tags: pa.tags || [],
          metadata: pa.metadata || {},
          created_at: pa.created_at,
          updated_at: pa.updated_at,
        }));

        setAssets(mappedAssets);
        setFilteredAssets(mappedAssets);
      } catch (error) {
        console.error("[ProductAssets] Error loading assets:", error);
        toast.error("Failed to load assets");
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [appState.userId, user?.uid]);

  // Filter and search
  useEffect(() => {
    let filtered = assets;

    if (activeFilter !== "all") {
      filtered = filtered.filter((asset) => asset.asset_type === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.title.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredAssets(filtered);
  }, [assets, activeFilter, searchQuery]);

  const handleDeleteAsset = async (assetId: string) => {
    const success = await deleteProductAsset(assetId);
    if (success) {
      setAssets(assets.filter((a) => a.id !== assetId));
      toast.success("Asset deleted successfully");
    } else {
      toast.error("Failed to delete asset");
    }
  };

  const handleWizardComplete = async (assetId: string) => {
    setShowWizard(false);
    toast.success("Asset created successfully!");
    // Reload assets from Supabase
    const userId = user?.uid || appState.userId;
    if (userId) {
      const supabaseAssets = await getProductAssets(userId);
      const mappedAssets: Asset[] = supabaseAssets.map((pa) => ({
        id: pa.id,
        user_uuid: pa.user_id,
        session_id: pa.session_id || undefined,
        asset_type: pa.asset_type as AssetType,
        title: pa.title,
        description: pa.description || undefined,
        storage_url: pa.storage_url || undefined,
        thumbnail_url: pa.thumbnail_url || undefined,
        file_size_bytes: pa.file_size_bytes || undefined,
        duration_seconds: pa.duration_seconds || undefined,
        status: pa.status || 'ready',
        tags: pa.tags || [],
        metadata: pa.metadata || {},
        created_at: pa.created_at,
        updated_at: pa.updated_at,
      }));
      setAssets(mappedAssets);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleQuickUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Quick upload triggered");
    const files = event.target.files;
    console.log("Files selected:", files ? files.length : 0);

    if (!files || files.length === 0) return;

    const userId = user?.uid || appState.userId;
    if (!userId) {
      console.error("No userId found");
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    const uploadToastId = `upload-${Date.now()}`;

    try {
      let successCount = 0;
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i}: ${file.name} (${file.type})`);

        // Update progress toast
        toast.loading(`Uploading ${i + 1}/${totalFiles}: ${file.name}`, { id: uploadToastId });

        // Detect asset type
        let type: AssetType;
        if (file.type.startsWith('video')) {
          type = 'video';
        } else if (file.name.toLowerCase().includes('screen') || file.name.toLowerCase().includes('screenshot')) {
          type = 'screenshot';
        } else {
          type = 'image';
        }

        console.log("Calling uploadAsset...");
        await uploadAsset(userId, {
          title: file.name,
          asset_type: type,
          file: file,
          session_id: appState.sessionId || undefined
        });
        console.log("uploadAsset completed for file", file.name);
        successCount++;
      }

      toast.dismiss(uploadToastId);
      toast.success(`${successCount} assets uploaded successfully`);

      // Reload assets from Supabase
      // Note: New uploads go to Firebase, but existing migrated assets are in Supabase
      // TODO: Migrate uploads to B2/Supabase as well
      const supabaseAssets = await getProductAssets(userId);
      const mappedAssets: Asset[] = supabaseAssets.map((pa) => ({
        id: pa.id,
        user_uuid: pa.user_id,
        session_id: pa.session_id || undefined,
        asset_type: pa.asset_type as AssetType,
        title: pa.title,
        description: pa.description || undefined,
        storage_url: pa.storage_url || undefined,
        thumbnail_url: pa.thumbnail_url || undefined,
        file_size_bytes: pa.file_size_bytes || undefined,
        duration_seconds: pa.duration_seconds || undefined,
        status: pa.status || 'ready',
        tags: pa.tags || [],
        metadata: pa.metadata || {},
        created_at: pa.created_at,
        updated_at: pa.updated_at,
      }));
      setAssets(mappedAssets);
      setFilteredAssets(mappedAssets);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload assets");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!appState.userName) {
    return (
      <>

        <div className="min-h-screen flex items-center justify-center p-6">
          <GlassPanel className="text-center max-w-md">
            <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-muted-foreground mb-4">
              Please complete the welcome flow on the home page first.
            </p>
            <PrimaryButton onClick={() => navigate("/")}>Go to Home</PrimaryButton>
          </GlassPanel>
        </div>
      </>
    );
  }

  return (
    <>

      <AssetCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />

      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold font-display text-g-heading mb-2">
                Asset Library
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your product images, generated thumbnails, and landing pages
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleQuickUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Quick Upload
              </Button>
              <PrimaryButton onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Asset
              </PrimaryButton>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-panel"
              />
            </div>

            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
              <TabsList className="glass-panel">
                <TabsTrigger value="all">All Assets</TabsTrigger>
                <TabsTrigger value="image">Product Images</TabsTrigger>
                <TabsTrigger value="thumbnail">Thumbnails</TabsTrigger>
                <TabsTrigger value="landing_page">Landing Pages</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="walkthrough">Walkthroughs</TabsTrigger>
                <TabsTrigger value="screenshot">Screenshots</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Smart Ingest Section - Always Visible at Top */}
              <GlassPanel
                className="hover-scale transition-all border-dashed border-2 border-white/20 flex flex-col items-center justify-center cursor-pointer py-12 group hover:border-purple-500/50 hover:bg-purple-500/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <Upload className="h-8 w-8 text-zinc-400 group-hover:text-purple-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Smart Ingest</h3>
                <p className="text-base text-zinc-500 text-center max-w-[300px]">
                  Upload videos, images, or screenshots to add to your library.
                  <br />
                  Supported formats: JPG, PNG, MP4, WEBM
                </p>
              </GlassPanel>

              {/* Asset Grid or Empty State */}
              {filteredAssets.length === 0 ? (
                <GlassPanel className="text-center py-12">
                  <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {searchQuery || activeFilter !== "all"
                      ? "No assets found"
                      : "No Assets Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || activeFilter !== "all"
                      ? "Try adjusting your filters or search query"
                      : "Create your first product demo to get started"}
                  </p>
                </GlassPanel>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {filteredAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDelete={handleDeleteAsset}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Asset Card Component
function AssetCard({
  asset,
  onDelete,
}: {
  asset: Asset;
  onDelete: (id: string) => void;
}) {
  const getAssetIcon = () => {
    switch (asset.asset_type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "walkthrough":
        return <Film className="h-5 w-5" />;
      case "animated_gif":
        return <Film className="h-5 w-5" />;
      case "landing_page":
        return <LayoutTemplate className="h-5 w-5" />;
      case "thumbnail":
        return <Monitor className="h-5 w-5" />;
      default:
        return <Image className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <GlassPanel className="hover-scale transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
        {asset.thumbnail_url ? (
          <img
            src={asset.thumbnail_url}
            alt={asset.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {getAssetIcon()}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="secondary" className="bg-background/80">
            {asset.asset_type}
          </Badge>
        </div>
        {asset.duration_seconds && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80">
              {formatDuration(asset.duration_seconds)}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-lg line-clamp-1">{asset.title}</h3>
        {asset.description && (
          <p className="text-base text-muted-foreground line-clamp-2">
            {asset.description}
          </p>
        )}

        {/* Tags */}
        {(asset.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(asset.tags || []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(asset.tags || []).length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{(asset.tags || []).length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
          <Calendar className="h-4 w-4" />
          {format(new Date(asset.created_at), "MMM d, yyyy")}
          <span>•</span>
          {formatFileSize(asset.file_size_bytes)}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => asset.storage_url && window.open(asset.storage_url, '_blank')}
          >
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => asset.storage_url && navigator.clipboard.writeText(asset.storage_url)}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (asset.storage_url) {
                const link = document.createElement('a');
                link.href = asset.storage_url;
                link.download = asset.title;
                link.click();
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-panel">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{asset.title}"? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(asset.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </GlassPanel>
  );
}
