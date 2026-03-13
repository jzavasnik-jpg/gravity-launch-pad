'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';

const MAX_LOADING_MS = 5000; // 5 second absolute max loading time

function MarketingContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fallback timeout to prevent infinite loading spinner
  useEffect(() => {
    const maxLoadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[MarketingLayout] Max loading time exceeded, forcing ready state');
        setForceReady(true);
      }
    }, MAX_LOADING_MS);

    return () => clearTimeout(maxLoadingTimeout);
  }, [loading]);

  // Auto-redirect authenticated users from landing page to dashboard
  useEffect(() => {
    if ((!loading || forceReady) && user && isClient && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, loading, isClient, pathname, router, forceReady]);

  // Show loading spinner while checking auth or redirecting (unless forceReady)
  if (!isClient || ((loading && !forceReady) || (user && pathname === '/'))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Marketing pages are for unauthenticated users only
  // Authenticated users on marketing routes (except /) see content without sidebar
  return <div className="min-h-screen bg-background">{children}</div>;
}

export default function MarketingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <MarketingContent>{children}</MarketingContent>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
