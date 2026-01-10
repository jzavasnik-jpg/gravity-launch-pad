import { useArchitectStore } from "@/store/architectStore";
import { getFontFamily, getSectionColors } from "./themeUtils";

export const ProblemRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { problemAgitate } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('problem', isLight, colorPalette);

    return (
        <div
            className="w-full p-8 md:p-16 min-h-[400px] flex flex-col justify-center items-center text-center"
            style={{
                backgroundColor: colors.background,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody)
            }}
        >
            {problemAgitate.generatedCopy.headline ? (
                <div className="max-w-2xl space-y-6 animate-in fade-in duration-700">
                    <h2
                        className="text-3xl md:text-5xl font-bold leading-tight tracking-tight"
                        style={{
                            color: '#ef4444',
                            fontFamily: getFontFamily(themeSettings.fontHeading)
                        }}
                    >
                        {problemAgitate.generatedCopy.headline}
                    </h2>
                    <div
                        className="text-lg md:text-xl leading-relaxed space-y-4"
                        style={{ color: colors.textMuted }}
                        dangerouslySetInnerHTML={{ __html: problemAgitate.generatedCopy.body }}
                    />
                </div>
            ) : (
                <div
                    className="opacity-30 border-2 border-dashed p-12 rounded-xl"
                    style={{ borderColor: colors.textMuted }}
                >
                    <p className="text-xl font-mono" style={{ color: colors.textMuted }}>
                        WAITING FOR AGITATION...
                    </p>
                    {problemAgitate.painPoint && (
                        <p className="mt-4 text-sm text-red-400">
                            Targeting: "{problemAgitate.painPoint}"
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
