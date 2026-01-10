import { MediaLabLayout } from '@/components/media-lab/MediaLabLayout';
import { ThumbnailGrid } from '@/components/media-lab/ThumbnailGrid';
import { StoryboardEditor } from '@/components/media-lab/StoryboardEditor';
import { TimelineEditor } from '@/components/media-lab/TimelineEditor';
import { Sparky } from '@/components/media-lab/Sparky';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState, useEffect } from 'react';
import { generateContent } from '@/lib/image-gen-api';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface Asset {
    id: string;
    url: string;
    type: 'image' | 'video';
    createdAt: Date;
}

interface ProjectData {
    script: string;
    hook?: string;
    platform: string;
    thumbnails?: Array<{ id: string; url: string; title: string; ctr: number }>;
}

const MediaLab = () => {
    const location = useLocation();
    const [assets, setAssets] = useState<Asset[]>([
        { id: '1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', type: 'image', createdAt: new Date() },
        { id: '2', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop', type: 'image', createdAt: new Date() },
        { id: '3', url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=2552&auto=format&fit=crop', type: 'image', createdAt: new Date() }
    ]);
    const [sparkyMode, setSparkyMode] = useState<'idle' | 'thinking' | 'excited'>('idle');
    const [projectData, setProjectData] = useState<ProjectData | null>(null);

    // Load data from navigation state
    useEffect(() => {
        if (location.state?.projectData) {
            const data = location.state.projectData as ProjectData;

            // Update project data but preserve existing thumbnails if not provided in new data
            setProjectData(prev => ({
                ...data,
                thumbnails: [
                    ...(prev?.thumbnails || []),
                    ...(data.thumbnails || [])
                ]
            }));

            console.log("Loaded project data:", data);

            // If we have thumbnails, add them to assets if not already there
            if (data.thumbnails && data.thumbnails.length > 0) {
                const newAssets = data.thumbnails.map(t => ({
                    id: t.id,
                    url: t.url,
                    type: 'image' as const,
                    createdAt: new Date()
                }));
                // Filter out duplicates based on URL
                setAssets(prev => {
                    const existingUrls = new Set(prev.map(a => a.url));
                    const uniqueNewAssets = newAssets.filter(a => !existingUrls.has(a.url));
                    return [...uniqueNewAssets, ...prev];
                });
            }
        }
    }, [location.state]);

    const handleGenerate = async () => {
        setSparkyMode('thinking');
        toast.info("Sparky is dreaming up something cool...");

        try {
            // Use Gemini to generate an asset
            const imageUrl = await generateContent("A futuristic, high-tech digital interface with glowing neon accents, 3d render, 8k, octane render");

            const newAsset: Asset = {
                id: Date.now().toString(),
                url: imageUrl,
                type: 'image',
                createdAt: new Date()
            };

            setAssets(prev => [newAsset, ...prev]);
            setSparkyMode('excited');
            toast.success("New asset generated!");

            setTimeout(() => setSparkyMode('idle'), 3000);
        } catch (error) {
            console.error(error);
            toast.error("Sparky got confused. Try again.");
            setSparkyMode('idle');
        }
    };

    return (
        <MediaLabLayout
            leftRail={
                <div className="space-y-4">
                    {/* Real Assets */}
                    {assets.map((asset) => (
                        <div key={asset.id} className="p-3 rounded-lg bg-void-surface border border-glass-stroke hover:border-electric-indigo/50 transition-colors cursor-pointer group">
                            <div className="w-full aspect-video bg-void-depth rounded mb-2 overflow-hidden relative">
                                <img src={asset.url} alt="Asset" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-electric-indigo/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs font-medium text-g-text-inverse">Asset_{asset.id.slice(-4)}.png</div>
                            <div className="text-[10px] text-g-muted">{asset.createdAt.toLocaleTimeString()}</div>
                        </div>
                    ))}
                </div>
            }
            rightRail={
                <Sparky mode={sparkyMode} onGenerate={handleGenerate} />
            }
            bottomBar={<TimelineEditor />}
        >
            <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-3xl font-display text-g-heading mb-1">
                            {projectData ? `Project: ${projectData.platform} Content` : 'Project: Zero to One'}
                        </h2>
                        <p className="text-g-muted text-sm">
                            {projectData ? 'Imported from Content Studio' : 'Market Validation Phase • 3 Variations'}
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="script" className="flex-1 flex flex-col">
                    <TabsList className="bg-void-depth border border-glass-stroke w-fit mb-6">
                        <TabsTrigger value="thumbnails" className="data-[state=active]:bg-electric-indigo data-[state=active]:text-white">Thumbnails</TabsTrigger>
                        <TabsTrigger value="storyboard" className="data-[state=active]:bg-electric-indigo data-[state=active]:text-white">Storyboard</TabsTrigger>
                        <TabsTrigger value="script" className="data-[state=active]:bg-electric-indigo data-[state=active]:text-white">Script</TabsTrigger>
                    </TabsList>

                    <TabsContent value="thumbnails" className="flex-1 overflow-y-auto mt-0">
                        <ThumbnailGrid thumbnails={projectData?.thumbnails || [
                            { id: '1', url: '', title: 'Pattern Interrupt', ctr: 8.4 },
                            { id: '2', url: '', title: 'Authority Angle', ctr: 6.1 },
                            { id: '3', url: '', title: 'Contrarian View', ctr: 4.2 },
                        ]} />
                    </TabsContent>

                    <TabsContent value="storyboard" className="flex-1 overflow-y-auto mt-0">
                        <StoryboardEditor />
                    </TabsContent>

                    <TabsContent value="script" className="flex-1 mt-0">
                        <div className="p-8 rounded-xl bg-void-surface border border-glass-stroke min-h-[400px] font-mono text-sm text-g-text leading-relaxed whitespace-pre-wrap">
                            {projectData ? (
                                <>
                                    {projectData.hook && (
                                        <>
                                            <span className="text-g-muted"># HOOK</span><br />
                                            {projectData.hook}<br /><br />
                                        </>
                                    )}
                                    <span className="text-g-muted"># CONTENT</span><br />
                                    {projectData.script}
                                </>
                            ) : (
                                <>
                                    <span className="text-g-muted"># HOOK (0:00-0:03)</span><br />
                                    Stop everything. This changes how you should think about content creation.<br /><br />
                                    <span className="text-g-muted"># BODY (0:03-0:45)</span><br />
                                    Everyone says "post daily." I posted weekly with this framework and got 10x results...
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MediaLabLayout>
    );
};

export default MediaLab;
