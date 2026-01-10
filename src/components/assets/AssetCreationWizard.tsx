// Asset Creation Wizard Component
// Step-by-step wizard for creating video demos, screenshots, and walkthroughs

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Upload, Image, ArrowRight, ArrowLeft, X } from "lucide-react";
import { GlassPanel } from "@/components/GlassPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RecordingInterface } from "./RecordingInterface";
import { FileUpload } from "./FileUpload";
import type { AssetWizardState, WizardStep } from "@/lib/asset-types";
import { uploadAsset } from "@/lib/asset-service";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface AssetCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (assetId: string) => void;
  contentSeedId?: string;
  contentType?: "avatar_seed" | "validated_idea" | "content_root";
}

export function AssetCreationWizard({
  isOpen,
  onClose,
  onComplete,
  contentSeedId,
  contentType,
}: AssetCreationWizardProps) {
  const { appState } = useApp();
  const [wizardState, setWizardState] = useState<AssetWizardState>({
    current_step: "choose_method",
  });

  const goToStep = (step: WizardStep) => {
    setWizardState((prev) => ({ ...prev, current_step: step }));
  };

  const selectMethod = (method: "record" | "screenshots" | "upload") => {
    setWizardState((prev) => ({ ...prev, method }));

    if (method === "record") {
      goToStep("recording");
    } else if (method === "screenshots") {
      goToStep("uploading");
    } else {
      goToStep("uploading");
    }
  };

  const handleClose = () => {
    setWizardState({ current_step: "choose_method" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-panel max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-display">
              Create Demo Asset
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["choose_method", "recording", "editing", "preview", "complete"].map(
            (step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${wizardState.current_step === step
                    ? "bg-primary"
                    : index <
                      ["choose_method", "recording", "editing", "preview", "complete"].indexOf(
                        wizardState.current_step
                      )
                      ? "bg-primary/50"
                      : "bg-gray-300"
                    }`}
                />
                {index < 4 && (
                  <div className="h-0.5 w-8 bg-gray-300 mx-1" />
                )}
              </div>
            )
          )}
        </div>

        {/* Step content */}
        {wizardState.current_step === "choose_method" && (
          <ChooseMethodStep onSelectMethod={selectMethod} />
        )}

        {wizardState.current_step === "recording" && (
          <RecordingStep
            onBack={() => goToStep("choose_method")}
            onNext={() => goToStep("editing")}
            wizardState={wizardState}
            setWizardState={setWizardState}
          />
        )}

        {wizardState.current_step === "uploading" && (
          <UploadingStep
            onBack={() => goToStep("choose_method")}
            onNext={() => goToStep("editing")}
            method={wizardState.method}
            wizardState={wizardState}
            setWizardState={setWizardState}
          />
        )}

        {wizardState.current_step === "editing" && (
          <EditingStep
            onBack={() =>
              wizardState.method === "record"
                ? goToStep("recording")
                : goToStep("uploading")
            }
            onNext={() => goToStep("preview")}
            wizardState={wizardState}
            setWizardState={setWizardState}
          />
        )}

        {wizardState.current_step === "preview" && (
          <PreviewStep
            onBack={() => goToStep("editing")}
            onComplete={onComplete}
            wizardState={wizardState}
            contentSeedId={contentSeedId}
            contentType={contentType}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Method selection step
function ChooseMethodStep({
  onSelectMethod,
}: {
  onSelectMethod: (method: "record" | "screenshots" | "upload") => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-center mb-6">
        Choose how you'd like to create your product demo
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel
          className="cursor-pointer hover-scale text-center p-6"
          onClick={() => onSelectMethod("record")}
        >
          <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="font-bold mb-2">Record Screen</h3>
          <p className="text-sm text-muted-foreground">
            Record your screen with voiceover (up to 60 seconds)
          </p>
        </GlassPanel>

        <GlassPanel
          className="cursor-pointer hover-scale text-center p-6"
          onClick={() => onSelectMethod("screenshots")}
        >
          <Image className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="font-bold mb-2">Build from Screenshots</h3>
          <p className="text-sm text-muted-foreground">
            Upload screenshots and create animated walkthrough
          </p>
        </GlassPanel>

        <GlassPanel
          className="cursor-pointer hover-scale text-center p-6"
          onClick={() => onSelectMethod("upload")}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="font-bold mb-2">Upload Video</h3>
          <p className="text-sm text-muted-foreground">
            Upload an existing video file or mobile recording
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}

// Recording step - now uses RecordingInterface
function RecordingStep({
  onBack,
  onNext,
  wizardState,
  setWizardState,
}: {
  onBack: () => void;
  onNext: () => void;
  wizardState: AssetWizardState;
  setWizardState: React.Dispatch<React.SetStateAction<AssetWizardState>>;
}) {
  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setWizardState((prev) => ({
      ...prev,
      recording_blob: blob,
    }));
    onNext();
  };

  return (
    <div className="space-y-4">
      <RecordingInterface
        maxDurationSeconds={60}
        onRecordingComplete={handleRecordingComplete}
        onCancel={onBack}
      />
    </div>
  );
}

// Upload step - now uses FileUpload
function UploadingStep({
  onBack,
  onNext,
  method,
  wizardState,
  setWizardState,
}: {
  onBack: () => void;
  onNext: () => void;
  method?: "record" | "screenshots" | "upload";
  wizardState: AssetWizardState;
  setWizardState: React.Dispatch<React.SetStateAction<AssetWizardState>>;
}) {
  const handleFilesSelected = (files: File[]) => {
    // Store files in wizard state
    setWizardState((prev) => ({
      ...prev,
      selected_screenshots: files.map((f) => f.name),
      selected_files: files,
    }));
    onNext();
  };

  return (
    <FileUpload
      mode={method === "screenshots" ? "screenshots" : "video"}
      onFilesSelected={handleFilesSelected}
      onCancel={onBack}
    />
  );
}

// Editing step (placeholder)
function EditingStep({
  onBack,
  onNext,
  wizardState,
  setWizardState,
}: {
  onBack: () => void;
  onNext: () => void;
  wizardState: AssetWizardState;
  setWizardState: React.Dispatch<React.SetStateAction<AssetWizardState>>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        Editing interface for trimming, annotations, and captions
      </p>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PrimaryButton onClick={onNext}>
          Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

// Preview and save step (placeholder)
function PreviewStep({
  onBack,
  onComplete,
  wizardState,
  contentSeedId,
  contentType,
}: {
  onBack: () => void;
  onComplete: (assetId: string) => void;
  wizardState: AssetWizardState;
  contentSeedId?: string;
  contentType?: "avatar_seed" | "validated_idea" | "content_root";
}) {
  const [isSaving, setIsSaving] = useState(false);
  const { appState } = useApp();

  const handleSave = async () => {
    if (!appState.userId) return;

    setIsSaving(true);
    try {
      let assetId = "";

      if (wizardState.method === 'record' && wizardState.recording_blob) {
        const file = new File([wizardState.recording_blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        const asset = await uploadAsset(appState.userId, {
          title: `Screen Recording ${new Date().toLocaleTimeString()}`,
          asset_type: 'video',
          file: file
        });
        assetId = asset.id;
      } else if (wizardState.selected_files && wizardState.selected_files.length > 0) {
        // Upload first file for now (MVP)
        const file = wizardState.selected_files[0];
        const asset = await uploadAsset(appState.userId, {
          title: file.name,
          asset_type: file.type.startsWith('video') ? 'video' : 'image',
          file: file
        });
        assetId = asset.id;
      }

      if (assetId) {
        onComplete(assetId);
      } else {
        toast.error("No file to upload");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload asset");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        Preview your asset and add final details
      </p>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PrimaryButton onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Asset"
          )}
        </PrimaryButton>
      </div>
    </div>
  );
}
