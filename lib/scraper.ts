/**
 * Web Scraper for Events
 * Uses Cheerio for static HTML, puppeteer-core for SPAs
 */

import * as cheerio from 'cheerio';
import type { Event } from '@/types/event';

type PartialEvent = Omit<Event, 'id' | 'why_read' | 'is_active' | 'scraped_at' | 'created_at'>;

// ── Utility: fetch with timeout + headers ────────────────────
async function fetchHTML(url: string, timeoutMs = 15000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BasithRadar/1.0; +https://basith.dev)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`fetchHTML failed for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Devfolio ─────────────────────────────────────────────────
export async function scrapeDevfolio(): Promise<PartialEvent[]> {
  const html = await fetchHTML('https://devfolio.co/hackathons');
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: PartialEvent[] = [];

  // Devfolio renders hackathon cards with data attributes
  $('[data-hackathon-slug]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
    const slug  = $el.attr('data-hackathon-slug');
    if (!title || !slug) return;

    events.push({
      title,
      org: $el.find('[class*="org"], [class*="organizer"]').first().text().trim() || 'Devfolio',
      type: 'hackathon',
      location: $el.find('[class*="location"]').first().text().trim() || 'Online',
      is_free: true,
      application_deadline: null,
      event_date: null,
      description: $el.find('[class*="description"], p').first().text().trim() || null,
      apply_url: `https://devfolio.co/hackathons/${slug}`,
      source_url: 'https://devfolio.co/hackathons',
      tags: ['hackathon', 'devfolio'],
      is_manually_added: false,
    });
  });

  return events.slice(0, 20);
}

// ── T-Hub ─────────────────────────────────────────────────────
export async function scrapeTHub(): Promise<PartialEvent[]> {
  const html = await fetchHTML('https://thub.telangana.gov.in/events');
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: PartialEvent[] = [];

  $('article, .event-card, .event-item, [class*="event"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, h4, .title').first().text().trim();
    const link  = $el.find('a').first().attr('href');
    if (!title) return;

    const dateText = $el.find('[class*="date"], time').first().text().trim();
    events.push({
      title,
      org: 'T-Hub Hyderabad',
      type: 'summit',
      location: 'T-Hub, Hyderabad',
      is_free: true,
      application_deadline: null,
      event_date: dateText || null,
      description: $el.find('p').first().text().trim() || null,
      apply_url: link ? (link.startsWith('http') ? link : `https://thub.telangana.gov.in${link}`) : 'https://thub.telangana.gov.in/events',
      source_url: 'https://thub.telangana.gov.in/events',
      tags: ['T-Hub', 'hyderabad', 'summit'],
      is_manually_added: false,
    });
  });

  return events.slice(0, 15);
}

// ── IIIT Hyderabad ────────────────────────────────────────────
export async function scrapeIIITH(): Promise<PartialEvent[]> {
  const html = await fetchHTML('https://iiit.ac.in/events');
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: PartialEvent[] = [];

  $('article, .event, [class*="event-card"], li').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, h4, a').first().text().trim();
    const link  = $el.find('a').first().attr('href');
    if (!title || title.length < 5) return;

    events.push({
      title,
      org: 'IIIT Hyderabad',
      type: 'workshop',
      location: 'IIIT Hyderabad, Gachibowli',
      is_free: true,
      application_deadline: null,
      event_date: null,
      description: $el.find('p, [class*="desc"]').first().text().trim() || null,
      apply_url: link ? (link.startsWith('http') ? link : `https://iiit.ac.in${link}`) : 'https://iiit.ac.in/events',
      source_url: 'https://iiit.ac.in/events',
      tags: ['IIIT-H', 'research', 'hyderabad'],
      is_manually_added: false,
    });
  });

  return events.slice(0, 10);
}

