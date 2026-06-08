'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/theme-provider';
import { ToastProvider } from './ui/toast';
import { TutorialProvider } from './tutorial/tutorial-provider';
import { TutorialOverlay } from './tutorial/tutorial-overlay';
import { SplashScreen } from './intro/splash-screen';
import { CoupleStateProvider } from '@/lib/hooks/couple-state-context';
import { NotificationProvider } from './notifications/notification-provider';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30s — short enough that returning to the app / switching features
            // pulls a partner's latest changes automatically (no manual refresh),
            // long enough to avoid hammering during a single screen's lifetime.
            // Mutations still invalidate immediately via invalidateQueries.
            staleTime: 30 * 1000,
            gcTime: 30 * 60 * 1000,   // keeps cache 30 min instead of default 5 min
            retry: 2,
            // Auto-refresh when the user comes back to the tab/app or regains
            // connectivity — the main "always up to date with your partner" path
            // for features without a dedicated realtime subscription.
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CoupleStateProvider>
        <ThemeProvider>
          <ToastProvider>
            <TutorialProvider>
              <SplashScreen />
              <TutorialOverlay />
              <NotificationProvider />
              {children}
            </TutorialProvider>
          </ToastProvider>
        </ThemeProvider>
      </CoupleStateProvider>
    </QueryClientProvider>
  );
}
