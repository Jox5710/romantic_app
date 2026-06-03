import { NextRequest } from 'next/server';
import { generate } from '@/lib/llm/gemini';
import {
  getSessionSupabase, jsonOk, jsonError, runWithLlmGuards,
} from '../_helpers';

/**
 * POST /api/llm/mission
 * Body: { locale: 'en' | 'ar' }
 * Returns: { mission: string } on success, { error: string } on failure.
 *
 * Reads the requesting user's couple from Supabase (RLS-scoped — they can
 * only see their own couple) to personalize the mission with both names.
 * Falls back to a generic "the two of you" framing when names are blank.
 */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await getSessionSupabase();
  if (!userId) return jsonError('unauthorized', 401);

  let body: { locale?: string };
  try { body = await request.json(); } catch { return jsonError('badRequest', 400); }
  const locale = body.locale === 'ar' ? 'ar' : 'en';

  // Find the couple this user belongs to. RLS guarantees they can only see
  // their own, so no extra ownership check needed.
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .maybeSingle();

  let nameA: string | null = null;
  let nameB: string | null = null;
  if (member?.couple_id) {
    const { data: couple } = await supabase
      .from('couples')
      .select(locale === 'ar' ? 'name_a_ar,name_b_ar,name_a,name_b' : 'name_a,name_b')
      .eq('id', member.couple_id)
      .maybeSingle();
    if (couple) {
      const c = couple as { name_a?: string | null; name_b?: string | null; name_a_ar?: string | null; name_b_ar?: string | null };
      nameA = (locale === 'ar' ? c.name_a_ar ?? c.name_a : c.name_a) ?? null;
      nameB = (locale === 'ar' ? c.name_b_ar ?? c.name_b : c.name_b) ?? null;
    }
  }
  const haveNames = !!nameA && !!nameB;

  const prompt = locale === 'ar'
    ? `صمّم مهمة رومانسية صغيرة ليوم واحد ${haveNames ? `للزوجين ${nameA} و${nameB}` : 'لزوجين'}. اجعلها محدّدة، لطيفة، يمكن إنجازها في أقل من ساعة، بدون مال. اطبع جملة واحدة فقط، بدون علامات اقتباس، بدون ترقيم، بدون مقدمة.\n\nمثال على النبرة: «اترك ملاحظة لاصقة بسبب واحد يجعلك فخوراً به».`
    : `Design one small, single-day romantic mission ${haveNames ? `for a couple named ${nameA} and ${nameB}` : 'for a couple'}. Keep it specific, kind, achievable in under an hour, no money required. Output one sentence only — no quotes, no numbering, no preamble.\n\nExample tone: "Leave a sticky note with one reason you're proud of them."`;

  const result = await runWithLlmGuards(() => generate(prompt));
  if (!result.ok) return jsonError(result.error, result.status);

  const mission = result.data
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .replace(/^(Mission|Idea|Suggestion|Output)\s*[:：]\s*/i, '')
    .trim();

  if (!mission) return jsonError('llmUnavailable', 502);
  return jsonOk({ mission });
}
