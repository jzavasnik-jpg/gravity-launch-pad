import { useState, useRef } from "react";
import { useArchitectStore, ColorPalette, DEFAULT_PALETTE } from "@/store/architectStore";
import { extractColorsFromFile, buildPaletteFromColors, isLightColor } from "@/lib/color-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    Sparkles,
    Palette,
    Check,
    Loader2,
    Image as ImageIcon,
    Wand2,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ColorPalettePickerProps {
    productName: string;
    productDescription: string;
    avatarName: string;
    onPaletteChange?: (palette: ColorPalette) => void;
}

type PaletteMode = 'presets' | 'logo' | 'ai';

const PRESET_PALETTES: { name: string; palette: ColorPalette }[] = [
    {
        name: "Gravity (Cyan)",
        palette: DEFAULT_PALETTE
    },
    {
        name: "Sunset Energy",
        palette: {
            primary: '#F97316',
            secondary: '#EF4444',
            accent: '#FBBF24',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        }
    },
    {
        name: "Forest Trust",
        palette: {
            primary: '#10B981',
            secondary: '#059669',
            accent: '#34D399',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        }
    },
    {
        name: "Royal Authority",
        palette: {
            primary: '#8B5CF6',
            secondary: '#7C3AED',
            accent: '#A78BFA',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        }
    },
    {
        name: "Rose Passion",
        palette: {
            primary: '#F43F5E',
            secondary: '#E11D48',
            accent: '#FB7185',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        }
    },
    {
        name: "Ocean Calm",
        palette: {
            primary: '#0EA5E9',
            secondary: '#0284C7',
            accent: '#38BDF8',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        }
    }
];

