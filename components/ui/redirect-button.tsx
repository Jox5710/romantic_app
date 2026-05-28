'use client';

import { type ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';
import { usePathname } from '@/lib/i18n/navigation';
import { GoldButton } from './gold-button';
import { LoadingOverlay } from './loading-overlay';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Async work to run before/while navigating (e.g. signOut, mutate, then router.replace). */
  onClick?: () => void | Promise<void>;
  /** Label shown in the full-screen overlay while the redirect is in flight. */
  overlayLabel?: string;
}

/**
 * A GoldButton that, on click, runs an async handler (which is expected to
 * trigger a navigation) and shows an inline spinner immediately plus a
 * full-screen LoadingOverlay until the route actually changes. This closes the
 * "silent gap" between clicking and the new page painting.
 */
export function RedirectButton({
  onClick,
  overlayLabel,
  children,
  ...rest
}: Props) {
  const pathname = usePathname();
  const startPath = useRef(pathname);
  const [pending, setPending] = useState(false);

  // When the path changes after we started, the navigation finished — drop the overlay.
  useEffect(() => {
    if (pending && pathname !== startPath.current) {
      setPending(false);
    }
  }, [pathname, pending]);

  async function handleClick() {
    startPath.current = pathname;
    setPending(true);
    try {
      await onClick?.();
    } catch {
      // If the handler throws, don't leave the user stuck under the overlay.
      setPending(false);
    }
  }

  return (
    <>
      <LoadingOverlay show={pending} label={overlayLabel} fullscreen />
      <GoldButton {...rest} loading={pending} onClick={handleClick}>
        {children}
      </GoldButton>
    </>
  );
}
