import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, User, CreditCard, Shield } from 'lucide-react';
import { updateUserProfile } from '@/lib/auth-service';
import { saveGeneratedAsset } from '@/lib/database-service';

export default function Settings() {
    const { user, userRecord } = useAuth();
    const { appState, setUserInfo } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(userRecord?.name || user?.displayName || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            const success = await updateUserProfile(user.uid, { name });
            if (success) {
                toast.success("Profile updated successfully");
                // Update local app state
                setUserInfo(user.uid, name, user.email || '');
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsLoading(true);
        try {
            // 1. Upload to Firebase Storage
            const { uploadUserPhoto } = await import('@/lib/auth-service');
            const downloadUrl = await uploadUserPhoto(user.uid, file);

            if (!downloadUrl) {
                throw new Error("Failed to get download URL");
            }

            // 2. Update Profile with new URL
            const success = await updateUserProfile(user.uid, { photo_url: downloadUrl });

            if (success) {
                toast.success("Profile photo updated");
                // Force reload to see changes or update context
                window.location.reload();
            } else {
                toast.error("Failed to update photo");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-display text-white mb-2">Settings</h1>
                    <p className="text-lg text-zinc-400">Manage your account preferences and profile.</p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Profile Information</CardTitle>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24 border-2 border-zinc-700">
                                        <AvatarImage src={user?.photoURL || ''} />
                                        <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-400">
                                            {name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
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
                                        <p className="text-xs text-zinc-500">
                                            JPG, GIF or PNG. Max size of 2MB.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-zinc-300">Display Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-zinc-950 border-zinc-800 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-zinc-950/50 border-zinc-800 text-zinc-500"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-white text-black hover:bg-zinc-200"
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
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Account Security</CardTitle>
                                <CardDescription>Manage your password and security settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <div className="p-3 bg-zinc-900 rounded-full">
                                        <Shield className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-medium text-white">Password</h4>
                                        <p className="text-sm text-zinc-500">Last changed 3 months ago</p>
                                    </div>
                                    <Button variant="outline" className="ml-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                        Change Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Subscription Plan</CardTitle>
                                <CardDescription>Manage your billing and subscription.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/20 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500/20 rounded-full">
                                            <CreditCard className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-medium text-white">Pro Plan</h4>
                                            <p className="text-base text-zinc-400">$29/month • Renews on Dec 15, 2025</p>
                                        </div>
                                    </div>
                                    <Button className="bg-white text-black hover:bg-zinc-200">Manage Subscription</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
