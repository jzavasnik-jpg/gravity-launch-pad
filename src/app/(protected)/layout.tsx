'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthSync } from '@/components/AuthSync';
import { Toaster } from '@/components/ui/sonner';

const MAX_LOADING_MS = 5000; // 5 second absolute max loading time

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fallback timeout to prevent infinite loading spinner
  useEffect(() => {
    const maxLoadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[ProtectedLayout] Max loading time exceeded, forcing ready state');
        setForceReady(true);
      }
    }, MAX_LOADING_MS);

    return () => clearTimeout(maxLoadingTimeout);
  }, [loading]);

  useEffect(() => {
    // Redirect to home if not authenticated (including when forceReady kicks in without user)
    if ((!loading || forceReady) && !user && isClient) {
      router.push('/');
    }
  }, [user, loading, router, isClient, forceReady]);

  // Show loading spinner unless forceReady kicks in
  if (!isClient || (loading && !forceReady)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <AuthSync />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ProtectedContent>{children}</ProtectedContent>
          <Toaster richColors position="top-right" />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
