import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Tag, Loader2, Check } from 'lucide-react';
import { useProjectStore, Asset } from '@/store/projectStore';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useApp } from '@/context/AppContext';
import { uploadAsset } from '@/lib/asset-service';

export function SmartIngestModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAssets, setPendingAssets] = useState<Partial<Asset>[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addAsset, campaignMode } = useProjectStore();
    const { appState } = useApp();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsAnalyzing(true);

        // Simulate AI Vision Analysis
        const newAssets: Partial<Asset>[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);

            // Mock AI Tagging based on filename or random
            const mockTags = ["product", "high-quality"];
            if (file.name.includes("before")) mockTags.push("problem-state");
            if (file.name.includes("after")) mockTags.push("solution-state");

            newAssets.push({
                id: crypto.randomUUID(),
                url,
                name: file.name,
                tags: mockTags,
                role: undefined, // User must select this
                file: file // Store the file for upload
            });
        }

        // Simulate network delay for AI
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPendingAssets(prev => [...prev, ...newAssets]);
        setIsAnalyzing(false);
        toast.success(`Analyzed ${files.length} images`);
    };

    const handleRoleChange = (id: string, role: Asset['role']) => {
        setPendingAssets(prev => prev.map(a => a.id === id ? { ...a, role } : a));
    };

    const handleSave = async () => {
        const incomplete = pendingAssets.filter(a => !a.role);
        if (incomplete.length > 0) {
            toast.error(`Please assign a role to all ${incomplete.length} assets.`);
            return;
        }

        const userId = appState.userId;
        if (!userId) {
            toast.error("User not authenticated");
            return;
        }

        // Upload to Firebase
        try {
            for (const asset of pendingAssets) {
                if (asset.role && asset.file) { // Ensure we have the file object
                    await uploadAsset(userId, {
                        title: asset.name || "Untitled Asset",
                        asset_type: 'image', // Defaulting to image for now
                        file: asset.file,
                        session_id: appState.sessionId || undefined,
                        metadata: { role: asset.role, characterTag: asset.characterTag }
                    });
                }
            }
            toast.success("Assets uploaded and saved to library");
            setPendingAssets([]);
            setIsOpen(false);
            // Trigger reload in parent if possible, or rely on useEffect in parent
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload assets");
        }
    };

    const removePending = (id: string) => {
        setPendingAssets(prev => prev.filter(a => a.id !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="bg-[#0f0f0f] border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" /> Smart Ingest
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Drop Zone / Upload Button */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-600 transition-colors bg-zinc-900/50"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-zinc-800 rounded-full">
                                <Upload className="w-6 h-6 text-zinc-400" />
                            </div>
                            <p className="text-sm font-medium text-zinc-300">Click to upload or drag and drop</p>
                            <p className="text-xs text-zinc-500">AI will auto-tag your images</p>
                        </div>
                    </div>

                    {/* Analysis Loading State */}
                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 text-purple-400 text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing images with Gemini Vision...</span>
                        </div>
                    )}

                    {/* Pending Assets List */}
                    {pendingAssets.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-zinc-400">Review & Assign Roles</h4>
                            <div className="grid gap-4">
                                {pendingAssets.map((asset) => (
                                    <div key={asset.id} className="flex gap-4 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <div className="w-24 h-24 flex-shrink-0 bg-black rounded-md overflow-hidden relative">
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePending(asset.id!)}
                                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-red-500/50 transition-colors"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium truncate max-w-[200px]">{asset.name}</p>
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {asset.tags?.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 hover:bg-zinc-700">
                                                            <Tag className="w-3 h-3 mr-1" /> {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-zinc-500">Role:</span>
                                                <Select
                                                    value={asset.role}
                                                    onValueChange={(val) => handleRoleChange(asset.id!, val as Asset['role'])}
                                                >
                                                    <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-xs">
                                                        <SelectValue placeholder="Select Role" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <SelectItem value="hero">Hero Shot</SelectItem>
                                                        <SelectItem value="before">Before State</SelectItem>
                                                        <SelectItem value="after">After State</SelectItem>
                                                        <SelectItem value="social_proof">Social Proof</SelectItem>
                                                        <SelectItem value="product_element">Product Element</SelectItem>
                                                        <SelectItem value="brand_element">Brand Element</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {/* Character Tag for Transformation Narrative */}
                                                {campaignMode === 'transformation_narrative' && (
                                                    <Select
                                                        value={asset.characterTag}
                                                        onValueChange={(val) => setPendingAssets(prev => prev.map(a => a.id === asset.id ? { ...a, characterTag: val as Asset['characterTag'] } : a))}
                                                    >
                                                        <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-xs">
                                                            <SelectValue placeholder="Who is in this?" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                            <SelectItem value="guide">The Guide (You)</SelectItem>
                                                            <SelectItem value="mentee">The Mentee</SelectItem>
                                                            <SelectItem value="both">Both</SelectItem>
                                                            <SelectItem value="product">Product Only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={pendingAssets.length === 0 || isAnalyzing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Check className="w-4 h-4 mr-2" /> Add to Library
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
