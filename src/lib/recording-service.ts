// Screen Recording Service
// Handles screen capture and recording using browser Screen Capture API

import type { RecordingConfig } from "./asset-types";

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  stream: MediaStream | null;
  recorder: MediaRecorder | null;
  chunks: Blob[];
}

const DEFAULT_CONFIG: RecordingConfig = {
  maxDurationSeconds: 60,
  audioEnabled: true,
  videoQuality: "high",
  frameRate: 30,
};

/**
 * Check if Screen Capture API is supported
 */
export function isScreenRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getDisplayMedia" in navigator.mediaDevices
  );
}

/**
 * Check if device is mobile (fallback to file upload)
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Request screen capture with optional audio
 */
export async function requestScreenCapture(
  config: Partial<RecordingConfig> = {}
): Promise<MediaStream | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!isScreenRecordingSupported()) {
    throw new Error("Screen recording is not supported in this browser");
  }

  try {
    // Request screen capture
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: finalConfig.frameRate,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false, // System audio requires special handling
    });

    // If audio is enabled, get microphone audio separately
    if (finalConfig.audioEnabled) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        // Combine video and audio tracks
        const combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ]);

        return combinedStream;
      } catch (audioError) {
        console.warn("Could not access microphone:", audioError);
        // Return video-only stream if audio fails
        return displayStream;
      }
    }

    return displayStream;
  } catch (error) {
    console.error("Error requesting screen capture:", error);
    return null;
  }
}

/**
 * Create MediaRecorder instance
 */
export function createRecorder(
  stream: MediaStream,
  onDataAvailable: (chunk: Blob) => void,
  onStop: () => void,
  onError: (error: Error) => void
): MediaRecorder | null {
  try {
    // Determine best supported format
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    const supportedType = mimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type)
    );

    if (!supportedType) {
      throw new Error("No supported video format found");
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: supportedType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        onDataAvailable(event.data);
      }
    };

    recorder.onstop = onStop;
    recorder.onerror = (event) => {
      onError(new Error("Recording error occurred"));
    };

    return recorder;
  } catch (error) {
    console.error("Error creating recorder:", error);
    onError(error as Error);
    return null;
  }
}

/**
 * Start recording
 */
export function startRecording(recorder: MediaRecorder): boolean {
  try {
    if (recorder.state !== "inactive") {
      console.warn("Recorder is already active");
      return false;
    }

    recorder.start(1000); // Collect data every second
    return true;
  } catch (error) {
    console.error("Error starting recording:", error);
    return false;
  }
}

/**
 * Stop recording
 */
export function stopRecording(recorder: MediaRecorder): boolean {
  try {
    if (recorder.state === "inactive") {
      console.warn("Recorder is not active");
      return false;
    }

    recorder.stop();
    return true;
  } catch (error) {
    console.error("Error stopping recording:", error);
    return false;
  }
}

/**
 * Pause recording
 */
export function pauseRecording(recorder: MediaRecorder): boolean {
  try {
    if (recorder.state !== "recording") {
      console.warn("Recorder is not recording");
      return false;
    }

    recorder.pause();
    return true;
  } catch (error) {
    console.error("Error pausing recording:", error);
    return false;
  }
}

/**
 * Resume recording
 */
export function resumeRecording(recorder: MediaRecorder): boolean {
  try {
    if (recorder.state !== "paused") {
      console.warn("Recorder is not paused");
      return false;
    }

    recorder.resume();
    return true;
  } catch (error) {
    console.error("Error resuming recording:", error);
    return false;
  }
}

/**
 * Stop all media tracks
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Create blob from recorded chunks
 */
export function createRecordingBlob(
  chunks: Blob[],
  mimeType: string = "video/webm"
): Blob {
  return new Blob(chunks, { type: mimeType });
}

/**
 * Create object URL for preview
 */
export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get recording duration from metadata
 */
export async function getVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(blob);
  });
}

/**
 * Extract thumbnail from video
 */
export async function extractVideoThumbnail(
  blob: Blob,
  timeSeconds: number = 0
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((thumbnailBlob) => {
        URL.revokeObjectURL(video.src);
        resolve(thumbnailBlob);
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => {
      resolve(null);
    };

    video.src = URL.createObjectURL(blob);
  });
}

/**
 * Trim video (basic implementation - for advanced trimming, use ffmpeg.wasm)
 */
export async function trimVideo(
  blob: Blob,
  startSeconds: number,
  endSeconds: number
): Promise<Blob | null> {
  // Note: This is a placeholder. Full implementation requires ffmpeg.wasm
  // For now, we'll just return the original blob
  console.log("Video trimming requested:", { startSeconds, endSeconds });
  console.log("Note: Full video trimming requires ffmpeg.wasm integration");
  
  return blob;
}

/**
 * Check available storage space (if API is available)
 */
export async function checkStorageQuota(): Promise<{
  available: number;
  total: number;
  percent: number;
} | null> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const available = estimate.quota || 0;
      const used = estimate.usage || 0;
      const total = available;
      const percent = total > 0 ? (used / total) * 100 : 0;

      return {
        available: available - used,
        total,
        percent,
      };
    } catch (error) {
      console.error("Error checking storage quota:", error);
    }
  }
  
  return null;
}
