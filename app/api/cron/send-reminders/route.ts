import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-guard';
import { getDueReminders } from '@/lib/reminder-queue';
import { sendWhatsAppMessage, formatUrgentReminder, formatEventDayReminder } from '@/lib/whatsapp';
import { createServiceClient } from '@/lib/supabase-server';
import { decryptText } from '@/lib/crypto';
import { differenceInDays, parseISO, format } from 'date-fns';

export async function POST(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const supabase = createServiceClient();
  const results = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  try {
    const dueReminders = await getDueReminders();
    results.processed = dueReminders.length;

    for (const reminder of dueReminders) {
      const profile = reminder.profile;
      const event = reminder.event;

      if (!profile?.whatsapp_number || !event) {
        results.skipped++;
        await supabase
          .from('reminders')
          .update({ status: 'failed', error_msg: 'No WhatsApp number or event data' })
          .eq('id', reminder.id);
        continue;
      }

      // Check if user paused notifications or opted out
      if (profile.notifications_paused || profile.whatsapp_opted_in === false) {
        results.skipped++;
        continue;
      }

      const phone = decryptText(profile.whatsapp_number);
      if (!phone) {
        results.skipped++;
        continue;
      }

      const deadline = event.application_deadline ? new Date(event.application_deadline) : null;
      const daysLeft = deadline ? Math.max(0, differenceInDays(deadline, new Date())) : 0;
      const eventDateStr = event.event_date ? format(parseISO(event.event_date), 'MMM d, yyyy') : null;

      let messageBody = '';

      if (reminder.type === 'event_day') {
        messageBody = formatEventDayReminder({
          title: event.title,
          eventDate: eventDateStr,
          location: event.location,
          whyRead: event.why_read,
          applyUrl: event.apply_url,
        });
      } else {
        messageBody = formatUrgentReminder({
          title: event.title,
          daysLeft,
          eventDate: eventDateStr,
          whyRead: event.why_read,
          applyUrl: event.apply_url,
        });
      }

      const sendRes = await sendWhatsAppMessage({
        to: phone,
        body: messageBody,
      });

      if (sendRes.success) {
        await supabase
          .from('reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        results.sent++;
      } else {
        await supabase
          .from('reminders')
          .update({
            status: (reminder.retry_count || 0) >= 3 ? 'failed' : 'pending',
            retry_count: (reminder.retry_count || 0) + 1,
            error_msg: sendRes.error || 'Gateway send failed',
          })
          .eq('id', reminder.id);

        results.failed++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[cron/send-reminders] Fatal error:', errorMsg);
    return NextResponse.json({ error: errorMsg, results }, { status: 500 });
  }
}
