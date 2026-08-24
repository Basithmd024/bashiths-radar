import { Bell, Clock, ExternalLink } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import type { Reminder } from '@/types/reminder';
import type { Event } from '@/types/event';
import { CountdownPill } from './CountdownPill';

interface ReminderCardProps {
  reminder: Reminder & { event?: Event };
}

const REMINDER_LABELS: Record<string, string> = {
  '7day': '7 days before',
  '3day': '3 days before',
  '1day': '1 day before',
  'dayof': 'Day of event',
};

export function ReminderCard({ reminder }: ReminderCardProps) {
  const event = reminder.event;
  const sendAt = parseISO(reminder.send_at);
  const timeUntilSend = formatDistanceToNow(sendAt, { addSuffix: true });

  return (
    <div className="reminder-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text leading-snug line-clamp-1">
            {event?.title ?? 'Unknown Event'}
          </p>
          {event?.org && (
            <p className="text-xs text-muted mt-0.5">{event.org}</p>
          )}
        </div>
        {event && <CountdownPill deadline={event.application_deadline} size="sm" />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="flex items-center gap-1.5 text-accent">
          <Bell className="w-3.5 h-3.5" />
          {REMINDER_LABELS[reminder.type] ?? reminder.type}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Sends {timeUntilSend}
        </span>
        {event?.event_date && (
          <span>
            Event: {format(parseISO(event.event_date), 'MMM d')}
          </span>
        )}
      </div>

      {event?.apply_url && (
        <a
          href={event.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-accent/70 hover:text-accent transition-colors"
        >
          Apply link <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
