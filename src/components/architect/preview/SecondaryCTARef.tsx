import { useArchitectStore } from "@/store/architectStore";
import { Clock } from "lucide-react";
import { getFontFamily, getSectionColors, getButtonTextColor } from "./themeUtils";

export const SecondaryCTARef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { secondaryCTA, hero } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('cta', isLight, colorPalette);
    const ctaUrl = hero.ctaUrl; // Use same URL as hero CTA

    const hasContent = secondaryCTA.headline || secondaryCTA.subheadline;

    return (
        <div
            className="w-full py-20 px-8 relative overflow-hidden"
            style={{
                background: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundEnd})`,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody)
            }}
        >
            {/* Background glow effect */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse at center, ${colorPalette.primary}15 0%, transparent 70%)`
                }}
            />

            {hasContent ? (
                <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10 animate-in fade-in duration-700">
                    {/* Headline */}
                    <h2
                        className="text-3xl md:text-5xl font-bold tracking-tight leading-tight"
                        style={{
                            fontFamily: getFontFamily(themeSettings.fontHeading),
                            color: colors.text
                        }}
                    >
                        {secondaryCTA.headline || "Ready to Get Started?"}
                    </h2>

                    {/* Subheadline */}
                    {secondaryCTA.subheadline && (
                        <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
                            {secondaryCTA.subheadline}
                        </p>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                        <a
                            href={ctaUrl || "#"}
                            target={ctaUrl ? "_blank" : undefined}
                            rel={ctaUrl ? "noopener noreferrer" : undefined}
                            className="inline-block px-10 py-5 font-bold text-lg rounded-lg transition-all hover:scale-105"
                            style={{
                                background: `linear-gradient(to right, ${colorPalette.primary}, ${colorPalette.secondary})`,
                                color: getButtonTextColor(colorPalette.primary),
                                boxShadow: `0 0 40px -5px ${colorPalette.primary}80`
                            }}
                        >
                            {secondaryCTA.buttonText || "Get Access Now"}
                        </a>
                    </div>

                    {/* Urgency Text */}
                    {secondaryCTA.urgencyText && (
                        <div className="flex items-center justify-center gap-2 text-orange-400">
                            <Clock className="w-4 h-4" />
                            <p className="text-sm font-medium">
                                {secondaryCTA.urgencyText}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="max-w-3xl mx-auto opacity-30 border-2 border-dashed p-12 rounded-xl text-center relative z-10"
                    style={{ borderColor: colors.textMuted }}
                >
                    <p className="text-xl font-mono" style={{ color: colors.textMuted }}>
                        SECONDARY CTA SECTION
                    </p>
                    <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                        Add headline and button text to see preview
                    </p>
                </div>
            )}
        </div>
    );
};
