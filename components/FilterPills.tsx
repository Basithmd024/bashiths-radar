'use client';

import type { EventFilter } from '@/types/event';

const FILTERS: Array<{ label: string; value: EventFilter }> = [
  { label: 'All',         value: 'all' },
  { label: '🏆 Hackathons',  value: 'hackathon' },
  { label: '🛠 Workshops',   value: 'workshop' },
  { label: '🎯 Summits',     value: 'summit' },
  { label: '🎤 Conferences', value: 'conference' },
  { label: '🆓 Free only',   value: 'free' },
];

interface FilterPillsProps {
  active: EventFilter;
  onChange: (filter: EventFilter) => void;
}

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {FILTERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border whitespace-nowrap ${
            active === value
              ? 'bg-accent text-navy border-accent'
              : 'text-muted border-border hover:border-accent/50 hover:text-text'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
