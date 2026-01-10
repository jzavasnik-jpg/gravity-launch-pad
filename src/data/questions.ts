export interface Question {
  id: number;
  text: string;
  suggestions?: string[];
  type?: "text" | "core-desire" | "six-s";
}

export const coreDesires = [
  {
    name: "Money",
    description: "Seek financial gain or security",
  },
  {
    name: "Time",
    description: "Seek freedom and efficiency",
  },
  {
    name: "Experiences",
    description: "Seek transformation or meaning",
  },
  {
    name: "Relationships",
    description: "Seek connection and belonging",
  },
];

export const sixSOptions = [
  {
    name: "Significance",
    description: "Recognition and personal value",
  },
  {
    name: "Safe",
    description: "Trust, reliability, confidence",
  },
  {
    name: "Supported",
    description: "Partnership, mentorship, care",
  },
  {
    name: "Successful",
    description: "Achievement and competence",
  },
  {
    name: "Surprise-and-delight",
    description: "Creativity and positive emotion",
  },
  {
    name: "Sharing",
    description: "Community, pride, virality",
  },
];

export const questions: Question[] = [
  {
    id: 0,
    text: "What is your ideal client's deepest desire? (The core tension they feel)",
    type: "text",
    suggestions: [
      "They want to feel confident in their decisions",
      "They desire freedom from overwhelming responsibilities",
      "They crave recognition for their unique talents",
      "They seek meaningful connections with like-minded people",
      "They want to achieve mastery in their field",
    ],
  },
  {
    id: 1,
    text: "Who is your ideal customer? (Demographics, psychographics, characteristics)",
    type: "text",
    suggestions: [
      "Professionals aged 30-45 seeking career advancement",
      "Creative entrepreneurs building their first business",
      "Parents balancing work and family life",
      "Technical experts wanting to share their knowledge",
      "Leaders managing growing teams",
    ],
  },
  {
    id: 2,
    text: "What does success look like for them? (Their ultimate destination and transformation)",
    type: "text",
    suggestions: [
      "Achieving work-life balance while growing their income",
      "Building a sustainable business that runs without them",
      "Becoming a recognized authority in their niche",
      "Creating meaningful impact in their community",
      "Gaining the confidence to pursue bigger opportunities",
    ],
  },
  {
    id: 3,
    text: "How are they currently trying to solve this problem? (What alternatives exist?)",
    type: "text",
    suggestions: [
      "Reading books and watching YouTube tutorials",
      "Hiring expensive consultants with mixed results",
      "Trial and error with no clear framework",
      "Following generic advice from social media",
      "Attending workshops but struggling with implementation",
    ],
  },
  {
    id: 4,
    text: "Why isn't their current solution working? (The 'before' state problem)",
    type: "text",
    suggestions: [
      "Too generic - doesn't address their specific situation",
      "Overwhelming - too much information without clear next steps",
      "Disconnected - lacks personalized guidance and support",
      "Time-consuming - requires too much trial and error",
      "Incomplete - missing key elements for real transformation",
    ],
  },
  {
    id: 5,
    text: "What would the ideal solution look like from their perspective?",
    type: "text",
    suggestions: [
      "A step-by-step system tailored to their exact needs",
      "Expert guidance with accountability and support",
      "Proven frameworks that deliver fast results",
      "A community of peers on the same journey",
      "Tools and templates that simplify implementation",
    ],
  },
  {
    id: 6,
    text: "Which of the Four Core Desire-markets does your ideal client's solution fall under?",
    type: "core-desire",
  },
  {
    id: 7,
    text: "What is the decision they've made (or are about to make)?",
    type: "text",
    suggestions: [
      "Committing to invest in themselves and their growth",
      "Deciding to stop struggling alone and seek expert help",
      "Choosing to prioritize this transformation now",
      "Recognizing they need a proven system, not more information",
      "Accepting that change requires guidance and accountability",
    ],
  },
  {
    id: 8,
    text: "What specific problem does your product or service solve for them?",
    type: "text",
    suggestions: [
      "Eliminates confusion with a clear, step-by-step roadmap",
      "Provides expert guidance without expensive consultants",
      "Delivers results in weeks instead of years",
      "Offers personalized support tailored to their situation",
      "Simplifies complex processes into actionable steps",
    ],
  },
  {
    id: 9,
    text: "What is the proprietary name for your unique framework, tool, or principle?",
    type: "text",
    suggestions: [
      "The [Your Name] Method",
      "The [Result] Blueprint",
      "The [Transformation] Framework",
      "The [Speed] System",
      "The [Unique Angle] Approach",
    ],
  },
  {
    id: 10,
    text: "Which of the Six 'S's is the PRIMARY emotion your solution will help them feel?",
    type: "six-s",
  },
  {
    id: 11,
    text: "What hesitations or objections might they have about your solution?",
    type: "text",
    suggestions: [
      "Not sure if it will work for their specific situation",
      "Concerned about the time commitment required",
      "Worried about the investment cost",
      "Skeptical after trying other solutions that failed",
      "Uncertain if they have the skills to implement it",
    ],
  },
  {
    id: 12,
    text: "What would motivate them to take action right now?",
    type: "text",
    suggestions: [
      "Limited-time opportunity they don't want to miss",
      "Seeing proof from others like them who succeeded",
      "Understanding the cost of waiting versus acting now",
      "Receiving a clear guarantee that reduces their risk",
      "Gaining immediate access to quick-win resources",
    ],
  },
  {
    id: 13,
    text: "What specific result do you promise that is faster, easier, or more complete than competitors?",
    type: "text",
    suggestions: [
      "Achieve [specific result] in [timeframe] without [common pain]",
      "Get [transformation] using our proven [unique method]",
      "Experience [benefit] with personalized [unique element]",
      "Master [skill] through our step-by-step [framework name]",
      "Unlock [outcome] with less effort and more support",
    ],
  },
];
