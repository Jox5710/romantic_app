import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.27';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const claude = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { count } = await supabase.from('daily_prompts').select('id', { count: 'exact', head: true });
  if ((count ?? 0) > 30) {
    return new Response(JSON.stringify({ message: 'Pool is sufficient' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: 'Generate 5 thoughtful, emotionally resonant daily prompt questions for couples. Each question should be on a new line, in both English and Arabic, separated by " | ". Format: English question | Arabic question. Vary depth from 1-5. Return only the questions, no numbering or extra text.',
    messages: [{ role: 'user', content: 'Generate 5 new daily prompts for couples.' }],
  });

  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const lines = text.split('\n').filter((l) => l.includes(' | '));

  const newPrompts = lines.map((line, i) => {
    const [en, ar] = line.split(' | ');
    return { prompt_en: en.trim(), prompt_ar: ar.trim(), depth: (i % 5) + 1 };
  });

  if (newPrompts.length) {
    await supabase.from('daily_prompts').insert(newPrompts);
  }

  return new Response(JSON.stringify({ added: newPrompts.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
