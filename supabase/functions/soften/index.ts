import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.27';
import { corsHeaders } from '../_shared/cors.ts';

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('unauthorized', { status: 401, headers: corsHeaders });
  }

  const { text, locale } = await req.json();
  if (!text || typeof text !== 'string' || text.length > 1000) {
    return new Response('bad input', { status: 400, headers: corsHeaders });
  }

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `You are a gentle couple's translator. Rewrite the user's message in I-statements, without accusations, absolutes ("always", "never"), or labels ("lazy", "selfish"). Keep their meaning intact; soften the edges so it lands with love. Match the language of the input (English or ${locale === 'ar' ? 'Arabic' : 'English'}). Return only the rewritten message, nothing else.`,
    messages: [{ role: 'user', content: text }],
  });

  const out = msg.content.find((b) => b.type === 'text')?.text ?? text;
  return new Response(JSON.stringify({ softened: out }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
