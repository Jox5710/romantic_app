'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

const PUBLIC_PATHS = ['/sign-in', '/invite', '/accept', '/awaiting', '/rejected'];
const ADMIN_PATHS = ['/admin'];

function SealedLoading() {
  const { repeat } = useRespectfulMotion();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-gold/40"
            style={{ willChange: 'transform, opacity' }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-gold/20"
            style={{ willChange: 'transform, opacity' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.div
            style={{ willChange: 'opacity' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat, ease: 'easeInOut' }}
          >
            <Image src="/forever-logo.png" alt="Forever" width={88} height={48} className="object-contain" priority />
          </motion.div>
        </div>
        <motion.p
          className="text-muted text-sm font-body-en"
          style={{ willChange: 'opacity' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat }}
        >
          Forever…
        </motion.p>
      </div>
    </div>
  );
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { session, isAdmin, coupleState, loading } = useCoupleState();

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
    const isAdminRoute = ADMIN_PATHS.some((p) => path.startsWith(p));

    if (!session) {
      if (!isPublic) router.replace('/sign-in');
      return;
    }

    if (isAdminRoute) {
      if (!isAdmin) router.replace('/');
      return;
    }

    if (isAdminRoute && isAdmin) return;

    switch (coupleState) {
      case 'approved':
        return;
      case null:
      case 'drafted':
        if (path !== '/invite') router.replace('/invite');
        return;
      case 'invited':
      case 'mutual':
      case 'pending_admin':
        if (!path.startsWith('/awaiting')) router.replace('/awaiting');
        return;
      case 'rejected':
        if (!path.startsWith('/rejected')) router.replace('/rejected');
        return;
    }
  }, [session, isAdmin, coupleState, loading, path, router]);

  if (loading) {
    // Wrap in a static-positioned parent so Next's app-router auto-scroll
    // handler has a non-fixed root to target (silences dev-only warning).
    return (
      <div className="min-h-screen">
        <SealedLoading />
      </div>
    );
  }
  return <>{children}</>;
}
