'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GlassPanel } from "@/components/GlassPanel";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { getAllUserSessions, getAllAvatarsBySessionId, getMarketingStatementsByAvatarId, deleteICPSession, deleteAvatar } from "@/lib/database-service";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, User, MessageSquare, Calendar, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PrimaryButton } from "@/components/PrimaryButton";
import { toast } from "sonner";
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

interface SessionWithAssets {
  session: any;
  avatar: any;
  marketing: any;
}

export default function SessionsPage() {
  const router = useRouter();
  const { appState, setAvatarData, setMarketingStatements } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithAssets[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");

  useEffect(() => {
    async function loadAssets() {
      const userId = user?.uid;

      if (!userId) {
        if (authLoading) {
          console.log('[SessionsLibrary] Auth still loading...');
          return;
        }
        console.log('[SessionsLibrary] No user ID, skipping load');
        setLoading(false);
        return;
      }

      console.log('[SessionsLibrary] Loading sessions for user:', userId);
      setLoading(true);
      try {
        const userSessions = await getAllUserSessions(userId);
        console.log('[SessionsLibrary] Found sessions:', userSessions?.length || 0);

        const allAvatarCards: SessionWithAssets[] = [];

        for (const session of userSessions) {
          const avatars = await getAllAvatarsBySessionId(session.id);
          console.log(`[SessionsLibrary] Session ${session.id}: Found ${avatars?.length || 0} avatars`);

          if (avatars && avatars.length > 0) {
            for (const avatar of avatars) {
              if (avatar.photo_url) {
                const marketing = await getMarketingStatementsByAvatarId(avatar.id);
                allAvatarCards.push({
                  session,
                  avatar,
                  marketing
                });
              }
            }
          }
        }

        console.log('[SessionsLibrary] Total avatar cards:', allAvatarCards.length);
        setSessions(allAvatarCards);
      } catch (error) {
        console.error("[SessionsLibrary] Error loading assets:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [user?.uid, authLoading]);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "completed") return s.session.completed;
    if (filter === "incomplete") return !s.session.completed;
    return true;
  });

  const handleLoadToDashboard = (sessionData: SessionWithAssets) => {
    console.log('[SessionsLibrary] Loading to dashboard:', {
      hasAvatar: !!sessionData.avatar,
      hasMarketing: !!sessionData.marketing,
      marketingIsArray: Array.isArray(sessionData.marketing),
      marketingLength: sessionData.marketing?.length,
      marketing: sessionData.marketing
    });

    if (sessionData.avatar) {
      setAvatarData(sessionData.avatar);
    }
    if (sessionData.marketing && Array.isArray(sessionData.marketing) && sessionData.marketing.length > 0) {
      console.log('[SessionsLibrary] Setting marketing statements:', sessionData.marketing);
      setMarketingStatements(sessionData.marketing);
    } else {
      console.warn('[SessionsLibrary] Marketing statements not valid:', sessionData.marketing);
    }
    router.push("/dashboard");
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteICPSession(sessionId);
    if (success) {
      setSessions(sessions.filter(s => s.session.id !== sessionId));
      toast.success("Session deleted successfully");
    } else {
      toast.error("Failed to delete session");
    }
  };

  const handleDeleteAvatar = async (avatarId: string) => {
    try {
      const success = await deleteAvatar(avatarId);
      if (success) {
        setSessions(sessions.filter(s => s.avatar.id !== avatarId));
        toast.success("Avatar deleted successfully");
      } else {
        toast.error("Failed to delete avatar");
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Failed to delete avatar");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appState.userName && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassPanel className="text-center max-w-md">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the welcome flow on the home page first.
          </p>
          <PrimaryButton onClick={() => router.push("/")}>Go to Home</PrimaryButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-display text-g-heading mb-2">
            Sessions Library
          </h1>
          <p className="text-muted-foreground">
            All your ICP interviews, avatars, and marketing content in one place
          </p>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "completed" | "incomplete")} className="mb-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="all">All Assets</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="incomplete">In Progress</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <GlassPanel className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Assets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your first ICP interview to generate customer avatars and marketing content
            </p>
            <PrimaryButton onClick={() => router.push("/icp")}>
              Start ICP Interview
            </PrimaryButton>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((item) => (
              <GlassPanel key={item.avatar.id} className="hover-scale transition-all">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${item.session.completed
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                      }`}
                  >
                    {item.session.completed ? "Completed" : "In Progress"}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.session.created_at), "MMM d, yyyy")}
                  </div>
                </div>

                {/* Avatar Info */}
                {item.avatar && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      {item.avatar.photo_url && (
                        <img
                          src={item.avatar.photo_url}
                          alt={item.avatar.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-xl">{item.avatar.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.avatar.age} • {item.avatar.occupation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {Array.isArray(item.session.answers)
                        ? item.session.answers.filter((a: string) => a).length
                        : 0}{" "}
                      / 14 questions answered
                    </span>
                  </div>
                  {item.session.core_desire && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Core Desire: {item.session.core_desire.name}</span>
                    </div>
                  )}
                  {item.session.six_s && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Six S Trigger: {item.session.six_s.name}</span>
                    </div>
                  )}
                  {item.marketing && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Marketing content generated</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {item.avatar && (
                    <>
                      <PrimaryButton
                        onClick={() => handleLoadToDashboard(item)}
                        className="flex-1"
                        size="sm"
                      >
                        View in Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </PrimaryButton>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-panel">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Avatar</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {item.avatar.name}? This will permanently remove
                              this avatar and its marketing content. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAvatar(item.avatar.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Avatar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
