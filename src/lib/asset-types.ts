// Product Asset Management Types
// TypeScript interfaces for the asset workflow system

export type AssetType = 'video' | 'image' | 'screenshot' | 'walkthrough' | 'animated_gif' | 'thumbnail' | 'landing_page';
export type AssetStatus = 'processing' | 'ready' | 'failed' | 'archived';
export type StorageProvider = 'backblaze_b2' | 'local' | 'supabase';
export type LinkType = 'demo' | 'screenshot' | 'walkthrough' | 'supplementary';
export type AudioType = 'recorded' | 'ai_generated' | 'uploaded';
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'none';
export type OutputFormat = 'gif' | 'mp4' | 'webm';
export type JobType = 'video_encode' | 'gif_generate' | 'thumbnail_create' | 'trim' | 'annotate';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Asset {
  id: string;
  user_uuid: string;
  session_id?: string;
  asset_type: AssetType;
  title: string;
  description?: string;
  storage_provider: StorageProvider;
  storage_path: string;
  storage_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  thumbnail_url?: string;
  status: AssetStatus;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentAssetLink {
  id: string;
  asset_id: string;
  avatar_seed_id?: string;
  validated_idea_id?: string;
  content_root_id?: string;
  link_type: LinkType;
  display_order: number;
  created_at: string;
}

export interface WalkthroughStep {
  screenshot_asset_id: string;
  caption: string;
  annotation?: {
    type: 'arrow' | 'circle' | 'text' | 'highlight';
    position: { x: number; y: number };
    size?: { width: number; height: number };
    text?: string;
    color?: string;
  }[];
  duration_ms: number;
}

export interface WalkthroughAsset {
  id: string;
  asset_id: string;
  user_uuid: string;
  title: string;
  steps: WalkthroughStep[];
  ai_storyboard: {
    suggested_flow?: string;
    recommended_captions?: string[];
    narrative_arc?: string;
  };
  transition_type: TransitionType;
  total_duration_seconds?: number;
  output_format: OutputFormat;
  created_at: string;
  updated_at: string;
}

export interface AssetVoiceover {
  id: string;
  asset_id: string;
  user_uuid: string;
  audio_type: AudioType;
  audio_storage_path: string;
  audio_url?: string;
  transcript?: string;
  voice_model?: string;
  voice_settings?: {
    voice_id?: string;
    speed?: number;
    pitch?: number;
    stability?: number;
  };
  duration_seconds?: number;
  created_at: string;
}

export interface AssetProcessingJob {
  id: string;
  asset_id: string;
  user_uuid: string;
  job_type: JobType;
  status: JobStatus;
  input_params: Record<string, any>;
  output_params: Record<string, any>;
  progress_percent: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Recording configuration
export interface RecordingConfig {
  maxDurationSeconds: number;
  audioEnabled: boolean;
  videoQuality?: 'low' | 'medium' | 'high';
  frameRate?: number;
}

// Upload configuration
export interface UploadConfig {
  maxFileSizeMB: number;
  acceptedFormats: string[];
  compressionEnabled: boolean;
}

// Backblaze B2 configuration
export interface B2Config {
  accountId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
  endpoint: string;
}

// Storage configuration
export interface StorageConfig {
  provider: StorageProvider;
  b2?: B2Config;
  uploadPath: string;
  cdnUrl?: string;
}

// Asset creation request
export interface CreateAssetRequest {
  title: string;
  session_id?: string;
  description?: string;
  asset_type: AssetType;
  file?: File | Blob;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Asset update request
export interface UpdateAssetRequest {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  status?: AssetStatus;
}

// Walkthrough creation request
export interface CreateWalkthroughRequest {
  title: string;
  screenshot_asset_ids: string[];
  captions?: string[];
  transition_type?: TransitionType;
  output_format?: OutputFormat;
  use_ai_storyboard?: boolean;
}

// Asset search/filter parameters
export interface AssetSearchParams {
  asset_type?: AssetType;
  status?: AssetStatus;
  tags?: string[];
  search_query?: string;
  linked_to_seed?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'file_size';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Asset with relationships
export interface AssetWithLinks extends Asset {
  content_links?: ContentAssetLink[];
  walkthrough_data?: WalkthroughAsset;
  voiceover?: AssetVoiceover;
  processing_jobs?: AssetProcessingJob[];
}

// Wizard step states
export type WizardStep = 'choose_method' | 'recording' | 'uploading' | 'editing' | 'preview' | 'complete';

export interface AssetWizardState {
  current_step: WizardStep;
  method?: 'record' | 'screenshots' | 'upload';
  asset_id?: string;
  recording_blob?: Blob;
  selected_screenshots?: string[];
  selected_files?: File[];
  upload_progress?: number;
}
