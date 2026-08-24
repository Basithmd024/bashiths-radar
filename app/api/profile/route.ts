import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { encryptText, decryptText } from '@/lib/crypto';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  whatsapp_number:         z.string().nullable().optional(),
  whatsapp_opted_in:       z.boolean().optional(),
  notifications_paused:    z.boolean().optional(),
  morning_digest_enabled:  z.boolean().optional(),
  evening_digest_enabled:  z.boolean().optional(),
  reminder_7d:             z.boolean().optional(),
  reminder_3d:             z.boolean().optional(),
  reminder_1d:             z.boolean().optional(),
  reminder_deadline_day:   z.boolean().optional(),
  reminder_event_day:      z.boolean().optional(),
  location_prefs:          z.array(z.string()).optional(),
  type_prefs:              z.array(z.string()).optional(),
  free_only:               z.boolean().optional(),
  digest_source_prefs:     z.array(z.string()).optional(),
});

const DEFAULT_PROFILE = {
  id: '00000000-0000-0000-0000-000000000000',
  whatsapp_number: '',
  whatsapp_opted_in: true,
  notifications_paused: false,
  morning_digest_enabled: true,
  evening_digest_enabled: true,
  reminder_7d: true,
  reminder_3d: true,
  reminder_1d: true,
  reminder_deadline_day: true,
  reminder_event_day: true,
  location_prefs: ['hyderabad', 'thub', 'iiith', 'mgit', 'pan-india', 'online'],
  type_prefs: ['hackathon', 'workshop', 'summit', 'conference'],
  free_only: false,
  digest_source_prefs: ['Anthropic News', 'OpenAI Blog', 'TechCrunch AI', 'Hacker News', 'Product Hunt AI', 'AI Snake Oil'],
  google_calendar_token: null,
  created_at: new Date().toISOString(),
};

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ profile: DEFAULT_PROFILE });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ profile: { ...DEFAULT_PROFILE, id: user.id } });
    }

    return NextResponse.json({
      profile: {
        ...data,
        whatsapp_number: decryptText(data.whatsapp_number),
      },
    });
  } catch (err) {
    return NextResponse.json({ profile: DEFAULT_PROFILE });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const updates = ProfileUpdateSchema.parse(body);

    const payloadToStore = {
      ...updates,
      whatsapp_number: updates.whatsapp_number ? encryptText(updates.whatsapp_number) : updates.whatsapp_number,
    };

    if (!user) {
      return NextResponse.json({ profile: { ...DEFAULT_PROFILE, ...updates } });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, ...payloadToStore })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      profile: {
        ...data,
        whatsapp_number: decryptText(data.whatsapp_number),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
