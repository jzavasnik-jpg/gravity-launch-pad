import { useArchitectStore } from "@/store/architectStore";
import { ArrowRight, Check, X } from "lucide-react";
import { getFontFamily, getSectionColors } from "./themeUtils";

export const TransformationRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { transformation } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('transformation', isLight, colorPalette);

    const hasContent = transformation.generatedCopy.headline ||
        transformation.beforeState ||
        transformation.afterState;

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
                    {/* Section Headline */}
                    {transformation.generatedCopy.headline && (
                        <div className="text-center">
                            <h2
                                className="text-3xl md:text-5xl font-bold tracking-tight"
                                style={{
                                    fontFamily: getFontFamily(themeSettings.fontHeading),
                                    color: colors.text
                                }}
                            >
                                {transformation.generatedCopy.headline}
                            </h2>
                        </div>
                    )}

                    {/* Before/After Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        {/* Arrow connector (desktop) */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                <ArrowRight className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* BEFORE Card */}
                        <div
                            className="border border-orange-500/30 rounded-2xl p-8 space-y-6"
                            style={{ backgroundColor: colors.cardBg }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <X className="w-5 h-5 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold text-orange-400 uppercase tracking-wider">
                                    Before
                                </h3>
                            </div>

                            {transformation.generatedCopy.beforeList && transformation.generatedCopy.beforeList.length > 0 ? (
                                <ul className="space-y-3">
                                    {transformation.generatedCopy.beforeList.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3" style={{ color: colors.textMuted }}>
                                            <X className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : transformation.beforeState ? (
                                <p className="leading-relaxed whitespace-pre-line" style={{ color: colors.textMuted }}>
                                    {transformation.beforeState}
                                </p>
                            ) : (
                                <p className="italic" style={{ color: colors.textMuted }}>Describe the before state...</p>
                            )}
                        </div>

                        {/* AFTER Card */}
                        <div
                            className="border border-emerald-500/30 rounded-2xl p-8 space-y-6"
                            style={{ backgroundColor: colors.cardBg }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wider">
                                    After
                                </h3>
                            </div>

                            {transformation.generatedCopy.afterList && transformation.generatedCopy.afterList.length > 0 ? (
                                <ul className="space-y-3">
                                    {transformation.generatedCopy.afterList.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3" style={{ color: colors.text }}>
                                            <Check className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : transformation.afterState ? (
                                <p className="leading-relaxed whitespace-pre-line" style={{ color: colors.text }}>
                                    {transformation.afterState}
                                </p>
                            ) : (
                                <p className="italic" style={{ color: colors.textMuted }}>Describe the after state...</p>
                            )}
                        </div>
                    </div>

                    {/* Bridge Text */}
                    {transformation.generatedCopy.bridgeText && (
                        <div className="text-center">
                            <p className="text-lg md:text-xl italic max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
                                "{transformation.generatedCopy.bridgeText}"
                            </p>
                        </div>
                    )}

                    {/* Timeline Badge */}
                    {transformation.timeline && (
                        <div className="flex justify-center">
                            <div
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
                                style={{
                                    backgroundColor: `${colorPalette.primary}15`,
                                    border: `1px solid ${colorPalette.primary}50`
                                }}
                            >
                                <span className="font-bold" style={{ color: colorPalette.primary }}>
                                    {transformation.timeline}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="max-w-3xl mx-auto opacity-30 border-2 border-dashed p-12 rounded-xl text-center"
                    style={{ borderColor: colors.textMuted }}
                >
                    <ArrowRight className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
                    <p className="text-xl font-mono" style={{ color: colors.textMuted }}>
                        TRANSFORMATION SECTION
                    </p>
                    <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                        Describe the before & after to see preview
                    </p>
                </div>
            )}
        </div>
    );
};
