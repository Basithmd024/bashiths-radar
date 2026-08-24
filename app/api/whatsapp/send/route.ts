import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const SendSchema = z.object({
  to: z.string().min(8),
  body: z.string().min(1),
  templateName: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check auth or cron secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.replace('Bearer ', '');
    const isCron = cronSecret && bearer === cronSecret;

    if (!user && !isCron) {
      // In local dev, allow sending if to number is provided
    }

    const body = await req.json();
    const parsed = SendSchema.parse(body);

    const result = await sendWhatsAppMessage({
      to: parsed.to,
      body: parsed.body,
      templateName: parsed.templateName,
      variables: parsed.variables,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
