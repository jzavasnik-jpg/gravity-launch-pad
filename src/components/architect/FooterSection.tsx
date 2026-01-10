import { useState } from "react";
import { useArchitectStore } from "@/store/architectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Link, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

export const FooterSection = () => {
    const { data, updateSection } = useArchitectStore();

    const addLegalLink = () => {
        const newLink = {
            id: `link_${Date.now()}`,
            label: "",
            url: "",
        };
        updateSection('footer', {
            legalLinks: [...data.footer.legalLinks, newLink]
        });
    };

    const updateLegalLink = (id: string, updates: Partial<typeof data.footer.legalLinks[0]>) => {
        updateSection('footer', {
            legalLinks: data.footer.legalLinks.map(l =>
                l.id === id ? { ...l, ...updates } : l
            )
        });
    };

    const removeLegalLink = (id: string) => {
        updateSection('footer', {
            legalLinks: data.footer.legalLinks.filter(l => l.id !== id)
        });
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

            {/* Header */}
            <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Step 7: Footer
                </h3>
                <p className="text-sm text-muted-foreground">
                    Finish strong with your brand info and required legal links.
                </p>
            </div>

            {/* Company Name */}
            <div className="space-y-3">
                <Label htmlFor="companyName" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Company / Brand Name
                </Label>
                <Input
                    id="companyName"
                    placeholder="Your Company Name"
                    value={data.footer.companyName}
                    onChange={(e) => updateSection('footer', { companyName: e.target.value })}
                    className="font-semibold"
                />
            </div>

            {/* Tagline */}
            <div className="space-y-3">
                <Label htmlFor="tagline" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Tagline (Optional)
                </Label>
                <Input
                    id="tagline"
                    placeholder="Helping creators launch with confidence"
                    value={data.footer.tagline}
                    onChange={(e) => updateSection('footer', { tagline: e.target.value })}
                />
            </div>

            {/* Contact Email */}
            <div className="space-y-3">
                <Label htmlFor="contactEmail" className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Contact Email
                </Label>
                <Input
                    id="contactEmail"
                    type="email"
                    placeholder="support@yourcompany.com"
                    value={data.footer.contactEmail}
                    onChange={(e) => updateSection('footer', { contactEmail: e.target.value })}
                />
            </div>

            {/* Legal Links Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                        <Link className="w-3 h-3" />
                        Legal Links
                    </Label>
                    <Button variant="ghost" size="sm" onClick={addLegalLink}>
                        <Plus className="w-4 h-4 mr-1" /> Add Link
                    </Button>
                </div>

                {data.footer.legalLinks.length === 0 ? (
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <Link className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No legal links added yet</p>
                        <p className="text-xs text-muted-foreground/70">Privacy Policy & Terms are essential</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.footer.legalLinks.map((link) => (
                            <div key={link.id} className="flex items-center gap-2 p-3 bg-card border rounded-lg">
                                <Input
                                    placeholder="Label (e.g. Privacy Policy)"
                                    value={link.label}
                                    onChange={(e) => updateLegalLink(link.id, { label: e.target.value })}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="/privacy or full URL"
                                    value={link.url}
                                    onChange={(e) => updateLegalLink(link.id, { url: e.target.value })}
                                    className="flex-1 font-mono text-sm"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLegalLink(link.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Copyright */}
            <div className="space-y-3">
                <Label htmlFor="copyright" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Copyright Text
                </Label>
                <Input
                    id="copyright"
                    placeholder={`© ${new Date().getFullYear()} Your Company. All Rights Reserved.`}
                    value={data.footer.copyright}
                    onChange={(e) => updateSection('footer', { copyright: e.target.value })}
                    className="text-sm"
                />
            </div>

            {/* Tips Card */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Legal Requirements</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Privacy Policy</strong> - Required if you collect any data</li>
                    <li>• <strong>Terms of Service</strong> - Protects you legally</li>
                    <li>• <strong>Refund Policy</strong> - Set expectations upfront</li>
                    <li>• <strong>Earnings Disclaimer</strong> - If you show income claims</li>
                </ul>
            </div>

        </div>
    );
};
