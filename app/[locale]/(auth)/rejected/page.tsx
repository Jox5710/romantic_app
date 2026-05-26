'use client';

import { useTranslations } from 'next-intl';
import { GoldButton } from '@/components/ui/gold-button';
import { useRouter } from '@/lib/i18n/navigation';

export default function RejectedPage() {
  const t = useTranslations('auth.awaiting');
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-red-900 bg-surface flex items-center justify-center">
          <span className="text-red-400 text-3xl">×</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display-en text-3xl text-ivory">Not Approved</h1>
          <p className="text-ivoryDim text-sm">{t('rejected')}</p>
        </div>
        <GoldButton variant="ghost" onClick={() => router.replace('/sign-in')} className="w-full">
          Sign In Again
        </GoldButton>
      </div>
    </div>
  );
}
