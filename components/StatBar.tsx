import { Calendar, BookmarkCheck, AlertTriangle } from 'lucide-react';

interface StatBarProps {
  total: number;
  saved: number;
  urgent: number; // deadline ≤ 3 days
}

export function StatBar({ total, saved, urgent }: StatBarProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-accent" />
        <span className="font-mono text-text font-semibold">{total}</span>
        <span>events</span>
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1.5">
        <BookmarkCheck className="w-4 h-4 text-pink-400" />
        <span className="font-mono text-text font-semibold">{saved}</span>
        <span>saved</span>
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1.5">
        <AlertTriangle className={`w-4 h-4 ${urgent > 0 ? 'text-danger animate-pulse' : 'text-muted'}`} />
        <span className={`font-mono font-semibold ${urgent > 0 ? 'text-danger' : 'text-text'}`}>{urgent}</span>
        <span>urgent</span>
      </span>
    </div>
  );
}
