'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReminderCard } from '@/components/ReminderCard';
import { Toggle } from '@/components/Toggle';
import { ManualEventForm } from '@/components/ManualEventForm';
import type { Reminder } from '@/types/reminder';
import type { Event } from '@/types/event';
import type { UserProfile } from '@/types/user';
import { Bell, MessageSquare, ShieldCheck, Clock, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<(Reminder & { event?: Event })[]>([]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    whatsapp_number: '',
    reminder_7d: true,
    reminder_3d: true,
    reminder_1d: true,
    reminder_dayof: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [remRes, profRes] = await Promise.all([
        fetch('/api/reminders'),
        fetch('/api/profile'),
      ]);

      if (remRes.ok) {
        const d = await remRes.json();
        setReminders(d.reminders || []);
      }

      if (profRes.ok) {
        const d = await profRes.json();
        if (d.profile) {
          setProfile(d.profile);
        }
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number: profile.whatsapp_number || null,
          reminder_7d: profile.reminder_7d,
          reminder_3d: profile.reminder_3d,
          reminder_1d: profile.reminder_1d,
          reminder_dayof: profile.reminder_dayof,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      toast.success('WhatsApp & Reminder settings saved! 🔔');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-text tracking-tight">
            WhatsApp Reminders & Schedule
          </h1>
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <MessageSquare className="w-3 h-3" /> Evolution API Ready
          </span>
        </div>
        <p className="text-xs text-muted mt-1">
          Automated deadline alerts straight to your WhatsApp so you never miss an application deadline again.
        </p>
      </div>

      {/* Settings Card: WhatsApp Number & Toggles */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-text">WhatsApp Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              WhatsApp Phone Number (with Country Code)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210 or 919876543210"
              value={profile.whatsapp_number || ''}
              onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-text text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Stored securely for sending deadline alerts only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-navy text-xs font-semibold hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Preferences</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!profile.whatsapp_number) {
                  toast.error('Enter your WhatsApp phone number first');
                  return;
                }
                const toastId = toast.loading('Sending test WhatsApp message...');
                try {
                  const res = await fetch('/api/reminders/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ whatsapp_number: profile.whatsapp_number }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success('Test WhatsApp message delivered! 🚀', {
                      id: toastId,
                      description: data.details,
                    });
                  } else {
                    toast.info('Test Alert Triggered', {
                      id: toastId,
                      description: data.details || data.error,
                    });
                  }
                } catch {
                  toast.error('Failed to trigger test alert', { id: toastId });
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:border-accent text-text text-xs font-medium transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-accent" />
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>

        {/* Schedule Toggles */}
        <div className="pt-3 border-t border-border/60">
          <p className="text-xs font-semibold text-text mb-3">
            Automated Alert Schedule (when you save an event):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Toggle
              label="7 Days Before Deadline"
              description="Early warning to form a team and prepare submission"
              checked={!!profile.reminder_7d}
              onChange={(val) => setProfile({ ...profile, reminder_7d: val })}
            />
            <Toggle
              label="3 Days Before Deadline"
              description="Finalize draft, review requirements and pitch"
              checked={!!profile.reminder_3d}
              onChange={(val) => setProfile({ ...profile, reminder_3d: val })}
            />
            <Toggle
              label="1 Day Before Deadline"
              description="Urgent 24-hour reminder to submit before cutoff"
              checked={!!profile.reminder_1d}
              onChange={(val) => setProfile({ ...profile, reminder_1d: val })}
            />
            <Toggle
              label="Morning of Event (Day-Of)"
              description="Day-of kick-off alert with link and venue details"
              checked={!!profile.reminder_dayof}
              onChange={(val) => setProfile({ ...profile, reminder_dayof: val })}
            />
          </div>
        </div>
      </div>

      {/* Manual Event Add Form */}
      <ManualEventForm onSuccess={fetchData} />

      {/* Queued Reminders List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Queued WhatsApp Reminders ({reminders.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-6 h-6 text-accent animate-spin mb-2" />
            <p className="text-xs text-muted">Checking scheduled alerts...</p>
          </div>
        ) : reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((rem) => (
              <ReminderCard key={rem.id} reminder={rem} />
            ))}
          </div>
        ) : (
          <div className="py-12 bg-card/40 border border-dashed border-border rounded-xl text-center p-6">
            <Bell className="w-7 h-7 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">No pending reminders queued</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Save any event on the Events tab to automatically schedule 7d, 3d, 1d, and day-of WhatsApp notifications.
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Message Template Preview */}
      <div className="bg-surface/60 border border-border/80 rounded-xl p-4 text-xs text-muted space-y-2">
        <p className="font-semibold text-text flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-accent" />
          Sample WhatsApp Alert Format:
        </p>
        <div className="bg-navy/80 p-3 rounded-lg border border-border/50 font-mono text-[11px] text-text whitespace-pre-line leading-relaxed">
          {`🔔 *Smart India Hackathon 2026 Internal Round*
⏰ 3 day(s) left to apply!
📅 Event date: Sep 15, 2026
🔗 Apply here: https://sih.gov.in

— Hackey ⚡`}
        </div>
      </div>
    </div>
  );
}
