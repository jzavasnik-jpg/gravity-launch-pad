// File Upload Component
// Upload videos and screenshots with drag-and-drop

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image,
  Video,
  X,
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { validateFile } from "@/lib/storage-service";
import type { UploadConfig } from "@/lib/asset-types";
import { toast } from "sonner";

interface FileUploadProps {
  mode: "video" | "screenshots";
  onFilesSelected: (files: File[]) => void;
  onCancel: () => void;
  maxFiles?: number;
  uploadConfig?: Partial<UploadConfig>;
}

export function FileUpload({
  mode,
  onFilesSelected,
  onCancel,
  maxFiles = mode === "screenshots" ? 10 : 1,
  uploadConfig = {},
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    new Map()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config: UploadConfig = {
    maxFileSizeMB: uploadConfig.maxFileSizeMB || 100,
    acceptedFormats:
      uploadConfig.acceptedFormats ||
      (mode === "video"
        ? ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
        : ["image/png", "image/jpeg", "image/jpg", "image/webp"]),
    compressionEnabled: uploadConfig.compressionEnabled ?? true,
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const errors = new Map<string, string>();

    // Validate each file
    Array.from(files).forEach((file) => {
      // Check if we've reached max files
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        toast.error(
          `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`
        );
        return;
      }

      // Validate file
      const validation = validateFile(file, {
        maxSizeMB: config.maxFileSizeMB,
        acceptedTypes: config.acceptedFormats,
      });

      if (validation.valid) {
        newFiles.push(file);
      } else {
        errors.set(file.name, validation.error || "Invalid file");
      }
    });

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }

    if (errors.size > 0) {
      setValidationErrors(errors);
      toast.error(`${errors.size} file(s) failed validation`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    onFilesSelected(selectedFiles);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) {
      return <Video className="h-8 w-8 text-blue-500" />;
    } else if (file.type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-green-500" />;
    }
    return <FileVideo className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <GlassPanel
        className={`relative border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center py-12">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-bold mb-2">
            {mode === "video" ? "Upload Video File" : "Upload Screenshots"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop {mode === "video" ? "your video" : "screenshots"} here, or
            click to browse
          </p>
          <PrimaryButton onClick={() => fileInputRef.current?.click()}>
            Choose {mode === "video" ? "Video" : "Images"}
          </PrimaryButton>
          <input
            ref={fileInputRef}
            type="file"
            accept={config.acceptedFormats.join(",")}
            multiple={maxFiles > 1}
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p>
              Accepted formats:{" "}
              {config.acceptedFormats
                .map((f) => f.split("/")[1].toUpperCase())
                .join(", ")}
            </p>
            <p>Maximum file size: {config.maxFileSizeMB} MB</p>
            {maxFiles > 1 && <p>Maximum files: {maxFiles}</p>}
          </div>
        </div>
      </GlassPanel>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFiles([])}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <GlassPanel key={index} className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0">{getFileIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.type.split("/")[1].toUpperCase()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.size > 0 && (
        <GlassPanel className="bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-500 mb-2">Validation Errors</h4>
              <ul className="space-y-1 text-sm">
                {Array.from(validationErrors.entries()).map(([name, error]) => (
                  <li key={name} className="text-red-500/80">
                    {name}: {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <PrimaryButton
          onClick={handleContinue}
          disabled={selectedFiles.length === 0}
        >
          Continue with {selectedFiles.length} file
          {selectedFiles.length !== 1 ? "s" : ""}
        </PrimaryButton>
      </div>

      {/* Tips */}
      {mode === "screenshots" && selectedFiles.length > 0 && (
        <GlassPanel className="bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-blue-500 mb-1">Tip</h4>
              <p className="text-sm text-blue-500/80">
                In the next step, you'll be able to reorder screenshots, add captions,
                and create an animated walkthrough.
              </p>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
