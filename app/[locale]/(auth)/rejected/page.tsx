'use client';

import { useTranslations } from 'next-intl';
import { RedirectButton } from '@/components/ui/redirect-button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function RejectedPage() {
  const t = useTranslations('auth.rejected');
  const router = useRouter();

  useTutorial('rejected', [
    { id: 'rejected-title', titleKey: 'rejected.step1.title', descKey: 'rejected.step1.desc' },
    { id: 'rejected-back', titleKey: 'rejected.step2.title', descKey: 'rejected.step2.desc' },
  ]);

  async function backToSignIn() {
    await createClient().auth.signOut();
    router.replace('/sign-in');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-red-900 bg-surface flex items-center justify-center">
          <span className="text-red-400 text-3xl">×</span>
        </div>
        <div className="space-y-2" data-tutorial-id="rejected-title">
          <h1 className="font-display-en text-3xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('message')}</p>
        </div>
        <RedirectButton variant="ghost" onClick={backToSignIn} className="w-full" data-tutorial-id="rejected-back">
          {t('backToSignIn')}
        </RedirectButton>
      </div>
    </div>
  );
}
