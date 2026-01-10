import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const platforms: Platform[] = [
  { id: "tiktok", name: "TikTok", icon: "📱", description: "Short-form video platform" },
  { id: "instagram-reels", name: "Instagram", icon: "📷", description: "Photos, videos & reels" },
  { id: "youtube-shorts", name: "YouTube", icon: "▶️", description: "Video content platform" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", description: "Professional network" },
  { id: "twitter-x", name: "Twitter/X", icon: "🐦", description: "Social media platform" },
  { id: "facebook", name: "Facebook", icon: "👍", description: "Social networking site" },
];

interface SocialLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedPlatforms: string[];
  onSave: (platforms: string[]) => void;
}

export function SocialLinkingModal({ 
  isOpen, 
  onClose, 
  linkedPlatforms,
  onSave 
}: SocialLinkingModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(linkedPlatforms)
  );
  const [platformUsernames, setPlatformUsernames] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const togglePlatform = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
      const newUsernames = { ...platformUsernames };
      delete newUsernames[platformId];
      setPlatformUsernames(newUsernames);
    } else {
      newSelected.add(platformId);
    }
    setSelectedPlatforms(newSelected);
  };

  const handleUsernameChange = (platformId: string, username: string) => {
    setPlatformUsernames({
      ...platformUsernames,
      [platformId]: username,
    });
  };

  const handleSave = async () => {
    // Validate that all selected platforms have usernames
    const missingUsernames = Array.from(selectedPlatforms).filter(
      (platformId) => !platformUsernames[platformId]?.trim()
    );

    if (missingUsernames.length > 0) {
      toast.error("Please provide usernames for all selected platforms");
      return;
    }

    setIsValidating(true);
    
    // Simulate validation (in production, this would validate with actual OAuth or API)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsValidating(false);
    
    // Save the linked platforms
    onSave(Array.from(selectedPlatforms));
    
    toast.success(`Successfully linked ${selectedPlatforms.size} platform(s)`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-6 h-6 text-primary" />
            <DialogTitle className="text-2xl">Link Social Accounts</DialogTitle>
          </div>
          <DialogDescription>
            Connect your social media accounts to enable multi-platform content generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const isSelected = selectedPlatforms.has(platform.id);
              
              return (
                <div
                  key={platform.id}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <h3 className="font-semibold">{platform.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Linked
                      </Badge>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <Label htmlFor={`username-${platform.id}`} className="text-xs">
                        Username / Handle
                      </Label>
                      <Input
                        id={`username-${platform.id}`}
                        placeholder={`@username`}
                        value={platformUsernames[platform.id] || ""}
                        onChange={(e) => handleUsernameChange(platform.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPlatforms.size > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold mb-2">Selected Platforms ({selectedPlatforms.size})</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedPlatforms).map((platformId) => {
                  const platform = platforms.find((p) => p.id === platformId);
                  return (
                    <Badge key={platformId} variant="secondary" className="text-sm">
                      {platform?.icon} {platform?.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> In this beta version, we're collecting usernames for validation. 
              Full OAuth integration will be available in the production release.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isValidating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedPlatforms.size === 0 || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Linked Accounts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
