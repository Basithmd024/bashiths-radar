'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Newspaper, Bell, Settings, Zap } from 'lucide-react';

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
      <Link href="/events" className="flex items-center gap-2.5 mb-8 px-2 pt-2 group">
        <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-accent/20">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-base font-extrabold text-text tracking-tight leading-none">Hackey</p>
          <p className="text-[10px] text-accent font-mono font-semibold uppercase tracking-wider leading-none mt-1">AI × PM Radar ◉</p>
        </div>
      </Link>

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
                  ? 'bg-accent/10 text-accent border border-accent/20 font-semibold'
                  : 'text-muted hover:text-text hover:bg-card'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-150 ${
                active ? '' : 'group-hover:scale-110'
              }`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-sm shadow-accent" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-border">
        <p className="text-[11px] font-medium text-text px-2">
          Hackey for Students & Builders
        </p>
        <p className="text-[10px] text-muted/70 px-2 mt-0.5">
          WhatsApp 24/7 Automation
        </p>
      </div>
    </aside>
  );
}
