'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, Shield, CreditCard, Key } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { user, userRecord } = useAuth();
    const { appState, setUserInfo } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(userRecord?.name || user?.displayName || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Update failed');
            }

            toast.success("Profile updated successfully");
            setUserInfo(user.id, name, user.email || '');
            router.refresh();
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            // Update local state with new avatar URL
            setAvatarUrl(data.url);
            toast.success('Profile photo updated!');

            // Soft refresh the page data without full reload
            router.refresh();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload photo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-display text-foreground mb-2">Settings</h1>
                    <p className="text-lg text-muted-foreground">Manage your account preferences and profile.</p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="bg-card border border-border">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="bg-card/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Profile Information</CardTitle>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24 border-2 border-border" key={avatarUrl || 'default'}>
                                        <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || userRecord?.avatar_url || ''} />
                                        <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                                            {name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            className="bg-muted border-border text-foreground hover:bg-muted/80"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {isLoading ? 'Uploading...' : 'Change Photo'}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            JPG, GIF or PNG. Max size of 2MB.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-muted-foreground">Display Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-background border-border text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-background/50 border-border text-muted-foreground"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        disabled={isLoading}
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account">
                        <Card className="bg-card/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Account Security</CardTitle>
                                <CardDescription>Manage your password and security settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border">
                                    <div className="p-3 bg-muted rounded-full">
                                        <Shield className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-medium text-foreground">Password</h4>
                                        <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                                    </div>
                                    <Button variant="outline" className="ml-auto border-border text-muted-foreground hover:bg-muted">
                                        Change Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing">
                        <Card className="bg-card/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Subscription Plan</CardTitle>
                                <CardDescription>Manage your billing and subscription.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/20 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500/20 rounded-full">
                                            <CreditCard className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-medium text-foreground">Pro Plan</h4>
                                            <p className="text-base text-muted-foreground">$29/month • Renews on Dec 15, 2025</p>
                                        </div>
                                    </div>
                                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Manage Subscription</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api-keys">
                        <Card className="bg-card/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">API Keys</CardTitle>
                                <CardDescription>Manage API keys for external integrations.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border">
                                    <div className="p-3 bg-muted rounded-full">
                                        <Key className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-medium text-foreground">API Access</h4>
                                        <p className="text-sm text-muted-foreground">Generate and manage API keys for programmatic access</p>
                                    </div>
                                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        <Link href="/settings/api-keys">Manage API Keys</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
