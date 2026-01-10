import { useArchitectStore } from "@/store/architectStore";
import { getFontFamily, getSectionColors, getButtonTextColor } from "./themeUtils";

export const HeroRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { hero } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('hero', isLight, colorPalette);

    const hasContent = hero.headline || hero.eyebrow || hero.subheadline;

    return (
        <div
            className="w-full min-h-[500px] flex flex-col justify-center items-center text-center px-8 py-16"
            style={{
                background: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundEnd})`,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody)
            }}
        >
            {hasContent ? (
                <div className="max-w-3xl space-y-6 animate-in fade-in duration-700">
                    {/* Eyebrow */}
                    {hero.eyebrow && (
                        <p
                            className="text-sm md:text-base uppercase tracking-[0.2em] font-medium"
                            style={{ color: colorPalette.primary }}
                        >
                            {hero.eyebrow}
                        </p>
                    )}

                    {/* Headline */}
                    <h1
                        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
                        style={{
                            fontFamily: getFontFamily(themeSettings.fontHeading),
                            color: colors.text
                        }}
                    >
                        {hero.headline || "Your Headline Here"}
                    </h1>

                    {/* Subheadline */}
                    {hero.subheadline && (
                        <p
                            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                            style={{ color: colors.textMuted }}
                        >
                            {hero.subheadline}
                        </p>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                        <a
                            href={hero.ctaUrl || "#"}
                            target={hero.ctaUrl ? "_blank" : undefined}
                            rel={hero.ctaUrl ? "noopener noreferrer" : undefined}
                            className="inline-block px-8 py-4 font-bold text-lg rounded-lg transition-all hover:scale-105"
                            style={{
                                background: `linear-gradient(to right, ${colorPalette.primary}, ${colorPalette.secondary})`,
                                color: getButtonTextColor(colorPalette.primary),
                                boxShadow: `0 0 30px -5px ${colorPalette.primary}80`
                            }}
                        >
                            {hero.ctaPrimary || "Get Started"}
                        </a>
                    </div>

                    {/* Trust Badges Placeholder */}
                    {hero.trustLogos && hero.trustLogos.length > 0 && (
                        <div className="pt-8 flex items-center justify-center gap-8 opacity-50">
                            {hero.trustLogos.map((logo, idx) => (
                                <img key={idx} src={logo} alt="Trust badge" className="h-8 grayscale" />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="opacity-30 border-2 border-dashed p-16 rounded-xl"
                    style={{ borderColor: colors.textMuted }}
                >
                    <p className="text-2xl font-mono" style={{ color: colors.textMuted }}>
                        HERO SECTION
                    </p>
                    <p className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                        Edit on the right panel to see live preview
                    </p>
                </div>
            )}
        </div>
    );
};
