import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Scissors, BarChart } from 'lucide-react';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

import BubbleMenuExtension from '@tiptap/extension-bubble-menu';

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            BubbleMenuExtension.configure({
                element: document.querySelector('.bubble-menu') as HTMLElement,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] font-sans text-lg leading-relaxed',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="relative">
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black border border-white/20 shadow-2xl flex items-center gap-1 p-1 rounded-none"
                    >
                        <button
                            onClick={() => console.log('Polarize')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase hover:bg-white/10 text-white transition-colors"
                        >
                            <Zap className="w-3 h-3 text-yellow-500" />
                            Polarize
                        </button>
                        <div className="w-px h-4 bg-white/20" />
                        <button
                            onClick={() => console.log('Shorten')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase hover:bg-white/10 text-white transition-colors"
                        >
                            <Scissors className="w-3 h-3 text-blue-400" />
                            Shorten
                        </button>
                        <div className="w-px h-4 bg-white/20" />
                        <button
                            onClick={() => console.log('Add Data')}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase hover:bg-white/10 text-white transition-colors"
                        >
                            <BarChart className="w-3 h-3 text-green-400" />
                            Add Data
                        </button>
                    </motion.div>
                </BubbleMenu>
            )}
            <EditorContent editor={editor} />
        </div>
    );
}
