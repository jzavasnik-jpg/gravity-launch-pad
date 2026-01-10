/**
 * Psychological Triggers Database
 * Patterns for emotional hooks mapped to Gravity Six S framework
 */

export interface PsychologicalTrigger {
  id: string;
  name: string;
  description: string;
  mechanism: string;
  gravitySixS: string[]; // Maps to Six S emotional framework
  exampleApplications: string[];
  strengthLevel: number; // 1-10 scale
  ethicalConsiderations: string;
}

export const psychologicalTriggers: PsychologicalTrigger[] = [
  {
    id: "fomo",
    name: "FOMO (Fear of Missing Out)",
    description: "Anxiety that others are having rewarding experiences from which one is absent",
    mechanism: "Triggers scarcity mindset and urgency to avoid loss or exclusion",
    gravitySixS: ["Significance", "Sharing"],
    exampleApplications: [
      "Limited time offer ending in 24 hours",
      "Only 3 spots left for this cohort",
      "Everyone in your industry is already doing this",
      "Join 10,000+ creators who've already transformed their content",
      "This strategy won't work once everyone knows about it"
    ],
    strengthLevel: 9,
    ethicalConsiderations: "Use real scarcity; avoid false urgency that manipulates"
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "People conform to actions of others, assuming those actions reflect correct behavior",
    mechanism: "Reduces uncertainty by showing what similar people have done",
    gravitySixS: ["Safe", "Sharing"],
    exampleApplications: [
      "See what 50,000 marketers are saying",
      "Trusted by companies like Google, Apple, and Amazon",
      "4.9★ from 2,847 verified customers",
      "As seen in Forbes, TechCrunch, and Wired",
      "Join the movement: 1M+ downloads"
    ],
    strengthLevel: 9,
    ethicalConsiderations: "Use real testimonials and verifiable proof"
  },
  {
    id: "validation",
    name: "Validation Seeking",
    description: "Deep desire to feel seen, understood, and affirmed",
    mechanism: "Addresses fundamental human need for recognition and acceptance",
    gravitySixS: ["Significance", "Supported"],
    exampleApplications: [
      "You're not crazy for thinking this way",
      "If you've felt this, you're exactly who this is for",
      "Your instinct about this was right all along",
      "It's not your fault the old methods didn't work",
      "You deserve to be recognized for your hard work"
    ],
    strengthLevel: 8,
    ethicalConsiderations: "Validate real struggles; don't manipulate insecurities"
  },
  {
    id: "authority",
    name: "Authority Bias",
    description: "Tendency to attribute greater accuracy to the opinion of an authority figure",
    mechanism: "Leverages expertise, credentials, or status to build trust",
    gravitySixS: ["Safe", "Successful"],
    exampleApplications: [
      "Stanford research shows this approach increases conversion by 340%",
      "After 10 years consulting Fortune 500 companies...",
      "Award-winning framework used by top performers",
      "PhD-backed methodology proven in 20+ clinical trials",
      "Industry veteran reveals insider secrets"
    ],
    strengthLevel: 8,
    ethicalConsiderations: "Represent credentials accurately; cite real research"
  },
  {
    id: "reciprocity",
    name: "Reciprocity",
    description: "Obligation to give back when someone gives to us",
    mechanism: "Creates psychological debt that motivates return action",
    gravitySixS: ["Supported", "Sharing"],
    exampleApplications: [
      "Free template that took me 100 hours to create",
      "I'm giving away my exact $10K framework for free",
      "Here's everything I learned from spending $50K testing this",
      "Download my complete playbook (no email required)",
      "Take this gift - consider it my way of helping you win"
    ],
    strengthLevel: 7,
    ethicalConsiderations: "Give genuine value; don't manipulate with fake generosity"
  },
  {
    id: "pattern-recognition",
    name: "Pattern Recognition",
    description: "Brain's tendency to identify patterns and complete familiar sequences",
    mechanism: "Leverages mental shortcuts and familiar structures for engagement",
    gravitySixS: ["Successful", "Surprise-and-delight"],
    exampleApplications: [
      "The 3-step formula every successful creator uses",
      "Here's the pattern I noticed in every viral post",
      "Once you see this pattern, you can't unsee it",
      "All top performers follow this exact sequence",
      "The hidden structure behind every winning campaign"
    ],
    strengthLevel: 7,
    ethicalConsiderations: "Identify real patterns; avoid false correlations"
  },
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Discomfort experienced when there's a gap between what we know and what we want to know",
    mechanism: "Creates information void that compels action to resolve",
    gravitySixS: ["Significance", "Surprise-and-delight"],
    exampleApplications: [
      "The one thing nobody tells you about viral content (until now)",
      "I discovered something that changes everything. Here's what...",
      "What happened next shocked even me",
      "There's a reason top creators don't share this publicly",
      "The missing piece that finally made it all click"
    ],
    strengthLevel: 8,
    ethicalConsiderations: "Deliver on the promise; don't use clickbait that disappoints"
  },
  {
    id: "loss-aversion",
    name: "Loss Aversion",
    description: "Pain of losing is psychologically twice as powerful as pleasure of gaining",
    mechanism: "Frames message around avoiding loss rather than achieving gain",
    gravitySixS: ["Safe", "Significance"],
    exampleApplications: [
      "Stop losing customers to this simple mistake",
      "What you're leaving on the table by not doing this",
      "The cost of waiting is higher than you think",
      "Avoid the $100K mistake I made so you don't have to",
      "Don't let your competitors take your market share"
    ],
    strengthLevel: 9,
    ethicalConsiderations: "Highlight real risks; don't manufacture fear"
  },
  {
    id: "identity-reinforcement",
    name: "Identity Reinforcement",
    description: "Actions that align with and strengthen self-concept",
    mechanism: "Connects behavior to personal identity and values",
    gravitySixS: ["Significance", "Sharing"],
    exampleApplications: [
      "For creators who refuse to compromise on quality",
      "This is for people who actually do the work",
      "Built for entrepreneurs who think differently",
      "If you're serious about your craft, this matters",
      "Join others who prioritize impact over vanity metrics"
    ],
    strengthLevel: 8,
    ethicalConsiderations: "Affirm positive identities; don't shame alternatives"
  },
  {
    id: "commitment-consistency",
    name: "Commitment & Consistency",
    description: "Desire to be consistent with previous commitments and beliefs",
    mechanism: "Small commitments lead to larger aligned actions",
    gravitySixS: ["Successful", "Safe"],
    exampleApplications: [
      "If you've made it this far, you're ready for the next step",
      "You've already invested time learning this - now apply it",
      "Since you believe in X, this is the logical next move",
      "You said you wanted to grow - here's how to prove it",
      "Complete what you started - here's the final piece"
    ],
    strengthLevel: 7,
    ethicalConsiderations: "Guide toward positive commitments; don't trap or manipulate"
  },
  {
    id: "tribe-belonging",
    name: "Tribe & Belonging",
    description: "Fundamental need to be part of an in-group and share identity",
    mechanism: "Creates sense of community and shared purpose",
    gravitySixS: ["Sharing", "Supported"],
    exampleApplications: [
      "Welcome to the community of creators who actually ship",
      "Join 50K+ entrepreneurs building in public",
      "Finally, a place where people get what you're trying to do",
      "This is your tribe - people who understand the journey",
      "You're not alone in feeling this way"
    ],
    strengthLevel: 8,
    ethicalConsiderations: "Build inclusive communities; avoid creating harmful us-vs-them dynamics"
  },
  {
    id: "progress-momentum",
    name: "Progress & Momentum",
    description: "Motivation from seeing incremental progress toward goals",
    mechanism: "Visual or measurable advancement creates positive reinforcement loop",
    gravitySixS: ["Successful", "Supported"],
    exampleApplications: [
      "You're 3 steps away from complete transformation",
      "Track your growth: Day 1 vs Day 30 comparison",
      "Level up your content game with each post",
      "See your improvement in real-time",
      "Small wins compound into massive results"
    ],
    strengthLevel: 7,
    ethicalConsiderations: "Celebrate real progress; set achievable milestones"
  }
];

