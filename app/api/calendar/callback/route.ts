import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/calendar';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state'); // user_id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const supabase = createServiceClient();

    await supabase
      .from('user_profiles')
      .update({ google_calendar_token: tokens })
      .eq('id', state);

    return NextResponse.redirect(`${appUrl}/settings?calendar=connected`);
  } catch (err) {
    console.error('Calendar callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?calendar=error`);
  }
}
