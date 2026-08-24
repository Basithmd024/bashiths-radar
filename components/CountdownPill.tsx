'use client';

import { useEffect, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

interface CountdownPillProps {
  deadline: string | null;
  size?: 'sm' | 'md';
}

export function CountdownPill({ deadline, size = 'md' }: CountdownPillProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    function compute() {
      const d = differenceInDays(parseISO(deadline!), new Date());
      setDays(d);
    }
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || days === null) {
    return <span className="tag-pill bg-surface text-muted">No deadline</span>;
  }

  if (days < 0) {
    return <span className="countdown-pill text-muted line-through">Closed</span>;
  }

  const colorClass =
    days <= 3 ? 'countdown-red' :
    days <= 7 ? 'countdown-yellow' :
    'countdown-green';

  const label = days === 0 ? 'TODAY' : days === 1 ? '1 day' : `${days} days`;

  return (
    <span className={`countdown-pill ${colorClass} ${size === 'sm' ? 'text-xs' : ''}`}>
      {days === 0 ? (
        <span className="animate-pulse">⚡ {label}</span>
      ) : (
        <>
          <span className="font-mono tabular-nums font-semibold">{days}</span>
          <span className="ml-1 text-[10px] uppercase tracking-wider opacity-80">
            {days === 1 ? 'day left' : 'days left'}
          </span>
        </>
      )}
    </span>
  );
}
