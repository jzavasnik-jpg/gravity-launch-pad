import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PaywallModal({ isOpen, onClose, onUpgrade }: PaywallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <DialogTitle className="text-2xl">Upgrade to PRO</DialogTitle>
          </div>
          <DialogDescription>
            Unlock powerful social content generation tools and advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              What You'll Get with PRO
            </h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Multi-Platform Content Generation</p>
                  <p className="text-sm text-muted-foreground">
                    Generate optimized content for TikTok, Instagram, YouTube, LinkedIn, Twitter, and Facebook
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Social Account Linking</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your social media accounts for direct publishing and analytics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Viral Concept Generator</p>
                  <p className="text-sm text-muted-foreground">
                    AI-powered multi-agent content ideation with scoring and recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Platform-Specific Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Content tailored to each platform's best practices and algorithms
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Content Export & Download</p>
                  <p className="text-sm text-muted-foreground">
                    Save and export generated content for all platforms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Free Plan Reminder */}
          <div className="p-4 rounded-lg border border-muted bg-muted/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your Free Plan Includes
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• ICP Interview Flow</li>
              <li>• Avatar & Persona Generation</li>
              <li>• PDF Export of Results</li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">PRO Plan</h3>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Zap className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Everything you need for viral content creation
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">$29</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={onUpgrade} className="bg-gradient-to-r from-primary to-purple-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to PRO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
