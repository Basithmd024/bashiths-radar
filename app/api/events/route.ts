import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Event } from '@/types/event';

// Realistic fallback events for local/demo mode
const SAMPLE_EVENTS: Partial<Event>[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Smart India Hackathon 2026 Internal Round',
    org: 'MGIT / AICTE',
    type: 'hackathon',
    location: 'MGIT, Hyderabad',
    is_free: true,
    application_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'National-level hackathon hosted by AICTE. Internal round at MGIT to select teams for the national finals.',
    apply_url: 'https://sih.gov.in',
    source_url: 'https://sih.gov.in',
    tags: ['hackathon', 'government', 'MGIT', 'urgent'],
    why_read: 'SIH internal round at MGIT — winning puts your team directly on the national stage.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'a12bc34d-58cc-4372-a567-0e02b2c3d480',
    title: 'T-Hub AI Product Innovation Summit 2026',
    org: 'T-Hub Hyderabad',
    type: 'summit',
    location: 'T-Hub Phase 2, Hyderabad',
    is_free: true,
    application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Two-day summit bringing together AI founders, product leaders, and investors with keynotes from DeepMind India.',
    apply_url: 'https://thub.telangana.gov.in/events',
    source_url: 'https://thub.telangana.gov.in/events',
    tags: ['AI', 'summit', 'hyderabad', 'T-Hub', 'founders'],
    why_read: 'Google DeepMind India keynote + networking with top AI founders in Hyderabad.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'b23cd45e-58cc-4372-a567-0e02b2c3d481',
    title: 'IIIT-H Research Open Day: NLP & Vision',
    org: 'IIIT Hyderabad',
    type: 'workshop',
    location: 'IIIT Hyderabad, Gachibowli',
    is_free: true,
    application_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Open day for undergrads to interact with IIIT-H research labs. Sessions on NLP, computer vision, and robotics.',
    apply_url: 'https://iiit.ac.in/events',
    source_url: 'https://iiit.ac.in/events',
    tags: ['research', 'NLP', 'vision', 'IIIT-H'],
    why_read: 'Direct access to IIIT-H NLP/vision labs — great for research internship leads.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'c34de56f-58cc-4372-a567-0e02b2c3d482',
    title: 'Google Solution Challenge 2026 Kickoff',
    org: 'GDSC MGIT',
    type: 'workshop',
    location: 'MGIT Campus, Hyderabad',
    is_free: true,
    application_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Kickoff workshop for Google Solution Challenge. Build with Gemini API & Firebase.',
    apply_url: 'https://developers.google.com',
    source_url: 'https://developers.google.com',
    tags: ['Google', 'GDSC', 'MGIT', 'hackathon'],
    why_read: 'Google Solution Challenge — global mentorship & Gemini API credits for MGIT teams.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'd45ef67a-58cc-4372-a567-0e02b2c3d483',
    title: 'Microsoft Imagine Cup 2026 — India Qualifier',
    org: 'Microsoft India',
    type: 'hackathon',
    location: 'Online + Hyderabad Hub',
    is_free: true,
    application_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'AI-first track with Azure OpenAI integration. Winners get mentorship from Microsoft CTOs and US finals trip.',
    apply_url: 'https://imaginecup.microsoft.com',
    source_url: 'https://imaginecup.microsoft.com',
    tags: ['Microsoft', 'Azure', 'AI', 'global'],
    why_read: 'Azure OpenAI track — Microsoft CTO mentorship + US finals trip for winners.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'e56fa78b-58cc-4372-a567-0e02b2c3d484',
    title: 'MLH Global Hack Week: AI Agents Edition',
    org: 'Major League Hacking',
    type: 'hackathon',
    location: 'Online',
    is_free: true,
    application_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Week-long hackathon series focused on AI agents. Daily mini-challenges and recruiter visibility.',
    apply_url: 'https://mlh.io',
    source_url: 'https://mlh.io',
    tags: ['MLH', 'AI', 'online', 'urgent'],
    why_read: 'Deadline in 24 hours — daily mini-challenges and direct recruiter visibility.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'f67ab89c-58cc-4372-a567-0e02b2c3d485',
    title: 'Unstop PM Bootcamp: AI Product Management',
    org: 'Unstop x ProductHood',
    type: 'workshop',
    location: 'Online',
    is_free: true,
    application_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '3-day intensive bootcamp on AI PM. Covers PRD writing for AI features and metrics for LLM products.',
    apply_url: 'https://unstop.com',
    source_url: 'https://unstop.com',
    tags: ['PM', 'AI', 'bootcamp', 'online'],
    why_read: 'AI PM frameworks — covers Notion AI & Copilot case studies for your portfolio.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '078bc90d-58cc-4372-a567-0e02b2c3d486',
    title: 'Anthropic Developer Day India',
    org: 'Anthropic',
    type: 'summit',
    location: 'Bangalore (Hybrid)',
    is_free: true,
    application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Anthropic first India developer event. Claude API deep dives, agent architectures, and live Q&A with research team.',
    apply_url: 'https://anthropic.com/events',
    source_url: 'https://anthropic.com/events',
    tags: ['Anthropic', 'Claude', 'AI', 'agents'],
    why_read: 'Anthropic India debut — live access to the Claude research and product team.',
    is_manually_added: false,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);

    const type      = searchParams.get('type');
    const free_only = searchParams.get('free_only') === 'true';
    const location  = searchParams.get('location');
    const search    = searchParams.get('search');
    const sort      = searchParams.get('sort') ?? 'deadline';
    const page      = parseInt(searchParams.get('page') ?? '1');
    const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset    = (page - 1) * limit;

    let eventsData: any[] = [];
    let totalCount = 0;

    try {
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (type && type !== 'all') query = query.eq('type', type);
      if (free_only) query = query.eq('is_free', true);
      if (location) query = query.ilike('location', `%${location}%`);
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,org.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      if (sort === 'deadline') {
        query = query.order('application_deadline', { ascending: true, nullsFirst: false });
      } else if (sort === 'date') {
        query = query.order('event_date', { ascending: true, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (!error && data && data.length > 0) {
        eventsData = data;
        totalCount = count ?? data.length;
      }
    } catch (supabaseErr) {
      console.warn('Supabase query failed, using sample seed data:', supabaseErr);
    }

    // Use fallback sample events if database has no rows yet
    if (eventsData.length === 0) {
      eventsData = SAMPLE_EVENTS as any[];
      totalCount = SAMPLE_EVENTS.length;
    }

    // Attach saved status if user session exists
    let savedEventIds = new Set<string>();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: saved } = await supabase
          .from('user_saved_events')
          .select('event_id')
          .eq('user_id', user.id);
        savedEventIds = new Set((saved ?? []).map(s => s.event_id));
      }
    } catch {
      // Ignore auth error for unauthenticated state
    }

    const enriched = eventsData.map(event => ({
      ...event,
      is_saved: savedEventIds.has(event.id),
    }));

    return NextResponse.json({
      events: enriched,
      total: totalCount,
      page,
      limit,
    });
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
