/**
 * Kling API Integration for Image-to-Video Generation
 *
 * Kling AI is an image-to-video generation service that creates short video clips
 * from static images. This module provides the integration layer for the Director's Cut
 * storyboard pipeline.
 *
 * API Documentation: https://docs.klingai.com/
 *
 * Flow:
 * 1. generateImagePrompt() - Create an AI prompt for the image based on scene script
 * 2. generateImage() - Generate a still image from the prompt (uses Gemini/Flux)
 * 3. generateVideo() - Convert the image to video using Kling AI
 */

import { Scene } from '@/store/projectStore';

// Kling API calls are proxied through /api/video/kling

export interface KlingVideoRequest {
  image_url: string;
  prompt?: string;
  duration?: 3 | 5; // Kling supports 3s or 5s videos
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  cfg_scale?: number; // 0-10, controls creativity vs faithfulness
}

export interface KlingVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
  progress?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  style: 'cinematic' | 'bold' | 'minimal' | 'documentary';
  aspect_ratio: '9:16' | '16:9' | '1:1';
}

export interface ImageGenerationResponse {
  url: string;
  revised_prompt?: string;
}

// Visual style modifiers for image generation
const STYLE_MODIFIERS: Record<string, string> = {
  cinematic: 'cinematic lighting, dramatic shadows, film grain, letterbox framing, professional cinematography, moody atmosphere, high contrast',
  bold: 'vibrant colors, high saturation, bold contrast, attention-grabbing, dynamic composition, punchy visuals, energetic',
  minimal: 'clean composition, lots of negative space, simple, elegant, soft lighting, muted colors, understated',
  documentary: 'natural lighting, authentic feel, realistic, candid, photojournalistic style, genuine moment captured'
};

/**
 * Generate an image prompt from scene script and visual style
 */
export function generateImagePrompt(scene: Scene, visualStyle: string): string {
  const styleModifier = STYLE_MODIFIERS[visualStyle] || STYLE_MODIFIERS.cinematic;

  // If scene has a custom imagePrompt, use it as base
  const basePrompt = scene.imagePrompt || scene.script;

  // Scene label specific additions
  const labelContext: Record<string, string> = {
    'HOOK': 'attention-grabbing opening shot, intriguing, curiosity-inducing',
    'PAIN': 'emotional tension, relatable struggle, empathetic mood',
    'SOLUTION': 'hopeful, transformative moment, breakthrough feeling',
    'CTA': 'compelling call to action, urgency, decisive moment',
    'TRANSITION': 'smooth visual bridge, connecting narrative flow'
  };

  const labelAddition = labelContext[scene.label] || '';

  // Combine into final prompt
  return `${basePrompt}. Visual style: ${styleModifier}. ${labelAddition}. Vertical 9:16 aspect ratio, mobile-first composition.`;
}

/**
 * Generate an image using AI (Gemini via proxy)
 * Returns a URL to the generated image
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch('/api/ai/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        generateImage: true,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Image generation failed: ${error.error}`);
    }

    const data = await response.json();

    // Extract image from Gemini response
    const candidates = data.candidates;
    if (candidates?.[0]?.content?.parts) {
      const imagePart = candidates[0].content.parts.find((p: any) => p.inlineData);
      if (imagePart?.inlineData) {
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        const base64Data = imagePart.inlineData.data;
        return {
          url: `data:${mimeType};base64,${base64Data}`,
          revised_prompt: request.prompt
        };
      }
    }

    throw new Error('No image data in response');
  } catch (error) {
    console.error('Image generation error:', error);

    // Development fallback
    console.warn('Using placeholder image for development');
    return {
      url: `https://picsum.photos/seed/${Date.now()}/540/960`,
      revised_prompt: request.prompt
    };
  }
}

/**
 * Generate a video from an image using Kling AI via proxy
 * This is an async operation - returns task ID for polling
 */
export async function initiateVideoGeneration(request: KlingVideoRequest): Promise<string> {
  try {
    const response = await fetch('/api/video/kling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: request.image_url,
        prompt: request.prompt || '',
        duration: request.duration || 5,
        aspect_ratio: request.aspect_ratio || '9:16',
        cfg_scale: request.cfg_scale || 5
      })
    });

    if (!response.ok) {
      const error = await response.json();
      // Return mock task ID for development if API not configured
      if (error.error?.includes('not configured')) {
        console.warn('Kling API key not configured, using placeholder');
        return `mock_task_${Date.now()}`;
      }
      throw new Error(error.error || 'Failed to initiate video generation');
    }

    const data = await response.json();
    return data.task_id || data.id;
  } catch (error) {
    console.error('Kling API error:', error);
    throw error;
  }
}

/**
 * Poll for video generation status
 */
export async function checkVideoStatus(taskId: string): Promise<KlingVideoResponse> {
  // Handle mock task IDs for development
  if (taskId.startsWith('mock_task_')) {
    // Simulate async completion after random delay
    const elapsed = Date.now() - parseInt(taskId.split('_')[2]);
    if (elapsed < 3000) {
      return { id: taskId, status: 'processing', progress: Math.min(90, elapsed / 33) };
    }
    return {
      id: taskId,
      status: 'completed',
      video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      progress: 100
    };
  }

  try {
    const response = await fetch(`/api/video/kling?task_id=${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check video status');
    }

    const data = await response.json();
    return {
      id: taskId,
      status: data.status,
      video_url: data.video_url,
      error: data.error,
      progress: data.progress
    };
  } catch (error) {
    console.error('Kling status check error:', error);
    throw error;
  }
}

/**
 * Complete video generation with polling
 * Polls for status until completion or failure
 */
export async function generateVideo(
  request: KlingVideoRequest,
  onProgress?: (progress: number) => void
): Promise<string> {
  const taskId = await initiateVideoGeneration(request);

  // Poll for completion
  const maxAttempts = 60; // 5 minutes max (polling every 5 seconds)
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const status = await checkVideoStatus(taskId);

    if (status.progress && onProgress) {
      onProgress(status.progress);
    }

    if (status.status === 'completed' && status.video_url) {
      return status.video_url;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Video generation failed');
    }

    attempts++;
  }

  throw new Error('Video generation timed out');
}

/**
 * High-level function to generate image and video for a scene
 */
export async function generateSceneMedia(
  scene: Scene,
  visualStyle: string,
  onImageProgress?: () => void,
  onVideoProgress?: (progress: number) => void
): Promise<{ imageUrl: string; videoUrl: string }> {
  // Step 1: Generate image prompt
  const prompt = generateImagePrompt(scene, visualStyle);

  // Step 2: Generate image
  onImageProgress?.();
  const imageResult = await generateImage({
    prompt,
    style: visualStyle as any,
    aspect_ratio: '9:16'
  });

  // Step 3: Generate video from image
  const videoUrl = await generateVideo(
    {
      image_url: imageResult.url,
      prompt: scene.script.slice(0, 200), // Use first 200 chars of script as motion guidance
      duration: scene.durationEstimate <= 3 ? 3 : 5,
      aspect_ratio: '9:16'
    },
    onVideoProgress
  );

  return {
    imageUrl: imageResult.url,
    videoUrl
  };
}

export default {
  generateImagePrompt,
  generateImage,
  initiateVideoGeneration,
  checkVideoStatus,
  generateVideo,
  generateSceneMedia
};
