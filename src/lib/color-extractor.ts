import ColorThief from 'colorthief';

export interface ExtractedColor {
    hex: string;
    rgb: [number, number, number];
    name?: string;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
}

/**
 * Convert RGB array to hex string
 */
export function rgbToHex(rgb: [number, number, number]): string {
    return '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Convert hex to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
}

/**
 * Calculate relative luminance for contrast calculations
 */
function getLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get contrast ratio between two colors
 */
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
    const rgb = hexToRgb(hex);
    const luminance = getLuminance(rgb);
    return luminance > 0.5;
}

/**
 * Extract colors from an image using ColorThief
 */
export async function extractColorsFromImage(imageSource: string | HTMLImageElement): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
        const colorThief = new ColorThief();

        const processImage = (img: HTMLImageElement) => {
            try {
                // Get dominant color
                const dominantRgb = colorThief.getColor(img) as [number, number, number];

                // Get palette of 6 colors
                const palette = colorThief.getPalette(img, 6) as [number, number, number][];

                const colors: ExtractedColor[] = [
                    { hex: rgbToHex(dominantRgb), rgb: dominantRgb, name: 'Dominant' },
                    ...palette.map((rgb, i) => ({
                        hex: rgbToHex(rgb),
                        rgb,
                        name: `Color ${i + 1}`
                    }))
                ];

                resolve(colors);
            } catch (error) {
                reject(error);
            }
        };

        if (typeof imageSource === 'string') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => processImage(img);
            img.onerror = () => reject(new Error('Failed to load image'));

            img.src = imageSource;
        } else {
            if (imageSource.complete) {
                processImage(imageSource);
            } else {
                imageSource.onload = () => processImage(imageSource);
                imageSource.onerror = () => reject(new Error('Failed to load image'));
            }
        }
    });
}

/**
 * Extract colors from a File object (uploaded image)
 */
export async function extractColorsFromFile(file: File): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                const colors = await extractColorsFromImage(dataUrl);
                resolve(colors);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Build a complete color palette from extracted colors
 * Intelligently picks primary, secondary, accent based on contrast and harmony
 */
export function buildPaletteFromColors(extractedColors: ExtractedColor[]): ColorPalette {
    if (extractedColors.length === 0) {
        // Default fallback palette
        return {
            primary: '#4FD1FF',
            secondary: '#6366F1',
            accent: '#10B981',
            background: '#030308',
            text: '#FFFFFF',
            muted: '#71717A'
        };
    }

    // Sort by vibrancy (saturation * lightness balance)
    const sortedColors = [...extractedColors].sort((a, b) => {
        const getVibrancy = (rgb: [number, number, number]) => {
            const max = Math.max(...rgb);
            const min = Math.min(...rgb);
            const saturation = max === 0 ? 0 : (max - min) / max;
            const lightness = (max + min) / 2 / 255;
            // Prefer colors that are vibrant but not too light or dark
            return saturation * (1 - Math.abs(0.5 - lightness) * 2);
        };
        return getVibrancy(b.rgb) - getVibrancy(a.rgb);
    });

    const primary = sortedColors[0]?.hex || '#4FD1FF';
    const secondary = sortedColors[1]?.hex || sortedColors[0]?.hex || '#6366F1';

    // Find a good accent color (different from primary/secondary)
    const accent = sortedColors.find((c, i) => {
        if (i < 2) return false;
        const contrastWithPrimary = getContrastRatio(c.rgb, hexToRgb(primary));
        return contrastWithPrimary > 1.5;
    })?.hex || '#10B981';

    // Determine background based on primary color lightness
    const primaryIsLight = isLightColor(primary);
    const background = primaryIsLight ? '#FFFFFF' : '#030308';
    const text = primaryIsLight ? '#18181B' : '#FFFFFF';
    const muted = primaryIsLight ? '#71717A' : '#A1A1AA';

    return {
        primary,
        secondary,
        accent,
        background,
        text,
        muted
    };
}

/**
 * Generate AI prompt for color palette based on product info
 */
export function generateColorPromptContext(
    productName: string,
    productDescription: string,
    avatarName: string,
    tone?: string
): string {
    return `Product: "${productName}"
Description: ${productDescription || 'Not provided'}
Target Audience: ${avatarName}
Tone/Vibe: ${tone || 'Professional and trustworthy'}

Based on this product and audience, suggest a color palette that:
1. Evokes the right emotional response
2. Feels professional and high-converting
3. Has good contrast for readability
4. Matches the brand personality`;
}
