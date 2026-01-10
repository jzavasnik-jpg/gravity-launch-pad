import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Image as ImageIcon, Sparkles, X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: string[];
}

interface AssetEditorProps {
    assetUrl: string;
    assetTitle: string;
    onClose?: () => void;
}

export const AssetEditor = ({ assetUrl, assetTitle, onClose }: AssetEditorProps) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm ready to help you refine this asset. What would you like to change?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");
        setIsGenerating(true);

        // Simulate AI response/generation
        setTimeout(() => {
            const responseMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm on it! Generating a new version based on your feedback...",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, responseMessage]);
            setIsGenerating(false);
            toast.success("Edit request sent to generation engine");
        }, 1500);
    };

    return (
        <div className="grid grid-cols-[1fr_400px] h-[80vh] w-full max-w-7xl bg-void-surface border border-glass-stroke rounded-xl overflow-hidden shadow-2xl">
            {/* Left: Image Preview */}
            <div className="bg-void-depth relative flex items-center justify-center p-8 border-r border-glass-stroke">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={assetUrl}
                        alt={assetTitle}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-glass-stroke"
                    />
                </div>

                <div className="absolute top-4 left-4">
                    <h2 className="text-2xl font-display text-g-heading">{assetTitle}</h2>
                </div>
            </div>

            {/* Right: Chat Interface */}
            <div className="flex flex-col bg-void-surface h-full">
                {/* Header */}
                <div className="p-4 border-b border-glass-stroke flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse" />
                        <span className="font-medium text-g-text">Asset Editor AI</span>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-3 rounded-lg text-sm",
                                        msg.role === 'user'
                                            ? "bg-electric-indigo text-white rounded-tr-none"
                                            : "bg-void-depth border border-glass-stroke text-g-text rounded-tl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-g-muted mt-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="flex items-center gap-2 text-xs text-g-muted ml-2">
                                <Sparkles className="w-3 h-3 animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-glass-stroke bg-void-depth/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-g-muted hover:text-g-text">
                            <ImageIcon className="w-3 h-3" />
                            Add Context
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Make the text bigger..."
                            className="bg-void-surface border-glass-stroke focus-visible:ring-electric-indigo"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isGenerating}
                            className="bg-electric-indigo hover:bg-electric-indigo/90"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
