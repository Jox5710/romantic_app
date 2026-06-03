import { NextRequest } from 'next/server';
import { generate } from '@/lib/llm/gemini';
import {
  getSessionUserId, jsonOk, jsonError, runWithLlmGuards,
} from '../_helpers';

/**
 * POST /api/llm/soften
 * Body: { text: string, locale: 'en' | 'ar' }
 * Returns: { softened: string } on success, { error: string } on failure.
 *
 * Auth: requires a Supabase session cookie. Internet-anonymous requests
 * get 401 — that's the guard against random people draining the Gemini
 * quota by hitting this endpoint directly.
 */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError('unauthorized', 401);

  let body: { text?: string; locale?: string };
  try { body = await request.json(); } catch { return jsonError('badRequest', 400); }

  const text = (body.text ?? '').toString().trim().slice(0, 800);
  const locale = body.locale === 'ar' ? 'ar' : 'en';
  if (!text) return jsonError('badRequest', 400);

  const prompt = locale === 'ar'
    ? `أعد صياغة الرسالة التالية بلغة أكثر لطفاً وتعاطفاً، باستخدام صياغة "أنا أشعر…" بدلاً من اتهامات بصيغة "أنت…". حافظ على المعنى. اجعلها موجزة. اطبع الرسالة المعاد صياغتها فقط، بدون أي مقدمة أو علامات اقتباس.\n\nالرسالة:\n"""${text}"""`
    : `Rewrite the following message in gentler, more compassionate language using "I feel…" phrasing instead of "you…" accusations. Preserve the meaning. Keep it concise. Output ONLY the rewritten message — no preamble, no quotes, no labels.\n\nMessage:\n"""${text}"""`;

  const result = await runWithLlmGuards(() => generate(prompt));
  if (!result.ok) return jsonError(result.error, result.status);

  // Gemini sometimes prefixes "Rewritten:" or wraps in quotes despite the
  // explicit instruction — strip both defensively.
  const softened = result.data
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .replace(/^(Rewritten|Softened|Rewrite|Output|Translation)\s*[:：]\s*/i, '')
    .trim();

  if (!softened) return jsonError('llmUnavailable', 502);
  return jsonOk({ softened });
}
