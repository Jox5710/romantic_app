'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { Heart } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';

function AcceptInner() {
  const t = useTranslations('auth.accept');
  const { toast } = useToast();

  useTutorial('accept', [
    { id: 'accept-title', titleKey: 'accept.step1.title', descKey: 'accept.step1.desc' },
    { id: 'accept-names', titleKey: 'accept.step2.title', descKey: 'accept.step2.desc' },
    { id: 'accept-button', titleKey: 'accept.step3.title', descKey: 'accept.step3.desc' },
  ]);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const [couple, setCouple] = useState<{ id: string; name_a: string | null; name_a_ar: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [myName, setMyName] = useState('');
  const [myNameAr, setMyNameAr] = useState('');
  // Account password — lets the partner sign in with email+password next time
  // instead of needing a magic link every login.
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const tSignIn = useTranslations('auth.signIn');

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from('couples')
      .select('id, name_a, name_a_ar')
      .eq('invite_code', code.toUpperCase())
      .eq('state', 'invited')
      .maybeSingle()
      .then(({ data }: { data: { id: string; name_a: string | null; name_a_ar: string | null } | null }) => {
        setCouple(data ?? null);
        setLoading(false);
      });
  }, [code]);

  async function accept() {
    if (!couple) return;

    // Validate password locally before any network calls
    setPasswordError(null);
    if (password.length < 8) { setPasswordError(tSignIn('passwordShort')); return; }
    if (password !== confirmPassword) { setPasswordError(tSignIn('passwordMismatch')); return; }

    setAccepting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Set the account password first — if this fails (e.g. GoTrue policy)
    // we bail before joining the couple so the user can retry cleanly.
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      toast(t('passwordError'));
      setAccepting(false);
      return;
    }

    // updateUser rotates the JWT; refresh so the next RLS-gated insert uses the new token.
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr) {
      toast(t('sessionError'));
      setAccepting(false);
      return;
    }

    // One atomic, security-definer step: join as partner AND auto-approve the
    // couple (no admin gate). See migration 00000000000011_accept_invite.sql.
    const { error: acceptErr } = await supabase.rpc('accept_invite', {
      p_code: code.toUpperCase(),
      p_name_b: myName.trim() || null,
      p_name_b_ar: myNameAr.trim() || null,
    });

    if (acceptErr) {
      toast(acceptErr.message);
      setAccepting(false);
      return;
    }

    // Full document load so the dashboard mounts fresh (same reasoning as the
    // sign-in redirect — avoids a blank first render). The couple is already
    // 'approved', so the route guard sends us straight to the dashboard.
    window.location.assign(`/${locale}`);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <Heart className="mx-auto text-gold" size={40} fill="currentColor" />

        {couple ? (
          <>
            <div className="space-y-2" data-tutorial-id="accept-title">
              <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
              {couple.name_a && (
                <p className="text-ivoryDim">
                  {couple.name_a} {t('subtitle')}
                </p>
              )}
            </div>
            <div className="space-y-4 text-start" data-tutorial-id="accept-names">
              <Field
                label={t('partnerLabel')}
                value={(locale === 'ar' ? couple.name_a_ar : null) || couple.name_a || ''}
                className="text-gold/90 cursor-default"
                readOnly
              />
              <Field
                label={t('myName')}
                placeholder={t('myNamePlaceholder')}
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
              />
              <Field
                label={t('myNameAr')}
                placeholder={t('myNameArPlaceholder')}
                dir="rtl"
                value={myNameAr}
                onChange={(e) => setMyNameAr(e.target.value)}
              />
              <Field
                label={t('password')}
                type="password"
                placeholder="••••••••"
                hint={t('passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Field
                label={t('confirmPassword')}
                type="password"
                placeholder="••••••••"
                error={passwordError ?? undefined}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <GoldButton onClick={accept} loading={accepting} size="lg" className="w-full" data-tutorial-id="accept-button">
              {t('accept')}
            </GoldButton>
          </>
        ) : (
          <div className="space-y-2">
            <h2 className="font-display-en text-2xl text-ivory">{t('notFoundTitle')}</h2>
            <p className="text-ivoryDim text-sm">{t('notFoundBody')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold shimmer" />
      </div>
    }>
      <AcceptInner />
    </Suspense>
  );
}
