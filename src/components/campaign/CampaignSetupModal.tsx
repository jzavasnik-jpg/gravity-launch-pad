import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Users, ArrowRight } from 'lucide-react';
import { useProjectStore, CampaignMode } from '@/store/projectStore';
import { useNavigate } from 'react-router-dom';

interface CampaignSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CampaignSetupModal({ isOpen, onClose }: CampaignSetupModalProps) {
    const navigate = useNavigate();
    const { setCampaignMode } = useProjectStore();

    const handleSelectMode = (mode: CampaignMode) => {
        setCampaignMode(mode);
        onClose();
        navigate('/veritas/content-composer');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border text-foreground max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display text-center mb-2 text-foreground">
                        How will you deliver this message?
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Choose the narrative structure for your campaign.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 mt-6">
                    {/* Option 1: Direct Authority */}
                    <div
                        onClick={() => handleSelectMode('direct_authority')}
                        className="bg-card/85 border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <User className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-foreground mb-1">Direct Authority</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Speak directly to the target audience's pain points using the avatar's psych profile. Best for thought leadership and direct offers.
                                </p>
                            </div>
                            <div className="pt-4 w-full">
                                <div className="bg-background rounded-lg p-3 text-xs font-mono text-muted-foreground border border-border">
                                    [Strategy: Avatar] + [Visual: You]
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Option 2: Transformation Narrative */}
                    <div
                        onClick={() => handleSelectMode('transformation_narrative')}
                        className="bg-card/85 border border-border rounded-xl p-6 hover:border-orange-500/50 hover:bg-card transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <Users className="w-8 h-8 text-muted-foreground group-hover:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-foreground mb-1">Transformation Narrative</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    A narrative scene showing you guiding the avatar from their 'before' state to their 'after' state. Best for case studies and empathy.
                                </p>
                            </div>
                            <div className="pt-4 w-full">
                                <div className="bg-background rounded-lg p-3 text-xs font-mono text-muted-foreground border border-border">
                                    [Role: Guide (You)] + [Role: Mentee]
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
