'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StatBar } from '@/components/StatBar';
import { FilterPills } from '@/components/FilterPills';
import { SearchBar } from '@/components/SearchBar';
import { EventCard } from '@/components/EventCard';
import { ManualEventForm } from '@/components/ManualEventForm';
import type { Event, EventFilter } from '@/types/event';
import { differenceInDays, parseISO } from 'date-fns';
import { Loader2, RefreshCw, Sparkles, FilterX } from 'lucide-react';
import { toast } from 'sonner';

export default function EventsPage() {
  const [events, setEvents] = useState<(Event & { is_saved?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'date'>('deadline');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    toast.success('Radar refreshed');
  };

  // Filter and Search logic
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // 1. Filter pills
      if (activeFilter === 'free' && !ev.is_free) return false;
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'free' &&
        ev.type !== activeFilter
      ) {
        return false;
      }

      // 2. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = ev.title?.toLowerCase().includes(q);
        const inOrg = ev.org?.toLowerCase().includes(q);
        const inTags = ev.tags?.some((t) => t.toLowerCase().includes(q));
        const inLoc = ev.location?.toLowerCase().includes(q);
        if (!inTitle && !inOrg && !inTags && !inLoc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
      } else {
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      }
    });
  }, [events, activeFilter, searchQuery, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = events.length;
    const saved = events.filter((e) => e.is_saved).length;
    const urgent = events.filter((e) => {
      if (!e.application_deadline) return false;
      const days = differenceInDays(parseISO(e.application_deadline), new Date());
      return days >= 0 && days <= 3;
    }).length;

    return { total, saved, urgent };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text tracking-tight">
              Event Radar
            </h1>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
              <Sparkles className="w-3 h-3" /> Hyderabad + Pan India
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Tracking hackathons, workshops & summits across Devfolio, T-Hub, IIIT-H, Unstop & MGIT
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-muted hover:text-text hover:border-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Stat Bar */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-sm">
        <StatBar total={stats.total} saved={stats.saved} urgent={stats.urgent} />
      </div>

      {/* Search & Sort Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-muted whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'deadline' | 'date')}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text focus:outline-none focus:border-accent"
            >
              <option value="deadline">⏰ Closest Deadline</option>
              <option value="date">📅 Event Date</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <FilterPills active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Manual Event Add Form Drawer */}
      <ManualEventForm onSuccess={fetchEvents} />

      {/* Event Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm text-muted">Scanning radar for upcoming events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="py-16 bg-card/40 border border-dashed border-border rounded-2xl text-center px-4">
          <FilterX className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-medium text-text">No events match your radar filters</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching filters to see more events.
          </p>
          {(activeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-accent hover:border-accent transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
