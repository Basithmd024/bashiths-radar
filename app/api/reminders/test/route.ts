import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, formatUrgentReminder } from '@/lib/whatsapp';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    let whatsapp_number: string | null = null;
    let event_title = 'Smart India Hackathon 2026 Internal Round';

    try {
      const body = await req.json();
      if (body.whatsapp_number) whatsapp_number = body.whatsapp_number;
      if (body.event_title) event_title = body.event_title;
    } catch {
      // Body is optional
    }

    if (!whatsapp_number) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('whatsapp_number')
            .eq('id', user.id)
            .single();
          if (profile?.whatsapp_number) whatsapp_number = profile.whatsapp_number;
        }
      } catch {
        // Fallback
      }
    }

    if (!whatsapp_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a WhatsApp number (e.g. +91 98765 43210)',
        },
        { status: 400 }
      );
    }

    const testMessage = formatUrgentReminder({
      title: event_title,
      daysLeft: 3,
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      whyRead: 'SIH internal round at MGIT — winning puts your team directly on the national stage.',
      applyUrl: 'https://sih.gov.in',
    });

    const result = await sendWhatsAppMessage({
      to: whatsapp_number,
      body: testMessage,
    });

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      details: result.details,
      sent_to: whatsapp_number,
      message_preview: testMessage,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
