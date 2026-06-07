'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { Card } from '@/components/ui/card';
import { Link } from '@/lib/i18n/navigation';
import { format } from 'date-fns';
import { ArrowRight, Mail } from 'lucide-react';
import type { CoupleState } from '@/lib/supabase/types';
import type { AdminUserRow } from '@/lib/admin-types';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalUsers: number;
  unconfirmed: number;
}

interface RecentCouple {
  id: string;
  name_a: string | null;
  name_b: string | null;
  name_a_ar: string | null;
  name_b_ar: string | null;
  created_at: string;
  invite_email: string | null;
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const isArabic = useLocale() === 'ar';

  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, approved: 0, rejected: 0, totalUsers: 0, unconfirmed: 0,
  });
  const [recent, setRecent] = useState<RecentCouple[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [couplesRes, recentRes, usersRes] = await Promise.all([
        supabase.from('couples').select('state'),
        supabase
          .from('couples')
          .select('id,name_a,name_b,name_a_ar,name_b_ar,created_at,invite_email')
          .eq('state', 'pending_admin')
          .order('created_at', { ascending: false })
          .limit(5),
        fetch('/api/admin/users'),
      ]);

      if (couplesRes.data) {
        const rows = couplesRes.data as { state: CoupleState }[];
        const userRows: AdminUserRow[] = usersRes.ok ? await usersRes.json() : [];

        setStats({
          total: rows.length,
          pending: rows.filter((r) => r.state === 'pending_admin').length,
          approved: rows.filter((r) => r.state === 'approved').length,
          rejected: rows.filter((r) => r.state === 'rejected').length,
          totalUsers: userRows.length,
          unconfirmed: userRows.filter((u) => !u.email_confirmed_at).length,
        });
      }

      setRecent((recentRes.data ?? []) as RecentCouple[]);
      setLoadingStats(false);
    }

    load();
  }, []);

  const pairNames = (c: RecentCouple) => {
    const a = (isArabic ? c.name_a_ar ?? c.name_a : c.name_a) ?? '?';
    const b = (isArabic ? c.name_b_ar ?? c.name_b : c.name_b) ?? t('couples.pendingPartner');
    return `${a} ${isArabic ? 'و' : '&'} ${b}`;
  };

  const statCards = [
    { label: t('stats.total'), value: stats.total },
    { label: t('stats.pending'), value: stats.pending, highlight: stats.pending > 0 },
    { label: t('stats.approved'), value: stats.approved },
    { label: t('stats.rejected'), value: stats.rejected },
    { label: t('stats.totalUsers'), value: stats.totalUsers },
    { label: t('stats.unconfirmed'), value: stats.unconfirmed, highlight: stats.unconfirmed > 0 },
  ];

  return (
    <RouteGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Stats grid */}
        <div className="space-y-3">
          <h1 className="font-display-en text-2xl sm:text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {statCards.map(({ label, value, highlight }) => (
              <Card
                key={label}
                variant="elevated"
                className={['text-center space-y-1', highlight ? 'border-gold/50' : ''].join(' ')}
              >
                {loadingStats ? (
                  <div className="h-8 w-12 mx-auto rounded shimmer" />
                ) : (
                  <p className={`text-3xl font-display-en ${highlight ? 'text-gold' : 'text-ivory'}`}>
                    {value}
                  </p>
                )}
                <p className="text-xs text-ivoryDim leading-tight">{label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent submissions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display-en text-xl text-ivory">{t('recentSubmissions.title')}</h2>
            <Link
              href="/admin/couples"
              className="text-xs text-gold hover:underline flex items-center gap-1"
            >
              {t('recentSubmissions.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-muted text-sm py-4">{t('recentSubmissions.empty')}</p>
          ) : (
            <div className="space-y-2">
              {recent.map((c) => (
                <Card key={c.id} variant="elevated" className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-ivory font-medium truncate">{pairNames(c)}</p>
                    <p className="text-xs text-muted">
                      {format(new Date(c.created_at), 'PPP')}
                      {c.invite_email && ` · ${c.invite_email}`}
                    </p>
                  </div>
                  <Link
                    href="/admin/couples"
                    className="shrink-0 text-xs text-gold hover:underline flex items-center gap-1"
                  >
                    {t('recentSubmissions.viewAll')} <ArrowRight size={11} />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-display-en text-xl text-ivory">{t('quickActions.title')}</h2>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin/couples"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-gold text-sm hover:bg-surface2 transition-colors"
            >
              {t('quickActions.reviewCouples')} →
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-gold text-sm hover:bg-surface2 transition-colors"
            >
              {t('quickActions.manageUsers')} →
            </Link>
            <Link
              href="/admin/mail"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-gold text-sm hover:bg-surface2 transition-colors"
            >
              <Mail size={13} />
              {t('quickActions.mail')} →
            </Link>
          </div>
        </div>

      </div>
    </RouteGuard>
  );
}
