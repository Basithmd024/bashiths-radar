import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { queueRemindersForEvent } from '@/lib/reminder-queue';
import { z } from 'zod';

const ManualEventSchema = z.object({
  title: z.string().min(3).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  apply_url: z.string().url().optional().or(z.literal('')),
  org: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  type: z.enum(['hackathon', 'workshop', 'summit', 'conference']).default('hackathon'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ManualEventSchema.parse(body);

    // Create the event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...parsed,
        is_manually_added: true,
        is_free: true,
        tags: ['manual'],
        why_read: `Manually tracked by you.`,
      })
      .select()
      .single();
    if (error) throw error;

    // Auto-save for this user
    await supabase
      .from('user_saved_events')
      .upsert({ user_id: user.id, event_id: event.id }, { onConflict: 'user_id,event_id' });

    // Queue reminders
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('reminder_7d, reminder_3d, reminder_1d, reminder_dayof')
      .eq('id', user.id)
      .single();
    if (profile) {
      await queueRemindersForEvent(user.id, event, profile);
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('POST /api/events/manual error:', err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
