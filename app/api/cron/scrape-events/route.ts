import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-guard';
import { scrapeAllSources } from '@/lib/scraper';
import { generateWhyRead } from '@/lib/claude';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const supabase = createServiceClient();
  const results = { scraped: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    console.log('[cron/scrape-events] Starting scrape...');
    const events = await scrapeAllSources();
    results.scraped = events.length;
    console.log(`[cron/scrape-events] Scraped ${events.length} events`);

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < events.length; i += 5) {
      const batch = events.slice(i, i + 5);

      await Promise.all(batch.map(async (event) => {
        try {
          if (!event.title || event.title.length < 3) {
            results.skipped++;
            return;
          }

          // Check if event already exists (by title + source_url)
          const { data: existing } = await supabase
            .from('events')
            .select('id, why_read')
            .ilike('title', event.title)
            .limit(1)
            .single();

          if (existing) {
            results.skipped++;
            return;
          }

          // Generate why_read via Claude
          const why_read = await generateWhyRead(event as Parameters<typeof generateWhyRead>[0]);

          const { error } = await supabase
            .from('events')
            .insert({ ...event, why_read });

          if (error) {
            console.error('Insert error:', error.message);
            results.errors++;
          } else {
            results.inserted++;
          }
        } catch (err) {
          console.error('Event processing error:', err);
          results.errors++;
        }
      }));
    }

    console.log('[cron/scrape-events] Done:', results);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[cron/scrape-events] Fatal error:', err);
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
