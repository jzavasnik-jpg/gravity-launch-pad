import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw, Download, Image as ImageIcon, X, Play, User } from "lucide-react";
import { generateViralThumbnail } from "@/lib/thumbnail-agent-api";
import { toast } from "sonner";

import { AssetSelectorModal } from "@/components/assets/AssetSelectorModal";
import type { Asset } from "@/lib/asset-types";


interface ThumbnailCardProps {
    platform: string;
    content: string; // Full script
    hook?: string;   // Specific hook
    productName: string;
    initialImageUrl?: string;
    productContext?: {
        description?: string;
        solution?: string;
    };
    assets?: any[];
    avatarUrl?: string;
    onThumbnailGenerated?: (url: string) => void;
}

export function ThumbnailCard({
    platform,
    content,
    hook,
    productName,
    initialImageUrl,
    productContext,
    assets,
    avatarUrl,
    onThumbnailGenerated
}: ThumbnailCardProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
    const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState("");
    const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
    const [additionalAssets, setAdditionalAssets] = useState<Asset[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [customAvatar, setCustomAvatar] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

    const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomAvatar(reader.result as string);
                toast.success("Custom avatar uploaded!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        // Use custom avatar if available, otherwise use the prop
        const effectiveAvatarUrl = customAvatar || avatarUrl;
        console.log("[ThumbnailCard] Generating with avatarUrl:", effectiveAvatarUrl?.substring(0, 50) + "..."); // Log truncated for base64

        setLoading(true);
        setGeneratedPrompt(null);

        // Save current image as previous before generating new one
        if (imageUrl) {
            setPreviousImageUrl(imageUrl);
        }

        try {
            // Combine prop assets and additional selected assets
            const combinedAssets = [
                ...(assets || []),
                ...additionalAssets.map(a => ({
                    type: 'image',
                    url: a.storage_url || a.thumbnail_url,
                    name: a.title
                }))
            ];

            console.log("Generating thumbnail with avatar:", avatarUrl);
            // Pass the current imageUrl as previousThumbnailUrl if we are making suggestions (iterating)
            const previousThumbnailUrl = suggestions ? imageUrl : undefined;

            const result = await generateViralThumbnail(
                content,
                platform,
                productName,
                productContext,
                suggestions,
                combinedAssets,
                avatarUrl,
                hook,
                hook,
                previousThumbnailUrl, // Pass current image for iteration
                generatedPrompt || undefined // Pass current prompt for editing
            );
            setImageUrl(result.imageUrl);
            setGeneratedPrompt(result.prompt);

            if (onThumbnailGenerated) {
                onThumbnailGenerated(result.imageUrl);
            }
            toast.success("Viral thumbnail generated!");
            setSuggestions(""); // Clear suggestions after success
        } catch (error) {
            console.error("Thumbnail generation failed:", error);
            toast.error("Failed to generate thumbnail");
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = () => {
        if (previousImageUrl) {
            setImageUrl(previousImageUrl);
            setPreviousImageUrl(null); // Clear previous after reverting
            toast.info("Reverted to previous thumbnail");
        }
    };

    const handleView = () => {
        if (!imageUrl) return;

        // If it's a regular URL, open it
        if (imageUrl.startsWith('http')) {
            window.open(imageUrl, '_blank');
            return;
        }

        // If it's base64, open a new window and write the image to it
        // This bypasses URL length limits and security restrictions on data URIs in new tabs
        const win = window.open();
        if (win) {
            win.document.write(
                `<html>
                    <head><title>Viral Thumbnail Preview</title></head>
                    <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#1a1a1a;height:100vh;">
                        <img src="${imageUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                    </body>
                </html>`
            );
            win.document.close();
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${platform}-thumbnail-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const removeAsset = (assetId: string) => {
        setAdditionalAssets(prev => prev.filter(a => a.id !== assetId));
    };

    return (
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                    {/* Image Area */}
                    <div className="w-full md:w-1/3 bg-black/20 min-h-[200px] flex flex-col">
                        <div className="relative group flex-grow flex items-center justify-center min-h-[200px]">
                            {imageUrl ? (
                                <>
                                    <img
                                        src={imageUrl}
                                        alt="Viral Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={handleView}>
                                            View
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={handleDownload}>
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    {loading ? (
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 mx-auto text-purple-400/50 mb-2" />
                                    )}
                                    <p className="text-sm text-g-muted">
                                        {loading ? "Designing viral thumbnail..." : "No thumbnail generated yet"}
                                    </p>
                                </div>
                            )}
                        </div>
                        {/* Debug Prompt Display */}
                        {generatedPrompt && (
                            <div className="p-2 bg-black/40 text-[10px] text-gray-400 font-mono overflow-y-auto max-h-[100px] border-t border-white/10">
                                <p className="font-bold text-gray-300 mb-1">Generated Prompt:</p>
                                {generatedPrompt}
                            </div>
                        )}
                    </div>

                    {/* Controls Area */}
                    <div className="w-full md:w-2/3 p-6 flex flex-col justify-center">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-g-heading flex items-center gap-2">
                                Viral Thumbnail Agent
                                {loading && <span className="text-xs font-normal text-purple-400 animate-pulse">Analyzing trends...</span>}
                            </h3>
                            <p className="text-sm text-g-muted">
                                AI analyzes your hook and emotional triggers to design a high-CTR thumbnail.
                            </p>
                        </div>

                        {/* Additional Assets Display */}
                        {additionalAssets.length > 0 && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {additionalAssets.map(asset => (
                                    <div key={asset.id} className="relative group">
                                        <img
                                            src={asset.storage_url || asset.thumbnail_url}
                                            alt={asset.title}
                                            className="w-12 h-12 object-cover rounded border border-purple-500/30"
                                        />
                                        <button
                                            onClick={() => removeAsset(asset.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Textarea
                                placeholder="Make suggestions (e.g., 'Make it more shocking', 'Add red arrows')"
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                className="bg-background/50 min-h-[80px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.metaKey && !loading) {
                                        handleGenerate();
                                    }
                                }}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    onClick={() => setIsAssetSelectorOpen(true)}
                                    variant="outline"
                                    className="px-3"
                                    title="Add Reference Image"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </Button>

                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant={customAvatar ? "default" : "outline"}
                                    className={`px-3 ${customAvatar ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
                                    title={customAvatar ? "Custom Avatar Active" : "Upload Custom Avatar"}
                                >
                                    <User className="w-4 h-4" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleCustomAvatarUpload}
                                    accept="image/*"
                                    className="hidden"
                                />

                                {/* Revert Button */}
                                {previousImageUrl && (
                                    <Button
                                        onClick={handleRevert}
                                        variant="outline"
                                        className="px-3 text-yellow-500 hover:text-yellow-400"
                                        title="Revert to previous version"
                                        disabled={loading}
                                    >
                                        <RefreshCw className="w-4 h-4 rotate-180" />
                                    </Button>
                                )}

                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    variant="gradient"
                                    className="min-w-[120px]"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            {imageUrl ? "Regenerate" : "Generate"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <AssetSelectorModal
                isOpen={isAssetSelectorOpen}
                onClose={() => setIsAssetSelectorOpen(false)}
                onConfirm={(assets) => setAdditionalAssets(prev => [...prev, ...assets])}
                maxSelection={3}
            />
        </Card >
    );
}
