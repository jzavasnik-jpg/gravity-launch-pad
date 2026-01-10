/**
 * Content Pipeline Types
 * Type definitions for the modular content generation pipeline
 */

// Avatar Seed - foundational ICP data
export interface AvatarSeed {
  id: string;
  user_uuid: string;
  session_id?: string;
  answers: string[];
  core_desire?: string;
  six_s?: string;
  avatar_name?: string;
  avatar_description?: string;
  emotional_mapping: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Validated Idea - market research results
export interface ValidatedIdea {
  id: string;
  avatar_seed_id: string;
  hooks: Hook[];
  angles: Angle[];
  psychological_triggers: string[];
  gravity_research: GravityResearch;
  external_research: ExternalResearch;
  emotional_mapping: Record<string, unknown>;
  trending_patterns: TrendingPattern[];
  validation_status: 'pending' | 'validated' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Hook structure
export interface Hook {
  id: string;
  text: string;
  framework: string;
  emotional_trigger: string;
  score: number;
  reasoning: string;
}

// Angle structure
export interface Angle {
  id: string;
  description: string;
  target_audience: string;
  unique_perspective: string;
  score: number;
}

// Gravity research data
export interface GravityResearch {
  frameworks_recommended: string[];
  triggers_recommended: string[];
  six_s_alignment: Record<string, number>;
  core_desire_alignment: Record<string, number>;
}

// External research data
export interface ExternalResearch {
  perplexity?: PerplexityData;
  reddit?: RedditData;
  youtube?: YouTubeData;
}

export interface PerplexityData {
  trending_topics: string[];
  search_volume: Record<string, number>;
  sentiment: string;
}

export interface RedditData {
  trending_posts: RedditPost[];
  subreddit_recommendations: string[];
  engagement_patterns: Record<string, unknown>;
}

export interface RedditPost {
  title: string;
  upvotes: number;
  comments: number;
  subreddit: string;
  url: string;
}

export interface YouTubeData {
  top_videos: YouTubeVideo[];
  trending_topics: string[];
  average_engagement: Record<string, number>;
}

export interface YouTubeVideo {
  title: string;
  views: number;
  likes: number;
  channel: string;
  url: string;
}

// Trending pattern
export interface TrendingPattern {
  pattern_type: string;
  confidence: number;
  evidence: string[];
}

// Content Root - initial native-format content
export interface ContentRoot {
  id: string;
  validated_idea_id: string;
  avatar_seed_id: string;
  root_platform: string;
  title?: string;
  hook: string;
  body: string;
  cta?: string;
  selected_framework?: string;
  selected_hook_id?: string;
  selected_pattern?: string;
  content_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Content Upcycle - platform-specific optimized content
export interface ContentUpcycle {
  id: string;
  content_root_id: string;
  avatar_seed_id: string;
  target_platform: string;
  title?: string;
  hook: string;
  body: string;
  cta?: string;
  hashtags: string[];
  character_limit?: number;
  length_limit?: number;
  platform_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Pipeline request/response types
export interface ValidatePipelineRequest {
  avatar_seed_id: string;
  use_external_agents?: boolean;
  external_agents?: ('perplexity' | 'reddit' | 'youtube')[];
}

export interface ValidatePipelineResponse {
  validated_idea: ValidatedIdea;
  recommendations: {
    top_hooks: Hook[];
    top_angles: Angle[];
    suggested_framework: string;
    suggested_triggers: string[];
  };
}

export interface GeneratePipelineRequest {
  validated_idea_id: string;
  root_platform: 'twitter' | 'tiktok' | 'linkedin' | 'instagram' | 'youtube' | 'facebook';
  selected_hook_id?: string;
  selected_framework?: string;
  selected_pattern?: string;
  custom_instructions?: string;
}

export interface GeneratePipelineResponse {
  content_root: ContentRoot;
  preview: {
    estimated_reach: string;
    estimated_engagement: string;
    viral_score: number;
  };
}

export interface UpcyclePipelineRequest {
  content_root_id: string;
  target_platforms: string[];
}

export interface UpcyclePipelineResponse {
  content_upcycles: ContentUpcycle[];
  summary: {
    total_platforms: number;
    estimated_total_reach: string;
  };
}

// Agent interface for modular architecture
export interface ContentAgent {
  name: string;
  type: 'gravity' | 'external';
  validate: (seed: AvatarSeed) => Promise<Partial<ValidatedIdea>>;
  generate?: (validated: ValidatedIdea, platform: string) => Promise<Partial<ContentRoot>>;
}

// Platform configuration
export interface PlatformConfig {
  name: string;
  character_limit?: number;
  length_limit?: number; // seconds for video
  supports_hashtags: boolean;
  supports_media: boolean;
  optimal_hook_length: number;
  optimal_cta: string[];
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'Twitter/X',
    character_limit: 280,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 50,
    optimal_cta: ['Reply with your thoughts', 'Retweet if you agree', 'Follow for more']
  },
  tiktok: {
    name: 'TikTok',
    length_limit: 60,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 30,
    optimal_cta: ['Comment below', 'Follow for part 2', 'Save this']
  },
  linkedin: {
    name: 'LinkedIn',
    character_limit: 3000,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 100,
    optimal_cta: ['What are your thoughts?', 'Connect with me', 'Share if helpful']
  },
  instagram: {
    name: 'Instagram Reels',
    length_limit: 90,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 30,
    optimal_cta: ['Double tap if you agree', 'Save for later', 'Share with a friend']
  },
  youtube: {
    name: 'YouTube Shorts',
    length_limit: 60,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 30,
    optimal_cta: ['Subscribe for more', 'Comment your experience', 'Watch the full video']
  },
  facebook: {
    name: 'Facebook',
    character_limit: 63206,
    supports_hashtags: true,
    supports_media: true,
    optimal_hook_length: 80,
    optimal_cta: ['Share with your network', 'React and comment', 'Learn more']
  }
};
