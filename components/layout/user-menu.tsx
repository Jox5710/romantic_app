'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useRouter, Link } from '@/lib/i18n/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export function UserMenu() {
  const t = useTranslations('userMenu');
  const { session } = useCoupleState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Hide entirely when signed out (e.g. on /sign-in)
  if (!session) return null;

  const email = session.user.email ?? '';
  const initial = email.charAt(0).toUpperCase() || '♥';

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace('/sign-in');
  }

  return (
    <div className="relative" ref={ref}>
      <LoadingOverlay show={signingOut} label={t('signingOut')} fullscreen />

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={email || 'Account'}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/15 border border-gold/40 text-gold text-sm font-semibold hover:bg-gold/25 transition-colors"
      >
        {initial || <User size={15} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            // Open toward the inline-end side in both LTR and RTL
            className="absolute end-0 mt-2 w-60 rounded-2xl border border-gold/25 bg-surface/95 backdrop-blur-xl shadow-popLg overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="text-[10px] uppercase tracking-wider text-muted">Forever</p>
              <p className="text-sm text-ivory truncate" title={email}>{email}</p>
            </div>

            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-ivoryDim hover:text-ivory hover:bg-surface2/60 transition-colors"
            >
              <Settings size={16} className="text-gold" />
              {t('account')}
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ivoryDim hover:text-ivory hover:bg-surface2/60 transition-colors"
            >
              <LogOut size={16} className="text-gold rtl-flip" />
              {t('signOut')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
