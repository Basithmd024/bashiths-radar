'use client';

import { useState } from 'react';
import { ExternalLink, Calendar, MapPin, Building2, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { Event } from '@/types/event';
import { CountdownPill } from './CountdownPill';
import { TagPill } from './TagPill';
import { SaveButton } from './SaveButton';

interface EventCardProps {
  event: Event & { is_saved?: boolean };
}

export function EventCard({ event }: EventCardProps) {
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const fmtDate = (d: string | null) =>
    d ? format(parseISO(d), 'MMM d, yyyy') : null;

  async function addToCalendar() {
    if (addingToCalendar) return;
    setAddingToCalendar(true);
    try {
      const res = await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
      if (res.status === 400) {
        const d = await res.json();
        if (d.error === 'Google Calendar not connected') {
          toast.error('Connect Google Calendar first', {
            description: 'Go to Settings → Google Calendar',
            action: { label: 'Settings', onClick: () => window.location.href = '/settings' },
          });
          return;
        }
      }
      if (!res.ok) throw new Error('Failed');
      toast.success('Added to your Google Calendar 📅');
    } catch {
      toast.error('Failed to add to Calendar');
    } finally {
      setAddingToCalendar(false);
    }
  }

  return (
    <article className="event-card group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <TagPill tag={event.type} />
            {event.is_free && (
              <span className="tag-pill bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                FREE
              </span>
            )}
            {event.is_manually_added && (
              <span className="tag-pill bg-slate-800/60 text-slate-500 border border-slate-700/40">
                Manual
              </span>
            )}
          </div>
          <h3 className="text-text font-medium text-sm leading-snug group-hover:text-accent transition-colors duration-150 line-clamp-2">
            {event.title}
          </h3>
        </div>
        <CountdownPill deadline={event.application_deadline} />
      </div>

      {/* Org & Location */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted">
        {event.org && (
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {event.org}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location}
          </span>
        )}
      </div>

      {/* AI why_read */}
      {event.why_read && (
        <p className="text-xs text-accent/90 mb-3 flex items-start gap-1.5 leading-relaxed">
          <span className="text-accent mt-0.5">→</span>
          <span>{event.why_read}</span>
        </p>
      )}

      {/* Dates row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-xs text-muted">
        {event.application_deadline && (
          <span className="flex items-center gap-1">
            <span className="text-warning">⏰</span>
            Deadline: <span className="text-text ml-0.5">{fmtDate(event.application_deadline)}</span>
          </span>
        )}
        {event.event_date && (
          <span className="flex items-center gap-1">
            <span className="text-accent">📅</span>
            Event: <span className="text-text ml-0.5">{fmtDate(event.event_date)}</span>
          </span>
        )}
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.filter(t => t !== 'manual').slice(0, 5).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-muted bg-surface border border-border/50"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
        <SaveButton eventId={event.id} initialSaved={event.is_saved} />

        <button
          onClick={addToCalendar}
          disabled={addingToCalendar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted border border-border hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
          <span>{addingToCalendar ? 'Adding…' : 'Calendar'}</span>
        </button>

        {event.apply_url && (
          <a
            href={event.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-accent text-navy hover:bg-accent/90 transition-colors duration-150"
          >
            Apply
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
