# 🛰️ Basith’s Radar — Master Project & Maintenance Handbook

Welcome to **Basith’s Radar** (Reminder Daily Update) — an autonomous, WhatsApp-first AI × PM Event Tracker, Hackathon Monitor & Intelligence Digest built for CSE builders at MGIT Hyderabad.

This handbook is your single source of truth for the architecture, environment variables, daily cron automation, troubleshooting, and guides for future updates.

---

## 📑 Table of Contents

1. [System Architecture & Data Flow](#1-system-architecture--data-flow)
2. [How WhatsApp Interaction Works](#2-how-whatsapp-interaction-works)
3. [Repository File Map](#3-repository-file-map)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Automated Cron Schedule & Pipelines](#5-automated-cron-schedule--pipelines)
6. [How to Add New Features](#6-how-to-add-new-features)
   - [Adding a New Event Source / Scraper](#adding-a-new-event-source--scraper)
   - [Adding a New AI News RSS Feed](#adding-a-new-ai-news-rss-feed)
   - [Modifying WhatsApp Message Formats](#modifying-whatsapp-message-formats)
   - [Adding New WhatsApp Commands](#adding-new-whatsapp-commands)
7. [Troubleshooting & Error Runbook](#7-troubleshooting--error-runbook)
8. [Future Roadmap & Ideas](#8-future-roadmap--ideas)

---

## 1. System Architecture & Data Flow

```
                                  ┌────────────────────────────────────────┐
                                  │            Target Event & News         │
                                  │  - Townscript, Devfolio, Unstop, T-Hub │
                                  │  - Anthropic, OpenAI, TechCrunch, HN   │
                                  └───────────────────┬────────────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │    Vercel Cron Automation    │
                                       │  - Scraper (Cheerio)         │
                                       │  - Claude 3.7 Sonnet Filter  │
                                       └──────────────┬───────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │     Supabase PostgreSQL      │
                                       │  - Encrypted Phone Numbers   │
                                       │  - Events & Digest Database  │
                                       │  - Reminder Queue (7d/3d/1d) │
                                       └──────────────┬───────────────┘
                                                      │
                                                      ▼
┌────────────────────────┐             ┌──────────────────────────────┐
│  WhatsApp (Your Phone) │◄────────────┤  Evolution API v2 on Render  │
│  - "Message Yourself"  │             │  https://evolution-api-t9p5  │
│  - Receive 8AM & 7PM   ├────────────►│  .onrender.com               │
└────────────────────────┘  Webhook    └──────────────┬───────────────┘
                            Inbound                   │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │  Vercel Webhook Router       │
                                       │  /api/whatsapp/webhook       │
                                       │  - Whitelist: 918309166629   │
                                       │  - Filters group chats       │
                                       │  - Executes SAVE, DONE, etc. │
                                       └──────────────────────────────┘
```

---

## 2. How WhatsApp Interaction Works

### **How the Bot Communicates With You**

#### **Method 1: Single Number (Current Setup — "Message Yourself")**
* **How it works:** Evolution API is linked to your personal WhatsApp number (`+918309166629`).
* **Where messages arrive:** In your **"Message Yourself"** chat (the chat with your own contact name in WhatsApp).
* **How to send commands:** 
  1. Open WhatsApp $\rightarrow$ Tap your own chat (**"You"** / **"Message Yourself"**).
  2. Type **`STATUS`**, **`MORE`**, **`SAVE 1`**, **`DONE 1`**, **`PAUSE`**, or **`RESUME`**.
  3. The bot reads your command, executes it in the database, and responds immediately.

#### **Method 2: Dedicated Bot Number (Optional for the Future)**
If you ever want the bot to appear as a completely separate contact (e.g. *"Basith's Radar Assistant"*):
1. Take a spare SIM card or virtual number.
2. Link that number to Render Evolution API by scanning the QR code with that phone.
3. In `app/api/whatsapp/webhook/route.ts`, set `AUTHORIZED_PHONE=918309166629` (your personal phone).
4. Now you chat with the bot just like messaging any other contact!

### **Privacy & Anti-Spam Protections in Code**
* **Group Chats Blocked:** Any incoming message with `@g.us` is immediately discarded.
* **Non-Command Ignore:** Everyday messages (*"hi"*, *"where are you"*, images, voice notes) are **silently ignored** so the bot never interferes with your normal conversations.
* **Authorized Whitelist:** Only messages from `+918309166629` trigger replies.

---

## 3. Repository File Map

```
bashiths-radar/
├── app/
│   ├── (app)/
│   │   ├── events/page.tsx           # Web UI: Browse & search all events
│   │   ├── digest/page.tsx           # Web UI: AI News feed & dismissal
│   │   ├── reminders/page.tsx        # Web UI: Active reminders & manual event add
│   │   └── settings/page.tsx         # Web UI: Notification toggles & preferences
│   ├── api/
│   │   ├── cron/
│   │   │   ├── scrape-events/route.ts       # 4:30 AM IST Scraper pipeline
│   │   │   ├── fetch-digest/route.ts        # 5:00 AM IST RSS & Claude filter
│   │   │   ├── send-morning-digest/route.ts # 8:00 AM IST Morning Briefing
│   │   │   ├── send-evening-digest/route.ts # 7:00 PM IST Evening Briefing
│   │   │   └── send-reminders/route.ts      # 15-min Due Reminder Worker
│   │   ├── whatsapp/
│   │   │   ├── send/route.ts                # Outbound WhatsApp dispatch API
│   │   │   └── webhook/route.ts             # Inbound WhatsApp command handler
│   │   ├── events/                          # Event fetch, save, & manual entry
│   │   ├── digest/                          # AI news fetch & dismiss
│   │   └── profile/                         # User preferences GET/PUT
│   ├── globals.css                          # Tailwind CSS styling tokens
│   └── layout.tsx                           # Master application layout
├── lib/
│   ├── whatsapp.ts                          # Multi-gateway sender (Evolution, Twilio, Meta) + Formatters
│   ├── claude.ts                            # Claude 3.7 Sonnet filter & 15-word reason generator
│   ├── scraper.ts                           # Cheerio scrapers for Devfolio, T-Hub, IIIT-H, Unstop
│   ├── rss.ts                               # RSS feed parser for AI sources
│   ├── reminder-queue.ts                    # Due reminder calculation & deduplication
│   ├── crypto.ts                            # AES-256 phone number encryption at rest
│   ├── cron-guard.ts                        # CRON_SECRET authorization verification
│   └── supabase-server.ts                   # Supabase service role client
├── supabase/
│   ├── schema.sql                           # Full PostgreSQL schema with RLS
│   └── seed.sql                             # Seed data for MGIT & Hyderabad events
├── types/                                   # TypeScript interfaces (Event, Digest, Reminder, User)
├── vercel.json                              # Vercel Hobby-compliant cron definitions
└── render.yaml                              # Render 24/7 Evolution API blueprint
```

---

## 4. Environment Variables Reference

| Variable Name | Location | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `EVOLUTION_API_URL` | Vercel & Local | Public URL of Evolution API | `https://evolution-api-t9p5.onrender.com` |
| `EVOLUTION_API_KEY` | Vercel & Local | Authentication key for Evolution | `Zi3VxfR/Tt/CIsobQ4jZnIz2t35CIBFIlZppDyHsW8s=` |
| `EVOLUTION_INSTANCE`| Vercel & Local | Name of the WhatsApp instance | `personal` |
| `CRON_SECRET` | Vercel & Local | Protects `/api/cron/*` endpoints | `test-cron-secret-12345` |
| `ENCRYPTION_SECRET` | Vercel & Local | 32-byte AES key for phone numbers | `basiths-radar-secure-encryption-key-32b` |
| `AUTHORIZED_PHONE` | Vercel & Local | Phone allowed to send commands | `918309166629` |
| `NEXT_PUBLIC_APP_URL`| Vercel & Local | Base URL of Next.js app | `https://bashiths-radar.vercel.app` |
| `ANTHROPIC_API_KEY` | Vercel & Local | Claude API key for filtering | `sk-ant-api03-...` |

---

## 5. Automated Cron Schedule & Pipelines

| Pipeline | Trigger Time (IST) | Trigger Time (UTC) | Action |
| :--- | :--- | :--- | :--- |
| **Morning Briefing** | **8:00 AM IST** | `30 2 * * *` | Sends urgent deadlines, today's events, & top AI news |
| **Evening Briefing** | **7:00 PM IST** | `30 13 * * *` | Sends closing deadlines, newly scraped events, & evening reads |
| **Manual Trigger** | Any time | On-demand via cURL | `POST /api/cron/send-morning-digest?secret=test-cron-secret-12345` |

---

## 6. How to Add New Features

### Adding a New Event Source / Scraper
Open [`lib/scraper.ts`](file:///Users/basith/.gemini/antigravity-ide/scratch/bashiths-radar/lib/scraper.ts) and add your scraper function:

```typescript
export async function scrapeMySource(): Promise<PartialEvent[]> {
  const html = await fetchHTML('https://example.com/events');
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: PartialEvent[] = [];

  $('.event-card').each((_, el) => {
    events.push({
      title: $(el).find('h3').text().trim(),
      org: 'Organizer Name',
      type: 'hackathon', // 'hackathon' | 'workshop' | 'summit' | 'conference'
      location: 'Hyderabad',
      is_free: true,
      application_deadline: '2026-09-30',
      event_date: '2026-10-05',
      apply_url: $(el).find('a').attr('href') || '',
      source_url: 'https://example.com/events',
      tags: ['ai', 'hackathon'],
      is_manually_added: false,
    });
  });
  return events;
}
```
Then import and add it to `scrapeAllEvents()` in the same file.

---

### Adding a New AI News RSS Feed
Open [`lib/rss.ts`](file:///Users/basith/.gemini/antigravity-ide/scratch/bashiths-radar/lib/rss.ts) and add the source to `FEED_SOURCES`:

```typescript
const FEED_SOURCES: Array<{ name: string; url: string }> = [
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news.rss' },
  { name: 'My New Source',  url: 'https://news.ycombinator.com/rss' },
];
```

---

### Modifying WhatsApp Message Formats
Open [`lib/whatsapp.ts`](file:///Users/basith/.gemini/antigravity-ide/scratch/bashiths-radar/lib/whatsapp.ts) and customize:
* `formatMorningDigest(...)` (Line 171)
* `formatEveningDigest(...)` (Line 216)
* `formatUrgentReminder(...)` (Line 254)
* `formatEventDayReminder(...)` (Line 283)

---

### Adding New WhatsApp Commands
Open [`app/api/whatsapp/webhook/route.ts`](file:///Users/basith/.gemini/antigravity-ide/scratch/bashiths-radar/app/api/whatsapp/webhook/route.ts) and add a new branch:

```typescript
if (normalizedCmd === 'HACKATHONS') {
  replyText = `🏆 *Top 3 Upcoming Hackathons*\n1. Smart India Hackathon\n2. T-Hub GenAI Sprint\n3. Devfolio Buildathon`;
}
```

---

## 7. Troubleshooting & Error Runbook

### **Q1: WhatsApp stops receiving messages or status is disconnected**
1. Check connection status:
   ```bash
   curl -s "https://evolution-api-t9p5.onrender.com/instance/connectionState/personal" \
     -H "apikey: Zi3VxfR/Tt/CIsobQ4jZnIz2t35CIBFIlZppDyHsW8s="
   ```
2. If `state` is `"close"`, fetch a fresh QR code:
   ```bash
   python3 /Users/basith/.gemini/antigravity-ide/scratch/evolution-api/whatsapp_cli.py qr
   ```
3. Scan it with WhatsApp $\rightarrow$ Linked Devices.

### **Q2: Render Free Tier "Spin Down" (Cold Start Delay)**
* On Render's free tier, the service spins down after 15 minutes of inactivity. When Vercel makes a request, it might take 20-30 seconds to wake up.
* **Fix (Keep-Alive):** You can add a free 10-minute ping on [cron-job.org](https://cron-job.org) pointing to `https://evolution-api-t9p5.onrender.com/` to keep it warm 24/7 at zero cost.

### **Q3: Vercel Cron not firing**
* Check your Vercel Dashboard $\rightarrow$ Project $\rightarrow$ **Settings** $\rightarrow$ **Cron Jobs**.
* Verify that `CRON_SECRET` matches in Vercel Environment Variables.

---

## 8. Future Roadmap & Ideas

- [ ] **Google Calendar Sync**: Auto-add saved hackathons directly to your Google Calendar.
- [ ] **Resume / Teammate Matcher**: AI blurb suggesting which project from your GitHub portfolio fits a specific hackathon theme.
- [ ] **College Notice Board OCR**: Auto-parse photos of physical MGIT notice-board circulars via Claude Vision and schedule reminders.
