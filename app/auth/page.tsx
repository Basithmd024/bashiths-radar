'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Radar, Mail, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/events`,
        },
      });

      if (error) throw error;

      setSent(true);
      toast.success('Magic link sent!', {
        description: 'Check your email inbox to log in instantly.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send login link';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/events`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google login error';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 mb-4">
            <Radar className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">
            Basith&apos;s Radar
          </h1>
          <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto">
            AI & PM Command Center for Hyderabad & India Hackathons, Deadlines & Daily Digest
          </p>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">Check your email</h3>
              <p className="text-xs text-muted mt-1">
                We sent a secure magic link to <span className="text-accent font-mono">{email}</span>
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-muted hover:text-text underline pt-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="basith@student.mgit.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-text text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent text-navy font-semibold text-sm hover:bg-accent/90 transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-surface border border-border hover:border-accent/60 text-text font-medium text-sm transition-all duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Feature badge */}
        <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-center gap-2 text-xs text-muted">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Automated WhatsApp Deadlines & Claude Digest</span>
        </div>
      </div>
    </div>
  );
}
