import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle, Image as ImageIcon, Video } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { searchAssets } from "@/lib/asset-service";
import type { Asset } from "@/lib/asset-types";
import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";

interface AssetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedAssets: Asset[]) => void;
    maxSelection?: number;
}

export function AssetSelectorModal({
    isOpen,
    onClose,
    onConfirm,
    maxSelection = 5
}: AssetSelectorModalProps) {
    const { appState } = useApp();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && appState.userId) {
            loadAssets();
        }
    }, [isOpen, appState.userId]);

    const loadAssets = async () => {
        if (!appState.userId) return;
        setLoading(true);
        try {
            const results = await searchAssets(appState.userId, {
                search_query: searchQuery,
                sort_by: 'created_at',
                sort_order: 'desc'
            });
            setAssets(results);
        } catch (error) {
            console.error("Failed to load assets:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAsset = (asset: Asset) => {
        const newSelected = new Set(selectedAssetIds);
        if (newSelected.has(asset.id)) {
            newSelected.delete(asset.id);
        } else {
            if (newSelected.size >= maxSelection) return;
            newSelected.add(asset.id);
        }
        setSelectedAssetIds(newSelected);
    };

    const handleConfirm = () => {
        const selected = assets.filter(a => selectedAssetIds.has(a.id));
        onConfirm(selected);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display">Select Product Assets</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 my-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            onKeyDown={(e) => e.key === 'Enter' && loadAssets()}
                        />
                    </div>
                    <Button variant="outline" onClick={loadAssets}>Search</Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] p-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No assets found. Upload some in the Product Assets library first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {assets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedAssetIds.has(asset.id)
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-transparent hover:border-primary/50"
                                        }`}
                                    onClick={() => toggleAsset(asset)}
                                >
                                    <div className="aspect-video bg-black/10 relative">
                                        {asset.asset_type === 'video' ? (
                                            <div className="flex items-center justify-center h-full bg-gray-900">
                                                <Video className="h-8 w-8 text-gray-500" />
                                            </div>
                                        ) : (
                                            <img
                                                src={asset.storage_url || asset.thumbnail_url}
                                                alt={asset.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        {selectedAssetIds.has(asset.id) && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <CheckCircle className="h-8 w-8 text-primary fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 text-xs truncate font-medium bg-background/80 backdrop-blur-sm absolute bottom-0 w-full">
                                        {asset.title}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">
                            {selectedAssetIds.size} selected (max {maxSelection})
                        </span>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <PrimaryButton onClick={handleConfirm} disabled={selectedAssetIds.size === 0}>
                                Use Selected Assets
                            </PrimaryButton>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
