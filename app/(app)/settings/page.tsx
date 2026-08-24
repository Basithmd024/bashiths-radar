'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toggle } from '@/components/Toggle';
import type { UserProfile } from '@/types/user';
import { createClient } from '@/lib/supabase-client';
import {
  Calendar,
  Settings as SettingsIcon,
  MapPin,
  Save,
  Loader2,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const LOCATION_OPTIONS = [
  { id: 'hyderabad', label: 'Hyderabad (Local)' },
  { id: 'thub', label: 'T-Hub Phase 2' },
  { id: 'iiith', label: 'IIIT Hyderabad' },
  { id: 'mgit', label: 'MGIT Campus' },
  { id: 'nitw', label: 'NIT Warangal' },
  { id: 'pan-india', label: 'Pan India' },
  { id: 'online', label: 'Online / Remote' },
];

const TYPE_OPTIONS = [
  { id: 'hackathon', label: '🏆 Hackathons' },
  { id: 'workshop', label: '🛠 Workshops' },
  { id: 'summit', label: '🎯 Summits' },
  { id: 'conference', label: '🎤 Conferences' },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    whatsapp_number: '',
    reminder_7d: true,
    reminder_3d: true,
    reminder_1d: true,
    reminder_dayof: true,
    location_prefs: ['hyderabad', 'pan-india', 'online'],
    type_prefs: ['hackathon', 'workshop', 'summit'],
    free_only: false,
    google_calendar_token: null,
  });

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);

      const res = await fetch('/api/profile');
      if (res.ok) {
        const d = await res.json();
        if (d.profile) setProfile(d.profile);
      }
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
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
          location_prefs: profile.location_prefs,
          type_prefs: profile.type_prefs,
          free_only: profile.free_only,
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Radar preferences saved! 🎯');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving preferences';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = (locId: string) => {
    const current = profile.location_prefs || [];
    const next = current.includes(locId)
      ? current.filter((l) => l !== locId)
      : [...current, locId];
    setProfile({ ...profile, location_prefs: next });
  };

  const toggleType = (typeId: string) => {
    const current = profile.type_prefs || [];
    const next = current.includes(typeId)
      ? current.filter((t) => t !== typeId)
      : [...current, typeId];
    setProfile({ ...profile, type_prefs: next });
  };

  const handleConnectCalendar = () => {
    window.location.href = '/api/calendar/auth';
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_session');
      localStorage.removeItem('user_phone');
    }
    toast.success('Signed out');
    window.location.href = '/auth';
  };

  const isGoogleConnected = Boolean(profile.google_calendar_token);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-sm text-muted">Loading settings & preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-accent" />
            Radar Configuration & Preferences
          </h1>
          <p className="text-xs text-muted mt-1">
            Customize which events to track, connect Google Calendar, and manage notifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-navy text-xs font-semibold hover:bg-accent/90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Preferences</span>
        </button>
      </div>

      {/* 1. Google Calendar Integration */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-semibold text-text">Google Calendar Sync</h2>
              <p className="text-xs text-muted">
                1-click auto-add deadline (with 1d alert) and event date (with 2h alert) to Google Calendar.
              </p>
            </div>
          </div>

          <div>
            {isGoogleConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                ● Connected
              </span>
            ) : (
              <button
                onClick={handleConnectCalendar}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-border hover:border-accent text-xs font-medium text-text transition-colors"
              >
                <span>Connect Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Location & College Filter Preferences */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold text-text">Location & Campus Preferences</h2>
            <p className="text-xs text-muted">Filter which geographic hubs and campus events to prioritize on your radar.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {LOCATION_OPTIONS.map((loc) => {
            const active = profile.location_prefs?.includes(loc.id);
            return (
              <button
                key={loc.id}
                onClick={() => toggleLocation(loc.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-surface border-border text-muted hover:text-text hover:border-border/80'
                }`}
              >
                <span>{loc.label}</span>
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-accent' : 'bg-border'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Event Types & Free Filter */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold text-text">Event Types & Pricing</h2>
            <p className="text-xs text-muted">Choose the categories of events you actively participate in.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {TYPE_OPTIONS.map((type) => {
            const active = profile.type_prefs?.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-surface border-border text-muted hover:text-text hover:border-border/80'
                }`}
              >
                <span>{type.label}</span>
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-accent' : 'bg-border'}`} />
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border/60">
          <Toggle
            label="Free Events Only"
            description="Hide any events, workshops or summits that require paid registration"
            checked={!!profile.free_only}
            onChange={(val) => setProfile({ ...profile, free_only: val })}
          />
        </div>
      </div>

      {/* 4. Evolution API / WhatsApp Engine Info */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold text-text">WhatsApp Engine (Evolution API)</h2>
            <p className="text-xs text-muted">
              Self-hosted open-source WhatsApp API for automated delivery without sandbox limitations.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Ensure your <code className="bg-surface px-1.5 py-0.5 rounded text-accent font-mono">EVOLUTION_API_URL</code> and{' '}
          <code className="bg-surface px-1.5 py-0.5 rounded text-accent font-mono">EVOLUTION_API_KEY</code> environment variables are configured in your <code className="bg-surface px-1.5 py-0.5 rounded text-accent font-mono">.env.local</code> file.
        </p>
      </div>

      {/* 5. Account Section */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Account & Security
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Logged in as: <span className="font-mono text-text">{userEmail || 'Local Student Session'}</span>
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/40 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
