import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import { generateContent } from '@/lib/image-gen-api';
import { uploadAsset } from '@/lib/asset-service';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, RefreshCw, Wand2, MousePointerClick, LayoutTemplate, ArrowLeft, Save, ImagePlus, Sparkles, Send, Undo2, CheckCircle, Upload, MonitorSmartphone, X, RotateCcw, Settings, Check, Type, Move, Home, Users, Bell, Briefcase, MessageSquare, MessageSquareText, ThumbsUp, Repeat2, PlusSquare, Search } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { refinePromptWithUserInstruction } from '@/lib/prompt-refiner';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext'; // Added useApp import
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Extracted HookLayer for cleaner logic and drag control isolation
const HookLayer = ({ hook, canvasRef, isResizing, onUpdate, onSelect, isSelected, onResizeStart, onDelete, readOnly = false }: any) => {
    const dragControls = useDragControls();

    // We use a separate state to force-reset the inner drag transform after drop
    const [isDragging, setIsDragging] = useState(false);

    return (
        // OUTER WRAPPER: Handles the exact anchor position and centering
        <motion.div
            key={hook.id}
            id={`hook-wrapper-${hook.id}${readOnly ? '-preview' : ''}`}
            style={{
                position: 'absolute',
                top: `${hook.y * 100}%`,
                left: `${hook.x * 100}%`,
                width: '40%',
                maxWidth: '100%',
                zIndex: isSelected ? 50 : 10,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none'
            }}
        >
            {/* INNER DRAGGABLE */}
            <motion.div
                // layout prop removed to prevent drag conflict
                drag={!readOnly}
                dragListener={false}
                dragMomentum={false}
                dragControls={dragControls}
                dragElastic={0}
                dragConstraints={canvasRef}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                    if (readOnly || !canvasRef.current) return;
                    setIsDragging(false);

                    const canvasRect = canvasRef.current.getBoundingClientRect();
                    const startXPx = (hook.x * canvasRect.width);
                    const startYPx = (hook.y * canvasRect.height);
                    const finalXPx = startXPx + info.offset.x;
                    const finalYPx = startYPx + info.offset.y;

                    const newX = Math.max(0, Math.min(1, finalXPx / canvasRect.width));
                    const newY = Math.max(0, Math.min(1, finalYPx / canvasRect.height));

                    onUpdate({ ...hook, x: newX, y: newY });
                }}
                animate={{
                    x: isDragging ? undefined : 0,
                    y: isDragging ? undefined : 0,
                    scale: hook.scale
                }}
                transition={{
                    duration: 0
                }}
                style={{
                    border: (isSelected && !readOnly) ? '2px solid #a855f7' : '2px solid transparent',
                    borderRadius: '8px',
                    padding: '4px',
                    pointerEvents: 'auto',
                    cursor: readOnly ? "default" : (isResizing ? "default" : "grab"),
                    touchAction: "none" // Prevent scroll interference
                }}
                whileTap={{ cursor: readOnly ? "default" : (isResizing ? "default" : "grabbing") }}
                onClick={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    onSelect();
                }}
                className="group relative w-full flex justify-center select-none"
            >
                <img
                    src={hook.url}
                    alt="Hook Text"
                    className="w-full h-auto object-contain drop-shadow-2xl filter contrast-125"
                    draggable={false}
                    onPointerDown={(e) => {
                        if (readOnly || isResizing) return;
                        dragControls.start(e);
                    }}
                />

                {isSelected && !readOnly && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Resize Handle */}
                        <div
                            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-purple-600 rounded-full cursor-nwse-resize z-50 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            onPointerDown={(e) => {
                                e.stopPropagation(); // Stop drag from seeing this
                                onResizeStart(e, hook.id, hook.scale);
                            }}
                        >
                            <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        </div>
                        {/* Delete Handle */}
                        <button
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-white rounded-full cursor-pointer z-50 shadow-lg flex items-center justify-center hover:scale-110 transition-transform text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
export default function ThumbnailEditPage() {
    const { conceptId } = useParams();
    const navigate = useNavigate();
    const { thumbnailState, setThumbnailState, strategyContext, visualMessengerState } = useProjectStore();
    const { concepts, bgImage, hooks: storedHooks, hookText } = thumbnailState;
    const avatarUrl = strategyContext?.selectedAssets?.find(a => a.name.toLowerCase().includes('avatar') || a.role === 'hero')?.url;

    // console.log("🔍 Debug Thumbnail State:", {
    //     hasStrategyContext: !!strategyContext,
    //     selectedAssets: strategyContext?.selectedAssets,
    //     visualMessengerMode: visualMessengerState?.mode,
    //     visualMessengerUrl: visualMessengerState?.currentUrl,
    //     conceptsCount: concepts.length
    // });

    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTool, setActiveTool] = useState<'select' | 'text' | 'layout'>('select');
    const [userInstruction, setUserInstruction] = useState("");
    const [hookStyleInstruction, setHookStyleInstruction] = useState("");
    const [hooks, setHooks] = useState<{ id: string; url: string; x: number; y: number; scale: number; text?: string }[]>(storedHooks || []);
    const [pendingHooks, setPendingHooks] = useState<{ id: string; text: string }[]>([]);
    const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5' | '1.91:1'>('16:9');
    const [textLayout, setTextLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    const [newLayerLayout, setNewLayerLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [textScale, setTextScale] = useState(1);
    const { appState, setHeaderActions } = useApp(); // Get setHeaderActions
    const { user } = useAuth();
    const [finalizedRatios, setFinalizedRatios] = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [history, setHistory] = useState<{ bgImage: string; hooks: { id: string; url: string; x: number; y: number; scale: number; text?: string }[]; prompt: string }[]>([]);
    const [placeholderHookText, setPlaceholderHookText] = useState("");
    const [mainHookInstruction, setMainHookInstruction] = useState("");
    const [newLayerText, setNewLayerText] = useState("");
    const canvasRef = useRef<HTMLDivElement>(null);
    const resizingHookId = useRef<string | null>(null); // Still used for logic
    const resizeStartRef = useRef<{ x: number; y: number; initialScale: number } | null>(null);
    const [isResizing, setIsResizing] = useState(false); // Global state for cursor management

    // Sync hooks to global store for persistence
    useEffect(() => {
        setThumbnailState({ hooks });
    }, [hooks, setThumbnailState]);

    // Resize Logic
    const handleResizePointerDown = (e: React.PointerEvent, hookId: string, currentScale: number) => {
        e.stopPropagation();
        e.preventDefault();

        // Initial State Set
        resizingHookId.current = hookId;
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialScale: currentScale
        };
        setIsResizing(true);
    };

    // Global Window Listeners for Resize (More reliable than element listeners)
    useEffect(() => {
        if (!isResizing) return;

        const handleWindowMove = (e: PointerEvent | MouseEvent) => {
            if (!resizingHookId.current || !resizeStartRef.current) return;

            // e.preventDefault(); // Optional, can cause issues with other browser interactions

            const deltaX = e.clientX - resizeStartRef.current.x;
            const scaleChange = deltaX * 0.005;
            const newScale = Math.max(0.1, Math.min(5, resizeStartRef.current.initialScale + scaleChange));

            setHooks(prev => prev.map(h =>
                h.id === resizingHookId.current ? { ...h, scale: newScale } : h
            ));
        };

        const handleWindowUp = (e: PointerEvent | MouseEvent) => {
            setIsResizing(false);
            resizingHookId.current = null;
            resizeStartRef.current = null;
        };

        window.addEventListener('pointermove', handleWindowMove);
        window.addEventListener('pointerup', handleWindowUp);
        window.addEventListener('pointerleave', handleWindowUp); // Catch leaving window

        return () => {
            window.removeEventListener('pointermove', handleWindowMove);
            window.removeEventListener('pointerup', handleWindowUp);
            window.removeEventListener('pointerleave', handleWindowUp);
        };
    }, [isResizing]);


    // IDB Helper (Simple implementation to avoid external dependencies)
    const saveToIDB = async (key: string, value: any) => {
        if (typeof window === 'undefined' || !window.indexedDB) return;
        const request = window.indexedDB.open('thumbnailDB', 1);
        request.onupgradeneeded = (e: any) => {
            e.target.result.createObjectStore('store');
        };
        request.onsuccess = (e: any) => {
            const db = e.target.result;
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put(value, key);
        };
    };

    const loadFromIDB = async (key: string) => {
        if (typeof window === 'undefined' || !window.indexedDB) return null;
        return new Promise<any>((resolve) => {
            const request = window.indexedDB.open('thumbnailDB', 1);
            request.onupgradeneeded = (e: any) => e.target.result.createObjectStore('store');
            request.onsuccess = (e: any) => {
                const db = e.target.result;
                const tx = db.transaction('store', 'readonly');
                const req = tx.objectStore('store').get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            };
            request.onerror = () => resolve(null);
        });
    };

    // Find the concept
    const concept = concepts.find(c => c.id === conceptId);
    const generationAttemptedRef = useRef(false);

    // Initial Generation & Persistence Restoration
    useEffect(() => {
        const init = async () => {
            if (!concept) return;

            // 1. Try to load from IDB (Persistence Fix)
            const savedBg = await loadFromIDB(`bg-${concept.id}`);
            if (savedBg) {
                console.log("Loaded bgImage from IDB");
                setThumbnailState({ bgImage: savedBg });
                return; // Skip generation if we have a saved image
            }

            // 2. Generate if needed
            if ((!bgImage || bgImage.includes('placehold')) && !generationAttemptedRef.current) {
                generationAttemptedRef.current = true; // Prevent double firing
                handleGenerate();
            }
            setPlaceholderHookText(concept.hook_text || "HOOK");
        };
        init();
    }, [concept?.id]); // Only run if ID changes (Fixes Double Gen loop)

    const handleGenerate = async () => {
        if (!concept) return;
        setIsGenerating(true);
        try {
            // ... (rest of asset collection logic) ...
            const assets = [];
            // 1. User Photo
            if (visualMessengerState?.mode === 'user' && visualMessengerState.currentUrl) {
                assets.push({ url: visualMessengerState.currentUrl, mimeType: 'image/jpeg' });
            } else {
                const avatarAsset = strategyContext?.selectedAssets?.find(a => a.name.toLowerCase().includes('avatar') || a.role === 'hero');
                if (avatarAsset && avatarAsset.url) assets.push({ url: avatarAsset.url, mimeType: 'image/jpeg' });
            }
            // 2. Product Assets
            strategyContext?.selectedAssets?.forEach(asset => {
                if (asset.url && !assets.some(a => a.url === asset.url)) {
                    assets.push({ url: asset.url, mimeType: 'image/jpeg' });
                }
            });

            let cleanPrompt = concept.image_prompt;
            cleanPrompt = cleanPrompt.replace(/\b(Text|Hook|Title|Words?|Caption):\s*["“][^"”]*["”]/gi, "");
            cleanPrompt = cleanPrompt.replace(/\b(Text|Hook|Title|Words?|Caption):\s*[^,.]+/gi, "");
            cleanPrompt = cleanPrompt.replace(/\s{2,}/g, " ").trim();

            const imageUrl = await generateContent(cleanPrompt, assets, aspectRatio);
            if (imageUrl) {
                setThumbnailState({ bgImage: imageUrl });
                // Save to IDB for persistence
                saveToIDB(`bg-${concept.id}`, imageUrl);
                toast.success("High-res thumbnail generated!");
            }
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error("Failed to generate thumbnail.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setThumbnailState({ bgImage: previousState.bgImage });
        setHooks(previousState.hooks);
        if (concept && previousState.prompt) concept.image_prompt = previousState.prompt;
        setHistory(prev => prev.slice(0, -1));
        toast.info("Undid last change");
    };

    const handleRevertHook = (hookId: string) => {
        if (history.length === 0) {
            toast("No history to revert to");
            return;
        }
        const lastSnapshot = history[history.length - 1];
        const oldHook = lastSnapshot.hooks.find(h => h.id === hookId);

        if (oldHook) {
            setHooks(currentHooks => currentHooks.map(h =>
                h.id === hookId ? oldHook : h
            ));
            toast.success("Reverted hook changes");
        } else {
            toast("No previous version of this hook found");
        }
    };

    const handleRegenerateHook = async (textOverride?: string, layoutOverride?: 'horizontal' | 'vertical') => {
        if (!concept) return;
        setIsRefining(true);
        try {
            const textToUse = textOverride || concept.hook_text || "HOOK";
            const response = await fetch('http://localhost:3001/api/generate-transparent-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToUse,
                    stylePrompt: hookStyleInstruction || "bold, white, viral style, high contrast",
                    layout: layoutOverride || textLayout
                })
            });

            if (!response.ok) throw new Error("Failed to generate hook");

            const data = await response.json();
            if (data.imageUrl) {
                const newHook = {
                    id: Date.now().toString(),
                    url: data.imageUrl,
                    x: 0.5,
                    y: 0.5,
                    scale: 1,
                    text: textToUse
                };
                setHooks(prev => [...prev, newHook]);
                setSelectedHookId(newHook.id);
                toast.success("New text layer added!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate hook");
        } finally {
            setIsRefining(false);
        }
    };

    const [drafts, setDrafts] = useState<any[]>([]);
    const [savedHooks, setSavedHooks] = useState<any[]>([]);
    const [isDraftMenuOpen, setIsDraftMenuOpen] = useState(false);

    // IMAGE REPOSITIONING (PAN/ZOOM) & ASPECT RATIO STATE
    const [bgTransformsMap, setBgTransformsMap] = useState<Record<string, { x: number, y: number, scale: number }>>({});
    const [hooksMap, setHooksMap] = useState<Record<string, any[]>>({});

    // Current Active State
    const [bgTransform, setBgTransform] = useState({ x: 0, y: 0, scale: 1 });

    const [isRepositioning, setIsRepositioning] = useState(false);
    const [imageConstraints, setImageConstraints] = useState<{ width: number, height: number, orientation: 'landscape' | 'portrait' }>({ width: 0, height: 0, orientation: 'landscape' });
    const bgDragControls = useDragControls();

    // Resize Observer for Syncing Preview
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ canvasWidth: 1, previewWidth: 1 });

    const prevAspectRatioRef = useRef(aspectRatio);

    const currentBgTransformRef = useRef(bgTransform);
    const currentHooksRef = useRef(hooks);

    useEffect(() => {
        currentBgTransformRef.current = bgTransform;
        currentHooksRef.current = hooks;
    }, [bgTransform, hooks]);
    // Aspect Ratio Logic Refinement
    useEffect(() => {
        const prevRatio = prevAspectRatioRef.current;
        if (prevRatio !== aspectRatio) {
            // Save state
            setBgTransformsMap(prev => ({ ...prev, [prevRatio]: currentBgTransformRef.current }));
            // Deep copy hooks to avoid reference issues
            setHooksMap(prev => ({ ...prev, [prevRatio]: JSON.parse(JSON.stringify(currentHooksRef.current)) }));

            // Load new state
            const savedTransform = bgTransformsMap[aspectRatio];
            const savedHooksState = hooksMap[aspectRatio];

            if (savedTransform) setBgTransform(savedTransform);
            else setBgTransform(currentBgTransformRef.current);

            if (savedHooksState) setHooks(JSON.parse(JSON.stringify(savedHooksState)));
            else setHooks(JSON.parse(JSON.stringify(currentHooksRef.current))); // Clone hooks for new ratio

            prevAspectRatioRef.current = aspectRatio;
        }
    }, [aspectRatio]);




    useEffect(() => {
        const updateDimensions = () => {
            if (canvasRef.current && previewContainerRef.current) {
                setDimensions({
                    canvasWidth: canvasRef.current.clientWidth || 1,
                    previewWidth: previewContainerRef.current.clientWidth || 1
                });
            }
        };

        // Initial check
        updateDimensions();

        // Observer
        const observer = new ResizeObserver(updateDimensions);
        if (canvasRef.current) observer.observe(canvasRef.current);
        if (previewContainerRef.current) observer.observe(previewContainerRef.current);

        return () => observer.disconnect();
    }, [aspectRatio]); // Re-run when aspect ratio changes container size

    // Reset transform when image changes
    useEffect(() => {
        setBgTransform({ x: 0, y: 0, scale: 1 });
    }, [bgImage]);

    // Handle Zoom (Mouse Wheel) - ONLY when in Reposition Mode
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!isRepositioning) return;
        e.stopPropagation();

        const zoomSensitivity = 0.001;
        const newScale = Math.min(Math.max(1, bgTransform.scale - e.deltaY * zoomSensitivity), 3); // Limit scale 1x to 3x

        setBgTransform(prev => ({ ...prev, scale: newScale }));
    }, [isRepositioning, bgTransform.scale]);

    // Handle Drag End to save position (clamping logic could go here)
    const handleBgDragEnd = (_: any, info: any) => {
        setBgTransform(prev => ({
            ...prev,
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y
        }));
    };

    // Subscribe to Firestore Drafts & Hooks
    useEffect(() => {
        if (!user) return;

        // Drafts
        const qDrafts = query(collection(db, `users/${user.uid}/drafts`), orderBy('timestamp', 'desc'));
        const unsubDrafts = onSnapshot(qDrafts, (snapshot) => {
            setDrafts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Hooks
        const qHooks = query(collection(db, `users/${user.uid}/hooks`), orderBy('timestamp', 'desc'));
        const unsubHooks = onSnapshot(qHooks, (snapshot) => {
            setSavedHooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubDrafts();
            unsubHooks();
        };
    }, [user]);

    const handleSaveHook = useCallback(async () => {
        const hookToSave = selectedHookId ? hooks.find(h => h.id === selectedHookId) : hooks[hooks.length - 1];

        if (!hookToSave) {
            toast.error("No hook layer to save");
            return;
        }

        // 1. Download to Disk (Legacy/Backup)
        const link = document.createElement('a');
        link.href = hookToSave.url;
        link.download = `hook-${concept?.id}-${hookToSave.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 2. Save to Cloud
        if (user) {
            try {
                await addDoc(collection(db, `users/${user.uid}/hooks`), {
                    imageUrl: hookToSave.url,
                    text: hookToSave.text || "Hook",
                    timestamp: serverTimestamp(),
                    conceptId: conceptId || 'unknown'
                });
                toast.success("Hook saved to cloud & disk!");
            } catch (error) {
                console.error("Error saving hook:", error);
                toast.error("Saved to disk, but cloud save failed");
            }
        } else {
            toast.success("Hook saved to disk!");
        }
    }, [selectedHookId, hooks, concept, user, conceptId]);

    // --- HELPERS ---
    const base64ToBlob = (base64: string, mimeType = 'image/png') => {
        try {
            const byteString = atob(base64.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            return new Blob([ab], { type: mimeType });
        } catch (e) {
            console.error("Blob conversion failed", e);
            return null;
        }
    };

    // Prevent Scroll when manipulating
    useEffect(() => {
        if (isResizing || isRepositioning) {
            document.body.style.overscrollBehavior = 'none';
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overscrollBehavior = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overscrollBehavior = '';
            document.body.style.overflow = '';
        };
    }, [isResizing, isRepositioning]);

    const handleSave = useCallback(async () => {
        if (!user) {
            toast.error("You must be logged in to save drafts");
            return;
        }

        let cleanDraftData: any = {};
        let finalBgImage = bgImage;

        try {
            // 1. Capture Current State
            const fullHooksMap = { ...hooksMap, [aspectRatio]: hooks };
            const fullBgTransformsMap = { ...bgTransformsMap, [aspectRatio]: bgTransform };

            // --- PAYLOAD HELPER: Strict Sanitization ---
            const safeNum = (val: any, defaultVal = 0) => {
                const n = Number(val);
                return (isNaN(n) || !isFinite(n)) ? defaultVal : n;
            };

            const cleanHook = (h: any) => ({
                id: String(h?.id ?? Date.now()),
                url: String(h?.url ?? ""),
                x: safeNum(h?.x, 0),
                y: safeNum(h?.y, 0),
                scale: safeNum(h?.scale, 1),
                text: String(h?.text ?? "")
            });

            const cleanTransform = (t: any) => ({
                x: safeNum(t?.x, 0),
                y: safeNum(t?.y, 0),
                scale: safeNum(t?.scale, 1)
            });

            // 2. Batched Sanitization
            const safeHooksMap: Record<string, any[]> = {};
            if (fullHooksMap && typeof fullHooksMap === 'object') {
                Object.entries(fullHooksMap).forEach(([k, v]) => {
                    if (Array.isArray(v)) safeHooksMap[k] = v.map(cleanHook);
                });
            }

            const safeTransformsMap: Record<string, any> = {};
            if (fullBgTransformsMap && typeof fullBgTransformsMap === 'object') {
                Object.entries(fullBgTransformsMap).forEach(([k, v]) => {
                    if (v && typeof v === 'object') safeTransformsMap[k] = cleanTransform(v);
                });
            }

            const safeHooks = hooks.map(cleanHook);

            // 3. Handle Background Image (Upload if Base64)
            if (bgImage && bgImage.startsWith('data:')) {
                // Upload to Storage to avoid Firestore limits
                const blob = base64ToBlob(bgImage);
                if (blob) {
                    const file = new File([blob], `draft-bg-${Date.now()}.png`, { type: 'image/png' });
                    try {
                        toast("Uploading draft image...");
                        const uploaded = await uploadAsset(user.uid, {
                            file,
                            title: `Draft Background (${new Date().toLocaleTimeString()})`,
                            asset_type: 'image',
                            session_id: conceptId || 'thumbnail-studio'
                        });
                        if (uploaded && uploaded.storage_url) {
                            finalBgImage = uploaded.storage_url;
                        }
                    } catch (uploadError) {
                        console.error("Draft image upload failed:", uploadError);
                        // Fallback but warn
                        finalBgImage = "Image Upload Failed (Check Local IDB)";
                        toast.error("Image upload failed, saved text only");
                    }
                }
            }

            const rawDraftData = {
                bgImage: String(finalBgImage || ""),
                hooks: safeHooks,
                hooksMap: JSON.stringify(safeHooksMap), // Stringify to avoid nested entity errors
                bgTransformsMap: JSON.stringify(safeTransformsMap), // Stringify
                lastAspectRatio: aspectRatio,
                prompt: String(concept?.image_prompt || ""),
                conceptId: String(conceptId || 'unknown')
            };

            // NUCLEAR OPTION: Ensure absolutely no non-JSON values (undefined, Prototypes) exist
            cleanDraftData = JSON.parse(JSON.stringify(rawDraftData));

            await addDoc(collection(db, `users/${user.uid}/drafts`), {
                ...cleanDraftData,
                timestamp: serverTimestamp()
            });
            toast.success("Draft saved to cloud!");
        } catch (error: any) {
            console.error("Error saving draft (Main):", error);
            console.log("Failed Payload:", cleanDraftData); // Debug for user console

            // Fallback: Try saving minimal data to isolate the issue
            try {
                await addDoc(collection(db, `users/${user.uid}/drafts`), {
                    bgImage: String(finalBgImage || ""),
                    prompt: "Draft (Recovery)",
                    timestamp: serverTimestamp(),
                    note: "Full save failed due to data validation"
                });
                toast.error("Saved partial draft (Complex data failed). Check Console.");
            } catch (fallbackError) {
                console.error("Fallback Save Failed:", fallbackError);
                toast.error(`Save completely failed: ${error.message}`);
            }
        }
    }, [user, bgImage, hooks, hooksMap, bgTransformsMap, bgTransform, aspectRatio, concept, conceptId]);

    const handleFinalize = async () => {
        if (!bgImage || hooks.length === 0 || !canvasRef.current || !user) return;

        setIsRefining(true);
        try {
            if (bgImage && concept) {
                setHistory(prev => [...prev, { bgImage, hooks, prompt: concept.image_prompt }]);
            }

            const canvasRect = canvasRef.current.getBoundingClientRect();

            const overlays = hooks.map(hook => {
                const element = document.getElementById(`hook-wrapper-${hook.id}`);
                if (!element) return null;

                const rect = element.getBoundingClientRect();
                const relativeTop = (rect.top - canvasRect.top) / canvasRect.height;
                const relativeLeft = (rect.left - canvasRect.left) / canvasRect.width;
                const relativeWidth = rect.width / canvasRect.width;
                const relativeHeight = rect.height / canvasRect.height;

                return {
                    imageUrl: hook.url,
                    relativePosition: { top: relativeTop, left: relativeLeft },
                    relativeDimensions: { width: relativeWidth, height: relativeHeight }
                };
            }).filter(Boolean);

            const response = await fetch('http://localhost:3001/api/composite-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseImage: bgImage,
                    baseImageTransform: {
                        x: bgTransform.x,
                        y: bgTransform.y,
                        scale: bgTransform.scale,
                        canvasWidth: canvasRect.width,
                        canvasHeight: canvasRect.height
                    },
                    overlays: overlays
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "Failed to composite");
            }

            const data = await response.json();
            if (data.imageUrl) {
                // FIXED: Upload to Firebase Storage if Base64 (avoids 1MB limit)
                let storageUrl = data.imageUrl;

                if (data.imageUrl.startsWith('data:')) {
                    const blob = base64ToBlob(data.imageUrl);
                    if (blob) {
                        const file = new File([blob], `final-${Date.now()}-${aspectRatio.replace(':', '-')}.png`, { type: 'image/png' });

                        // Use asset service helper (this creates the DB entry)
                        await uploadAsset(user.uid, {
                            file: file,
                            title: `Thumbnail ${aspectRatio} - ${concept?.title || 'Draft'}`,
                            asset_type: 'thumbnail',
                            description: `Created in Thumbnail Studio (Concept: ${concept?.title})`,
                            session_id: conceptId || 'thumbnail-studio',
                            metadata: {
                                aspectRatio,
                                conceptId: conceptId || 'unknown',
                                source: 'thumbnail_studio'
                            }
                        });
                        // No need to set storageUrl or manual addDoc here, uploadAsset handles it all
                    }
                } else {
                    // It's a remote URL (not base64), so save manually
                    await addDoc(collection(db, 'product_assets'), {
                        user_uuid: user.uid,
                        title: `Thumbnail ${aspectRatio} - ${concept?.title || 'Draft'}`,
                        asset_type: 'thumbnail',
                        storage_url: storageUrl,
                        thumbnail_url: storageUrl,
                        status: 'ready',
                        storage_provider: 'firebase',
                        metadata: {
                            aspectRatio,
                            conceptId: conceptId || 'unknown',
                            source: 'thumbnail_studio'
                        },
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });
                }

                setFinalizedRatios(prev => new Set(prev).add(aspectRatio));
                toast.success(`Saved ${aspectRatio} version to Asset Library!`);
            }
        } catch (error: any) {
            console.error("Finalize Error:", error);
            toast.error(`Finalize failed: ${error.message}`);
        } finally {
            setIsRefining(false);
        }
    };


    const handleNext = useCallback(() => {
        // Validation: Check if all edited ratios have been finalized
        const editedRatios = new Set([...Object.keys(hooksMap), ...Object.keys(bgTransformsMap), aspectRatio]);
        // Filter out any empty/default states if necessary, but strictly:
        const unfinalized = [...editedRatios].filter(r => !finalizedRatios.has(r));

        if (unfinalized.length > 0) {
            const confirmed = window.confirm(
                `Warning: You have unfinalized changes for the following aspect ratios: ${unfinalized.join(', ')}.\n\n` +
                `These versions have NOT been saved to your Asset Library.\n\n` +
                `Do you want to proceed anyway?`
            );
            if (!confirmed) return;
        }

        navigate('/veritas/export-studio');
    }, [navigate, finalizedRatios, hooksMap, bgTransformsMap, aspectRatio]);

    const handleRefineAndGenerate = async () => {
        if (!userInstruction.trim()) return;

        setIsRefining(true);
        try {
            // 0. Save current state to history
            if (bgImage && concept) {
                setHistory(prev => [...prev, { bgImage, hooks, prompt: concept.image_prompt }]);
            }

            // 1. Refine the prompt
            const currentPrompt = concept?.image_prompt || "";
            const newPrompt = await refinePromptWithUserInstruction(currentPrompt, userInstruction);

            // 2. Generate new image
            // We reuse the existing assets logic but with the new prompt
            const assets = [];
            if (visualMessengerState?.mode === 'user' && visualMessengerState.currentUrl) {
                assets.push({ url: visualMessengerState.currentUrl, mimeType: 'image/jpeg' });
            } else {
                const avatarAsset = strategyContext?.selectedAssets?.find(a => a.name.toLowerCase().includes('avatar') || a.role === 'hero');
                if (avatarAsset && avatarAsset.url) assets.push({ url: avatarAsset.url, mimeType: 'image/jpeg' });
            }
            const productAssets = strategyContext?.selectedAssets || [];
            productAssets.forEach(asset => {
                if (asset.url && !assets.some(a => a.url === asset.url)) {
                    assets.push({ url: asset.url, mimeType: 'image/jpeg' });
                }
            });

            const imageUrl = await generateContent(newPrompt.replace(/\b(Text|Hook|Title|Words?|Caption):\s*.*$/gim, ""), assets, aspectRatio); // Aggressive strip for refine

            // 3. Update state
            if (imageUrl) {
                setThumbnailState({ bgImage: imageUrl });
                // Update the concept's prompt too
                if (concept) concept.image_prompt = newPrompt;
                toast.success("Image updated!");
            }

            setUserInstruction("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update image");
        } finally {
            setIsRefining(false);
        }
    };

    const handleRegenerateFromScratch = async () => {
        setIsRefining(true);
        try {
            // 0. Save current state to history
            if (bgImage && concept) {
                setHistory(prev => [...prev, { bgImage, hooks, prompt: concept.image_prompt }]);
            }

            // 1. Gather assets
            const assets = [];
            if (visualMessengerState?.mode === 'user' && visualMessengerState.currentUrl) {
                assets.push({ url: visualMessengerState.currentUrl, mimeType: 'image/jpeg' });
            } else {
                const avatarAsset = strategyContext?.selectedAssets?.find(a => a.name.toLowerCase().includes('avatar') || a.role === 'hero');
                if (avatarAsset && avatarAsset.url) assets.push({ url: avatarAsset.url, mimeType: 'image/jpeg' });
            }
            const productAssets = strategyContext?.selectedAssets || [];
            productAssets.forEach(asset => {
                if (asset.url && !assets.some(a => a.url === asset.url)) {
                    assets.push({ url: asset.url, mimeType: 'image/jpeg' });
                }
            });

            // 2. Generate with CURRENT concept prompt
            // NOTE: We do NOT force text rendering anymore as it is handled by the separate hook layer.
            let promptToUse = concept?.image_prompt || "";
            promptToUse = promptToUse.replace(/\b(Text|Hook|Title|Words?|Caption):\s*["“][^"”]*["”]/gi, "");
            promptToUse = promptToUse.replace(/\b(Text|Hook|Title|Words?|Caption):\s*[^,.]+/gi, "");
            promptToUse = promptToUse.replace(/\s{2,}/g, " ").trim();

            const imageUrl = await generateContent(promptToUse, assets, aspectRatio);

            // 3. Update state
            if (imageUrl) {
                // Generate Hook in parallel or sequence
                let newHooks = [];
                try {
                    const hookRes = await fetch('http://localhost:3001/api/generate-transparent-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: concept.hook_text || "HOOK",
                            stylePrompt: "bold, white, viral style, high contrast",
                            layout: textLayout // Pass textLayout for the main hook
                        })
                    });
                    const hookData = await hookRes.json();
                    if (hookData.imageUrl) {
                        newHooks.push({
                            id: Date.now().toString(),
                            url: hookData.imageUrl,
                            x: 0.5,
                            y: 0.5,
                            scale: 1,
                            text: concept.hook_text
                        });
                    }
                } catch (e) {
                    console.error("Failed to auto-generate hook:", e);
                }

                setThumbnailState({ bgImage: imageUrl, hooks: newHooks });
                setHooks(newHooks); // Sync local state
                if (newHooks.length > 0) setSelectedHookId(newHooks[0].id);
                toast.success("Regenerated from scratch!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to regenerate");
        } finally {
            setIsRefining(false);
        }
    };

    const handleUpdateHook = async (hookId: string, newText: string, stylePrompt?: string, layoutOverride?: 'horizontal' | 'vertical') => {
        setIsRefining(true);
        try {
            // Find current hook to get position/scale if needed, or just update text
            const hook = hooks.find(h => h.id === hookId);
            if (!hook) return;

            const response = await fetch('http://localhost:3001/api/generate-transparent-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newText,
                    stylePrompt: stylePrompt || hookStyleInstruction || "bold, white, viral style, high contrast",
                    layout: layoutOverride || textLayout // Use layoutOverride if provided, otherwise textLayout
                })
            });

            const data = await response.json();
            if (data.imageUrl) {
                setHooks(prev => prev.map(h =>
                    h.id === hookId ? { ...h, url: data.imageUrl, text: newText } : h
                ));
                toast.success("Hook updated!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update hook");
        } finally {
            setIsRefining(false);
        }
    };

    const handleRerollHook = async (hookId: string) => {
        const hook = hooks.find(h => h.id === hookId);
        if (!hook) return;
        await handleUpdateHook(hookId, hook.text || "HOOK");
    };

    const handleDeleteHook = (hookId: string) => {
        setHooks(prev => prev.filter(h => h.id !== hookId));
        if (selectedHookId === hookId) setSelectedHookId(null);
        toast.success("Layer deleted");
    };

    const handleAddLayer = async () => {
        if (!newLayerText.trim()) return;
        await handleRegenerateHook(newLayerText);
        setNewLayerText("");
    };

    const handleConvertPendingHook = async (pendingId: string, text: string) => {
        await handleRegenerateHook(text);
        setPendingHooks(prev => prev.filter(h => h.id !== pendingId));
    };

    // Inject Header Actions
    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-4">
                <Select
                    value={aspectRatio}
                    onValueChange={(val: any) => setAspectRatio(val)}
                >
                    <SelectTrigger className="w-[240px] bg-zinc-900 border-white/10 text-white">
                        <SelectValue placeholder="Select Canvas" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="16:9">Youtube canvas (16:9)</SelectItem>
                        <SelectItem value="9:16">Shorts / Reels / TikTok (9:16)</SelectItem>
                        <SelectItem value="4:5">Instagram / LinkedIn (4:5)</SelectItem>
                        <SelectItem value="1:1">Square Post (1:1)</SelectItem>
                        <SelectItem value="1.91:1">Generic Horizontal (1.91:1)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Drafts & Upload Menu */}
                <div className="relative">
                    <Button
                        variant="outline"
                        className={`border-white/10 text-zinc-400 hover:text-white ${isDraftMenuOpen ? 'bg-white/10 text-white' : ''}`}
                        onClick={() => setIsDraftMenuOpen(!isDraftMenuOpen)}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Drafts & Saves
                    </Button>

                    {/* Click Menu for Drafts */}
                    {isDraftMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-xl p-4 z-50">
                            {/* Primary Save Action */}
                            <Button
                                className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                    handleSave();
                                    setIsDraftMenuOpen(false);
                                }}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Current Version
                            </Button>

                            <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider border-t border-white/10 pt-4">Restore & Upload</h4>

                            {/* Upload Option */}
                            <div className="mb-4 pb-4 border-b border-white/10 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors text-sm p-2 hover:bg-white/5 rounded-lg">
                                    <Upload className="w-4 h-4" />
                                    <div>
                                        <span className="block font-medium">Upload Background</span>
                                        <span className="text-[10px] text-zinc-500">Replaces current background</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    if (ev.target?.result) {
                                                        setThumbnailState({ bgImage: ev.target.result as string });
                                                        toast.success("Image uploaded as background");
                                                        setIsDraftMenuOpen(false);
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors text-sm p-2 hover:bg-white/5 rounded-lg">
                                    <Upload className="w-4 h-4" />
                                    <div>
                                        <span className="block font-medium">Upload Hook Layer</span>
                                        <span className="text-[10px] text-zinc-500">Adds new layer</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    if (ev.target?.result) {
                                                        const newHook = {
                                                            id: Date.now().toString(),
                                                            url: ev.target.result as string,
                                                            x: 0.5,
                                                            y: 0.5,
                                                            scale: 1,
                                                            text: "Uploaded Layer"
                                                        };
                                                        setHooks(prev => [...prev, newHook]);
                                                        setSelectedHookId(newHook.id);
                                                        toast.success("Hook layer added");
                                                        setIsDraftMenuOpen(false);
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            {/* Save Hook Action */}
                            <div className="mb-4 pb-4 border-b border-white/10">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5"
                                    onClick={() => {
                                        handleSaveHook();
                                        setIsDraftMenuOpen(false);
                                    }}
                                    disabled={hooks.length === 0}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Current Hook Layer
                                </Button>
                            </div>

                            {/* Saved Drafts List */}
                            <div className="space-y-2 max-h-32 overflow-y-auto mb-4 border-b border-white/10 pb-2">
                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Full Drafts</h5>
                                {drafts.map((draft) => (
                                    <div key={draft.id} className="flex items-center justify-between group/item p-1 hover:bg-white/5 rounded">
                                        <button
                                            onClick={() => {
                                                setThumbnailState({ bgImage: draft.bgImage, hooks: draft.hooks || [] });
                                                if (concept) concept.image_prompt = draft.prompt;
                                                toast.success("Draft loaded!");
                                                setIsDraftMenuOpen(false);
                                            }}
                                            className="text-sm text-zinc-400 hover:text-white truncate text-left flex-1"
                                        >
                                            {draft.timestamp?.toDate ? draft.timestamp.toDate().toLocaleTimeString() : 'Just now'} - {draft.prompt.substring(0, 15)}...
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!user) return;
                                                try {
                                                    await deleteDoc(doc(db, `users/${user.uid}/drafts`, draft.id));
                                                    toast.success("Draft deleted");
                                                } catch (error) {
                                                    console.error("Error deleting draft:", error);
                                                }
                                            }}
                                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 px-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {drafts.length === 0 && (
                                    <p className="text-xs text-zinc-600 italic">No saved drafts</p>
                                )}
                            </div>

                            {/* Saved Hooks List */}
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Saved Hooks</h5>
                                {savedHooks.map((hook) => (
                                    <div key={hook.id} className="flex items-center justify-between group/item p-1 hover:bg-white/5 rounded">
                                        <button
                                            onClick={() => {
                                                const newHook = {
                                                    id: Date.now().toString(),
                                                    url: hook.imageUrl,
                                                    x: 0.5,
                                                    y: 0.5,
                                                    scale: 1,
                                                    text: hook.text
                                                };
                                                setHooks(prev => [...prev, newHook]);
                                                setSelectedHookId(newHook.id);
                                                toast.success("Hook added!");
                                                setIsDraftMenuOpen(false);
                                            }}
                                            className="text-sm text-zinc-400 hover:text-white truncate text-left flex-1"
                                        >
                                            {hook.timestamp?.toDate ? hook.timestamp.toDate().toLocaleTimeString() : 'Just now'} - {hook.text}
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!user) return;
                                                try {
                                                    await deleteDoc(doc(db, `users/${user.uid}/hooks`, hook.id));
                                                    toast.success("Hook deleted");
                                                } catch (error) {
                                                    console.error("Error deleting hook:", error);
                                                }
                                            }}
                                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 px-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {savedHooks.length === 0 && (
                                    <p className="text-xs text-zinc-600 italic">No saved hooks</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Finalize Button - Always visible if images exist */}
                {bgImage && hooks.length > 0 && (
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleFinalize}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalize
                    </Button>
                )}
                <Button className="bg-white text-black hover:bg-zinc-200" onClick={handleNext}>
                    Next: Export
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );

        // Cleanup on unmount
        return () => setHeaderActions(null);
    }, [aspectRatio, isDraftMenuOpen, drafts, savedHooks, user, concept, handleSave, handleNext, setHeaderActions, setThumbnailState, setHooks, setSelectedHookId]);

    if (!concept) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Concept Not Found</h2>
                    <Button onClick={() => navigate('/veritas/thumbnail-composer')}>
                        Back to Selection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center Canvas & Edit Stack */}
                <div className="flex-1 bg-[#0a0a0a] relative flex flex-col overflow-y-auto">
                    {/* Header for Title Alignment */}
                    <div className="flex items-center justify-start gap-4 w-full px-6 pt-4 pb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/veritas/thumbnail-composer')}
                            className="text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <h3 className="font-display text-3xl text-white">Thumbnail Studio</h3>
                        <div className="ml-auto flex items-center gap-2">
                            {/* Reposition Toggle */}
                            <Button
                                variant={isRepositioning ? "default" : "secondary"}
                                size="sm"
                                className={`gap-2 ${isRepositioning ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                                onClick={() => setIsRepositioning(!isRepositioning)}
                            >
                                <Move className="w-4 h-4" />
                                {isRepositioning ? "Done" : "Reposition"}
                            </Button>
                        </div>
                    </div>

                    {/* Canvas Display */}
                    <div className="flex-1 flex items-center justify-center p-4 relative min-h-[500px]">
                        <div
                            ref={canvasRef}
                            className={`relative w-full ${aspectRatio === '16:9' ? 'aspect-video max-w-5xl' :
                                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-full max-w-md' :
                                    aspectRatio === '1:1' ? 'aspect-square max-h-full max-w-2xl' :
                                        aspectRatio === '4:5' ? 'aspect-[4/5] max-h-full max-w-xl' :
                                            'aspect-[1.91/1] max-w-5xl'
                                } bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-white/10 group transition-all duration-300`}
                        >
                            {bgImage && !bgImage.includes('Image+Not+Persisted') ? (

                                <motion.div
                                    className="w-full h-full relative overflow-hidden flex items-center justify-center bg-zinc-950" // Flex center + Dark bg
                                    onWheel={handleWheel}
                                >
                                    <motion.img
                                        src={bgImage}
                                        onLoad={(e) => {
                                            const img = e.currentTarget;
                                            // Determine natural aspect ratio
                                            const ratio = img.naturalWidth / img.naturalHeight;

                                            // What is the container's ratio?
                                            // We can approximate or just use the logic:
                                            // If (imageRatio > containerRatio) -> Height constrained (h-full)
                                            // But container is fluid. 
                                            // Simpler heuristic:
                                            // We apply 'object-cover' manually.
                                            // If we set `min-width: 100%` and `min-height: 100%` and `flex-shrink: 0`,
                                            // it might cover? No.

                                            // Let's rely on the CSS 'min-width/min-height' trick for 'cover' behavior in Flexbox?
                                            // Actually, `object-fit: cover` logic is:
                                            // max(width_scale, height_scale).

                                            // Let's assume we want to start centered.
                                            // We will toggle classes based on a comparison if we can get container rect.
                                            // Or simplified: `min-w-full min-h-full max-w-none max-h-none` using `object-fit`?
                                            // NO, `object-fit` clips inside.

                                            // CORRECT APPROACH:
                                            // We need to compare `ratio` to `canvasRef.current` ratio.
                                            if (canvasRef.current) {
                                                const canvas = canvasRef.current.getBoundingClientRect();
                                                const canvasRatio = canvas.width / canvas.height;

                                                if (ratio > canvasRatio) {
                                                    // Image is wider than container -> Height defines fit -> h-full
                                                    setImageConstraints({ width: 0, height: 0, orientation: 'landscape' });
                                                } else {
                                                    // Image is taller -> Width defines fit -> w-full
                                                    setImageConstraints({ width: 0, height: 0, orientation: 'portrait' });
                                                }
                                            }
                                        }}
                                        // The 'Highlander Cover' Logic:
                                        // If landscape orientation (wider than box), we want height: 100%, width: auto
                                        // If portrait orientation (taller than box), we want width: 100%, height: auto
                                        className={`
                                            ${imageConstraints.orientation === 'landscape' ? 'h-full w-auto max-w-none' : 'w-full h-auto max-h-none'}
                                            ${isRepositioning ? 'cursor-move' : ''}
                                            flex-shrink-0
                                        `}
                                        style={{
                                            // Ensure it renders correctly even before JS loads constraints?
                                            // Default to 'min-w-full min-h-full' to prevent gaps?
                                            // No, that might distort.
                                        }}
                                        alt="Generated Thumbnail"
                                        onError={(e) => console.error("❌ Image Load Error:", e)}

                                        // Drag Logic
                                        drag={isRepositioning}
                                        dragMomentum={false}
                                        onDragEnd={handleBgDragEnd}

                                        // Animation / Transform Application
                                        animate={{
                                            x: bgTransform.x,
                                            y: bgTransform.y,
                                            scale: bgTransform.scale
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto animate-pulse">
                                            <Sparkles className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <p className="text-zinc-500 font-mono text-sm">
                                            {bgImage?.includes('Image+Not+Persisted') ? "Image not saved locally. Check Drafts." : "Generating your masterpiece..."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Hook Text Layers */}
                            {hooks.map((hook) => (
                                <HookLayer
                                    key={hook.id}
                                    hook={hook}
                                    canvasRef={canvasRef}
                                    isResizing={isResizing}
                                    onUpdate={(newHook: any) => setHooks(prev => prev.map(h => h.id === newHook.id ? newHook : h))}
                                    onSelect={() => setSelectedHookId(hook.id)}
                                    isSelected={selectedHookId === hook.id}
                                    onResizeStart={handleResizePointerDown}
                                    onDelete={() => handleDeleteHook(hook.id)}
                                />
                            ))}


                            {/* Loading Overlay */}
                            {(isGenerating || isRefining) && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div className="text-center space-y-4">
                                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                                        <p className="text-zinc-400 font-mono animate-pulse">
                                            {isRefining ? "Refining Prompt..." : "Rendering Pixels..."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Stack */}
                    <div className="w-full max-w-5xl mx-auto space-y-4 mt-6 px-6 pb-12">
                        {/* Image Edit Card */}
                        <EditCard
                            label="Image"
                            value={userInstruction}
                            onChange={setUserInstruction}
                            onReroll={handleRegenerateFromScratch}
                            onRevert={handleUndo}
                            onSend={handleRefineAndGenerate}
                            isProcessing={isRefining}
                            showAddReference={true}
                            placeholder="e.g., Make it brighter, add a laptop, change background..."
                        />

                        {/* Text Layers Section */}
                        <div className="space-y-3">
                            {/* Main Hook Card (Instruction Based) */}
                            <EditCard
                                label="Main Hook"
                                value={mainHookInstruction}
                                onChange={setMainHookInstruction}
                                onReroll={() => hooks.length > 0 ? handleRerollHook(hooks[0].id) : handleRegenerateHook(placeholderHookText)}
                                onRevert={hooks.length > 0 ? () => handleRevertHook(hooks[0].id) : () => { }}
                                onSend={() => hooks.length > 0 ? handleUpdateHook(hooks[0].id, hooks[0].text || "", mainHookInstruction, textLayout) : handleRegenerateHook(placeholderHookText)}
                                onDelete={() => {
                                    if (hooks.length > 0) handleDeleteHook(hooks[0].id);
                                    setMainHookInstruction(""); // Always clear input
                                }}
                                isProcessing={isRefining}
                                placeholder="e.g., Make hook neon green, make it cursive..."
                                extraActions={
                                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/10 mr-2">
                                        <button
                                            onClick={() => setTextLayout('horizontal')}
                                            className={`p-1.5 rounded ${textLayout === 'horizontal' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            title="Horizontal"
                                        >
                                            <LayoutTemplate className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setTextLayout('vertical')}
                                            className={`p-1.5 rounded ${textLayout === 'vertical' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            title="Vertical"
                                        >
                                            <LayoutTemplate className="w-4 h-4 rotate-90" />
                                        </button>
                                    </div>
                                }
                            />

                            {/* Add Text Layer Card */}
                            <EditCard
                                label="Add Text Layer"
                                value={newLayerText}
                                onChange={setNewLayerText}
                                onReroll={() => { }}
                                onRevert={() => setNewLayerText("")}
                                onSend={handleAddLayer}
                                onDelete={() => setNewLayerText("")} // Clear text
                                isProcessing={isRefining}
                                placeholder="e.g., 50% OFF, Link in Bio..."
                                extraActions={
                                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/10 mr-2">
                                        <button
                                            onClick={() => setNewLayerLayout('horizontal')}
                                            className={`p-1.5 rounded ${newLayerLayout === 'horizontal' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            title="Horizontal"
                                        >
                                            <LayoutTemplate className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setNewLayerLayout('vertical')}
                                            className={`p-1.5 rounded ${newLayerLayout === 'vertical' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            title="Vertical"
                                        >
                                            <LayoutTemplate className="w-4 h-4 rotate-90" />
                                        </button>
                                    </div>
                                }
                            />

                            {/* Additional Layers (Edit Existing) */}
                            {hooks.slice(1).map((hook, index) => (
                                <EditCard
                                    key={hook.id}
                                    label={`Layer ${index + 2}`}
                                    value={hook.text || ""}
                                    onChange={(val) => setHooks(prev => prev.map(h => h.id === hook.id ? { ...h, text: val } : h))}
                                    onReroll={() => handleRerollHook(hook.id)}
                                    onRevert={() => handleRevertHook(hook.id)}
                                    onSend={() => handleUpdateHook(hook.id, hook.text || "")}
                                    onDelete={() => handleDeleteHook(hook.id)}
                                    isProcessing={isRefining}
                                    placeholder="Edit layer text..."
                                />
                            ))}

                            {/* Pending Hooks (from manual add button if used) */}
                            {pendingHooks.map((pending) => (
                                <EditCard
                                    key={pending.id}
                                    label="New Layer"
                                    value={pending.text}
                                    onChange={(val) => setPendingHooks(prev => prev.map(h => h.id === pending.id ? { ...h, text: val } : h))}
                                    onReroll={() => { }} // No reroll for pending
                                    onRevert={() => setPendingHooks(prev => prev.filter(h => h.id !== pending.id))} // Revert = Delete for pending
                                    onSend={() => handleConvertPendingHook(pending.id, pending.text)}
                                    onDelete={() => setPendingHooks(prev => prev.filter(h => h.id !== pending.id))}
                                    isProcessing={isRefining}
                                    isPending={true}
                                    placeholder="Type text for new layer..."
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Preview) */}
                <div className="w-96 border-l border-white/10 bg-black p-2 flex flex-col items-center justify-start pt-4">
                    <div className="flex items-center justify-between w-full mb-2 px-2">
                        <h3 className="font-display text-3xl text-white">Platform Preview</h3>
                    </div>

                    {/* Smartphone/Platform Preview Frame */}
                    <div className="w-[380px] h-[760px] bg-black rounded-[3rem] border-8 border-zinc-800 overflow-hidden relative shadow-2xl scale-90 origin-top">
                        <div className="absolute top-0 left-0 right-0 h-6 bg-black z-20 flex justify-center">
                            <div className="w-32 h-4 bg-black rounded-b-xl"></div>
                        </div>
                        <div className="h-full bg-white text-black overflow-hidden flex flex-col">
                            {/* Status Bar */}
                            <div className="h-12 bg-[#0f172a] text-white flex items-end justify-between px-6 pb-2 text-xs font-medium">
                                <span>9:41</span>
                                <span>5G 100%</span>
                            </div>

                            {/* Scrollable Feed Area */}
                            <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#f3f2ef]">
                                {/* LinkedIn App Header */}
                                <div className="bg-white px-4 py-2 flex items-center gap-3 border-b border-zinc-200 sticky top-0 z-30">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden">
                                        {/* Profile Pic Placeholder */}
                                        <div className="w-full h-full bg-zinc-300" />
                                    </div>
                                    <div className="flex-1 h-8 bg-[#eef3f8] rounded-md flex items-center px-3 gap-2">
                                        <Search className="w-4 h-4 text-zinc-500" />
                                        <span className="text-sm text-zinc-500">Search</span>
                                    </div>
                                    <MessageSquare className="w-6 h-6 text-zinc-600 flex-shrink-0" />
                                </div>

                                {/* Feed Item */}
                                <div className="bg-white mb-2 pb-2">
                                    {/* Post Header */}
                                    <div className="flex items-start justify-between px-4 pt-4 pb-2">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 font-bold overflow-hidden">
                                                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : "User"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-semibold text-zinc-900 leading-tight">Premium SaaS Growth</span>
                                                    <span className="text-zinc-500 text-xs">• 1st</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 leading-tight">Helping founders scale • 2h • <span className="opacity-60">🌐</span></p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 px-0 text-purple-600 font-semibold hover:bg-transparent">+ Follow</Button>
                                    </div>

                                    {/* Post Text */}
                                    <div className="px-4 pb-2">
                                        <p className="text-sm text-zinc-800">
                                            Stop guessing with your thumbnails. Use data-backed psychology to drive clicks. <br /><br />
                                            Here’s exactly how we do it...
                                            <span className="text-zinc-500"> ...see more</span>
                                        </p>
                                    </div>

                                    {/* Thumbnail Preview Area */}
                                    <div
                                        ref={previewContainerRef}
                                        className={`bg-zinc-100 overflow-hidden relative w-full ${aspectRatio === '16:9' ? 'aspect-video' :
                                            aspectRatio === '9:16' ? 'aspect-[9/16]' :
                                                aspectRatio === '1:1' ? 'aspect-square' :
                                                    aspectRatio === '4:5' ? 'aspect-[4/5]' :
                                                        'aspect-[1.91/1]'
                                            }`}>
                                        {bgImage ? (
                                            <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-zinc-200">
                                                <motion.img
                                                    src={bgImage}
                                                    className={`
                                                    ${imageConstraints.orientation === 'landscape' ? 'h-full w-auto max-w-none' : 'w-full h-auto max-h-none'}
                                                    flex-shrink-0
                                                `}
                                                    // Sync Transform!
                                                    style={{
                                                        transform: `translate(${bgTransform.x * (dimensions.previewWidth / dimensions.canvasWidth)}px, ${bgTransform.y * (dimensions.previewWidth / dimensions.canvasWidth)}px) scale(${bgTransform.scale})`
                                                    }}
                                                    alt="Preview"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-zinc-200" />
                                        )}

                                        {/* Hook Layer on Preview */}
                                        {hooks.map(hook => (
                                            <HookLayer
                                                key={hook.id}
                                                hook={hook}
                                                // canvasRef not needed for readOnly, but passing null or dummy ref if needed by types (it's 'any' so null is fine)
                                                canvasRef={{ current: null }}
                                                isResizing={false}
                                                readOnly={true}
                                                onUpdate={() => { }}
                                                onSelect={() => { }}
                                                isSelected={false}
                                                onResizeStart={() => { }}
                                                onResizeMove={() => { }}
                                                onResizeEnd={() => { }}
                                                onDelete={() => { }}
                                            />
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 mt-1">
                                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                            <ThumbsUp className="w-5 h-5 text-zinc-500 group-hover:text-zinc-700" />
                                            <span className="text-xs font-medium text-zinc-500">Like</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                            <MessageSquareText className="w-5 h-5 text-zinc-500 group-hover:text-zinc-700" />
                                            <span className="text-xs font-medium text-zinc-500">Comment</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                            <Repeat2 className="w-5 h-5 text-zinc-500 group-hover:text-zinc-700" />
                                            <span className="text-xs font-medium text-zinc-500">Repost</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                            <Send className="w-5 h-5 text-zinc-500 group-hover:text-zinc-700" />
                                            <span className="text-xs font-medium text-zinc-500">Send</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fake Next Post */}
                                <div className="bg-white h-40 w-full p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-200" />
                                        <div className="w-32 h-4 bg-zinc-100 rounded" />
                                    </div>
                                    <div className="w-full h-16 bg-zinc-50 rounded" />
                                </div>
                            </div>

                            {/* LinkedIn App Footer */}
                            <div className="h-[60px] bg-white border-t border-zinc-200 flex items-center justify-between px-6 pb-2">
                                <div className="flex flex-col items-center gap-1 cursor-pointer">
                                    <Home className="w-6 h-6 text-black fill-black" />
                                    <span className="text-[10px] text-black font-medium">Home</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 cursor-pointer">
                                    <Users className="w-6 h-6 text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500">My Network</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 cursor-pointer">
                                    <PlusSquare className="w-6 h-6 text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500">Post</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 cursor-pointer">
                                    <Bell className="w-6 h-6 text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500">Notifications</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 cursor-pointer">
                                    <Briefcase className="w-6 h-6 text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500">Jobs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

function EditCard({
    label,
    value,
    onChange,
    onReroll,
    onRevert,
    onSend,
    onDelete,
    isProcessing,
    showAddReference = false,
    isPending = false,
    placeholder = "Enter text...",
    extraActions
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    onReroll: () => void;
    onRevert: () => void;
    onSend: () => void;
    onDelete?: () => void;
    isProcessing: boolean;
    showAddReference?: boolean;
    isPending?: boolean;
    placeholder?: string;
    extraActions?: React.ReactNode;
}) {
    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            {/* Label / Icon Area */}
            <div className="w-24 flex flex-col gap-1">
                <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>

            {/* Input Area */}
            <div className="flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-base text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {showAddReference && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-purple-400 hover:text-purple-300"
                        title="Add Reference Image"
                    >
                        <ImagePlus className="w-5 h-5" />
                    </Button>
                )}
                {extraActions}

                {/* Send / Update Button (Swapped Position) */}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onSend}
                    disabled={isProcessing}
                    className="h-8 w-8 text-purple-400 hover:text-purple-300"
                    title="Edit / Update"
                >
                    <Send className="w-5 h-5" />
                </Button>

                {/* Re-roll / Regenerate Button (Destructive Warning) */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            disabled={isProcessing}
                            className="h-8 w-8 text-zinc-400 hover:text-white"
                            title="Re-roll (Regenerate)"
                        >
                            <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Regenerate Image?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                                This will completely regenerate the image from the original prompt. To make edits, use the Edit button.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700 border-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onReroll} className="bg-purple-600 hover:bg-purple-700 text-white">Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onRevert}
                    disabled={isProcessing}
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                    title="Revert"
                >
                    <Undo2 className="w-5 h-5" />
                </Button>
                {onDelete && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onDelete}
                        disabled={isProcessing}
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        title="Delete"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
