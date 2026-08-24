'use client';

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { EventType } from '@/types/event';

interface ManualEventFormProps {
  onSuccess?: () => void;
}

export function ManualEventForm({ onSuccess }: ManualEventFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    org: '',
    type: 'hackathon' as EventType,
    location: '',
    event_date: '',
    application_deadline: '',
    apply_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      toast.error('Please enter title and event date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/events/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          apply_url: formData.apply_url || undefined,
          application_deadline: formData.application_deadline || undefined,
          location: formData.location || undefined,
          org: formData.org || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add event');
      }

      toast.success('Event added + saved to your radar! 🎯');
      setFormData({
        title: '',
        org: '',
        type: 'hackathon',
        location: '',
        event_date: '',
        application_deadline: '',
        apply_url: '',
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding event';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border hover:border-accent text-sm font-medium text-muted hover:text-accent bg-surface/50 hover:bg-surface transition-all duration-200"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add Event Manually (Notice Board / Local Event)</span>
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-accent" />
          Add Custom / College Notice Event
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted hover:text-text px-2 py-1 rounded bg-surface border border-border"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Event Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. MGIT CodeFiesta 2026 / HackHyderabad"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Organizer / College
            </label>
            <input
              type="text"
              placeholder="e.g. MGIT CSE / IIIT-H / GDSC"
              value={formData.org}
              onChange={(e) => setFormData({ ...formData, org: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:border-accent"
            >
              <option value="hackathon">🏆 Hackathon</option>
              <option value="workshop">🛠 Workshop</option>
              <option value="summit">🎯 Summit</option>
              <option value="conference">🎤 Conference</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Event Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Application Deadline
            </label>
            <input
              type="date"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Location / Venue
            </label>
            <input
              type="text"
              placeholder="e.g. MGIT Auditorium / Online"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Apply / Register URL
            </label>
            <input
              type="url"
              placeholder="https://forms.gle/... or link"
              value={formData.apply_url}
              onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted border border-border hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-navy hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Save & Queue Reminders
          </button>
        </div>
      </form>
    </div>
  );
}
