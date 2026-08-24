import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeDigestResponse } from '@/types/digest';
import type { Event } from '@/types/event';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = 'claude-sonnet-4-5';

// ── Rate limiting: simple in-memory queue ────────────────────
let activeRequests = 0;
const MAX_CONCURRENT = 5;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeRequests < MAX_CONCURRENT) {
      activeRequests++;
      resolve();
    } else {
      queue.push(() => { activeRequests++; resolve(); });
    }
  });
}

function releaseSlot(): void {
  activeRequests--;
  if (queue.length > 0) {
    const next = queue.shift()!;
    next();
  }
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// ── Filter article for digest ────────────────────────────────
export async function filterArticle(
  title: string,
  description: string
): Promise<ClaudeDigestResponse | null> {
  await acquireSlot();
  try {
    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 256,
        system: `You are a ruthless filter for a CSE student in Hyderabad who builds AI tools, does n8n automation, participates in hackathons, and tracks the AI product space. Only flag articles that are genuinely useful or actionable for someone building real products. Skip hype, opinion pieces, and generic AI news.`,
        messages: [
          {
            role: 'user',
            content: `Article title: ${title}\nSummary: ${description}\n\nReturn ONLY valid JSON, no markdown:\n{\n  "worth_reading": true/false,\n  "tag": "breaking" | "launch" | "update" | "research",\n  "one_line": "One sentence on why THIS specific person should read it. Max 15 words.",\n  "priority": 1-5\n}`,
          },
        ],
      })
    );

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text.trim()) as ClaudeDigestResponse;
  } catch (err) {
    console.error('Claude filterArticle error:', err);
    return null;
  } finally {
    releaseSlot();
  }
}

// ── Generate "why read" for an event ────────────────────────
export async function generateWhyRead(event: Partial<Event>): Promise<string> {
  await acquireSlot();
  try {
    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 80,
        system: `You generate one-line "why apply" blurbs for events targeting a CSE student at MGIT Hyderabad who builds AI tools and participates in hackathons. Be specific about the benefit. Max 15 words. No filler.`,
        messages: [
          {
            role: 'user',
            content: `Event: ${event.title}\nOrg: ${event.org}\nType: ${event.type}\nTags: ${event.tags?.join(', ')}\nDescription: ${event.description?.slice(0, 300)}\n\nGenerate one line (max 15 words). No quotes.`,
          },
        ],
      })
    );
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.trim().replace(/^["']|["']$/g, '');
  } catch {
    return `${event.type} by ${event.org} — check it out.`;
  } finally {
    releaseSlot();
  }
}

// ── Batch generate why_read for multiple events ──────────────
export async function generateWhyReadBatch(events: Partial<Event>[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  await Promise.all(
    events.map(async (event) => {
      if (event.id) {
        const why = await generateWhyRead(event);
        results.set(event.id, why);
      }
    })
  );
  return results;
}
