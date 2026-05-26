'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTransition } from 'react';

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === 'en' ? 'ar' : 'en';
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label="Switch language"
      className="flex items-center justify-center w-8 h-8 rounded-full bg-surface text-sm font-hand text-gold hover:text-goldBright hover:bg-surface2 transition-colors shadow-pop disabled:opacity-50"
    >
      {locale === 'en' ? 'ع' : 'EN'}
    </button>
  );
}
