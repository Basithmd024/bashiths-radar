/**
 * Universal WhatsApp Service
 * Primary: Evolution API v2 (Local or Hosted)
 * Fallback: Twilio WhatsApp, Meta Cloud API, or n8n Webhook
 */

import twilio from 'twilio';
import type { Event } from '@/types/event';
import type { DigestItem } from '@/types/digest';

export interface SendWhatsAppParams {
  to: string;
  body: string;
  templateName?: string;
  variables?: Record<string, string>;
}

export interface SendWhatsAppResult {
  success: boolean;
  provider?: 'evolution' | 'twilio' | 'meta' | 'n8n' | 'simulation';
  messageId?: string;
  error?: string;
  details?: string;
}

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'personal';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const N8N_WHATSAPP_WEBHOOK = process.env.N8N_WHATSAPP_WEBHOOK ?? '';

/**
 * Universal WhatsApp Message Sender
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const { to, body } = params;
  const digitsOnly = to.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 8) {
    return { success: false, error: 'Invalid phone number (must include country code)' };
  }

  // ── 1. Evolution API (Primary) ──────────────────────────────
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY && !EVOLUTION_API_URL.includes('placeholder')) {
    try {
      const endpoint = `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: digitsOnly,
          text: body,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const msgId = data?.key?.id ?? data?.id ?? 'msg-sent';
        return {
          success: true,
          provider: 'evolution',
          messageId: msgId,
          details: `Delivered via Evolution API (${EVOLUTION_INSTANCE})`,
        };
      }
    } catch (err: unknown) {
      console.warn('Evolution API send failed:', err instanceof Error ? err.message : err);
    }
  }

  // ── 2. Meta WhatsApp Cloud API ──────────────────────────────
  if (META_WHATSAPP_TOKEN && META_PHONE_NUMBER_ID) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: digitsOnly,
          type: 'text',
          text: { body },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          provider: 'meta',
          messageId: data?.messages?.[0]?.id,
          details: 'Delivered via Meta Cloud API',
        };
      }
    } catch (err: unknown) {
      console.warn('Meta Cloud API send failed:', err instanceof Error ? err.message : err);
    }
  }

  // ── 3. Twilio WhatsApp Sandbox ──────────────────────────────
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !TWILIO_ACCOUNT_SID.includes('placeholder')) {
    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${digitsOnly}`;
      const twilioRes = await client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: formattedTo,
        body,
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: twilioRes.sid,
        details: `Delivered via Twilio WhatsApp (${twilioRes.status})`,
      };
    } catch (err: unknown) {
      console.warn('Twilio WhatsApp send failed:', err instanceof Error ? err.message : err);
    }
  }

  // ── 4. n8n Webhook ──────────────────────────────────────────
  if (N8N_WHATSAPP_WEBHOOK) {
    try {
      const res = await fetch(N8N_WHATSAPP_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: digitsOnly, message: body }),
      });
      if (res.ok) {
        return {
          success: true,
          provider: 'n8n',
          details: 'Dispatched to n8n webhook',
        };
      }
    } catch (err: unknown) {
      console.warn('n8n webhook failed:', err instanceof Error ? err.message : err);
    }
  }

  // ── 5. Simulation Fallback ──────────────────────────────────
  console.log(`[WhatsApp Simulation -> +${digitsOnly}]\n${body}`);
  return {
    success: false,
    provider: 'simulation',
    error: 'No active WhatsApp gateway reached.',
    details: `Simulated message output for +${digitsOnly}`,
  };
}

// ============================================================
// MESSAGE FORMATTERS (Matching Exact Spec)
// ============================================================

/**
 * Morning Briefing (8:00 AM IST)
 */
