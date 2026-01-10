import { LandingPageFormData, GeneratedLandingPage } from '@/types/landing-page';

// Use a fallback key or environment variable if available
// Note: In a real app, this should be proxied through a backend to hide the key
// For this demo/prototype, we'll assume the key is available in the environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function generateLandingPageContent(
    formData: LandingPageFormData
): Promise<GeneratedLandingPage> {
    if (!GEMINI_API_KEY) {
        console.warn('Missing VITE_GEMINI_API_KEY');
        // Return mock data if no key is present (for testing/demo purposes)
        return getMockContent(formData);
    }

    const prompt = buildLandingPagePrompt(formData);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response format');
        }

        const text = data.candidates[0].content.parts[0].text;

        // Parse JSON from response (handle potential markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse AI response: No JSON found');

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Generation failed:', error);
        // Fallback to mock data on error for resilience
        return getMockContent(formData);
    }
}

function buildLandingPagePrompt(data: LandingPageFormData): string {
    return `
You are a conversion copywriter creating landing page content.

PRODUCT: ${data.productName}
CATEGORY: ${data.businessCategory}
IDEAL CUSTOMER: ${data.idealCustomer}
PROBLEM SOLVED: ${data.problemSolved}
KEY BENEFITS: ${data.benefits.join(', ')}
PRICE: ${data.pricePoint || 'Not specified'}
TESTIMONIALS: ${JSON.stringify(data.testimonials)}

Generate compelling landing page content following this structure.
Return ONLY valid JSON with no markdown formatting:

{
  "hero": {
    "eyebrow": "Short trust phrase (e.g. Trusted by 500+ companies)",
    "headline": "Powerful value proposition headline (under 10 words)",
    "subheadline": "Supporting text that expands on headline (2 sentences max)",
    "ctaText": "${data.primaryCTAText}",
    "trustSignals": ["Featured in TechCrunch", "5-Star Rated", "24/7 Support"]
  },
  "problem": {
    "sectionHeader": "Sound familiar?",
    "problems": [
      {"statement": "Short problem statement 1", "agitation": "Why this hurts/costs money"},
      {"statement": "Short problem statement 2", "agitation": "Why this hurts/costs money"},
      {"statement": "Short problem statement 3", "agitation": "Why this hurts/costs money"}
    ],
    "personalTransition": "I've been exactly where you are, and that's why we built ${data.productName}."
  },
  "valueStack": {
    "tiers": [
      {"name": "Core Platform", "value": "$997", "description": "Full access to all features"},
      {"name": "Premium Support", "value": "$497", "description": "24/7 priority assistance"},
      {"name": "Onboarding Call", "value": "$297", "description": "1-on-1 setup session"},
      {"name": "Resource Library", "value": "$197", "description": "Templates and guides"}
    ],
    "totalValue": "$1,988",
    "yourPrice": "${data.pricePoint || 'Contact for pricing'}"
  },
  "socialProof": {
    "sectionHeader": "What Our Clients Say",
    "testimonials": [
      {"quote": "Best investment we made this year.", "specificResult": "2x Revenue", "name": "John Smith", "title": "CEO, TechCo"},
      {"quote": "Incredible time saver.", "specificResult": "Saved 20hrs/week", "name": "Sarah Jones", "title": "Marketing Director"},
      {"quote": "Support is outstanding.", "specificResult": "Instant ROI", "name": "Mike Brown", "title": "Founder"}
    ]
  },
  "transformation": {
    "quickWin": {"title": "Week 1", "description": "Setup and first results"},
    "compound": {"title": "Month 1", "description": "Building momentum and habits"},
    "advantage": {"title": "Month 3", "description": "Significant competitive advantage"},
    "tenX": {"title": "Year 1", "description": "Transformational business outcome"}
  },
  "secondaryCTA": {
    "headline": "Ready to transform your business?",
    "buttonText": "${data.primaryCTAText}",
    "avatarCount": 5
  },
  "footer": {
    "companyName": "${data.productName}",
    "links": [
      {"label": "About", "href": "#"},
      {"label": "Contact", "href": "#"},
      {"label": "Privacy", "href": "#"},
      {"label": "Terms", "href": "#"}
    ],
    "socialLinks": []
  }
}
`;
}

function getMockContent(data: LandingPageFormData): GeneratedLandingPage {
    return {
        hero: {
            eyebrow: "Trusted by industry leaders",
            headline: data.primaryHeadline || `Transform your ${data.businessCategory} business today`,
            subheadline: `The all-in-one solution for ${data.idealCustomer} to solve ${data.problemSolved.substring(0, 50)}...`,
            ctaText: data.primaryCTAText,
            trustSignals: ["Verified Partner", "Secure Platform", "Top Rated"]
        },
        problem: {
            sectionHeader: "Is this happening to you?",
            problems: [
                { statement: "Wasting time on manual tasks", agitation: "Hours lost every week that could be spent growing." },
                { statement: "Inconsistent results", agitation: "Never knowing if you'll hit your targets next month." },
                { statement: "Complex tools", agitation: "Software that requires a PhD to understand." }
            ],
            personalTransition: `We built ${data.productName} because we were tired of facing these exact same challenges.`
        },
        valueStack: {
            tiers: [
                { name: "The Core System", value: "$2,000", description: "Complete access to the platform" },
                { name: "Implementation Guide", value: "$500", description: "Step-by-step setup instructions" },
                { name: "Community Access", value: "$300", description: "Network with other experts" },
                { name: "Weekly Coaching", value: "$1,000", description: "Live Q&A sessions" }
            ],
            totalValue: "$3,800",
            yourPrice: data.pricePoint || "Start Free"
        },
        socialProof: {
            sectionHeader: "Don't just take our word for it",
            testimonials: data.testimonials.length > 0 ? data.testimonials : [
                { quote: "This changed everything for us.", specificResult: "30% Growth", name: "Alex Chen", title: "Director" },
                { quote: "Simple yet powerful.", specificResult: "Saved 10h/week", name: "Sam Wilson", title: "Manager" },
                { quote: "Highly recommended.", specificResult: "5x ROI", name: "Jordan Lee", title: "Founder" }
            ]
        },
        transformation: {
            quickWin: { title: "Immediate Clarity", description: "See your data in a whole new way instantly." },
            compound: { title: "Consistent Growth", description: "Stack small wins for big results over time." },
            advantage: { title: "Market Leadership", description: "Outpace your competitors with better tools." },
            tenX: { title: "Total Freedom", description: "Automate the work and focus on strategy." }
        },
        secondaryCTA: {
            headline: "Ready to get started?",
            buttonText: data.primaryCTAText,
            avatarCount: 5
        },
        footer: {
            companyName: data.productName,
            links: [
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Login", href: "#" }
            ],
            socialLinks: []
        }
    };
}
