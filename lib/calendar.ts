/**
 * Google Calendar API Helpers
 * OAuth 2.0 flow + creating calendar entries
 */

import { google } from 'googleapis';
import type { Event } from '@/types/event';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate Google OAuth consent URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // Force refresh_token on every auth
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Add an event to Google Calendar (creates 2 entries: deadline + event date)
 */
export async function addEventToCalendar(
  event: Event,
  calendarToken: Record<string, unknown>
): Promise<{ deadlineEventId?: string; dateEventId?: string; error?: string }> {
  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(calendarToken as Parameters<typeof oauth2Client.setCredentials>[0]);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const baseDescription = [
      event.why_read ? `Why apply: ${event.why_read}` : '',
      event.description ? `\n${event.description}` : '',
      event.apply_url ? `\nApply: ${event.apply_url}` : '',
      event.tags?.length ? `\nTags: ${event.tags.join(', ')}` : '',
    ].filter(Boolean).join('');

    const results: { deadlineEventId?: string; dateEventId?: string } = {};

    // 1. Application Deadline entry
    if (event.application_deadline) {
      const deadline = new Date(event.application_deadline);
      const deadlineEvent = {
        summary: `📝 Apply: ${event.title}`,
        description: baseDescription,
        start: { date: event.application_deadline },
        end: { date: event.application_deadline },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 24 * 60 }], // 1 day before
        },
        colorId: '11', // Tomato
      };
      const deadlineRes = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: deadlineEvent,
      });
      results.deadlineEventId = deadlineRes.data.id ?? undefined;
      void deadline;
    }

    // 2. Event Date entry
    if (event.event_date) {
      const eventEntry = {
        summary: `🎯 ${event.title}`,
        description: baseDescription,
        location: event.location ?? undefined,
        start: { date: event.event_date },
        end: { date: event.event_date },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 120 }], // 2 hours before
        },
        colorId: '9', // Blueberry
      };
      const eventRes = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventEntry,
      });
      results.dateEventId = eventRes.data.id ?? undefined;
    }

    return results;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Google Calendar error:', errorMsg);
    return { error: errorMsg };
  }
}