export const psychologicalTriggerDatabase = {
  triggers: psychologicalTriggers,
  
  getTriggersByGravitySixS: (sixS: string): PsychologicalTrigger[] => {
    return psychologicalTriggers.filter(trigger =>
      trigger.gravitySixS.includes(sixS)
    ).sort((a, b) => b.strengthLevel - a.strengthLevel);
  },
  
  getStrongestTriggers: (limit: number = 5): PsychologicalTrigger[] => {
    return [...psychologicalTriggers]
      .sort((a, b) => b.strengthLevel - a.strengthLevel)
      .slice(0, limit);
  },
  
  getTriggerById: (id: string): PsychologicalTrigger | undefined => {
    return psychologicalTriggers.find(trigger => trigger.id === id);
  },
  
  recommendTriggersForConcept: (
    platform: string,
    gravitySixS: string,
    contentGoal: 'awareness' | 'engagement' | 'conversion'
  ): PsychologicalTrigger[] => {
    const relevantTriggers = psychologicalTriggers.filter(trigger =>
      trigger.gravitySixS.includes(gravitySixS)
    );
    
    // Different goals prioritize different triggers
    const goalPriority = {
      awareness: ['curiosity-gap', 'pattern-recognition', 'tribe-belonging'],
      engagement: ['validation', 'identity-reinforcement', 'social-proof'],
      conversion: ['fomo', 'loss-aversion', 'authority']
    };
    
    const priorityTriggerIds = goalPriority[contentGoal];
    
    return relevantTriggers
      .sort((a, b) => {
        const aHasPriority = priorityTriggerIds.includes(a.id) ? 1 : 0;
        const bHasPriority = priorityTriggerIds.includes(b.id) ? 1 : 0;
        
        if (aHasPriority !== bHasPriority) {
          return bHasPriority - aHasPriority;
        }
        
        return b.strengthLevel - a.strengthLevel;
      })
      .slice(0, 3);
  }
};
