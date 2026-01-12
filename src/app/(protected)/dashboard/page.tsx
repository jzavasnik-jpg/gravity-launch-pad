'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { FloatingCard } from '@/components/ui/FloatingCard';
import { Button } from '@/components/ui/button';
import { AvatarGalleryCard, PLACEHOLDER_AVATARS, AvatarCardData } from '@/components/AvatarGalleryCard';
import { CircularProgress } from '@/components/CircularProgress';
import {
  getAllAvatarsBySessionId,
  getLatestICPSession,
  getAllUserSessions
} from '@/lib/database-service';
import {
  Sparkles,
  Target,
  TrendingUp,
  User,
  FileText,
  Rocket,
  BarChart3,
  Palette,
  Video,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, userRecord, isAuthenticated } = useAuth();
  const { appState } = useApp();
  const router = useRouter();
  const [latestSession, setLatestSession] = useState<any>(null);
  const [avatars, setAvatars] = useState<AvatarCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        const session = await getLatestICPSession(user.uid);
        setLatestSession(session);

        if (session) {
          const sessionAvatars = await getAllAvatarsBySessionId(session.id);
          if (sessionAvatars && sessionAvatars.length > 0) {
            const avatarData: AvatarCardData[] = sessionAvatars.map(avatar => ({
              photo_url: avatar.photo_url || "",
              name: avatar.name,
              age: avatar.age || 0,
              gender: avatar.gender || "",
              occupation: avatar.occupation || "",
              topInsight: (avatar.pain_points && Array.isArray(avatar.pain_points) && avatar.pain_points[0]) ||
                (avatar.dreams && Array.isArray(avatar.dreams) && avatar.dreams[0]) ||
                "No insights available",
              isPlaceholder: false,
            }));
            setAvatars(avatarData);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const quickActions = [
    {
      title: 'Market Radar',
      description: 'Discover market trends and opportunities',
      icon: BarChart3,
      href: '/veritas/market-radar',
      color: 'text-blue-400',
    },
    {
      title: 'Strategy',
      description: 'Build your go-to-market strategy',
      icon: Target,
      href: '/veritas/strategy',
      color: 'text-green-400',
    },
    {
      title: 'Content Composer',
      description: 'Create viral content with AI',
      icon: FileText,
      href: '/veritas/content-composer',
      color: 'text-purple-400',
    },
    {
      title: 'Thumbnail Studio',
      description: 'Design click-worthy thumbnails',
      icon: Palette,
      href: '/veritas/thumbnail-composer',
      color: 'text-orange-400',
    },
    {
      title: "Director's Cut",
      description: 'Build your video storyboard',
      icon: Video,
      href: '/veritas/directors-cut',
      color: 'text-pink-400',
    },
    {
      title: 'Landing Pad',
      description: 'Generate high-converting landing pages',
      icon: Rocket,
      href: '/landing-pad',
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 font-display">
          Welcome back{userRecord?.name ? `, ${userRecord.name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered product launch command center
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FloatingCard intensity="subtle" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avatars Created</p>
              <p className="text-2xl font-bold text-foreground">{avatars.length || 0}</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard intensity="subtle" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ICP Progress</p>
              <p className="text-2xl font-bold text-foreground">
                {latestSession?.completed ? '100%' : `${Math.round((latestSession?.answers?.filter((a: any) => a)?.length || 0) / 14 * 100)}%`}
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard intensity="subtle" className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan Type</p>
              <p className="text-2xl font-bold text-foreground capitalize">{userRecord?.plan_type || 'Free'}</p>
            </div>
          </div>
        </FloatingCard>
      </div>

      {/* Avatars Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground font-display">
            Your Customer Avatars
          </h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/icp/review')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <FloatingCard intensity="medium" className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading avatars...</div>
          ) : avatars.length > 0 ? (
            <AvatarGalleryCard
              avatars={avatars.slice(0, 3)}
              onViewDetails={() => router.push('/icp/review')}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No avatars yet. Complete your ICP interview to generate customer avatars.</p>
              <Button onClick={() => router.push('/icp')}>
                Start ICP Interview
              </Button>
            </div>
          )}
        </FloatingCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 font-display">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <div
              key={action.href}
              onClick={() => router.push(action.href)}
              className="cursor-pointer"
            >
              <FloatingCard
                intensity="subtle"
                className="p-4 hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </FloatingCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