export function formatMorningDigest(data: {
  urgentEvents: Array<{ title: string; daysLeft: number; whyRead?: string | null; applyUrl?: string | null }>;
  upcomingEvents: Array<{ title: string; eventDate: string; whyRead?: string | null }>;
  aiUpdates: Array<{ tag: string; title: string; oneLine?: string | null; url: string }>;
}): string {
  const sections: string[] = [`☀️ *Hackey — Morning Brief*\n`];

  if (data.urgentEvents.length > 0) {
    sections.push(`🔥 *Urgent applications*`);
    data.urgentEvents.forEach((ev, i) => {
      const num = i + 1;
      const daysText = ev.daysLeft === 0 ? 'CLOSING TODAY' : `${ev.daysLeft} days left`;
      sections.push(
        `${num}. *${ev.title}* — ${daysText}\n→ ${ev.whyRead || 'Apply before deadline.'}\nApply: ${ev.applyUrl || 'Check radar'}\n`
      );
    });
  }

  if (data.upcomingEvents.length > 0) {
    sections.push(`📅 *Upcoming events*`);
    data.upcomingEvents.forEach((ev) => {
      sections.push(`• *${ev.title}* — ${ev.eventDate}\n→ ${ev.whyRead || 'Upcoming builder opportunity.'}\n`);
    });
  }

  if (data.aiUpdates.length > 0) {
    sections.push(`🤖 *AI × Product updates*`);
    data.aiUpdates.forEach((item, i) => {
      const num = i + 1;
      sections.push(
        `${num}. [${item.tag.toUpperCase()}] *${item.title}*\n→ ${item.oneLine || 'Key industry update.'}\nRead: ${item.url}\n`
      );
    });
  }

  sections.push(
    `───────────────────\nReply with:\n*SAVE <num>* — save an event\n*DONE <num>* — mark as applied\n*STATUS* — view saved deadlines\n*MORE* — get more updates`
  );

  return sections.join('\n');
}

/**
 * Evening Briefing (7:00 PM IST)
 */
export function formatEveningDigest(data: {
  closingEvents: Array<{ title: string; deadlineText: string; whyRead?: string | null; applyUrl?: string | null }>;
  newOpportunities: Array<{ title: string; whyRead?: string | null; applyUrl?: string | null }>;
  eveningReads: Array<{ title: string; oneLine?: string | null; url: string }>;
}): string {
  const sections: string[] = [`🌙 *Hackey — Evening Brief*\n`];

  if (data.closingEvents.length > 0) {
    sections.push(`⏰ *Don’t miss these*`);
    data.closingEvents.forEach((ev, i) => {
      const num = i + 1;
      sections.push(
        `${num}. *${ev.title}* — deadline ${ev.deadlineText}\n→ ${ev.whyRead || 'Final hours to submit.'}\nApply: ${ev.applyUrl || 'Check radar'}\n`
      );
    });
  }

  if (data.newOpportunities.length > 0) {
    sections.push(`🆕 *New opportunities found today*`);
    data.newOpportunities.forEach((ev) => {
      sections.push(`• *${ev.title}*\n→ ${ev.whyRead || 'Newly discovered on radar.'}\n`);
    });
  }

  if (data.eveningReads.length > 0) {
    sections.push(`⚡ *Worth reading tonight*`);
    data.eveningReads.forEach((item) => {
      sections.push(`• *${item.title}*\n→ ${item.oneLine || 'Valuable insight for builders.'}\nRead: ${item.url}\n`);
    });
  }

  sections.push(`— Hackey ⚡`);
  return sections.join('\n');
}

/**
 * Urgent Application Reminder (7d / 3d / 1d / deadline day)
 */
export function formatUrgentReminder(data: {
  title: string;
  daysLeft: number;
  eventDate?: string | null;
  whyRead?: string | null;
  applyUrl?: string | null;
}): string {
  const urgencyText = data.daysLeft === 0 ? '⚠️ CLOSING TODAY' : `⏰ ${data.daysLeft} day(s) left to apply`;

  return [
    `🔔 *Application reminder*`,
    ``,
    `*${data.title}*`,
    urgencyText,
    data.eventDate ? `📅 Event date: ${data.eventDate}` : '',
    ``,
    `→ ${data.whyRead || 'Take action on this opportunity.'}`,
    ``,
    data.applyUrl ? `🔗 Apply: ${data.applyUrl}` : '',
    ``,
    `— Hackey ⚡`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Event-Day Kickoff Alert (8:00 AM IST on event date)
 */
export function formatEventDayReminder(data: {
  title: string;
  eventDate?: string | null;
  location?: string | null;
  whyRead?: string | null;
  applyUrl?: string | null;
}): string {
  return [
    `📅 *Event happening today!*`,
    ``,
    `*${data.title}*`,
    data.eventDate ? `🕒 Date: ${data.eventDate}` : '',
    data.location ? `📍 Location: ${data.location}` : '📍 Online',
    ``,
    `→ ${data.whyRead || 'Good luck with today’s event!'}`,
    ``,
    data.applyUrl ? `Details: ${data.applyUrl}` : '',
    ``,
    `— Hackey ⚡`,
  ]
    .filter(Boolean)
    .join('\n');
}
