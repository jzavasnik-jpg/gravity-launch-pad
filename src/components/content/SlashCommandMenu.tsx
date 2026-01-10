import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Image as ImageIcon, Wand2, Scissors, X } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SlashCommandMenuProps {
    editor: Editor | null;
}

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const { strategyContext, setToneValue, regenerateContent } = useProjectStore();
    const assets = strategyContext?.selectedAssets || [];

    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { from, to } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(from - 1, from, '\n', '\n');

            if (textBefore === '/') {
                const coords = editor.view.coordsAtPos(from);
                // Calculate relative position to the editor container if needed, 
                // but for fixed/absolute positioning, we might need the editor's bounding rect.
                // For simplicity in this MVP, we might just show it near the cursor or centered.
                // Let's try to position it near the cursor.
                const editorRect = editor.view.dom.getBoundingClientRect();
                setPosition({
                    top: coords.top - editorRect.top + 40, // Offset
                    left: coords.left - editorRect.left
                });
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        editor.on('selectionUpdate', handleSelectionUpdate);
        return () => {
            editor.off('selectionUpdate', handleSelectionUpdate);
        };
    }, [editor]);

    const insertAsset = (assetName: string, role?: string) => {
        if (!editor) return;
        // Delete the slash
        editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });

        const tag = `[Visual: ${role ? role.toUpperCase() : 'ASSET'} - ${assetName}]`;
        editor.commands.insertContent(tag);
        setIsOpen(false);
    };

    const regenerateSelection = () => {
        if (!editor) return;
        editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });

        // Mock regeneration for now
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
            toast.info("Regenerating selection... (Mock)");
            // In real app, call API with selectedText and context
        } else {
            toast.error("Please select text to regenerate.");
        }
        setIsOpen(false);
    };

    const shortenParagraph = () => {
        if (!editor) return;
        editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });

        // Mock shortening for now - in real app would call AI
        const { from, to } = editor.state.selection;
        // This is complex to get right paragraph, for now just a toast
        // toast.info("Shortening paragraph...");
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute z-50 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-2 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-medium text-zinc-400">Commands</span>
                <button onClick={() => setIsOpen(false)}><X className="w-3 h-3 text-zinc-500" /></button>
            </div>
            <div className="max-h-60 overflow-y-auto p-1 space-y-1">
                <div className="px-2 py-1 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Actions</div>
                <button
                    onClick={regenerateSelection}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded text-left"
                >
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    <span>Regenerate Selection</span>
                </button>
                <button
                    onClick={shortenParagraph}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded text-left"
                >
                    <Scissors className="w-4 h-4 text-orange-400" />
                    <span>Shorten Paragraph</span>
                </button>

                <div className="px-2 py-1 text-[10px] font-medium text-zinc-600 uppercase tracking-wider mt-2">Insert Asset</div>
                {assets.length === 0 && (
                    <div className="px-2 py-1 text-xs text-zinc-500 italic">No assets available</div>
                )}
                {assets.map(asset => (
                    <button
                        key={asset.id}
                        onClick={() => insertAsset(asset.name, asset.role)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded text-left group"
                    >
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span className="truncate flex-1">{asset.name}</span>
                        {asset.role && <span className="text-[9px] bg-zinc-700 px-1 rounded text-zinc-400">{asset.role}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
