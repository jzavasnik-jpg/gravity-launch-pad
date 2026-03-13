'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GradientButton } from '@/components/ui/gradient-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  Chrome,
  ChevronDown,
} from 'lucide-react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth-service';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
    // On success, signInWithGoogle redirects — no need to setGoogleLoading(false)
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        setLoading(false);
        return;
      }
      const { error: authError } = await signUpWithEmail(email, password, name);
      if (authError) {
        setError(authError.message);
      } else {
        toast.success(
          'Account created. Check your email to verify your address.'
        );
        setMode('signin');
        setPassword('');
      }
    } else {
      const { user, error: authError } = await signInWithEmail(email, password);
      if (authError) {
        setError(authError.message);
      } else if (user) {
        toast.success('Signed in successfully.');
        router.push('/dashboard');
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          &larr; Back to home
        </Link>

        {/* Card */}
        <div className="victor-glass-card rounded-2xl p-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome to Launch
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to your account or create one to get started
          </p>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google OAuth — primary action */}
          <GradientButton
            className="w-full text-sm py-3"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Chrome className="w-4 h-4 mr-2" />
            )}
            Continue with Google
          </GradientButton>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* Email toggle */}
          <button
            type="button"
            onClick={() => setShowEmail((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <Mail className="w-4 h-4" />
            Use email instead
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                showEmail ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Email form (expandable) */}
          {showEmail && (
            <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-foreground">
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>

              {/* Mode toggle */}
              <p className="text-center text-sm text-muted-foreground">
                {mode === 'signin' ? (
                  <>
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="text-foreground hover:underline"
                    >
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="text-foreground hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
