'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface SaveButtonProps {
  eventId: string;
  initialSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
}

export function SaveButton({ eventId, initialSaved = false, onSaveChange }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const newSaved = !saved;

    try {
      if (newSaved) {
        const res = await fetch('/api/events/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSaved(true);
        onSaveChange?.(true);
        toast.success('Event saved + reminders queued', {
          description: 'You\'ll get WhatsApp alerts before the deadline.',
        });
      } else {
        const res = await fetch(`/api/events/save?event_id=${eventId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to unsave');
        setSaved(false);
        onSaveChange?.(false);
        toast('Event removed from saved');
      }
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Unsave event' : 'Save event'}
      className={`save-btn group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        saved
          ? 'text-pink-400 bg-pink-950/40 border border-pink-800/50 hover:border-pink-600'
          : 'text-muted border border-border hover:border-accent hover:text-accent'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-300 ${
          saved
            ? 'fill-pink-400 text-pink-400 scale-110'
            : 'group-hover:scale-110'
        } ${loading ? 'animate-pulse' : ''}`}
      />
      <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
