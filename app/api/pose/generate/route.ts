import { NextRequest } from 'next/server';
import { generateImage, type ImagePart } from '@/lib/llm/gemini';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { buildPosePrompt } from '@/lib/pose-presets';
import {
  getSessionSupabase, jsonOk, jsonError, runWithLlmGuards,
} from '../../llm/_helpers';

export const maxDuration = 60;

const DAILY_LIMIT = 2;
const MAX_B64 = 12_000_000; // ~9MB decoded per image — reject larger uploads

/** Parse a data URL (`data:image/jpeg;base64,...`) into an ImagePart. */
function parseDataUrl(s: unknown): ImagePart | null {
  if (typeof s !== 'string') return null;
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(s.trim());
  if (!m) return null;
  if (m[2].length > MAX_B64) return null;
  return { mimeType: m[1], data: m[2] };
}

/**
 * POST /api/pose/generate
 * Body: { poseLabel, poseDescription, imageA: dataURL, imageB: dataURL }
 * Returns: { url, poseLabel } — a signed URL to the generated couple portrait.
 *
 * Enforces a 2/day/couple quota atomically (reserve_pose_generation), then asks
 * Gemini to merge the two photos into the chosen pose, stores the result in the
 * couple-photos bucket, and returns a 1-hour signed URL. Quota is refunded if
 * generation fails so a model hiccup never burns a slot.
 */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await getSessionSupabase();
  if (!userId) return jsonError('unauthorized', 401);

  let body: { poseLabel?: string; poseDescription?: string; imageA?: string; imageB?: string };
  try { body = await request.json(); } catch { return jsonError('badRequest', 400); }

  const imageA = parseDataUrl(body.imageA);
  const imageB = parseDataUrl(body.imageB);
  const poseDescription = (body.poseDescription || '').toString().trim().slice(0, 300);
  const poseLabel = (body.poseLabel || poseDescription || 'Romantic pose').toString().trim().slice(0, 120);
  if (!imageA || !imageB) return jsonError('badImages', 400);
  if (!poseDescription) return jsonError('badRequest', 400);

  // Couple lookup (RLS-scoped to the caller's own couple).
  const { data: member } = await supabase
    .from('couple_members').select('couple_id').eq('user_id', userId).maybeSingle();
  const coupleId = member?.couple_id;
  if (!coupleId) return jsonError('noCouple', 400);

  const admin = getAdminSupabase();

  // Atomic reserve against the daily cap.
  const { data: reserved, error: reserveErr } = await admin
    .rpc('reserve_pose_generation', { p_couple_id: coupleId, p_limit: DAILY_LIMIT });
  if (reserveErr) return jsonError('serverError', 500);
  if (reserved === -1) return jsonError('quotaExceeded', 429);

  async function refund() {
    const { data: row } = await admin
      .from('pose_quota').select('count').eq('couple_id', coupleId!)
      .eq('day', new Date().toISOString().slice(0, 10)).maybeSingle();
    if (row && typeof row.count === 'number' && row.count > 0) {
      await admin.from('pose_quota').update({ count: row.count - 1 })
        .eq('couple_id', coupleId!).eq('day', new Date().toISOString().slice(0, 10));
    }
  }

  const prompt = buildPosePrompt(poseDescription);
  const result = await runWithLlmGuards(() => generateImage(prompt, [imageA, imageB]));
  if (!result.ok) { await refund(); return jsonError(result.error, result.status); }

  // Store the generated image and hand back a signed URL.
  try {
    const out = result.data;
    const ext = out.mimeType.includes('jpeg') ? 'jpg' : 'png';
    const path = `${coupleId}/pose-${Date.now()}.${ext}`;
    const bytes = Buffer.from(out.data, 'base64');
    const up = await admin.storage.from('couple-photos').upload(path, bytes, {
      contentType: out.mimeType, upsert: false,
    });
    if (up.error) { await refund(); return jsonError('serverError', 500); }

    await admin.from('pose_creations').insert({
      couple_id: coupleId, created_by: userId, pose_label: poseLabel, result_path: path,
    });

    const signed = await admin.storage.from('couple-photos').createSignedUrl(path, 3600);
    if (signed.error || !signed.data?.signedUrl) { return jsonError('serverError', 500); }
    return jsonOk({ url: signed.data.signedUrl, poseLabel });
  } catch {
    await refund();
    return jsonError('serverError', 500);
  }
}
