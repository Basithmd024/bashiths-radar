/**
 * Reminder Queue Management
 * Auto-schedules 7d, 3d, 1d, deadline_day, and event_day WhatsApp alerts
 */

import { createServerSupabaseClient, createServiceClient } from './supabase-server';
import type { Event } from '@/types/event';
import type { ReminderType } from '@/types/reminder';
import type { UserProfile } from '@/types/user';

/**
 * Queue reminders for an event based on user preferences
 */
export async function queueRemindersForEvent(
  userId: string,
  event: Event,
  reminderPrefs: Partial<UserProfile>
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();

  const entries: Array<{
    user_id: string;
    event_id: string;
    send_at: string;
    type: ReminderType;
    status: 'pending';
  }> = [];

  if (event.application_deadline) {
    const deadline = new Date(event.application_deadline);

    const schedule: Array<{ type: ReminderType; enabled: boolean; daysBefore: number; hour: number }> = [
      { type: '7day',         enabled: reminderPrefs.reminder_7d ?? true,           daysBefore: 7, hour: 9 },
      { type: '3day',         enabled: reminderPrefs.reminder_3d ?? true,           daysBefore: 3, hour: 9 },
      { type: '1day',         enabled: reminderPrefs.reminder_1d ?? true,           daysBefore: 1, hour: 9 },
      { type: 'deadline_day', enabled: reminderPrefs.reminder_deadline_day ?? true, daysBefore: 0, hour: 9 },
    ];

    for (const s of schedule) {
      if (!s.enabled) continue;
      const sendAt = new Date(deadline);
      sendAt.setDate(sendAt.getDate() - s.daysBefore);
      sendAt.setHours(s.hour, 0, 0, 0); // 9:00 AM IST
      if (sendAt > now) {
        entries.push({
          user_id: userId,
          event_id: event.id,
          send_at: sendAt.toISOString(),
          type: s.type,
          status: 'pending',
        });
      }
    }
  }

  // Event Day reminder (8:00 AM morning of event)
  if ((reminderPrefs.reminder_event_day ?? true) && event.event_date) {
    const eventDay = new Date(event.event_date);
    eventDay.setHours(8, 0, 0, 0); // 8:00 AM
    if (eventDay > now) {
      entries.push({
        user_id: userId,
        event_id: event.id,
        send_at: eventDay.toISOString(),
        type: 'event_day',
        status: 'pending',
      });
    }
  }

  if (entries.length > 0) {
    const { error } = await supabase
      .from('reminders')
      .upsert(entries, { onConflict: 'user_id,event_id,type' });

    if (error) console.error('Reminder queue error:', error.message);
  }
}

/**
 * Cancel all pending reminders for a user/event pair
 */
export async function cancelRemindersForEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from('reminders')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'pending');
}

/**
 * Get all due reminders for cron processing
 */
export async function getDueReminders() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      event:events(*),
      profile:user_profiles(*)
    `)
    .eq('status', 'pending')
    .lte('send_at', new Date().toISOString())
    .order('send_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('getDueReminders error:', error.message);
    return [];
  }
  return data ?? [];
}
