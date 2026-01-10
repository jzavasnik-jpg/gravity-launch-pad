import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Smart capitalization that preserves proper nouns and capitalizes sentences correctly
export function smartCapitalize(text: string): string {
  // Common proper nouns that should stay capitalized
  const properNouns: Record<string, string> = {
    'saas': 'SaaS',
    'micro saas': 'Micro SaaS',
    'chatgpt': 'ChatGPT',
    'mailchimp': 'MailChimp',
    'ai': 'AI',
    'api': 'API',
    'apis': 'APIs',
    'seo': 'SEO',
    'roi': 'ROI',
    'ui': 'UI',
    'ux': 'UX',
    'b2b': 'B2B',
    'b2c': 'B2C',
    'crm': 'CRM',
    'cms': 'CMS',
    'sdk': 'SDK',
    'mvp': 'MVP',
    'kpi': 'KPI',
    'kpis': 'KPIs',
  };
  
  let result = text;
  
  // Replace proper nouns (case-insensitive)
  for (const [wrong, correct] of Object.entries(properNouns)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    result = result.replace(regex, correct);
  }
  
  // Capitalize first letter of sentences (after period, start of string)
  result = result.replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  
  return result;
}
