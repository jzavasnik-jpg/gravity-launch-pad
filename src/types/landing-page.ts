export interface LandingPageFormData {
    // Step 1: Business Identity
    productName: string;
    logoUrl?: string;
    businessCategory: string;

    // Step 2: Target Audience
    idealCustomer: string;
    problemSolved: string;

    // Step 3: Value Proposition
    primaryHeadline: string;
    benefits: string[];
    pricePoint?: string;

    // Step 4: Social Proof
    testimonials: Testimonial[];
    clientLogos?: string[];
    metrics?: string[];

    // Step 5: CTA Config
    primaryCTAText: string;
    ctaActionType: 'email' | 'link' | 'demo' | 'scroll';
    ctaActionValue?: string;
    hasSecondaryCTA: boolean;
    secondaryCTAText?: string;
}

export interface Testimonial {
    quote: string;
    result?: string;
    authorName: string;
    authorTitle: string;
    authorPhoto?: string;
}

export interface ColorPalette {
    primary: string;      // Hex color
    secondary: string;
    accent: string;
    background: string;
    text: string;
    isFromLogo: boolean;
}

export interface GeneratedLandingPage {
    hero: HeroContent;
    problem: ProblemContent;
    valueStack: ValueStackContent;
    socialProof: SocialProofContent;
    transformation: TransformationContent;
    secondaryCTA: SecondaryCTAContent;
    footer: FooterContent;
}

export interface HeroContent {
    eyebrow: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    trustSignals: string[];
}

export interface ProblemContent {
    sectionHeader: string;
    problems: {
        statement: string;
        agitation: string;
    }[];
    personalTransition: string;
}

export interface ValueStackContent {
    tiers: {
        name: string;
        value: string;
        description: string;
    }[];
    totalValue: string;
    yourPrice: string;
}

export interface SocialProofContent {
    sectionHeader: string;
    testimonials: {
        quote: string;
        specificResult: string;
        name: string;
        title: string;
    }[];
}

export interface TransformationContent {
    quickWin: { title: string; description: string };
    compound: { title: string; description: string };
    advantage: { title: string; description: string };
    tenX: { title: string; description: string };
}

export interface SecondaryCTAContent {
    headline: string;
    buttonText: string;
    avatarCount: number;
}

export interface FooterContent {
    companyName: string;
    links: { label: string; href: string }[];
    socialLinks: { platform: string; url: string }[];
}

// Supabase table structure
export interface LandingPageRecord {
    id: string;
    user_id: string;
    name: string;
    form_data: LandingPageFormData;
    generated_content: GeneratedLandingPage;
    color_palette: ColorPalette;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    slug?: string;
}
