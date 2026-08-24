import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Reminder } from '@/types/reminder';
import type { Event } from '@/types/event';

const SAMPLE_REMINDERS: (Reminder & { event: Partial<Event> })[] = [
  {
    id: 'rem-1',
    user_id: '00000000-0000-0000-0000-000000000000',
    event_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    send_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    type: '3day',
    status: 'pending',
    sent_at: null,
    error_msg: null,
    created_at: new Date().toISOString(),
    event: {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Smart India Hackathon 2026 Internal Round',
      org: 'MGIT / AICTE',
      type: 'hackathon',
      application_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      apply_url: 'https://sih.gov.in',
    },
  },
  {
    id: 'rem-2',
    user_id: '00000000-0000-0000-0000-000000000000',
    event_id: 'a12bc34d-58cc-4372-a567-0e02b2c3d480',
    send_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    type: '7day',
    status: 'pending',
    sent_at: null,
    error_msg: null,
    created_at: new Date().toISOString(),
    event: {
      id: 'a12bc34d-58cc-4372-a567-0e02b2c3d480',
      title: 'T-Hub AI Product Innovation Summit 2026',
      org: 'T-Hub Hyderabad',
      type: 'summit',
      application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      apply_url: 'https://thub.telangana.gov.in/events',
    },
  },
];

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    let remindersData: any[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('reminders')
          .select('*, event:events(*)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('send_at', { ascending: true });

        if (!error && data && data.length > 0) {
          remindersData = data;
        }
      }
    } catch {
      // Ignore auth err
    }

    if (remindersData.length === 0) {
      remindersData = SAMPLE_REMINDERS;
    }

    return NextResponse.json({ reminders: remindersData });
  } catch (err) {
    console.error('GET /api/reminders error:', err);
    return NextResponse.json({ reminders: SAMPLE_REMINDERS });
  }
}
