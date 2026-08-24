import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-guard';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppMessage, formatEveningDigest } from '@/lib/whatsapp';
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
      .eq('evening_digest_enabled', true);

    if (userError) throw userError;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 2. Fetch Closing Events (deadline today or tomorrow)
    const { data: closingDbEvents } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('application_deadline', todayStr)
      .lte('application_deadline', tomorrowStr)
      .order('application_deadline', { ascending: true })
      .limit(3);

    // 3. Fetch Newly Discovered Opportunities today
    const { data: newDbEvents } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('created_at', todayStr)
      .limit(3);

    // 4. Fetch Evening AI Reads
    const { data: eveningReadsDb } = await supabase
      .from('digest_items')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(2);

    const closingEvents = (closingDbEvents || []).map((ev) => {
      const days = ev.application_deadline ? differenceInDays(parseISO(ev.application_deadline), now) : 0;
      const deadlineText = days <= 0 ? 'TONIGHT' : days === 1 ? 'TOMORROW' : `in ${days} days`;
      return {
        title: ev.title,
        deadlineText,
        whyRead: ev.why_read,
        applyUrl: ev.apply_url,
      };
    });

    const newOpportunities = (newDbEvents || []).map((ev) => ({
      title: ev.title,
      whyRead: ev.why_read,
      applyUrl: ev.apply_url,
    }));

    const eveningReads = (eveningReadsDb || []).map((item) => ({
      title: item.title,
      oneLine: item.one_line,
      url: item.url,
    }));

    const digestBody = formatEveningDigest({
      closingEvents,
      newOpportunities,
      eveningReads,
    });

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
        await supabase
          .from('user_profiles')
          .update({ last_evening_digest_at: new Date().toISOString() })
          .eq('id', user.id);

        await supabase.from('whatsapp_messages').insert({
          user_id: user.id,
          phone,
          direction: 'outbound',
          message_type: 'evening_digest',
          body: digestBody,
        });
      } else {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Evening digest cron error:', errorMsg);
    return NextResponse.json({ error: errorMsg, results }, { status: 500 });
  }
}
