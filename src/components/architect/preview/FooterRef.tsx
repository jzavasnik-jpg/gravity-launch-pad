import { useArchitectStore } from "@/store/architectStore";
import { Mail } from "lucide-react";
import { getFontFamily, getSectionColors } from "./themeUtils";

export const FooterRef = () => {
    const { data, themeSettings, colorPalette } = useArchitectStore();
    const { footer } = data;
    const isLight = themeSettings.mode === 'light';
    const colors = getSectionColors('footer', isLight, colorPalette);

    const hasContent = footer.companyName || footer.tagline || footer.contactEmail;

    return (
        <div
            className="w-full py-12 px-8"
            style={{
                background: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundEnd})`,
                color: colors.text,
                fontFamily: getFontFamily(themeSettings.fontBody),
                borderTop: `1px solid ${colors.border}`
            }}
        >
            {hasContent ? (
                <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <h3
                                className="text-xl font-bold"
                                style={{
                                    fontFamily: getFontFamily(themeSettings.fontHeading),
                                    color: colors.text
                                }}
                            >
                                {footer.companyName || "Your Company"}
                            </h3>
                            {footer.tagline && (
                                <p className="text-sm" style={{ color: colors.textMuted }}>
                                    {footer.tagline}
                                </p>
                            )}
                        </div>

                        {/* Legal Links Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                Legal
                            </h4>
                            <ul className="space-y-2">
                                {footer.legalLinks.length > 0 ? (
                                    footer.legalLinks.map((link) => (
                                        <li key={link.id}>
                                            <a
                                                href={link.url || "#"}
                                                className="text-sm transition-colors"
                                                style={{ color: colors.textMuted }}
                                            >
                                                {link.label || "Untitled Link"}
                                            </a>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li className="text-sm" style={{ color: colors.textMuted }}>Privacy Policy</li>
                                        <li className="text-sm" style={{ color: colors.textMuted }}>Terms of Service</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                Contact
                            </h4>
                            {footer.contactEmail ? (
                                <a
                                    href={`mailto:${footer.contactEmail}`}
                                    className="flex items-center gap-2 text-sm transition-colors"
                                    style={{ color: colors.textMuted }}
                                >
                                    <Mail className="w-4 h-4" />
                                    {footer.contactEmail}
                                </a>
                            ) : (
                                <p className="text-sm" style={{ color: colors.textMuted }}>
                                    support@example.com
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Copyright Bar */}
                    <div
                        className="pt-8 text-center"
                        style={{ borderTop: `1px solid ${colors.border}` }}
                    >
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                            {footer.copyright || `© ${new Date().getFullYear()} All Rights Reserved`}
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    className="max-w-3xl mx-auto opacity-30 border-2 border-dashed p-8 rounded-xl text-center"
                    style={{ borderColor: colors.textMuted }}
                >
                    <p className="text-lg font-mono" style={{ color: colors.textMuted }}>
                        FOOTER SECTION
                    </p>
                    <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                        Add company info to see preview
                    </p>
                </div>
            )}
        </div>
    );
};
