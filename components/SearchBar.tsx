'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search events, orgs, tags…' }: SearchBarProps) {
  const [value, setValue] = useState('');

  // Debounce: only fire after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 w-4 h-4 text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-surface border border-border text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-150"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 text-muted hover:text-text transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
