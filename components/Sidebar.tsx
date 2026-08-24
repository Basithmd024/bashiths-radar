'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Newspaper, Bell, Settings, Radar } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Events',    href: '/events',    icon: CalendarDays },
  { label: 'Digest',    href: '/digest',    icon: Newspaper },
  { label: 'Reminders', href: '/reminders', icon: Bell },
  { label: 'Settings',  href: '/settings',  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface border-r border-border p-4 fixed left-0 top-0 bottom-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2 pt-2">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Radar className="w-4.5 h-4.5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text leading-none">Basith&apos;s</p>
          <p className="text-xs text-accent font-mono leading-none mt-0.5">Radar ◉</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-text hover:bg-card'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-150 ${
                active ? '' : 'group-hover:scale-110'
              }`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-border">
        <p className="text-[10px] text-muted px-2">
          MGIT Hyderabad · AI/PM Tracker
        </p>
        <p className="text-[10px] text-muted/60 px-2 mt-0.5">
          Last updated: {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>
    </aside>
  );
}
