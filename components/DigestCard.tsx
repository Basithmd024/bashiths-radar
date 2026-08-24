'use client';

import { ExternalLink, X, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { DigestItem } from '@/types/digest';
import { TagPill } from './TagPill';

interface DigestCardProps {
  item: DigestItem;
  onDismiss: (id: string) => void;
}

export function DigestCard({ item, onDismiss }: DigestCardProps) {
  async function dismiss() {
    try {
      await fetch('/api/digest/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digest_id: item.id }),
      });
      onDismiss(item.id);
    } catch {
      toast.error('Failed to dismiss');
    }
  }

  const timeAgo = item.published_at
    ? formatDistanceToNow(parseISO(item.published_at), { addSuffix: true })
    : item.source
    ? `from ${item.source}`
    : '';

  // Priority bar: 5 = 5 dots, 1 = 1 dot
  const priorityDots = Array.from({ length: 5 }, (_, i) => i < item.priority);

  return (
    <article className="digest-card group">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TagPill tag={item.tag} />
            {/* Priority dots */}
            <div className="flex items-center gap-0.5" title={`Priority: ${item.priority}/5`}>
              {priorityDots.map((active, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    active ? 'bg-accent' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-text text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-150">
            {item.title}
          </h3>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss this article"
          className="flex-shrink-0 p-1 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI one-liner */}
      {item.one_line && (
        <p className="mt-2.5 text-xs text-accent/90 flex items-start gap-1.5 leading-relaxed">
          <span className="text-accent mt-0.5 flex-shrink-0">→</span>
          <span>{item.one_line}</span>
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          {item.source && <span className="font-medium">{item.source}</span>}
          {timeAgo && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </>
          )}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-accent border border-accent/30 hover:bg-accent hover:text-navy transition-all duration-150"
        >
          Read
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
