export type DigestTag = 'breaking' | 'launch' | 'update' | 'research';

export interface DigestItem {
  id: string;
  title: string;
  url: string;
  source: string | null;
  tag: DigestTag;
  one_line: string | null;
  priority: number; // 1-5
  published_at: string | null;
  fetched_at: string;
  is_active: boolean;
}

export interface ClaudeDigestResponse {
  worth_reading: boolean;
  tag: DigestTag;
  one_line: string;
  priority: number;
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  source: string;
}
