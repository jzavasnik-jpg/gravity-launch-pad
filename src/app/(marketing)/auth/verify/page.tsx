'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/context/ThemeContext';

function VerifyContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="victor-glass-card max-w-md w-full rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">Check your email</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          We sent a verification link to your email address. Click the link to verify your account and get started.
        </p>
        <p className="text-muted-foreground/60 text-xs mb-8">
          Didn't receive the email? Check your spam folder or try signing up again.
        </p>
        <Link href="/auth">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <ThemeProvider>
      <VerifyContent />
    </ThemeProvider>
  );
}
