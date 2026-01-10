import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LandingPageData, INITIAL_ARCHITECT_DATA } from '@/types/architect';

// Global color palette for Landing Pad
export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
}

export const DEFAULT_PALETTE: ColorPalette = {
    primary: '#4FD1FF',
    secondary: '#6366F1',
    accent: '#10B981',
    background: '#030308',
    text: '#FFFFFF',
    muted: '#71717A'
};

// Light mode palette
export const LIGHT_PALETTE: ColorPalette = {
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#10B981',
    background: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280'
};

// Landing page theme settings
export type ThemeMode = 'light' | 'dark';
export type FontFamily = 'inter' | 'outfit' | 'clash' | 'playfair' | 'roboto';

export interface ThemeSettings {
    mode: ThemeMode;
    fontHeading: FontFamily;
    fontBody: FontFamily;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
    mode: 'light',
    fontHeading: 'clash',
    fontBody: 'outfit'
};

export const FONT_OPTIONS: { value: FontFamily; label: string; preview: string }[] = [
    { value: 'inter', label: 'Inter', preview: 'font-sans' },
    { value: 'outfit', label: 'Outfit', preview: 'font-sans' },
    { value: 'clash', label: 'Clash Display', preview: 'font-display' },
    { value: 'playfair', label: 'Playfair Display', preview: 'font-serif' },
    { value: 'roboto', label: 'Roboto', preview: 'font-sans' },
];

// Brand setup data from Smart Setup
export interface BrandSetup {
    avatarName: string;
    productName: string;
    productPrice: string;
    productDescription: string;
    logoUrl?: string;
    logoFile?: string; // Base64 encoded
    paletteSource: 'default' | 'logo' | 'ai' | 'custom';
}

interface ArchitectState {
    data: LandingPageData;
    colorPalette: ColorPalette;
    brandSetup: BrandSetup | null;
    themeSettings: ThemeSettings;
    setData: (updates: Partial<LandingPageData> | ((prev: LandingPageData) => Partial<LandingPageData>)) => void;
    updateSection: <K extends keyof LandingPageData>(section: K, updates: Partial<LandingPageData[K]>) => void;
    setColorPalette: (palette: Partial<ColorPalette>) => void;
    setBrandSetup: (setup: Partial<BrandSetup>) => void;
    setThemeSettings: (settings: Partial<ThemeSettings>) => void;
    reset: () => void;
}

export const useArchitectStore = create<ArchitectState>()(
    persist(
        (set) => ({
            data: INITIAL_ARCHITECT_DATA,
            colorPalette: DEFAULT_PALETTE,
            brandSetup: null,
            themeSettings: DEFAULT_THEME_SETTINGS,
            setData: (updates) => set((state) => ({
                data: typeof updates === 'function' ? { ...state.data, ...updates(state.data) } : { ...state.data, ...updates }
            })),
            updateSection: (section, updates) => set((state) => ({
                data: {
                    ...state.data,
                    [section]: { ...state.data[section], ...updates }
                }
            })),
            setColorPalette: (palette) => set((state) => ({
                colorPalette: { ...state.colorPalette, ...palette }
            })),
            setBrandSetup: (setup) => set((state) => ({
                brandSetup: state.brandSetup
                    ? { ...state.brandSetup, ...setup }
                    : {
                        avatarName: '',
                        productName: '',
                        productPrice: '',
                        productDescription: '',
                        paletteSource: 'default',
                        ...setup
                    }
            })),
            setThemeSettings: (settings) => set((state) => ({
                themeSettings: { ...state.themeSettings, ...settings }
            })),
            reset: () => set({
                data: INITIAL_ARCHITECT_DATA,
                colorPalette: DEFAULT_PALETTE,
                brandSetup: null,
                themeSettings: DEFAULT_THEME_SETTINGS
            })
        }),
        {
            name: 'architect-storage',
            partialize: (state) => ({
                data: state.data,
                colorPalette: state.colorPalette,
                brandSetup: state.brandSetup,
                themeSettings: state.themeSettings
            })
        }
    )
);
