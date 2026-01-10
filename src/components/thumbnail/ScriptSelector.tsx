import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, FileText, Wand2, ArrowRight } from 'lucide-react';
import { generateScript } from '@/lib/thumbnail-service';
import { toast } from 'sonner';

interface ScriptSelectorProps {
    onAnalyze?: (script: string) => void;
    isAnalyzing?: boolean;
    initialTopic?: string;
    initialHook?: string;
}

const MOCK_SCRIPT_1 = `Title: The $10K Trap\nHook: Stop chasing $10k months. It's a trap.\nBody: Most agency owners are obsessed with hitting $10k/month...`;
const MOCK_SCRIPT_2 = `Title: AI is lying to you\nHook: ChatGPT is making you dumber.\nBody: Everyone is using AI to write their content...`;

export function ScriptSelector({ onAnalyze, isAnalyzing, initialTopic, initialHook }: ScriptSelectorProps) {
    const { appState } = useApp();
    const { contentStudioPainSynopsis } = appState;

    // State
    const [source, setSource] = useState<string>("topic");
    const [topic, setTopic] = useState<string>(initialTopic || "");
    const [scriptText, setScriptText] = useState<string>("");
    const [toneLevel, setToneLevel] = useState<number>(50); // 0 = Serious, 100 = Humorous
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // Initialize script from source
    useEffect(() => {
        if (source === "draft") {
            let draftContent = "";
            if (typeof contentStudioPainSynopsis === 'string') {
                draftContent = contentStudioPainSynopsis;
            } else if (contentStudioPainSynopsis) {
                draftContent = JSON.stringify(contentStudioPainSynopsis);
            }
            setScriptText(draftContent);
        } else if (source === "mock1") {
            setScriptText(MOCK_SCRIPT_1);
        } else if (source === "mock2") {
            setScriptText(MOCK_SCRIPT_2);
        } else if (source === "topic") {
            // If we have an initial hook but no script, pre-fill it
            if (initialHook && !scriptText) {
                setScriptText(`Hook: ${initialHook}\n\n`);
            } else if (!scriptText) {
                setScriptText("");
            }
        }
    }, [source, contentStudioPainSynopsis, initialHook]);

    const handleGenerateScript = async () => {
        if (!topic && !scriptText) {
            toast.error("Please enter a topic or select a script to rewrite.");
            return;
        }

        setIsGeneratingScript(true);
        try {
            const result = await generateScript(topic || "My Video", toneLevel, scriptText);
            setScriptText(result.script_text);
            toast.success("Script generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 space-y-8 bg-zinc-900/50 border border-white/10 rounded-xl backdrop-blur-sm">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-display text-white">Script & Tone</h2>
                <p className="text-zinc-400 text-sm">Set the tone, write the script, then generate thumbnails.</p>
            </div>

            {/* Step 1: Tone & Source */}
            <div className="space-y-6 p-6 bg-black/40 rounded-lg border border-white/5">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-mono uppercase text-zinc-500">Emotional Tone</label>
                        <span className="text-xs font-medium text-purple-400">
                            {toneLevel < 30 ? "Serious & Professional" : toneLevel > 70 ? "Humorous & Entertaining" : "Balanced & Engaging"}
                        </span>
                    </div>
                    <Slider
                        value={[toneLevel]}
                        onValueChange={(vals) => setToneLevel(vals[0])}
                        max={100}
                        step={10}
                        className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600 font-mono uppercase">
                        <span>Serious</span>
                        <span>Humorous</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-zinc-500">Input Source</label>
                    <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                            <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="topic">Generate from Topic</SelectItem>
                            <SelectItem value="draft">Rewrite Current Draft</SelectItem>
                            <SelectItem value="mock1">Rewrite Mock: The $10K Trap</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {source === 'topic' && (
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase text-zinc-500">Video Topic</label>
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. How to scale a SaaS agency..."
                            className="bg-zinc-900 border-white/10 text-white"
                        />
                    </div>
                )}

                <Button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript || (source === 'topic' && !topic)}
                    className="w-full bg-white text-black hover:bg-zinc-200"
                >
                    {isGeneratingScript ? (
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    {scriptText ? "Rewrite Script with New Tone" : "Generate Script"}
                </Button>
            </div>

            {/* Step 2: Script Editor */}
            <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-zinc-500">Script Editor (Editable)</label>
                <div className="relative">
                    <Textarea
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        className="min-h-[300px] bg-black border-white/10 text-zinc-300 font-mono text-sm resize-none focus:ring-purple-500/20 p-4 leading-relaxed"
                        placeholder="Your script will appear here..."
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 font-mono">
                        {scriptText.length} chars
                    </div>
                </div>
            </div>

            {/* Step 3: Action */}
            <Button
                onClick={() => onAnalyze(scriptText)}
                disabled={isAnalyzing || !String(scriptText).trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12"
            >
                {isAnalyzing ? (
                    <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing First Scene...
                    </>
                ) : (
                    <>
                        Generate Thumbnails <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </div>
    );
}
