import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { queueRemindersForEvent, cancelRemindersForEvent } from '@/lib/reminder-queue';
import { z } from 'zod';

const SaveSchema = z.object({ event_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event_id } = SaveSchema.parse(body);

    // Insert saved event
    const { error: saveError } = await supabase
      .from('user_saved_events')
      .upsert({ user_id: user.id, event_id }, { onConflict: 'user_id,event_id' });
    if (saveError) throw saveError;

    // Fetch the event details to queue reminders
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    if (eventError) throw eventError;

    // Fetch user reminder preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('reminder_7d, reminder_3d, reminder_1d, reminder_dayof')
      .eq('id', user.id)
      .single();

    if (profile && event) {
      await queueRemindersForEvent(user.id, event, profile);
    }

    return NextResponse.json({ success: true, queued: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error('POST /api/events/save error:', err);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const event_id = searchParams.get('event_id');
    if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    // Remove saved event
    await supabase
      .from('user_saved_events')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', event_id);

    // Cancel pending reminders
    await cancelRemindersForEvent(user.id, event_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/events/save error:', err);
    return NextResponse.json({ error: 'Failed to unsave event' }, { status: 500 });
  }
}
