'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { Heart } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';

const schema = z
  .object({
    myName: z.string().min(1),
    myNameAr: z.string().optional(),
    partnerEmail: z.string().email(),
    // Account password — lets the user sign in with email+password from now on.
    // Magic-link still works (it's an additional method, not a replacement).
    password: z.string().min(8, 'passwordShort'),
    confirmPassword: z.string(),
    weddingDate: z.string().optional(),
    passphrase: z.string().min(8, 'Passphrase must be at least 8 characters'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function InvitePage() {
  const t = useTranslations('auth.invite');
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  useTutorial('invite', [
    { id: 'invite-title', titleKey: 'invite.step1.title', descKey: 'invite.step1.desc' },
    { id: 'invite-wedding', titleKey: 'invite.step2.title', descKey: 'invite.step2.desc' },
    { id: 'invite-passphrase', titleKey: 'invite.step3.title', descKey: 'invite.step3.desc' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Set the account password first so email+password sign-in works going
    //    forward. If this fails (e.g. weak password rejected by GoTrue) we
    //    bail before creating any couple records — keeps the data clean.
    const { error: passwordErr } = await supabase.auth.updateUser({ password: values.password });
    if (passwordErr) {
      toast(t('passwordError'));
      return;
    }

    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: couple, error: coupleErr } = await supabase
      .from('couples')
      .insert({
        state: 'invited',
        name_a: values.myName,
        name_a_ar: values.myNameAr?.trim() || null,
        invite_code: inviteCode,
        invite_email: values.partnerEmail,
        initiator_id: user.id,
        wedding_date: values.weddingDate ? new Date(values.weddingDate).toISOString() : null,
      })
      .select('id')
      .single();

    if (coupleErr || !couple) {
      toast(coupleErr?.message ?? t('errorCreating'));
      return;
    }

    const { error: memberErr } = await supabase.from('couple_members').insert({
      user_id: user.id,
      couple_id: couple.id,
      role: 'initiator',
      display_name: values.myName,
      confirmed_at: new Date().toISOString(),
    });

    if (memberErr) {
      toast(memberErr.message);
      return;
    }

    setInviteCode(inviteCode);
    setDone(true);
  }

  if (done) {
    const inviteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/accept?code=${inviteCode}`
      : `/accept?code=${inviteCode}`;
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm animate-fade-up">
          <p className="text-gold font-display-en text-5xl">✉</p>
          <h2 className="text-ivory font-display-en text-3xl">{t('inviteSent')}</h2>
          <div className="bg-surface2 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider">{t('shareLink')}</p>
            <p className="text-gold font-mono text-sm break-all">{inviteUrl}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs text-ivoryDim hover:text-ivory transition-colors"
            >
              {copied ? t('copied') : t('copyLink')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        <div className="text-center space-y-2" data-tutorial-id="invite-title">
          <Heart className="mx-auto text-gold" size={32} fill="currentColor" />
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field
            label={t('myName')}
            placeholder={t('myNamePlaceholder')}
            error={errors.myName?.message}
            {...register('myName')}
          />
          <Field
            label={t('myNameAr')}
            placeholder={t('myNameArPlaceholder')}
            error={errors.myNameAr?.message}
            dir="rtl"
            {...register('myNameAr')}
          />
          <Field
            label={t('partnerEmail')}
            type="email"
            placeholder={t('partnerEmailPlaceholder')}
            error={errors.partnerEmail?.message}
            {...register('partnerEmail')}
          />
          <Field
            label={t('password')}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            hint={t('passwordHint')}
            {...register('password')}
          />
          <Field
            label={t('confirmPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <div data-tutorial-id="invite-wedding">
            <Field
              label={t('weddingDate')}
              type="date"
              error={errors.weddingDate?.message}
              {...register('weddingDate')}
            />
          </div>
          <div data-tutorial-id="invite-passphrase">
            <Field
              label={t('passphrase')}
              type="password"
              placeholder="••••••••"
              error={errors.passphrase?.message}
              hint={t('passphraseHint')}
              {...register('passphrase')}
            />
          </div>
          <GoldButton type="submit" loading={isSubmitting} size="lg" className="w-full">
            {t('sendInvite')}
          </GoldButton>
        </form>
      </div>
    </div>
  );
}
