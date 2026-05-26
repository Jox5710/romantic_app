'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { Link } from '@/lib/i18n/navigation';
import type { CoupleState } from '@/lib/supabase/types';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('couples')
      .select('state')
      .then(({ data }) => {
        if (!data) return;
        const rows = data as { state: CoupleState }[];
        setStats({
          total: rows.length,
          pending: rows.filter((r) => r.state === 'pending_admin').length,
          approved: rows.filter((r) => r.state === 'approved').length,
          rejected: rows.filter((r) => r.state === 'rejected').length,
        });
      });
  }, []);

  return (
    <RouteGuard>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('stats.total'), value: stats.total },
            { label: t('stats.pending'), value: stats.pending },
            { label: t('stats.approved'), value: stats.approved },
            { label: t('stats.rejected'), value: stats.rejected },
          ].map(({ label, value }) => (
            <Card key={label} variant="elevated" className="text-center space-y-1">
              <p className="text-3xl font-display-en text-gold">{value}</p>
              <p className="text-xs text-ivoryDim">{label}</p>
            </Card>
          ))}
        </div>

        <Link
          href="/admin/couples"
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-gold text-sm hover:bg-surface2 transition-colors"
        >
          {t('couples.title')} →
        </Link>
      </div>
    </RouteGuard>
  );
}