export function ColorPalettePicker({
    productName,
    productDescription,
    avatarName,
    onPaletteChange
}: ColorPalettePickerProps) {
    const { colorPalette, setColorPalette, setBrandSetup } = useArchitectStore();

    const [mode, setMode] = useState<PaletteMode>('presets');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
    const [extractedColors, setExtractedColors] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        setIsExtracting(true);
        setMode('logo');

        try {
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedLogo(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Extract colors
            const colors = await extractColorsFromFile(file);
            const palette = buildPaletteFromColors(colors);

            setExtractedColors(colors.slice(0, 6).map(c => c.hex));
            setColorPalette(palette);
            setBrandSetup({ logoFile: uploadedLogo || undefined, paletteSource: 'logo' });

            if (onPaletteChange) {
                onPaletteChange(palette);
            }

            toast.success("Colors extracted from your logo!");
        } catch (error) {
            console.error("Error extracting colors:", error);
            toast.error("Failed to extract colors. Try a different image.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAIGenerate = async () => {
        setIsGeneratingAI(true);
        setMode('ai');

        try {
            const response = await fetch('http://localhost:3001/api/generate-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `You are an expert UI/UX designer specializing in color psychology and brand identity.

Generate a color palette for a landing page based on the product information provided.

Consider:
- The emotional response the colors should evoke
- The target audience's expectations
- Conversion optimization (CTAs that pop, readable text)
- Professional, trustworthy appearance

Return ONLY a JSON object with these exact hex color values:
{
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE",
    "background": "#030308",
    "text": "#FFFFFF",
    "muted": "#71717A",
    "reasoning": "Brief explanation of why these colors work for this brand"
}

The primary color should be vibrant and attention-grabbing.
The secondary should complement the primary.
The accent should be used sparingly for highlights.
Keep background dark (#030308) and text white for modern SaaS look.`,
                    userPrompt: `Product Name: ${productName || "Digital Product"}
Product Description: ${productDescription || "A premium digital product"}
Target Audience: ${avatarName || "Digital entrepreneurs"}

Generate a color palette that would convert well for this specific product and audience.`
                })
            });

            if (!response.ok) {
                throw new Error("API request failed");
            }

            const data = await response.json();

            if (data.primary) {
                const palette: ColorPalette = {
                    primary: data.primary,
                    secondary: data.secondary || data.primary,
                    accent: data.accent || '#10B981',
                    background: data.background || '#030308',
                    text: data.text || '#FFFFFF',
                    muted: data.muted || '#71717A'
                };

                setColorPalette(palette);
                setBrandSetup({ paletteSource: 'ai' });

                if (onPaletteChange) {
                    onPaletteChange(palette);
                }

                if (data.reasoning) {
                    toast.success(data.reasoning.slice(0, 100) + "...");
                } else {
                    toast.success("AI generated a custom palette for your brand!");
                }
            }
        } catch (error) {
            console.error("Error generating AI palette:", error);
            toast.error("Failed to generate AI palette. Using smart defaults.");

            // Fallback: Generate based on product name vibes
            const fallbackPalette = generateFallbackPalette(productName);
            setColorPalette(fallbackPalette);
            setBrandSetup({ paletteSource: 'ai' });

            if (onPaletteChange) {
                onPaletteChange(fallbackPalette);
            }
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const generateFallbackPalette = (name: string): ColorPalette => {
        // Simple heuristic based on product name keywords
        const lowerName = name.toLowerCase();

        if (lowerName.includes('wealth') || lowerName.includes('money') || lowerName.includes('finance')) {
            return { ...DEFAULT_PALETTE, primary: '#10B981', secondary: '#059669', accent: '#FBBF24' };
        }
        if (lowerName.includes('health') || lowerName.includes('fitness') || lowerName.includes('wellness')) {
            return { ...DEFAULT_PALETTE, primary: '#10B981', secondary: '#34D399', accent: '#06B6D4' };
        }
        if (lowerName.includes('creative') || lowerName.includes('design') || lowerName.includes('art')) {
            return { ...DEFAULT_PALETTE, primary: '#8B5CF6', secondary: '#A78BFA', accent: '#F472B6' };
        }
        if (lowerName.includes('power') || lowerName.includes('elite') || lowerName.includes('premium')) {
            return { ...DEFAULT_PALETTE, primary: '#F97316', secondary: '#EF4444', accent: '#FBBF24' };
        }

        return DEFAULT_PALETTE;
    };

    const handlePresetSelect = (preset: typeof PRESET_PALETTES[0]) => {
        setColorPalette(preset.palette);
        setBrandSetup({ paletteSource: 'custom' });

        if (onPaletteChange) {
            onPaletteChange(preset.palette);
        }

        toast.success(`Applied "${preset.name}" palette`);
    };

    const handleColorChange = (key: keyof ColorPalette, value: string) => {
        setColorPalette({ [key]: value });
        setBrandSetup({ paletteSource: 'custom' });

        if (onPaletteChange) {
            onPaletteChange({ ...colorPalette, [key]: value });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-primary/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Brand Colors</span>
                    {/* Color Preview Pills */}
                    <div className="flex items-center gap-1 ml-2">
                        {['primary', 'secondary', 'accent'].map((key) => (
                            <div
                                key={key}
                                className="w-5 h-5 rounded-full border border-white/20"
                                style={{ backgroundColor: colorPalette[key as keyof ColorPalette] }}
                            />
                        ))}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Mode Tabs */}
                    <div className="flex gap-2">
                        <Button
                            variant={mode === 'presets' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('presets')}
                            className="flex-1"
                        >
                            <Palette className="w-3 h-3 mr-1" />
                            Presets
                        </Button>
                        <Button
                            variant={mode === 'logo' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="flex-1"
                        >
                            {isExtracting ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3 mr-1" />
                            )}
                            From Logo
                        </Button>
                        <Button
                            variant={mode === 'ai' ? 'default' : 'outline'}
                            size="sm"
                            onClick={handleAIGenerate}
                            disabled={isGeneratingAI}
                            className="flex-1"
                        >
                            {isGeneratingAI ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                                <Wand2 className="w-3 h-3 mr-1" />
                            )}
                            AI Magic
                        </Button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    {/* Preset Palettes */}
                    {mode === 'presets' && (
                        <div className="grid grid-cols-2 gap-2">
                            {PRESET_PALETTES.map((preset) => {
                                const isSelected =
                                    colorPalette.primary === preset.palette.primary &&
                                    colorPalette.secondary === preset.palette.secondary;

                                return (
                                    <button
                                        key={preset.name}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all text-left",
                                            isSelected
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex -space-x-1">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-white/20"
                                                    style={{ backgroundColor: preset.palette.primary }}
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-full border border-white/20"
                                                    style={{ backgroundColor: preset.palette.secondary }}
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-full border border-white/20"
                                                    style={{ backgroundColor: preset.palette.accent }}
                                                />
                                            </div>
                                            {isSelected && <Check className="w-3 h-3 text-primary ml-auto" />}
                                        </div>
                                        <p className="text-xs font-medium">{preset.name}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Logo Extraction Result */}
                    {mode === 'logo' && uploadedLogo && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <img
                                    src={uploadedLogo}
                                    alt="Uploaded logo"
                                    className="w-12 h-12 object-contain rounded"
                                />
                                <div className="flex-1">
                                    <p className="text-xs font-medium">Colors Extracted</p>
                                    <div className="flex gap-1 mt-1">
                                        {extractedColors.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-5 h-5 rounded border border-white/20"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* AI Generation Status */}
                    {mode === 'ai' && !isGeneratingAI && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                AI analyzed your product "{productName || 'your product'}" and generated a custom palette
                                optimized for conversion.
                            </p>
                        </div>
                    )}

                    {/* Manual Color Editing */}
                    <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Fine-tune Colors
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['primary', 'secondary', 'accent'] as const).map((key) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {key}
                                    </Label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="color"
                                            value={colorPalette[key]}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-0"
                                        />
                                        <Input
                                            value={colorPalette[key]}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
