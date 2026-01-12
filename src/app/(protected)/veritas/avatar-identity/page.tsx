'use client';

import { AvatarProfile } from '@/components/AvatarProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function AvatarIdentityPage() {
  const { appState } = useApp();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-12">
        <h1 className="font-display text-5xl mb-4 text-foreground">Avatar Identity</h1>
        <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
          The Source Code of your Personal Brand.
        </p>
      </header>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-8">
          <TabsTrigger
            value="voice"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground font-mono uppercase tracking-widest px-8 py-4"
          >
            Voice Identity
          </TabsTrigger>
          <TabsTrigger
            value="visual"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground font-mono uppercase tracking-widest px-8 py-4"
          >
            Visual Identity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border p-8 rounded-lg"
          >
            <div className="veritas-override">
              {appState.avatarData ? (
                <AvatarProfile avatar={appState.avatarData} />
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground font-mono mb-4">No avatar selected.</p>
                  <p className="text-sm text-muted-foreground/70">Please select a session from the Dashboard or Library.</p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="visual" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border p-8 rounded-lg flex flex-col items-center justify-center min-h-[400px]"
          >
            {appState.avatarData?.photo_url ? (
              <div className="space-y-6 text-center">
                <div className="relative group">
                  <img
                    src={appState.avatarData.photo_url}
                    alt={appState.avatarData.name}
                    className="w-64 h-64 rounded-full object-cover border-4 border-border shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="font-mono text-xs uppercase tracking-widest text-white">Change Photo</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">{appState.avatarData.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-1">Visual Profile</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" className="font-mono text-xs">
                    <Upload className="w-4 h-4 mr-2" /> Upload Custom
                  </Button>
                  <Button variant="outline" className="font-mono text-xs">
                    <ImageIcon className="w-4 h-4 mr-2" /> Generate New
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground font-mono">
                No avatar data found. Please select an avatar first.
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
