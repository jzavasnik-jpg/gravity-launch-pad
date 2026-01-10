/**
 * ICP Question Index Constants
 * 
 * Maps human-readable keys to array indices in appState.gravityICP.answers[]
 * This prevents fragile array[0], array[1] access patterns throughout the codebase.
 * 
 * Based on /src/data/questions.ts
 */

export const ICP_QUESTION_INDICES = {
  /** Q1: What is your ideal client's deepest desire? */
  DEEPEST_DESIRE: 0,
  
  /** Q2: Who is your ideal customer? (Demographics, psychographics) */
  TARGET_AUDIENCE: 1,
  
  /** Q3: What does success look like for them? */
  SUCCESS_VISION: 2,
  
  /** Q4: How are they currently trying to solve this problem? */
  CURRENT_SOLUTIONS: 3,
  
  /** Q5: Why isn't their current solution working? */
  CURRENT_PROBLEM: 4,
  
  /** Q6: What would the ideal solution look like? */
  IDEAL_SOLUTION: 5,
  
  /** Q7: Core Desire Market selection (Money/Time/Experiences/Relationships) */
  CORE_DESIRE: 6,
  
  /** Q8: What decision have they made or are about to make? */
  DECISION_POINT: 7,
  
  /** Q9: What specific problem does your product/service solve? */
  SPECIFIC_PROBLEM: 8,
  
  /** Q10: Proprietary framework/tool name */
  FRAMEWORK_NAME: 9,
  
  /** Q11: Primary Six S emotion selection */
  PRIMARY_SIX_S: 10,
  
  /** Q12: Hesitations or objections */
  OBJECTIONS: 11,
  
  /** Q13: What would motivate them to take action? */
  MOTIVATION: 12,
  
  /** Q14: Specific result promise (faster/easier/more complete) */
  PROMISE: 13,
} as const;

export type ICPQuestionKey = keyof typeof ICP_QUESTION_INDICES;

/**
 * Helper function to safely get an ICP answer by key
 */
export const getICPAnswer = (
  answers: string[],
  key: ICPQuestionKey
): string => {
  const index = ICP_QUESTION_INDICES[key];
  return answers[index] || '';
};

/**
 * Get a truncated version of an ICP answer for display
 */
export const getICPAnswerTruncated = (
  answers: string[],
  key: ICPQuestionKey,
  maxLength: number = 100
): string => {
  const answer = getICPAnswer(answers, key);
  if (answer.length <= maxLength) return answer;
  return answer.substring(0, maxLength).trim() + '...';
};

/**
 * Check if an ICP answer exists and is non-empty
 */
export const hasICPAnswer = (
  answers: string[],
  key: ICPQuestionKey
): boolean => {
  const answer = getICPAnswer(answers, key);
  return answer.trim().length > 0;
};

/**
 * Labels for display purposes
 */
export const ICP_QUESTION_LABELS: Record<ICPQuestionKey, string> = {
  DEEPEST_DESIRE: 'Deepest Desire',
  TARGET_AUDIENCE: 'Target Audience',
  SUCCESS_VISION: 'Success Vision',
  CURRENT_SOLUTIONS: 'Current Solutions',
  CURRENT_PROBLEM: 'Current Problem',
  IDEAL_SOLUTION: 'Ideal Solution',
  CORE_DESIRE: 'Core Desire',
  DECISION_POINT: 'Decision Point',
  SPECIFIC_PROBLEM: 'Problem You Solve',
  FRAMEWORK_NAME: 'Your Framework',
  PRIMARY_SIX_S: 'Primary Emotion',
  OBJECTIONS: 'Objections',
  MOTIVATION: 'Motivation',
  PROMISE: 'Your Promise',
};
