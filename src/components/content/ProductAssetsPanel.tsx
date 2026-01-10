import React, { useEffect, useState } from 'react';
import { useProjectStore, Asset } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2, Package, Monitor, GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getProductAssets, ProductAsset, getSignedB2Urls, isB2Url } from '@/lib/database-service';
import { cn } from '@/lib/utils';

// Drag data type for reference image transfers
export const ASSET_DRAG_TYPE = 'application/x-gravity-asset';

type FilterType = 'all' | 'products' | 'thumbnails';

export function ProductAssetsPanel() {
    const { strategyContext, setStrategyContext } = useProjectStore();
    const { user } = useAuth();
    const { appState } = useApp();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);

    // Handle drag start - set drag data with asset info
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, asset: Asset) => {
        setDraggingAssetId(asset.id);
        e.dataTransfer.effectAllowed = 'copy';
        // Store JSON asset data in our custom type AND text/plain for broader compatibility
        const assetJson = JSON.stringify(asset);
        e.dataTransfer.setData(ASSET_DRAG_TYPE, assetJson);
        e.dataTransfer.setData('text/plain', assetJson);

        // Create a small drag image thumbnail
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            background: #0a0a12;
            border: 2px solid rgba(79, 209, 255, 0.5);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            position: absolute;
            top: -1000px;
            left: -1000px;
        `;

        // Add image thumbnail if available
        if (asset.thumbnail_url || asset.url) {
            const img = document.createElement('img');
            img.src = asset.thumbnail_url || asset.url;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            dragImage.appendChild(img);
        }

        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 30, 30);

        // Clean up drag image after a short delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 100);
        });
    };

    const handleDragEnd = () => {
        setDraggingAssetId(null);
    };

    // Fetch assets from Supabase (metadata) - files are stored in Backblaze B2
    useEffect(() => {
        async function loadAssets() {
            const userId = user?.uid || appState.userId;
            console.log('[ProductAssetsPanel] Loading assets for userId:', userId);
            if (!userId) {
                console.log('[ProductAssetsPanel] No userId available');
                return;
            }

            setLoading(true);
            try {
                // Fetch from Supabase product_assets table
                const supabaseAssets = await getProductAssets(userId);
                console.log('[ProductAssetsPanel] Supabase returned:', supabaseAssets.length, 'assets');

                // Collect all B2 URLs that need signing
                const urlsToSign: string[] = [];
                for (const pa of supabaseAssets) {
                    if (pa.storage_url && isB2Url(pa.storage_url)) {
                        urlsToSign.push(pa.storage_url);
                    }
                    if (pa.thumbnail_url && isB2Url(pa.thumbnail_url)) {
                        urlsToSign.push(pa.thumbnail_url);
                    }
                }

                // Get signed URLs for all B2 assets in batch
                let signedUrlMap = new Map<string, string>();
                if (urlsToSign.length > 0) {
                    console.log('[ProductAssetsPanel] Signing', urlsToSign.length, 'B2 URLs');
                    signedUrlMap = await getSignedB2Urls(urlsToSign);
                }

                // Map Supabase assets to store Asset type with signed URLs
                const mappedAssets: Asset[] = supabaseAssets.map((pa: ProductAsset) => {
                    const storageUrl = pa.storage_url || '';
                    const thumbnailUrl = pa.thumbnail_url || pa.storage_url || '';

                    return {
                        id: pa.id,
                        url: signedUrlMap.get(storageUrl) || storageUrl,
                        thumbnail_url: signedUrlMap.get(thumbnailUrl) || thumbnailUrl,
                        name: pa.title,
                        title: pa.title,
                        tags: pa.tags || [],
                        role: pa.metadata?.role || undefined,
                        characterTag: pa.metadata?.characterTag || undefined,
                        asset_type: pa.asset_type,
                    };
                });

                setAssets(mappedAssets);

                // Sync to strategyContext so SceneCards can access them
                if (strategyContext) {
                    setStrategyContext({
                        ...strategyContext,
                        selectedAssets: mappedAssets
                    });
                }
            } catch (error) {
                console.error("[ProductAssetsPanel] Failed to load assets:", error);
            } finally {
                setLoading(false);
            }
        }

        loadAssets();
    }, [user?.uid, appState.userId]);

    // Filter assets based on active filter
    const filteredAssets = assets.filter(asset => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'products') {
            return asset.asset_type === 'image' || !asset.asset_type;
        }
        if (activeFilter === 'thumbnails') {
            return asset.asset_type === 'thumbnail';
        }
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-card/50">
            {/* Header */}
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-display font-medium text-foreground">Reference Images</h3>
                        <p className="text-sm text-muted-foreground">From your Asset Library</p>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 h-9 text-sm",
                            activeFilter === 'all'
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 h-9 text-sm",
                            activeFilter === 'products'
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveFilter('products')}
                    >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Products
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 h-9 text-sm",
                            activeFilter === 'thumbnails'
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveFilter('thumbnails')}
                    >
                        <Monitor className="w-4 h-4 mr-1" />
                        Thumbnails
                    </Button>
                </div>
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                            <ImageIcon className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {activeFilter === 'all'
                                ? 'No assets in your library'
                                : `No ${activeFilter} found`}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Add assets from the Asset Library page
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {filteredAssets.map((asset) => (
                            <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "group relative bg-muted rounded-lg overflow-hidden border transition-all cursor-grab active:cursor-grabbing",
                                    draggingAssetId === asset.id
                                        ? "border-primary/50 opacity-50 scale-95"
                                        : "border-border hover:border-primary/30 hover:shadow-[0_0_20px_-5px_rgba(79,209,255,0.3)]"
                                )}
                            >
                                {asset.thumbnail_url || asset.url ? (
                                    <img
                                        src={asset.thumbnail_url || asset.url}
                                        alt={asset.title || asset.name}
                                        className="w-full aspect-square object-cover pointer-events-none"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="w-full aspect-square flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}

                                {/* Drag handle indicator */}
                                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-1.5 bg-black/60 rounded">
                                        <GripVertical className="w-4 h-4 text-white" />
                                    </div>
                                </div>

                                {/* Overlay with name */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-sm text-white truncate font-medium">
                                        {asset.title || asset.name}
                                    </p>
                                </div>

                                {/* Type badge */}
                                {asset.asset_type && (
                                    <div className="absolute top-1 right-1">
                                        <span className="px-2 py-0.5 bg-black/60 rounded text-sm text-white uppercase">
                                            {asset.asset_type}
                                        </span>
                                    </div>
                                )}

                                {/* Drag hint on hover */}
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                    <span className="text-sm text-primary font-medium bg-black/60 px-2 py-1 rounded">
                                        Drag to scene
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer - Link to Asset Library */}
            <div className="p-3 border-t border-border">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-sm border-border text-muted-foreground hover:text-foreground"
                    onClick={() => window.open('/product-assets', '_blank')}
                >
                    <Package className="w-4 h-4 mr-2" />
                    Open Asset Library
                </Button>
            </div>
        </div>
    );
}
