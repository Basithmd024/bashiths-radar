'use client';

import { useState, useEffect, useCallback } from 'react';
import { DigestCard } from '@/components/DigestCard';
import type { DigestItem } from '@/types/digest';
import { format } from 'date-fns';
import { Sparkles, Newspaper, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DigestPage() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDigest = useCallback(async () => {
    try {
      const res = await fetch('/api/digest');
      if (!res.ok) throw new Error('Failed to fetch digest');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Digest fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast('Article dismissed');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDigest();
    toast.success('Digest refreshed');
  };

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text tracking-tight">
              AI Builder&apos;s Daily Digest
            </h1>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
              <Sparkles className="w-3 h-3" /> Claude Filtered
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            {todayFormatted} · Filtered ruthlessly for AI product builders & engineering students. Zero hype.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-muted hover:text-text hover:border-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Digest'}</span>
        </button>
      </div>

      {/* Sources badge banner */}
      <div className="bg-card border border-border/70 rounded-xl p-3.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-semibold text-text flex items-center gap-1.5 mr-1">
          <Newspaper className="w-3.5 h-3.5 text-accent" />
          Active Feeds:
        </span>
        {['Anthropic News', 'OpenAI Blog', 'TechCrunch AI', 'Hacker News (AI)', 'Product Hunt AI', 'AI Snake Oil'].map((src) => (
          <span key={src} className="px-2 py-0.5 rounded bg-surface border border-border/60 text-[11px]">
            {src}
          </span>
        ))}
      </div>

      {/* Digest List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm text-muted">Curating today&apos;s actionable AI updates...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <DigestCard key={item.id} item={item} onDismiss={handleDismiss} />
          ))}
        </div>
      ) : (
        <div className="py-16 bg-card/40 border border-dashed border-border rounded-2xl text-center px-4">
          <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text">You&apos;re completely caught up!</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            No pending AI news for today or you&apos;ve cleared your feed. Daily cron fetches fresh updates at 6:00 AM IST.
          </p>
        </div>
      )}
    </div>
  );
}
