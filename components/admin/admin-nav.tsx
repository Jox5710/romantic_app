'use client';

import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/lib/i18n/navigation';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { LayoutDashboard, Heart, Users, Mail } from 'lucide-react';

export function AdminNav() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  const { isAdmin, loading } = useCoupleState();

  if (loading || !isAdmin) return null;

  const tabs = [
    { href: '/admin' as const, label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/couples' as const, label: t('couples'), icon: Heart, exact: false },
    { href: '/admin/users' as const, label: t('users'), icon: Users, exact: false },
    { href: '/admin/mail' as const, label: t('mail'), icon: Mail, exact: false },
  ];

  return (
    <nav className="sticky top-16 md:top-20 z-30 bg-bg/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted hover:text-ivory',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
