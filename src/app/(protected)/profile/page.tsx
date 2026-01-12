'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Mail, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userRecord, loading } = useAuth();
    const { appState } = useApp();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-md w-full bg-card/50 border-border">
                    <CardContent className="text-center py-12">
                        <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
                        <Button onClick={() => router.push('/')}>Go to Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayName = userRecord?.name || user.displayName || appState.userName || 'User';
    const email = user.email || '';
    const photoUrl = user.photoURL || '';
    const createdAt = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-display text-foreground mb-2">Profile</h1>
                        <p className="text-lg text-muted-foreground">View and manage your account information.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/settings')}
                        className="border-border"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Settings
                    </Button>
                </div>

                {/* Profile Card */}
                <Card className="bg-card/50 border-border">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 border-2 border-border">
                                <AvatarImage src={photoUrl} />
                                <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl text-foreground">{displayName}</CardTitle>
                                <CardDescription className="text-base">
                                    Member since {format(createdAt, 'MMMM yyyy')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border border-border">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm text-foreground">{email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border border-border">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Joined</p>
                                    <p className="text-sm text-foreground">{format(createdAt, 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className="bg-card/50 border-border cursor-pointer hover:bg-card/80 transition-colors"
                        onClick={() => router.push('/dashboard')}
                    >
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-semibold text-foreground">Dashboard</h3>
                                <p className="text-sm text-muted-foreground">View your avatars and campaigns</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-card/50 border-border cursor-pointer hover:bg-card/80 transition-colors"
                        onClick={() => router.push('/sessions')}
                    >
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-semibold text-foreground">Sessions Library</h3>
                                <p className="text-sm text-muted-foreground">Browse all your ICP sessions</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
