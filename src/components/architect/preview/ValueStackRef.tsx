import { useArchitectStore } from "@/store/architectStore";
import { Check } from "lucide-react";
import { getFontFamily, getSectionColors } from "./themeUtils";

export const ValueStackRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { items, yourPrice } = data.valueStack;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('value', isLight, colorPalette);

    // Default mock data for visualization if empty
    const displayItems = items.length > 0 ? items : [
        { id: "1", name: "The Core Program", value: 997 },
        { id: "2", name: "Bonus #1: The Templates", value: 197 },
        { id: "3", name: "Bonus #2: Community Access", value: 297 },
    ];

    const totalValue = displayItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const displayPrice = yourPrice || 497;

    return (
        <div
            className="w-full p-8 md:p-16 min-h-[600px] flex flex-col justify-center items-center"
            style={{
                background: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundEnd})`,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody)
            }}
        >
            <div
                className="max-w-md w-full shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500"
                style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`
                }}
            >
                {/* Header */}
                <div
                    className="p-6 text-center"
                    style={{
                        backgroundColor: colorPalette.primary,
                        color: '#ffffff'
                    }}
                >
                    <h3
                        className="text-2xl italic"
                        style={{ fontFamily: getFontFamily(themeSettings.fontHeading) }}
                    >
                        Here's What You Get
                    </h3>
                </div>

                {/* Stack */}
                <div className="p-0">
                    {displayItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-center p-4 transition-colors"
                            style={{
                                borderBottom: `1px solid ${colors.border}`,
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: colorPalette.accent }}
                                >
                                    <Check className="w-3 h-3 text-white stroke-[4]" />
                                </div>
                                <span
                                    className="font-semibold leading-tight"
                                    style={{ color: colors.text }}
                                >
                                    {item.name}
                                </span>
                            </div>
                            <span
                                className="font-mono font-bold line-through decoration-2"
                                style={{ color: colors.textMuted }}
                            >
                                ${Number(item.value).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div
                    className="p-6 space-y-4"
                    style={{ backgroundColor: isLight ? '#f1f5f9' : '#0a0a0f' }}
                >
                    <div className="flex justify-between items-center" style={{ color: colors.textMuted }}>
                        <span className="uppercase tracking-widest text-xs font-bold">Total Value</span>
                        <span className="font-mono text-lg line-through decoration-2">
                            ${totalValue.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span
                            className="uppercase tracking-widest text-xs font-bold"
                            style={{ color: colors.text }}
                        >
                            Today's Price
                        </span>
                        <div className="flex flex-col items-end">
                            <span
                                className="font-bold text-4xl tracking-tighter"
                                style={{ color: colorPalette.accent }}
                            >
                                ${displayPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className="p-4 text-center"
                    style={{
                        backgroundColor: '#fff9c4',
                        borderTop: '1px solid #fde68a'
                    }}
                >
                    <p className="text-sm font-bold text-yellow-800">
                        LIMITED TIME OFFER
                    </p>
                </div>
            </div>
        </div>
    );
};
