import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const DismissSchema = z.object({ digest_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { digest_id } = DismissSchema.parse(body);

    await supabase
      .from('user_dismissed_digest')
      .upsert({ user_id: user.id, digest_id }, { onConflict: 'user_id,digest_id' });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to dismiss item' }, { status: 500 });
  }
}
