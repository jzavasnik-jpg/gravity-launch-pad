import { useArchitectStore } from "@/store/architectStore";
import { Star, Quote } from "lucide-react";
import { getFontFamily, getSectionColors } from "./themeUtils";

export const SocialProofRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { socialProof } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('social', isLight, colorPalette);

    const hasContent = socialProof.testimonials.length > 0 ||
        socialProof.metrics.length > 0 ||
        socialProof.generatedCopy.headline;

    return (
        <div
            className="w-full py-16 px-8"
            style={{
                background: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundEnd})`,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody)
            }}
        >
            {hasContent ? (
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
                    {/* Section Header */}
                    {socialProof.generatedCopy.headline && (
                        <div className="text-center space-y-3">
                            <h2
                                className="text-3xl md:text-4xl font-bold tracking-tight"
                                style={{
                                    fontFamily: getFontFamily(themeSettings.fontHeading),
                                    color: colors.text
                                }}
                            >
                                {socialProof.generatedCopy.headline}
                            </h2>
                            {socialProof.generatedCopy.subheadline && (
                                <p className="text-lg" style={{ color: colors.textMuted }}>
                                    {socialProof.generatedCopy.subheadline}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Metrics Row */}
                    {socialProof.metrics.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            {socialProof.metrics.map((metric) => (
                                <div key={metric.id} className="space-y-1">
                                    <p
                                        className="text-3xl md:text-4xl font-bold"
                                        style={{ color: colorPalette.primary }}
                                    >
                                        {metric.value}
                                    </p>
                                    <p
                                        className="text-sm uppercase tracking-wider"
                                        style={{ color: colors.textMuted }}
                                    >
                                        {metric.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Testimonials Grid */}
                    {socialProof.testimonials.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {socialProof.testimonials.map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="rounded-xl p-6 space-y-4 transition-colors"
                                    style={{
                                        backgroundColor: colors.cardBg,
                                        border: `1px solid ${colors.border}`,
                                    }}
                                >
                                    {/* Stars */}
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <div className="relative">
                                        <Quote className="w-6 h-6 absolute -top-1 -left-1" style={{ color: `${colorPalette.primary}50` }} />
                                        <p className="leading-relaxed pl-4 italic" style={{ color: colors.textMuted }}>
                                            "{testimonial.quote || "Testimonial quote..."}"
                                        </p>
                                    </div>

                                    {/* Author */}
                                    <div
                                        className="flex items-center gap-3 pt-2 border-t"
                                        style={{ borderColor: colors.border }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                            style={{ background: `linear-gradient(to bottom right, ${colorPalette.primary}, ${colorPalette.secondary})` }}
                                        >
                                            {testimonial.name ? testimonial.name.charAt(0).toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <p className="font-semibold" style={{ color: colors.text }}>
                                                {testimonial.name || "Customer Name"}
                                            </p>
                                            {testimonial.role && (
                                                <p className="text-xs" style={{ color: colors.textMuted }}>
                                                    {testimonial.role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Logo Row */}
                    {socialProof.logos && socialProof.logos.length > 0 && (
                        <div
                            className="flex items-center justify-center gap-12 opacity-50 pt-8 border-t"
                            style={{ borderColor: colors.border }}
                        >
                            {socialProof.logos.map((logo, idx) => (
                                <img key={idx} src={logo} alt="Company logo" className="h-8 grayscale hover:grayscale-0 transition-all" />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="max-w-3xl mx-auto opacity-30 border-2 border-dashed p-12 rounded-xl text-center"
                    style={{ borderColor: colors.textMuted }}
                >
                    <Star className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
                    <p className="text-xl font-mono" style={{ color: colors.textMuted }}>
                        SOCIAL PROOF SECTION
                    </p>
                    <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                        Add testimonials and metrics to see preview
                    </p>
                </div>
            )}
        </div>
    );
};
