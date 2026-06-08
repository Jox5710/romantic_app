import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendMail, mailerConfigured } from '@/lib/mailer';

/**
 * Send a REAL partner invitation email.
 *
 * The initiator (already authenticated) has just created their couple in state
 * 'invited'. This route emails the partner an authenticating link so that
 * clicking it both signs them in AND lands them on /accept (couple prefilled).
 *
 * The link is built in the exact shape that the working magic-link uses
 * (`/<locale>/auth/v1/verify?token=…&type=…&redirect_to=…` → app-host proxy
 * `app/[locale]/auth/v1/verify/route.ts` → GoTrue verify sets cookies on the APP
 * host → redirect to /accept). We obtain the one-time `hashed_token` from the
 * admin `generateLink` API (type 'invite' for a brand-new partner, falling back
 * to 'magiclink' if they already have an account).
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let coupleId: string;
  let locale: 'en' | 'ar';
  try {
    const body = await request.json();
    if (!body?.coupleId || typeof body.coupleId !== 'string') throw new Error();
    coupleId = body.coupleId;
    locale = body?.locale === 'ar' ? 'ar' : 'en';
  } catch {
    return NextResponse.json({ error: 'expected { coupleId, locale }' }, { status: 400 });
  }

  const admin = getAdminSupabase();

  // Load the couple via the service role and authorise: caller must be the
  // initiator and the couple must still be awaiting a partner.
  const { data: couple, error: coupleErr } = await admin
    .from('couples')
    .select('id, state, initiator_id, invite_email, invite_code, name_a, name_a_ar')
    .eq('id', coupleId)
    .maybeSingle();

  if (coupleErr || !couple) return NextResponse.json({ error: 'couple not found' }, { status: 404 });
  if (couple.initiator_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (couple.state !== 'invited') return NextResponse.json({ error: 'couple not invitable' }, { status: 409 });
  if (!couple.invite_email || !couple.invite_code) {
    return NextResponse.json({ error: 'couple missing invite email/code' }, { status: 409 });
  }

  if (!mailerConfigured()) {
    // No real SMTP yet → tell the client to fall back to the shareable link.
    return NextResponse.json({ sent: false, reason: 'smtp_unconfigured' }, { status: 200 });
  }

  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const redirectTo = `${siteUrl}/${locale}/accept?code=${couple.invite_code}`;

  // Generate an authenticating one-time link. 'invite' creates the partner user;
  // if they already exist GoTrue rejects it → retry as a magic link.
  let hashedToken: string | undefined;
  let linkType: 'invite' | 'magiclink' = 'invite';
  const inviteRes = await admin.auth.admin.generateLink({
    type: 'invite',
    email: couple.invite_email,
    options: { redirectTo },
  });
  if (inviteRes.error || !inviteRes.data?.properties?.hashed_token) {
    const magicRes = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: couple.invite_email,
      options: { redirectTo },
    });
    if (magicRes.error || !magicRes.data?.properties?.hashed_token) {
      return NextResponse.json({ error: 'could not generate invite link' }, { status: 500 });
    }
    hashedToken = magicRes.data.properties.hashed_token;
    linkType = 'magiclink';
  } else {
    hashedToken = inviteRes.data.properties.hashed_token;
  }

  // App-host verify URL (same proven path as the user's own magic link).
  const verifyType = linkType === 'invite' ? 'invite' : 'magiclink';
  const link = `${siteUrl}/${locale}/auth/v1/verify?token=${encodeURIComponent(hashedToken)}`
    + `&type=${verifyType}&redirect_to=${encodeURIComponent(redirectTo)}`;

  const inviterName = (locale === 'ar' ? couple.name_a_ar : null) || couple.name_a || '';
  const sent = await sendMail({
    to: couple.invite_email,
    subject: buildSubject(locale, inviterName),
    html: buildHtml(locale, inviterName, link),
  });

  return NextResponse.json({ sent }, { status: sent ? 200 : 502 });
}

function buildSubject(locale: 'en' | 'ar', inviter: string): string {
  return locale === 'ar'
    ? `${inviter || 'شريكك'} يدعوك إلى Forever 💛`
    : `${inviter || 'Your partner'} invited you to Forever 💛`;
}

function buildHtml(locale: 'en' | 'ar', inviter: string, link: string): string {
  const ar = locale === 'ar';
  const dir = ar ? 'rtl' : 'ltr';
  const title = ar ? 'دعوة إلى Forever' : 'An invitation to Forever';
  const lead = ar
    ? `<strong>${inviter || 'شريكك'}</strong> أنشأ لكما مساحة خاصة على Forever ويدعوك للانضمام.`
    : `<strong>${inviter || 'Your partner'}</strong> created a private space for the two of you on Forever and is inviting you to join.`;
  const cta = ar ? 'تأكيد الدعوة وبدء رحلتكما' : 'Confirm & begin your journey';
  const note = ar
    ? 'إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.'
    : "If you weren't expecting this, you can safely ignore this email.";
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#0a0a0f;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#14141c;border:1px solid #2a2a36;border-radius:20px;padding:40px 32px;text-align:${ar ? 'right' : 'left'};">
        <tr><td align="center" style="padding-bottom:8px;">
          <div style="font-size:40px;color:#c9a961;">∞</div>
        </td></tr>
        <tr><td align="center" style="color:#f4ecd8;font-size:24px;font-weight:600;padding-bottom:16px;">${title}</td></tr>
        <tr><td style="color:#cdc6b8;font-size:15px;line-height:1.7;padding-bottom:28px;">${lead}</td></tr>
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${link}" style="display:inline-block;background:#c9a961;color:#14141c;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">${cta}</a>
        </td></tr>
        <tr><td style="color:#8a8576;font-size:12px;line-height:1.6;">${note}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
