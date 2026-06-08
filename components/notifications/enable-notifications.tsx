'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellOff, BellRing, Share, PlusSquare } from 'lucide-react';
import {
  notificationsSupported, getPermission, requestNotificationPermission,
} from '@/lib/notifications';
import { subscribeToPush } from '@/lib/push';
import {
  isNative, nativePushPermission, registerNativePush, isIOS, isStandalonePWA,
} from '@/lib/native';

/**
 * Permission prompt for notifications. Browsers only allow requesting
 * permission from a user gesture, so this is a button/banner the user taps.
 * Hidden once granted; shows a small "blocked" hint if previously denied.
 */
export function EnableNotifications() {
  const t = useTranslations('notifications');
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  // iOS Safari (non-installed) can't do web push at all — the only path is to
  // Add-to-Home-Screen first. Detected client-side to avoid hydration mismatch.
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    // In the native shell, web Notification may be absent — gate on the native
    // push permission instead so the button still appears.
    if (isNative()) { void nativePushPermission().then(setPerm); return; }
    if (isIOS() && !isStandalonePWA()) { setIosInstall(true); return; }
    setPerm(notificationsSupported() ? getPermission() : 'unsupported');
  }, []);

  if (iosInstall) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-ivoryDim max-w-xs">
        <span className="flex items-center gap-2 text-gold font-medium">
          <Bell size={14} className="shrink-0" />
          {t('iosInstall.title')}
        </span>
        <span className="flex items-center gap-2">
          <Share size={13} className="shrink-0 text-gold/80" />
          {t('iosInstall.step1')}
        </span>
        <span className="flex items-center gap-2">
          <PlusSquare size={13} className="shrink-0 text-gold/80" />
          {t('iosInstall.step2')}
        </span>
        <span className="flex items-center gap-2">
          <BellRing size={13} className="shrink-0 text-gold/80" />
          {t('iosInstall.step3')}
        </span>
      </div>
    );
  }

  if (perm === 'unsupported' || perm === 'granted') return null;

  async function enable() {
    if (isNative()) {
      // Native push: prompts, then registers the FCM/APNs device token.
      await registerNativePush();
      setPerm(await nativePushPermission());
      return;
    }
    const result = await requestNotificationPermission();
    setPerm(result);
    // Register a Web Push subscription so heartbeats arrive even when the app
    // is closed — not just while a tab is open.
    if (result === 'granted') void subscribeToPush();
  }

  if (perm === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface2/60 px-4 py-2 text-xs text-muted">
        <BellOff size={14} className="shrink-0" />
        <span>{t('blocked')}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      className="group flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-4 py-2 text-xs text-gold hover:bg-gold/10 transition-colors"
    >
      <Bell size={14} className="group-hover:hidden" />
      <BellRing size={14} className="hidden group-hover:block" />
      <span>{t('enable')}</span>
    </button>
  );
}
