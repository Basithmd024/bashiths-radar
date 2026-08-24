import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { addEventToCalendar } from '@/lib/calendar';
import { z } from 'zod';

const Schema = z.object({ event_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event_id } = Schema.parse(body);

    // Fetch user's calendar token
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('google_calendar_token')
      .eq('id', user.id)
      .single();

    if (!profile?.google_calendar_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Fetch event
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const result = await addEventToCalendar(
      event,
      profile.google_calendar_token as Record<string, unknown>
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deadlineEventId: result.deadlineEventId,
      dateEventId: result.dateEventId,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add to calendar' }, { status: 500 });
  }
}
