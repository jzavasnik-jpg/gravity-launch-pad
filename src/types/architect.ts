export interface ArchitectSection {
    id: string;
    label: string;
    status: 'pending' | 'editing' | 'done';
    path: string;
}

export type LandingPageData = {
    hero: {
        eyebrow: string;
        headline: string;
        subheadline: string;
        ctaPrimary: string;
        ctaUrl: string;
        trustLogos: string[];
        generatedCopy: {
            eyebrow: string;
            headline: string;
            subheadline: string;
        };
    };
    problemAgitate: {
        painPoint: string;
        consequence: string;
        generatedCopy: {
            headline: string;
            body: string; // HTML allowed
        };
    };
    socialProof: {
        testimonials: {
            id: string;
            name: string;
            role: string;
            quote: string;
            avatar?: string;
        }[];
        metrics: {
            id: string;
            value: string;
            label: string;
        }[];
        logos: string[];
        generatedCopy: {
            headline: string;
            subheadline: string;
        };
    };
    transformation: {
        beforeState: string;
        afterState: string;
        timeline: string;
        generatedCopy: {
            headline: string;
            beforeList: string[];
            afterList: string[];
            bridgeText: string;
        };
    };
    valueStack: {
        items: {
            id: string;
            name: string;
            value: number;
        }[];
        yourPrice: number;
    };
    secondaryCTA: {
        headline: string;
        subheadline: string;
        buttonText: string;
        urgencyText: string;
        generatedCopy: {
            headline: string;
            subheadline: string;
            urgencyText: string;
        };
    };
    footer: {
        companyName: string;
        tagline: string;
        legalLinks: {
            id: string;
            label: string;
            url: string;
        }[];
        contactEmail: string;
        copyright: string;
    };
};

export const INITIAL_ARCHITECT_DATA: LandingPageData = {
    hero: {
        eyebrow: "Attention [Avatar Name]",
        headline: "The Big Promise That Solves The Problem",
        subheadline: "Without the thing they hate...",
        ctaPrimary: "Get Started",
        ctaUrl: "",
        trustLogos: [],
        generatedCopy: {
            eyebrow: "",
            headline: "",
            subheadline: "",
        },
    },
    problemAgitate: {
        painPoint: "",
        consequence: "",
        generatedCopy: {
            headline: "",
            body: "",
        },
    },
    socialProof: {
        testimonials: [],
        metrics: [],
        logos: [],
        generatedCopy: {
            headline: "",
            subheadline: "",
        },
    },
    transformation: {
        beforeState: "",
        afterState: "",
        timeline: "",
        generatedCopy: {
            headline: "",
            beforeList: [],
            afterList: [],
            bridgeText: "",
        },
    },
    valueStack: {
        items: [],
        yourPrice: 0,
    },
    secondaryCTA: {
        headline: "",
        subheadline: "",
        buttonText: "Get Access Now",
        urgencyText: "",
        generatedCopy: {
            headline: "",
            subheadline: "",
            urgencyText: "",
        },
    },
    footer: {
        companyName: "",
        tagline: "",
        legalLinks: [
            { id: "privacy", label: "Privacy Policy", url: "/privacy" },
            { id: "terms", label: "Terms of Service", url: "/terms" },
        ],
        contactEmail: "",
        copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
    },
};
