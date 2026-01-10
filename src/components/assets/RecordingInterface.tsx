// Recording Interface Component
// Screen recording UI with controls and preview

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Square,
  Pause,
  Play,
  Mic,
  MicOff,
  Monitor,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  isScreenRecordingSupported,
  isMobileDevice,
  requestScreenCapture,
  createRecorder,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  stopMediaStream,
  createRecordingBlob,
  createPreviewUrl,
  getVideoDuration,
} from "@/lib/recording-service";
import type { RecordingConfig } from "@/lib/asset-types";
import { toast } from "sonner";

interface RecordingInterfaceProps {
  maxDurationSeconds?: number;
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function RecordingInterface({
  maxDurationSeconds = 60,
  onRecordingComplete,
  onCancel,
}: RecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Check browser support
  const isSupported = isScreenRecordingSupported();
  const isMobile = isMobileDevice();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDurationSeconds) {
            handleStopRecording();
            return maxDurationSeconds;
          }
          
          return newDuration;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, maxDurationSeconds]);

  const handleStartRecording = async () => {
    if (!isSupported) {
      toast.error("Screen recording is not supported in this browser");
      return;
    }

    setIsInitializing(true);

    try {
      // Request screen capture
      const stream = await requestScreenCapture({
        maxDurationSeconds,
        audioEnabled,
        videoQuality: "high",
      });

      if (!stream) {
        throw new Error("Failed to start screen capture");
      }

      streamRef.current = stream;

      // Create recorder
      const recorder = createRecorder(
        stream,
        (chunk) => {
          setRecordingChunks((prev) => [...prev, chunk]);
        },
        () => {
          handleRecordingStop();
        },
        (error) => {
          console.error("Recording error:", error);
          toast.error("Recording error occurred");
          handleStopRecording();
        }
      );

      if (!recorder) {
        throw new Error("Failed to create recorder");
      }

      recorderRef.current = recorder;

      // Start recording
      const started = startRecording(recorder);
      if (!started) {
        throw new Error("Failed to start recording");
      }

      setIsRecording(true);
      setDuration(0);
      setRecordingChunks([]);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStopRecording = () => {
    if (!recorderRef.current || !isRecording) return;

    const stopped = stopRecording(recorderRef.current);
    if (!stopped) {
      toast.error("Failed to stop recording");
    }
  };

  const handleRecordingStop = async () => {
    setIsRecording(false);
    setIsPaused(false);

    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }

    if (recordingChunks.length === 0) {
      toast.error("No recording data available");
      return;
    }

    // Create blob from chunks
    const blob = createRecordingBlob(recordingChunks);
    
    // Create preview URL
    const url = createPreviewUrl(blob);
    setPreviewUrl(url);

    // Get actual duration
    try {
      const actualDuration = await getVideoDuration(blob);
      onRecordingComplete(blob, actualDuration);
    } catch (error) {
      console.error("Error getting video duration:", error);
      onRecordingComplete(blob, duration);
    }
  };

  const handlePauseResume = () => {
    if (!recorderRef.current) return;

    if (isPaused) {
      const resumed = resumeRecording(recorderRef.current);
      if (resumed) {
        setIsPaused(false);
      }
    } else {
      const paused = pauseRecording(recorderRef.current);
      if (paused) {
        setIsPaused(true);
      }
    }
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (duration / maxDurationSeconds) * 100;

  // Show mobile fallback message
  if (isMobile && !isSupported) {
    return (
      <GlassPanel className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-bold mb-2">Mobile Recording Limited</h3>
        <p className="text-muted-foreground mb-4">
          Screen recording is not fully supported on mobile browsers. Please use the
          upload option instead or switch to desktop.
        </p>
        <Button variant="outline" onClick={onCancel}>
          Go Back
        </Button>
      </GlassPanel>
    );
  }

  if (!isSupported) {
    return (
      <GlassPanel className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-bold mb-2">Recording Not Supported</h3>
        <p className="text-muted-foreground mb-4">
          Your browser does not support screen recording. Please try using Chrome,
          Firefox, or Edge.
        </p>
        <Button variant="outline" onClick={onCancel}>
          Go Back
        </Button>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview/Status Area */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {previewUrl ? (
          <video
            ref={previewVideoRef}
            src={previewUrl}
            controls
            className="w-full h-full"
          />
        ) : isRecording ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Video className="h-16 w-16 text-red-500 animate-pulse mb-4" />
            <Badge variant="destructive" className="text-lg px-4 py-2">
              REC {formatTime(duration)}
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "Start Recording" to begin
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recording progress</span>
            <span className="font-medium">
              {formatTime(duration)} / {formatTime(maxDurationSeconds)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {duration >= maxDurationSeconds - 10 && (
            <p className="text-xs text-yellow-500 text-center">
              Recording will auto-stop at {maxDurationSeconds} seconds
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      {!previewUrl && (
        <div className="flex flex-col gap-4">
          {/* Audio Toggle */}
          {!isRecording && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleAudio}
                className="flex items-center gap-2"
              >
                {audioEnabled ? (
                  <>
                    <Mic className="h-4 w-4" />
                    Microphone On
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4" />
                    Microphone Off
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {audioEnabled
                  ? "Add live voiceover to your recording"
                  : "Record without audio"}
              </p>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex justify-center gap-2">
            {!isRecording ? (
              <>
                <Button variant="outline" onClick={onCancel} disabled={isInitializing}>
                  Cancel
                </Button>
                <PrimaryButton
                  onClick={handleStartRecording}
                  disabled={isInitializing}
                  className="px-6"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Start Recording
                    </>
                  )}
                </PrimaryButton>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handlePauseResume}
                  className="px-6"
                >
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStopRecording}
                  className="px-6"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Controls */}
      {previewUrl && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Preview your recording. You can trim and edit it in the next step.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewUrl(null);
                setRecordingChunks([]);
                setDuration(0);
              }}
            >
              Record Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
