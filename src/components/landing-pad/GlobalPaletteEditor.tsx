import { useState } from "react";
import { useArchitectStore, ColorPalette, DEFAULT_PALETTE, FontFamily, FONT_OPTIONS, ThemeSettings, DEFAULT_THEME_SETTINGS } from "@/store/architectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Palette,
    RotateCcw,
    Check,
    Copy,
    Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Helper to get font family CSS
const getFontFamily = (font: FontFamily): string => {
    switch (font) {
        case 'clash': return 'Clash Display, sans-serif';
        case 'playfair': return 'Playfair Display, serif';
        case 'inter': return 'Inter, sans-serif';
        case 'roboto': return 'Roboto, sans-serif';
        case 'outfit': return 'Outfit, sans-serif';
        default: return 'Outfit, sans-serif';
    }
};

const COLOR_LABELS: Record<keyof ColorPalette, { label: string; description: string }> = {
    primary: { label: "Primary", description: "Main brand color, CTAs, highlights" },
    secondary: { label: "Secondary", description: "Supporting accent color" },
    accent: { label: "Accent", description: "Tertiary highlights, badges" },
    background: { label: "Background", description: "Page background color" },
    text: { label: "Text", description: "Primary text color" },
    muted: { label: "Muted", description: "Secondary text, borders" }
};

export function GlobalPaletteEditor() {
    const { colorPalette, setColorPalette, themeSettings, setThemeSettings } = useArchitectStore();
    const [isOpen, setIsOpen] = useState(false);
    const [localPalette, setLocalPalette] = useState<ColorPalette>(colorPalette);
    const [localFonts, setLocalFonts] = useState<{ heading: FontFamily; body: FontFamily }>({
        heading: themeSettings.fontHeading,
        body: themeSettings.fontBody
    });

    const handleOpen = (open: boolean) => {
        if (open) {
            setLocalPalette(colorPalette);
            setLocalFonts({
                heading: themeSettings.fontHeading,
                body: themeSettings.fontBody
            });
        }
        setIsOpen(open);
    };

    const handleColorChange = (key: keyof ColorPalette, value: string) => {
        setLocalPalette(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setColorPalette(localPalette);
        setThemeSettings({ fontHeading: localFonts.heading, fontBody: localFonts.body });
        toast.success("Style settings updated!");
        setIsOpen(false);
    };

    const handleReset = () => {
        setLocalPalette(DEFAULT_PALETTE);
        setLocalFonts({
            heading: DEFAULT_THEME_SETTINGS.fontHeading,
            body: DEFAULT_THEME_SETTINGS.fontBody
        });
    };

    const handleCopyCSS = () => {
        const css = `:root {
  --color-primary: ${localPalette.primary};
  --color-secondary: ${localPalette.secondary};
  --color-accent: ${localPalette.accent};
  --color-background: ${localPalette.background};
  --color-text: ${localPalette.text};
  --color-muted: ${localPalette.muted};
}`;
        navigator.clipboard.writeText(css);
        toast.success("CSS variables copied to clipboard!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Palette className="w-4 h-4" />
                    Edit Style
                    <div className="flex -space-x-1 ml-1">
                        {['primary', 'secondary', 'accent'].map((key) => (
                            <div
                                key={key}
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: colorPalette[key as keyof ColorPalette] }}
                            />
                        ))}
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Colors & Typography
                    </DialogTitle>
                    <DialogDescription>
                        Customize colors and fonts for your landing page.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Live Preview */}
                    <div
                        className="rounded-lg p-4 border"
                        style={{ backgroundColor: localPalette.background }}
                    >
                        <p
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: localPalette.muted }}
                        >
                            Preview
                        </p>
                        <h3
                            className="text-xl font-bold mb-2"
                            style={{
                                color: localPalette.text,
                                fontFamily: getFontFamily(localFonts.heading)
                            }}
                        >
                            Your Landing Page Title
                        </h3>
                        <p
                            className="text-sm mb-3"
                            style={{
                                color: localPalette.muted,
                                fontFamily: getFontFamily(localFonts.body)
                            }}
                        >
                            Supporting text that describes your product.
                        </p>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 rounded-lg text-sm font-bold"
                                style={{
                                    backgroundColor: localPalette.primary,
                                    color: localPalette.background
                                }}
                            >
                                Primary CTA
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg text-sm font-bold border"
                                style={{
                                    borderColor: localPalette.secondary,
                                    color: localPalette.secondary
                                }}
                            >
                                Secondary
                            </button>
                            <span
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                    backgroundColor: localPalette.accent + '20',
                                    color: localPalette.accent
                                }}
                            >
                                Accent Badge
                            </span>
                        </div>
                    </div>

                    {/* Typography Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Type className="w-4 h-4 text-primary" />
                            Typography
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Heading Font</Label>
                                <Select
                                    value={localFonts.heading}
                                    onValueChange={(value: FontFamily) => setLocalFonts(prev => ({ ...prev, heading: value }))}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((font) => (
                                            <SelectItem key={font.value} value={font.value}>
                                                <span style={{ fontFamily: getFontFamily(font.value) }}>{font.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    Headlines and section titles
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Body Font</Label>
                                <Select
                                    value={localFonts.body}
                                    onValueChange={(value: FontFamily) => setLocalFonts(prev => ({ ...prev, body: value }))}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FONT_OPTIONS.map((font) => (
                                            <SelectItem key={font.value} value={font.value}>
                                                <span style={{ fontFamily: getFontFamily(font.value) }}>{font.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    Paragraphs and descriptions
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Color Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Palette className="w-4 h-4 text-primary" />
                            Colors
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {(Object.keys(COLOR_LABELS) as (keyof ColorPalette)[]).map((key) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-xs font-medium">
                                        {COLOR_LABELS[key].label}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={localPalette[key]}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                                        />
                                        <Input
                                            value={localPalette[key]}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="h-10 font-mono text-xs"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {COLOR_LABELS[key].description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyCSS}>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy CSS
                        </Button>
                    </div>
                    <Button onClick={handleSave}>
                        <Check className="w-4 h-4 mr-2" />
                        Apply Style
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
