import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-guard';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppMessage, formatMorningDigest } from '@/lib/whatsapp';
import { decryptText } from '@/lib/crypto';
import { differenceInDays, parseISO, format } from 'date-fns';

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const supabase = createServiceClient();
  const results = { usersProcessed: 0, messagesSent: 0, skipped: 0, errors: 0 };

  try {
    // 1. Fetch eligible active users
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('whatsapp_opted_in', true)
      .eq('notifications_paused', false)
      .eq('morning_digest_enabled', true);

    if (userError) throw userError;

    // 2. Fetch Urgent Events (deadline in <= 3 days)
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const { data: urgentDbEvents } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', todayStr)
      .lte('application_deadline', threeDaysLater)
      .order('application_deadline', { ascending: true })
      .limit(3);

    // 3. Fetch Upcoming Events (within 7 days)
    const sevenDaysLater = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: upcomingDbEvents } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', todayStr)
      .lte('event_date', sevenDaysLater)
      .order('event_date', { ascending: true })
      .limit(3);

    // 4. Fetch Top AI updates (last 24-48h, priority >= 4)
    const { data: aiUpdatesDb } = await supabase
      .from('digest_items')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('fetched_at', { ascending: false })
      .limit(3);

    // Prepare message payload
    const urgentEvents = (urgentDbEvents || []).map((ev) => ({
      title: ev.title,
      daysLeft: ev.application_deadline ? Math.max(0, differenceInDays(parseISO(ev.application_deadline), now)) : 0,
      whyRead: ev.why_read,
      applyUrl: ev.apply_url,
    }));

    const upcomingEvents = (upcomingDbEvents || []).map((ev) => ({
      title: ev.title,
      eventDate: ev.event_date ? format(parseISO(ev.event_date), 'MMM d, yyyy') : 'Upcoming',
      whyRead: ev.why_read,
    }));

    const aiUpdates = (aiUpdatesDb || []).map((item) => ({
      tag: item.tag,
      title: item.title,
      oneLine: item.one_line,
      url: item.url,
    }));

    const digestBody = formatMorningDigest({
      urgentEvents,
      upcomingEvents,
      aiUpdates,
    });

    const orderedEventIds = (urgentDbEvents || []).map((e) => e.id);
    const orderedArticleIds = (aiUpdatesDb || []).map((a) => a.id);

    // 5. Send to each user
    for (const user of users || []) {
      results.usersProcessed++;
      const rawPhone = user.whatsapp_number || '918309166629';
      const phone = decryptText(rawPhone);

      if (!phone) {
        results.skipped++;
        continue;
      }

      const sendRes = await sendWhatsAppMessage({
        to: phone,
        body: digestBody,
      });

      if (sendRes.success) {
        results.messagesSent++;
        // Update user timestamp and log audit record
        await supabase
          .from('user_profiles')
          .update({ last_morning_digest_at: new Date().toISOString() })
          .eq('id', user.id);

        await supabase.from('whatsapp_messages').insert({
          user_id: user.id,
          phone,
          direction: 'outbound',
          message_type: 'morning_digest',
          body: digestBody,
          event_ids: orderedEventIds,
          article_ids: orderedArticleIds,
        });
      } else {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    let errorMsg = String(err);
    if (err instanceof Error) {
      errorMsg = err.message;
    } else if (typeof err === 'object' && err !== null) {
      errorMsg = JSON.stringify(err);
    }
    console.error('Morning digest cron error:', errorMsg);
    return NextResponse.json({ error: errorMsg, results }, { status: 500 });
  }
}
