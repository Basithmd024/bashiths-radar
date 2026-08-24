'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Newspaper, Bell, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Events',   href: '/events',    icon: CalendarDays },
  { label: 'Digest',   href: '/digest',    icon: Newspaper },
  { label: 'Reminders',href: '/reminders', icon: Bell },
  { label: 'Settings', href: '/settings',  icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150 ${
                active
                  ? 'text-accent'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
