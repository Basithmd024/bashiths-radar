import type { EventType } from '@/types/event';
import type { DigestTag } from '@/types/digest';

type Tag = EventType | DigestTag | string;

const TAG_STYLES: Record<string, string> = {
  // Event types
  hackathon:  'bg-purple-900/60 text-purple-300 border-purple-700/50',
  workshop:   'bg-blue-900/60   text-blue-300   border-blue-700/50',
  summit:     'bg-teal-900/60   text-teal-300   border-teal-700/50',
  conference: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50',
  // Digest tags
  breaking:   'bg-red-900/60    text-red-300    border-red-700/50',
  launch:     'bg-cyan-900/60   text-cyan-300   border-cyan-700/50',
  update:     'bg-amber-900/60  text-amber-300  border-amber-700/50',
  research:   'bg-violet-900/60 text-violet-300 border-violet-700/50',
  // Generic
  free:       'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
  manual:     'bg-slate-800/60  text-slate-400  border-slate-700/50',
};

interface TagPillProps {
  tag: Tag;
  className?: string;
}

export function TagPill({ tag, className = '' }: TagPillProps) {
  const style = TAG_STYLES[tag.toLowerCase()] ?? 'bg-slate-800/60 text-slate-400 border-slate-700/50';
  return (
    <span className={`tag-pill border ${style} ${className}`}>
      {tag}
    </span>
  );
}
