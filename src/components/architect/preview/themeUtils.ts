import { FontFamily, ColorPalette, ThemeSettings } from "@/store/architectStore";

// Helper to get font family CSS
export const getFontFamily = (font: FontFamily): string => {
    switch (font) {
        case 'clash': return 'Clash Display, sans-serif';
        case 'playfair': return 'Playfair Display, serif';
        case 'inter': return 'Inter, sans-serif';
        case 'roboto': return 'Roboto, sans-serif';
        case 'outfit': return 'Outfit, sans-serif';
        default: return 'Outfit, sans-serif';
    }
};

// Section background colors for seamless transitions
// Light mode: alternates between white and very light gray
// Dark mode: alternates between near-black shades
export type SectionPosition = 'hero' | 'problem' | 'social' | 'transformation' | 'value' | 'cta' | 'footer';

interface SectionColors {
    background: string;
    backgroundEnd?: string; // For gradients
    text: string;
    textMuted: string;
    cardBg: string;
    border: string;
}

export const getSectionColors = (
    position: SectionPosition,
    isLight: boolean,
    colorPalette: ColorPalette
): SectionColors => {
    // Define the color flow for seamless transitions
    // Light mode backgrounds: white -> gray-50 -> white -> gray-50 -> white -> gray-100 -> gray-200
    // Dark mode backgrounds: #030308 -> #0a0a0f -> #0d0d12 -> #0a0a0f -> #0d0d12 -> #080810 -> #050508

    const lightBgs = {
        hero: { bg: '#ffffff', end: '#f9fafb' },
        problem: { bg: '#f9fafb', end: '#f9fafb' },
        social: { bg: '#f9fafb', end: '#ffffff' },
        transformation: { bg: '#ffffff', end: '#ffffff' },
        value: { bg: '#ffffff', end: '#f3f4f6' },
        cta: { bg: '#f3f4f6', end: '#e5e7eb' },
        footer: { bg: '#e5e7eb', end: '#e5e7eb' }
    };

    const darkBgs = {
        hero: { bg: '#030308', end: '#0a0a0f' },
        problem: { bg: '#0a0a0f', end: '#0a0a0f' },
        social: { bg: '#0a0a0f', end: '#0d0d12' },
        transformation: { bg: '#0d0d12', end: '#0d0d12' },
        value: { bg: '#0d0d12', end: '#0a0a0f' },
        cta: { bg: '#0a0a0f', end: '#080810' },
        footer: { bg: '#080810', end: '#050508' }
    };

    const bgs = isLight ? lightBgs : darkBgs;
    const sectionBg = bgs[position];

    return {
        background: sectionBg.bg,
        backgroundEnd: sectionBg.end,
        text: isLight ? '#1f2937' : '#f9fafb',
        textMuted: isLight ? '#6b7280' : '#9ca3af',
        cardBg: isLight ? '#ffffff' : '#18181b',
        border: isLight ? '#e5e7eb' : '#27272a'
    };
};

// Helper to determine if a color is light or dark for contrast
export const isColorLight = (hex: string): boolean => {
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
};

// Get contrasting text color for buttons
export const getButtonTextColor = (primaryColor: string): string => {
    return isColorLight(primaryColor) ? '#000000' : '#ffffff';
};
