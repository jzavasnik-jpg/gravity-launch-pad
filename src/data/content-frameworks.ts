/**
 * Scroll-Stopping Content Frameworks
 * Pattern hooks and frameworks for creating viral short-form content
 */

export interface PatternHook {
  id: string;
  name: string;
  description: string;
  exampleHooks: string[];
  emotionMapping: string[];
  bestForPlatforms: string[];
  viralPotential: number; // 1-10 scale
}

export const patternHooks: PatternHook[] = [
  {
    id: "contradiction",
    name: "Contradiction",
    description: "Present something that defies common beliefs or expectations",
    exampleHooks: [
      "I made $1M by doing the opposite of what every guru says...",
      "Why successful people actually fail more than everyone else",
      "The #1 productivity tip? Do less, not more",
      "Stop working hard if you want to succeed faster"
    ],
    emotionMapping: ["Surprise-and-delight", "Significance"],
    bestForPlatforms: ["TikTok", "Instagram Reels", "Twitter/X"],
    viralPotential: 9
  },
  {
    id: "pov",
    name: "POV (Point of View)",
    description: "Capture a relatable moment or perspective your audience experiences",
    exampleHooks: [
      "POV: You just realized your 9-5 is training you to stay poor",
      "POV: When you finally understand why your content isn't converting",
      "POV: Your competitor just figured out what took you 3 years",
      "POV: The moment you realize your offer isn't the problem"
    ],
    emotionMapping: ["Sharing", "Supported"],
    bestForPlatforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    viralPotential: 8
  },
  {
    id: "real-numbers",
    name: "Real Numbers",
    description: "Lead with specific, surprising data points or results",
    exampleHooks: [
      "I tested 47 hooks. Only 3 went viral. Here's why...",
      "$0 to $100K in 90 days using this exact framework",
      "473 people bought in 48 hours. Here's the strategy...",
      "I analyzed 1,000 viral posts. Found these 5 patterns..."
    ],
    emotionMapping: ["Significance", "Successful"],
    bestForPlatforms: ["LinkedIn", "Twitter/X", "YouTube Shorts"],
    viralPotential: 9
  },
  {
    id: "micro-tutorial",
    name: "Micro Tutorial",
    description: "Promise quick, actionable teaching in bite-sized format",
    exampleHooks: [
      "3 ChatGPT prompts that 10x your content in 5 minutes",
      "The 60-second framework for writing hooks that convert",
      "Copy this exact DM sequence. It closes 40% of prospects",
      "5 questions to ask before creating any piece of content"
    ],
    emotionMapping: ["Successful", "Supported"],
    bestForPlatforms: ["TikTok", "Instagram Reels", "LinkedIn"],
    viralPotential: 8
  },
  {
    id: "pattern-interrupt",
    name: "Pattern Interrupt",
    description: "Break the scroll with unexpected visual or verbal disruption",
    exampleHooks: [
      "Stop scrolling. This will change everything.",
      "If you see this, you're already too late... (unless you...)",
      "Delete your content calendar. Here's why:",
      "Everyone's doing it wrong. Even you. Especially you."
    ],
    emotionMapping: ["Surprise-and-delight", "Significance"],
    bestForPlatforms: ["TikTok", "Instagram Reels", "Twitter/X"],
    viralPotential: 7
  },
  {
    id: "before-after",
    name: "Before-After",
    description: "Show transformation or contrast to trigger aspiration",
    exampleHooks: [
      "Me before discovering this framework vs. after",
      "Day 1 of building in public vs. Day 365",
      "How my client page looked before vs. the $50K version",
      "What I thought mattered vs. what actually drove results"
    ],
    emotionMapping: ["Successful", "Significance"],
    bestForPlatforms: ["Instagram Reels", "TikTok", "LinkedIn"],
    viralPotential: 8
  },
  {
    id: "secret-reveal",
    name: "Secret Reveal",
    description: "Promise insider knowledge or hidden information",
    exampleHooks: [
      "What nobody tells you about going viral (but should)",
      "The algorithm secret that influencers gatekeep",
      "Behind the scenes: How I actually built my 6-figure funnel",
      "What top creators do off-camera that changes everything"
    ],
    emotionMapping: ["Significance", "Safe"],
    bestForPlatforms: ["YouTube Shorts", "TikTok", "Twitter/X"],
    viralPotential: 9
  },
  {
    id: "mistake-confessional",
    name: "Mistake Confessional",
    description: "Admit failure or mistake to build trust and relatability",
    exampleHooks: [
      "I wasted $10K on this mistake so you don't have to",
      "The truth about my first launch (and why it failed)",
      "Things I'd never do again after 5 years in business",
      "My biggest marketing mistake cost me 6 months"
    ],
    emotionMapping: ["Safe", "Supported"],
    bestForPlatforms: ["LinkedIn", "Twitter/X", "Instagram Reels"],
    viralPotential: 7
  },
  {
    id: "list-format",
    name: "List Format",
    description: "Structure content as scannable, digestible list",
    exampleHooks: [
      "7 signs your content strategy is already failing",
      "5 things I wish I knew before my first viral post",
      "10 books that changed how I think about marketing",
      "3 rules for content that actually converts"
    ],
    emotionMapping: ["Successful", "Supported"],
    bestForPlatforms: ["LinkedIn", "Twitter/X", "Instagram Reels"],
    viralPotential: 7
  },
  {
    id: "urgent-warning",
    name: "Urgent Warning",
    description: "Create urgency through fear of missing out or loss",
    exampleHooks: [
      "If you're not doing this by 2024, you're already behind",
      "This platform update will kill your reach in 30 days",
      "Your competitors are using this. You're not. Here's why that matters.",
      "Stop what you're doing. This changes everything for creators."
    ],
    emotionMapping: ["Safe", "Significance"],
    bestForPlatforms: ["TikTok", "Twitter/X", "LinkedIn"],
    viralPotential: 8
  }
];

export const contentFrameworks = {
  hooks: patternHooks,
  
  getFrameworksByPlatform: (platform: string): PatternHook[] => {
    return patternHooks.filter(hook => 
      hook.bestForPlatforms.includes(platform)
    ).sort((a, b) => b.viralPotential - a.viralPotential);
  },
  
  getFrameworksByEmotion: (emotion: string): PatternHook[] => {
    return patternHooks.filter(hook => 
      hook.emotionMapping.includes(emotion)
    ).sort((a, b) => b.viralPotential - a.viralPotential);
  },
  
  getTopFrameworks: (limit: number = 5): PatternHook[] => {
    return [...patternHooks]
      .sort((a, b) => b.viralPotential - a.viralPotential)
      .slice(0, limit);
  }
};
