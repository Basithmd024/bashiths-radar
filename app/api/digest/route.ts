import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { DigestItem } from '@/types/digest';

const SAMPLE_DIGEST_ITEMS: DigestItem[] = [
  {
    id: 'd1111111-58cc-4372-a567-0e02b2c3d490',
    title: 'Anthropic Introduces Claude 3.5 Sonnet Upgrades & Computer Use Beta',
    url: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
    source: 'Anthropic News',
    tag: 'breaking',
    one_line: 'Direct OS automation API — lets your agents interact with desktops and browsers directly.',
    priority: 5,
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'd2222222-58cc-4372-a567-0e02b2c3d491',
    title: 'OpenAI Releases Realtime API for Low-Latency Voice and Audio Agents',
    url: 'https://openai.com/blog/introducing-the-realtime-api',
    source: 'OpenAI Blog',
    tag: 'launch',
    one_line: 'Sub-300ms multimodal audio streaming API for building conversational hackathon prototypes.',
    priority: 5,
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'd3333333-58cc-4372-a567-0e02b2c3d492',
    title: 'n8n Launches Autonomous AI Agent Nodes with LangChain & Supabase Tools',
    url: 'https://blog.n8n.io/ai-agents-release',
    source: 'Hacker News',
    tag: 'update',
    one_line: 'Visual multi-agent orchestration directly inside n8n workflows without writing glue code.',
    priority: 4,
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'd4444444-58cc-4372-a567-0e02b2c3d493',
    title: 'DeepSeek-V3 Architecture: Multi-Head Latent Attention & FP8 Training',
    url: 'https://github.com/deepseek-ai/DeepSeek-V3',
    source: 'AI Snake Oil',
    tag: 'research',
    one_line: 'Ultra-low cost open weight model competitive with GPT-4o on coding and reasoning benchmarks.',
    priority: 4,
    published_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'd5555555-58cc-4372-a567-0e02b2c3d494',
    title: 'vLLM v0.6: Massive Throughput Improvements for Local Model Serving',
    url: 'https://blog.vllm.ai/2024/09/05/vllm-v060.html',
    source: 'TechCrunch AI',
    tag: 'update',
    one_line: '2.7x faster local LLM inference — crucial for self-hosting models on student GPU rigs.',
    priority: 3,
    published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    fetched_at: new Date().toISOString(),
    is_active: true,
  },
];

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    let dismissedIds: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dismissed } = await supabase
          .from('user_dismissed_digest')
          .select('digest_id')
          .eq('user_id', user.id);
        dismissedIds = (dismissed ?? []).map(d => d.digest_id);
      }
    } catch {
      // Ignore auth err
    }

    let items: DigestItem[] = [];

    try {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from('digest_items')
        .select('*')
        .eq('is_active', true)
        .gte('fetched_at', since)
        .order('priority', { ascending: false })
        .order('fetched_at', { ascending: false })
        .limit(50);

      if (dismissedIds.length > 0) {
        query = query.not('id', 'in', `(${dismissedIds.join(',')})`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        items = data;
      }
    } catch (err) {
      console.warn('Supabase digest query fallback:', err);
    }

    if (items.length === 0) {
      items = SAMPLE_DIGEST_ITEMS.filter(item => !dismissedIds.includes(item.id));
    }

    return NextResponse.json({ items });
  } catch (err) {
    console.error('GET /api/digest error:', err);
    return NextResponse.json({ error: 'Failed to fetch digest' }, { status: 500 });
  }
}
