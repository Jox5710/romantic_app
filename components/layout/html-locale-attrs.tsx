'use client';

import { useEffect } from 'react';

export function HtmlLocaleAttrs({ locale }: { locale: string }) {
  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  return null;
}
