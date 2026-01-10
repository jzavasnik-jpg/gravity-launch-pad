import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GlassInput } from "@/components/GlassInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Sparkles, Mail } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: (name: string, email: string) => void;
}

export const WelcomeModal = ({ isOpen, onComplete }: WelcomeModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (trimmedName.length < 2) {
      setError("Please enter your first name (at least 2 characters)");
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    onComplete(trimmedName, trimmedEmail);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="glass-panel border-primary/20 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">Welcome to Gravity Product Launcher</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-base">
            Let's personalize your experience. Start with our free plan and upgrade anytime.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground block mb-2">
              Your First Name
            </label>
            <GlassInput
              placeholder="Enter your first name"
              value={name}
              onChange={(value) => {
                setName(value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <GlassInput
              placeholder="your.email@example.com"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <PrimaryButton 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name.trim() || !email.trim()}
          >
            Start Free Plan
          </PrimaryButton>

          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Free Plan includes:</strong> ICP Interview, Avatar Generation, PDF Export
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service. Your data is saved securely.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