// ── Unstop (static fallback) ──────────────────────────────────
export async function scrapeUnstop(): Promise<PartialEvent[]> {
  // Unstop is a SPA; use their public API endpoint
  try {
    const res = await fetch(
      'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathon&per_page=20&is_active=true',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data?.data ?? [];
    return items.slice(0, 20).map((item: Record<string, any>) => ({
      title: String(item.title ?? ''),
      org: String(item.organisation?.name ?? item.user_company ?? 'Unstop'),
      type: 'hackathon' as const,
      location: String(item.region ?? item.city ?? 'Online'),
      is_free: item.is_paid === false || item.registration_fees === 0,
      application_deadline: item.end_date ? String(item.end_date).split('T')[0] : null,
      event_date: item.start_date ? String(item.start_date).split('T')[0] : null,
      description: String(item.tagline ?? item.description ?? '').slice(0, 500),
      apply_url: item.seo_url ? `https://unstop.com/${item.seo_url}` : 'https://unstop.com',
      source_url: 'https://unstop.com',
      tags: ['hackathon', 'unstop', 'student'],
      is_manually_added: false,
    }));
  } catch (err) {
    console.error('Unstop scrape failed:', err);
    return [];
  }
}

// ── Dare2Compete (JSON API fallback) ─────────────────────────
export async function scrapeDare2Compete(): Promise<PartialEvent[]> {
  try {
    const res = await fetch(
      'https://dare2compete.com/api/opportunities?type=hackathon&page=1',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data ?? data?.opportunities ?? [];
    return items.slice(0, 15).map((item: Record<string, any>) => ({
      title: String(item.name ?? item.title ?? ''),
      org: String(item.brand ?? item.org ?? 'Dare2Compete'),
      type: 'hackathon' as const,
      location: String(item.location ?? item.mode ?? 'Online'),
      is_free: !item.is_paid,
      application_deadline: item.apply_end ? String(item.apply_end).split('T')[0] : null,
      event_date: item.start_date ? String(item.start_date).split('T')[0] : null,
      description: String(item.description ?? '').slice(0, 500),
      apply_url: item.url ? String(item.url) : 'https://dare2compete.com',
      source_url: 'https://dare2compete.com',
      tags: ['hackathon', 'dare2compete', 'student'],
      is_manually_added: false,
    }));
  } catch (err) {
    console.error('Dare2Compete scrape failed:', err);
    return [];
  }
}

// ── Townscript ────────────────────────────────────────────────
export async function scrapeTownscript(): Promise<PartialEvent[]> {
  const html = await fetchHTML(
    'https://www.townscript.com/in/hyderabad/tech-events'
  );
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: PartialEvent[] = [];

  $('[class*="event-card"], [class*="eventCard"], .event-listing, .event-wrap').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, .event-name, [class*="title"]').first().text().trim();
    const link  = $el.find('a').first().attr('href');
    if (!title || title.length < 5) return;

    events.push({
      title,
      org: $el.find('[class*="organizer"], [class*="org"]').first().text().trim() || 'Townscript',
      type: 'workshop',
      location: $el.find('[class*="location"], [class*="venue"]').first().text().trim() || 'Hyderabad',
      is_free: $el.text().toLowerCase().includes('free'),
      application_deadline: null,
      event_date: null,
      description: null,
      apply_url: link ? (link.startsWith('http') ? link : `https://www.townscript.com${link}`) : 'https://www.townscript.com',
      source_url: 'https://www.townscript.com/in/hyderabad/tech-events',
      tags: ['hyderabad', 'tech', 'townscript'],
      is_manually_added: false,
    });
  });

  return events.slice(0, 15);
}

// ── Master scrape function ────────────────────────────────────
export async function scrapeAllSources(): Promise<PartialEvent[]> {
  const results = await Promise.allSettled([
    scrapeDevfolio(),
    scrapeTHub(),
    scrapeIIITH(),
    scrapeUnstop(),
    scrapeDare2Compete(),
    scrapeTownscript(),
  ]);

  const allEvents: PartialEvent[] = [];
  const seenTitles = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const event of result.value) {
        const key = event.title.toLowerCase().trim();
        if (key.length > 3 && !seenTitles.has(key)) {
          seenTitles.add(key);
          allEvents.push(event);
        }
      }
    }
  }

  return allEvents;
}
