import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-guard';
import { fetchAllFeeds } from '@/lib/rss';
import { filterArticle } from '@/lib/claude';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const supabase = createServiceClient();
  const results = { fetched: 0, processed: 0, inserted: 0, skipped: 0, errors: 0 };

  try {
    console.log('[cron/fetch-digest] Fetching RSS feeds...');
    const items = await fetchAllFeeds();
    results.fetched = items.length;
    console.log(`[cron/fetch-digest] Got ${items.length} articles`);

    // Process in batches of 5 (Claude rate limit)
    for (let i = 0; i < items.length; i += 5) {
      const batch = items.slice(i, i + 5);

      await Promise.all(batch.map(async (item) => {
        results.processed++;
        try {
          if (!item.title || !item.link) {
            results.skipped++;
            return;
          }

          const aiResult = await filterArticle(item.title, item.description);
          if (!aiResult || !aiResult.worth_reading) {
            results.skipped++;
            return;
          }

          const { error } = await supabase
            .from('digest_items')
            .upsert(
              {
                title: item.title,
                url: item.link,
                source: item.source,
                tag: aiResult.tag,
                one_line: aiResult.one_line,
                priority: aiResult.priority,
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
                fetched_at: new Date().toISOString(),
                is_active: true,
              },
              { onConflict: 'url' }
            );

          if (error) {
            results.errors++;
          } else {
            results.inserted++;
          }
        } catch (err) {
          console.error('Article processing error:', err);
          results.errors++;
        }
      }));

      // Small delay between batches
      if (i + 5 < items.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log('[cron/fetch-digest] Done:', results);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[cron/fetch-digest] Fatal error:', err);
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
