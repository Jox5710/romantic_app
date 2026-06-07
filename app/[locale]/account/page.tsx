'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { GoldButton } from '@/components/ui/gold-button';
import { RedirectButton } from '@/components/ui/redirect-button';
import { useToast } from '@/components/ui/toast';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useRouter } from '@/lib/i18n/navigation';
import { Settings, LogOut } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface Form {
  name_a: string;
  name_a_ar: string;
  name_b: string;
  name_b_ar: string;
  wedding_date: string;
}

export default function AccountPage() {
  const t = useTranslations('account');
  const tMenu = useTranslations('userMenu');

  useTutorial('account', [
    { id: 'account-title', titleKey: 'account.step1.title', descKey: 'account.step1.desc' },
    { id: 'account-fields', titleKey: 'account.step2.title', descKey: 'account.step2.desc' },
    { id: 'account-save', titleKey: 'account.step3.title', descKey: 'account.step3.desc' },
  ]);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { coupleId, session } = useCoupleState();

  const [form, setForm] = useState<Form>({
    name_a: '', name_a_ar: '', name_b: '', name_b_ar: '', wedding_date: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    supabase
      .from('couples')
      .select('name_a,name_b,name_a_ar,name_b_ar,wedding_date')
      .eq('id', coupleId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name_a: data.name_a ?? '',
            name_a_ar: data.name_a_ar ?? '',
            name_b: data.name_b ?? '',
            name_b_ar: data.name_b_ar ?? '',
            wedding_date: data.wedding_date ? data.wedding_date.slice(0, 10) : '',
          });
        }
        setLoading(false);
      });
  }, [coupleId]);

  async function save() {
    if (!coupleId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('couples')
      .update({
        name_a: form.name_a.trim() || null,
        name_a_ar: form.name_a_ar.trim() || null,
        name_b: form.name_b.trim() || null,
        name_b_ar: form.name_b_ar.trim() || null,
        wedding_date: form.wedding_date ? new Date(form.wedding_date).toISOString() : null,
      })
      .eq('id', coupleId);
    setSaving(false);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['couple', coupleId] });
    }
    toast(error ? t('error') : t('saved'), error ? 'error' : 'success');
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace('/sign-in');
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <RouteGuard>
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3" data-tutorial-id="account-title">
          <Settings size={26} className="text-gold" />
          <div>
            <h1 className="font-display-en text-3xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {session?.user.email && (
          <p className="text-xs text-muted">{session.user.email}</p>
        )}

        <Card variant="elevated" className="space-y-4" data-tutorial-id="account-fields">
          {loading ? (
            [1, 2, 3, 4].map((n) => <div key={n} className="h-12 rounded-xl shimmer" />)
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('nameA')} placeholder={t('namePlaceholder')} value={form.name_a} onChange={set('name_a')} />
                <Field label={t('nameAAr')} placeholder={t('nameArPlaceholder')} dir="rtl" value={form.name_a_ar} onChange={set('name_a_ar')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('nameB')} placeholder={t('namePlaceholder')} value={form.name_b} onChange={set('name_b')} />
                <Field label={t('nameBAr')} placeholder={t('nameArPlaceholder')} dir="rtl" value={form.name_b_ar} onChange={set('name_b_ar')} />
              </div>
              <Field label={t('weddingDate')} type="date" value={form.wedding_date} onChange={set('wedding_date')} />

              <GoldButton onClick={save} loading={saving} size="lg" className="w-full" data-tutorial-id="account-save">
                {t('save')}
              </GoldButton>
            </>
          )}
        </Card>

        <RedirectButton variant="ghost" onClick={signOut} overlayLabel={tMenu('signingOut')} className="w-full">
          <LogOut size={16} className="rtl-flip" />
          {tMenu('signOut')}
        </RedirectButton>
      </div>
    </RouteGuard>
  );
}
