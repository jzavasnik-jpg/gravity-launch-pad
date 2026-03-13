'use client';

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireEmailVerification = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (requireEmailVerification && !isEmailVerified) {
      router.push("/");
    }
  }, [loading, isAuthenticated, isEmailVerified, requireEmailVerification, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireEmailVerification && !isEmailVerified) {
    return null;
  }

  return <>{children}</>;
};
