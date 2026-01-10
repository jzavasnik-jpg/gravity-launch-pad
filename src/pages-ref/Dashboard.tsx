import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, ArrowRight, Loader2, Sparkles, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLatestICPSession, getAllAvatarsBySessionId } from "@/lib/database-service";
import { Badge } from "@/components/ui/badge";

// Helper function to get avatar story with fallbacks
function getAvatarStory(avatar: any): string {
  // Primary: use stored story
  if (avatar.story && avatar.story.trim()) {
    return avatar.story;
  }

  // Fallback 1: Construct from daily challenges and dreams
  if (avatar.daily_challenges?.length > 0) {
    const challenge = avatar.daily_challenges[0];
    const dream = avatar.dreams?.[0];
    if (dream) return `${challenge} ${dream}`;
    return challenge;
  }

  // Fallback 2: Use pain points from matrix
  if (avatar.pain_points_matrix) {
    const dimensions = ['Significance', 'Safe', 'Supported', 'Successful'] as const;
    for (const dim of dimensions) {
      const data = avatar.pain_points_matrix[dim];
      if (data?.challenges?.length > 0) {
        return data.challenges[0];
      }
    }
  }

  // Fallback 3: Use standard pain points
  if (avatar.pain_points?.length > 0) {
    return avatar.pain_points[0];
  }

  // Final fallback: Generate from metadata
  return `${avatar.name} is ${avatar.age ? `a ${avatar.age}-year-old` : 'an'} ${avatar.occupation || 'professional'} seeking meaningful transformation in their journey.`;
}

export default function Dashboard() {
  const { appState, setAvatarDataList } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Load latest data from database on mount
  useEffect(() => {
    async function loadFromDatabase() {
      if (!appState.userId) {
        setLoading(false);
        return;
      }

      if (appState.avatarDataList && appState.avatarDataList.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const latestSession = await getLatestICPSession(appState.userId);
        if (latestSession && latestSession.completed) {
          const avatars = await getAllAvatarsBySessionId(latestSession.id);
          if (avatars && avatars.length > 0) {
            const normalizedAvatars = avatars.map(avatar => ({
              ...avatar,
              photo_url: avatar.photo_url || '',
              daily_challenges: Array.isArray(avatar.daily_challenges) ? avatar.daily_challenges : [],
              buying_triggers: Array.isArray(avatar.buying_triggers) ? avatar.buying_triggers : [],
              dreams: Array.isArray(avatar.dreams) ? avatar.dreams : [],
              pain_points: Array.isArray(avatar.pain_points) ? avatar.pain_points : [],
              pain_points_matrix: (avatar as any).pain_points_matrix || {},
              six_s_scores: avatar.six_s_scores || {},
            }));
            setAvatarDataList(normalizedAvatars);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFromDatabase();
  }, [appState.userId, appState.avatarDataList, setAvatarDataList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading avatars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-2">
            Avatar Library
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your customer personas and marketing assets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {appState.sessionId && (
            <Button
              variant="outline"
              onClick={() => navigate("/icp/review")}
              className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            >
              <FileText className="w-4 h-4 mr-2" />
              Review ICP
            </Button>
          )}
          <Button
            onClick={() => navigate("/icp")}
            className="bg-gradient-to-r from-primary to-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Avatar
          </Button>
        </div>
      </div>

      {/* Avatar Grid */}
      {appState.avatarDataList && appState.avatarDataList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appState.avatarDataList.map((avatar) => (
            <Card
              key={avatar.id}
              className="group relative overflow-hidden bg-card/85 backdrop-blur-xl border-primary/25
                shadow-[0_0_40px_-8px_rgba(79,209,255,0.3),0_0_20px_-5px_rgba(99,102,241,0.2),0_25px_50px_-15px_rgba(0,0,0,0.8)]
                hover:shadow-[0_0_60px_-5px_rgba(79,209,255,0.4),0_0_30px_-5px_rgba(99,102,241,0.3),0_30px_60px_-15px_rgba(0,0,0,0.9)]
                hover:-translate-y-1 hover:border-primary/40
                transition-all duration-400 cursor-pointer"
              onClick={() => navigate(`/avatar/${avatar.id}`)}
            >
              {/* Image Section */}
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={avatar.photo_url}
                  alt={avatar.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-display font-semibold text-white mb-1">
                    {avatar.name}
                  </h3>
                  <p className="text-sm text-white/70 uppercase tracking-wider font-medium">
                    {avatar.occupation}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-4">
                <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                  {getAvatarStory(avatar)}
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <Badge
                    variant="outline"
                    className="border-border/50 text-muted-foreground text-xs bg-muted/30"
                  >
                    {new Date(avatar.created_at || Date.now()).toLocaleDateString()}
                  </Badge>
                  <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Profile <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State - Premium Design per CLAUDE.md */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-3">
            Create Your First Avatar
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
            Answer 14 questions about your ideal customer to generate a detailed persona
            with Six S emotional mapping and personalized marketing strategies.
          </p>
          <Button
            onClick={() => navigate("/icp")}
            size="lg"
            className="bg-gradient-to-r from-primary to-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,209,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(79,209,255,0.6)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start ICP Interview
          </Button>
          <p className="text-sm text-muted-foreground/60 mt-4">
            Takes approximately 10-15 minutes
          </p>
        </div>
      )}
    </div>
  );
}
