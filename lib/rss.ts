/**
 * RSS Feed Fetcher
 * Uses rss-parser to fetch and normalize articles from multiple sources
 */

import Parser from 'rss-parser';
import type { RSSItem } from '@/types/digest';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Basith-Radar/1.0 (RSS reader; contact@basith.dev)',
  },
});

const FEED_SOURCES: Array<{ name: string; url: string }> = [
  { name: 'Anthropic News',  url: 'https://www.anthropic.com/news.rss' },
  { name: 'OpenAI Blog',     url: 'https://openai.com/blog/rss.xml' },
  { name: 'TechCrunch AI',   url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'Hacker News',     url: 'https://hnrss.org/frontpage?q=AI+product+tools&count=20' },
  { name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed?category=artificial-intelligence' },
  { name: 'AI Snake Oil',    url: 'https://www.aisnakeoil.com/feed' },
  { name: 'The Rundown AI',  url: 'https://www.therundown.ai/rss' },
];

async function fetchOneFeed(source: { name: string; url: string }): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? []).slice(0, 20).map((item) => ({
      title:       (item.title ?? '').trim(),
      link:        item.link ?? item.guid ?? '',
      description: (item.contentSnippet ?? item.summary ?? item.content ?? '').slice(0, 500),
      pubDate:     item.pubDate ?? item.isoDate,
      source:      source.name,
    })).filter(i => i.title && i.link);
  } catch (err) {
    console.error(`RSS fetch failed for ${source.name}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Fetch all configured RSS feeds concurrently
 * Deduplicates by URL
 */
export async function fetchAllFeeds(): Promise<RSSItem[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchOneFeed));
  const allItems: RSSItem[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const item of result.value) {
        if (item.link && !seenUrls.has(item.link)) {
          seenUrls.add(item.link);
          allItems.push(item);
        }
      }
    }
  }

  // Sort by pubDate descending (newest first)
  return allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });
}

export { FEED_SOURCES };
