import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getAllUserSessions, getAvatarsForSession, getOrphanedAvatars, getAllAvatarsForUser } from "@/lib/database-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User,
    Users,
    ChevronDown,
    Loader2,
    AlertTriangle,
    Check,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarData {
    id: string;
    name: string;
    photo_url?: string;
    occupation?: string;
    pain_points?: string[];
    icp_session_id: string | null;  // Can be null for orphaned avatars
}

interface SessionData {
    id: string;
    user_name?: string;
    created_at?: string;
    completed?: boolean;
}

interface AvatarSelectorProps {
    selectedAvatar: AvatarData | null;
    onAvatarSelect: (avatar: AvatarData) => void;
    onSessionSwitch?: (sessionId: string, avatars: AvatarData[]) => void;
    /** If true, hides session warning icons and dialogs (for Landing Pad use) */
    disableSessionWarnings?: boolean;
}

export function AvatarSelector({
    selectedAvatar,
    onAvatarSelect,
    onSessionSwitch,
    disableSessionWarnings = false
}: AvatarSelectorProps) {
    const { appState, setSessionId, setAvatarData, setAvatarDataList } = useApp();

    const [isLoading, setIsLoading] = useState(false);
    const [allAvatars, setAllAvatars] = useState<AvatarData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [showSessionSwitchDialog, setShowSessionSwitchDialog] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState<AvatarData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Load all avatars from all sessions on mount
    useEffect(() => {
        loadAllAvatars();
    }, [appState.userId]);

    const loadAllAvatars = async () => {
        if (!appState.userId) return;

        setIsLoading(true);
        try {
            // Get all user sessions
            const userSessions = await getAllUserSessions(appState.userId);

            // Store all sessions (both completed and incomplete) for reference
            setSessions(userSessions.filter(s => s.completed));

            // Fetch avatars from all completed sessions
            const avatarPromises = userSessions
                .filter(s => s.completed)
                .map(session => getAvatarsForSession(session.id));

            const avatarArrays = await Promise.all(avatarPromises);

            // Also fetch orphaned avatars (those with NULL icp_session_id)
            const orphanedAvatars = await getOrphanedAvatars();
            console.log('[AvatarSelector] Found orphaned avatars:', orphanedAvatars.length);

            // Combine session avatars and orphaned avatars
            const allFetchedAvatars = [...avatarArrays.flat(), ...orphanedAvatars];

            // Extra safety filter - ensure no deleted avatars slip through
            // Note: getAvatarsForSession already filters deleted_at, but this is a safety net
            const flatAvatars = allFetchedAvatars
                .filter(Boolean)
                .filter((avatar: any) => {
                    // Explicitly check that deleted_at doesn't exist or is null/undefined
                    const isDeleted = avatar.deleted_at !== undefined && avatar.deleted_at !== null;
                    if (isDeleted) {
                        console.log('[AvatarSelector] Filtering out deleted avatar:', avatar.name, avatar.deleted_at);
                    }
                    return !isDeleted;
                }) as AvatarData[];

            console.log('[AvatarSelector] Loaded avatars:', flatAvatars.map(a => ({
                id: a.id,
                name: a.name,
                icp_session_id: a.icp_session_id,
                deleted_at: (a as any).deleted_at
            })));
            console.log('[AvatarSelector] Current appState.sessionId:', appState.sessionId);

            setAllAvatars(flatAvatars);

            // If no avatars found but user has sessions, try the getAllAvatarsForUser approach
            if (flatAvatars.length === 0 && userSessions.length > 0) {
                console.log('[AvatarSelector] No avatars found via session lookup, trying direct user lookup');
                const userAvatars = await getAllAvatarsForUser(appState.userId);
                if (userAvatars.length > 0) {
                    setAllAvatars(userAvatars as AvatarData[]);
                    console.log('[AvatarSelector] Found avatars via direct user lookup:', userAvatars.length);
                }
            }
        } catch (error) {
            console.error("Error loading avatars:", error);
            toast.error("Failed to load avatars");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = (avatar: AvatarData) => {
        console.log('[AvatarSelector] handleAvatarClick:', {
            avatarName: avatar.name,
            avatarId: avatar.id,
            avatarSessionId: avatar.icp_session_id,
            selectedAvatarSessionId: selectedAvatar?.icp_session_id,
            disableSessionWarnings
        });

        // If warnings disabled, or no avatar selected yet, or same session - just select it
        if (disableSessionWarnings || !selectedAvatar || avatar.icp_session_id === selectedAvatar.icp_session_id) {
            onAvatarSelect(avatar);
            setIsExpanded(false);
        } else {
            // Different session than currently selected - show confirmation dialog
            setPendingAvatar(avatar);
            setShowSessionSwitchDialog(true);
        }
    };

    const handleConfirmSessionSwitch = async () => {
        if (!pendingAvatar) return;

        setIsLoading(true);
        try {
            // Handle orphaned avatars (null session ID) - just select without session switch
            if (!pendingAvatar.icp_session_id) {
                setAvatarData(pendingAvatar);
                onAvatarSelect(pendingAvatar);
                toast.info(`Selected ${pendingAvatar.name} - this avatar needs to be linked to a session`);
            } else {
                // Load avatars for the new session
                const sessionAvatars = await getAvatarsForSession(pendingAvatar.icp_session_id);

                // Update app state with new session
                setSessionId(pendingAvatar.icp_session_id);
                setAvatarDataList(sessionAvatars);
                setAvatarData(pendingAvatar);

                // Notify parent component
                if (onSessionSwitch) {
                    onSessionSwitch(pendingAvatar.icp_session_id, sessionAvatars);
                }

                onAvatarSelect(pendingAvatar);
                toast.success(`Switched to session with ${sessionAvatars.length} avatar(s)`);
            }
        } catch (error) {
            console.error("Error switching session:", error);
            toast.error("Failed to switch session");
        } finally {
            setIsLoading(false);
            setShowSessionSwitchDialog(false);
            setPendingAvatar(null);
            setIsExpanded(false);
        }
    };

    // Separate orphaned avatars from session-linked avatars
    const orphanedAvatars = allAvatars.filter(a => !a.icp_session_id);
    const linkedAvatars = allAvatars.filter(a => a.icp_session_id);

    // Group linked avatars by session
    const avatarsBySession = linkedAvatars.reduce((acc, avatar) => {
        const sessionId = avatar.icp_session_id!;
        if (!acc[sessionId]) {
            acc[sessionId] = [];
        }
        acc[sessionId].push(avatar);
        return acc;
    }, {} as Record<string, AvatarData[]>);

    const getSessionLabel = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return "Unknown Session";

        const date = session.created_at
            ? new Date(session.created_at).toLocaleDateString()
            : "Unknown date";

        return `Session: ${date}`;
    };

    // Determine if an avatar is from the "current" session for warning display
    const isCurrentSession = (avatarSessionId: string) => {
        // If warnings disabled, always return true (no warnings shown)
        if (disableSessionWarnings) return true;

        // If no avatar is selected yet, don't show any warnings
        if (!selectedAvatar) return true;

        // Compare against the selected avatar's session
        return avatarSessionId === selectedAvatar.icp_session_id;
    };

    return (
        <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                <Users className="w-3 h-3" />
                Select Avatar
            </Label>

            {/* Selected Avatar Display */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    isExpanded
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                )}
            >
                {selectedAvatar ? (
                    <>
                        <Avatar className="w-10 h-10 border border-primary/20">
                            <AvatarImage src={selectedAvatar.photo_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {selectedAvatar.name?.charAt(0) || "A"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {selectedAvatar.name}
                            </p>
                            {selectedAvatar.occupation && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {selectedAvatar.occupation}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                Select an avatar...
                            </p>
                        </div>
                    </>
                )}
                <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                )} />
            </button>

            {/* Expanded Avatar List */}
            {isExpanded && (
                <div className="border border-border rounded-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {isLoading ? (
                        <div className="p-6 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            <p className="text-sm text-muted-foreground mt-2">Loading avatars...</p>
                        </div>
                    ) : allAvatars.length === 0 ? (
                        <div className="p-6 text-center">
                            <User className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No avatars found</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Complete an ICP session to create avatars
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                            {/* Orphaned Avatars Section - Show at top with warning */}
                            {orphanedAvatars.length > 0 && (
                                <div>
                                    {/* Orphaned Header */}
                                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-2 bg-orange-500/10 text-orange-500">
                                        <AlertTriangle className="w-3 h-3" />
                                        Needs Linking
                                        <span className="ml-auto text-[10px] font-normal">Select to link to session</span>
                                    </div>

                                    {/* Orphaned Avatars */}
                                    {orphanedAvatars.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            onClick={() => handleAvatarClick(avatar)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 bg-orange-500/5",
                                                selectedAvatar?.id === avatar.id && "bg-primary/5"
                                            )}
                                        >
                                            <Avatar className="w-9 h-9 border border-orange-500/30">
                                                <AvatarImage src={avatar.photo_url} />
                                                <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs">
                                                    {avatar.name?.charAt(0) || "A"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {avatar.name}
                                                </p>
                                                {avatar.occupation && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {avatar.occupation}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedAvatar?.id === avatar.id && (
                                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                            <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" title="No linked session" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Session-linked Avatars */}
                            {Object.entries(avatarsBySession).map(([sessionId, avatars]) => (
                                <div key={sessionId}>
                                    {/* Session Header */}
                                    <div className={cn(
                                        "px-3 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-2",
                                        isCurrentSession(sessionId)
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {isCurrentSession(sessionId) && (
                                            <Check className="w-3 h-3" />
                                        )}
                                        {getSessionLabel(sessionId)}
                                        {isCurrentSession(sessionId) && (
                                            <span className="ml-auto text-[10px] font-normal">Current</span>
                                        )}
                                    </div>

                                    {/* Avatars in Session */}
                                    {avatars.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            onClick={() => handleAvatarClick(avatar)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                                                selectedAvatar?.id === avatar.id && "bg-primary/5"
                                            )}
                                        >
                                            <Avatar className="w-9 h-9 border border-border">
                                                <AvatarImage src={avatar.photo_url} />
                                                <AvatarFallback className="bg-muted text-xs">
                                                    {avatar.name?.charAt(0) || "A"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {avatar.name}
                                                </p>
                                                {avatar.occupation && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {avatar.occupation}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedAvatar?.id === avatar.id && (
                                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                            {!isCurrentSession(avatar.icp_session_id!) && (
                                                <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" title="Different session" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Refresh Button */}
                    <div className="p-2 border-t border-border bg-muted/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadAllAvatars}
                            disabled={isLoading}
                            className="w-full text-xs"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                            Refresh List
                        </Button>
                    </div>
                </div>
            )}

            {/* Session Switch Confirmation Dialog */}
            <Dialog open={showSessionSwitchDialog} onOpenChange={setShowSessionSwitchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Switch Session?
                        </DialogTitle>
                        <DialogDescription>
                            The avatar "{pendingAvatar?.name}" belongs to a different session.
                            Switching will load data from that session into the Landing Pad builder.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Selected Avatar
                            </p>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={pendingAvatar?.photo_url} />
                                    <AvatarFallback>
                                        {pendingAvatar?.name?.charAt(0) || "A"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{pendingAvatar?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {pendingAvatar?.occupation || "No occupation"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            This will update your current working session. Any unsaved changes
                            to your current session will be preserved separately.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowSessionSwitchDialog(false);
                                setPendingAvatar(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmSessionSwitch}
                            disabled={isLoading}
                            className="bg-primary"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Switching...
                                </>
                            ) : (
                                "Continue & Switch Session"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
