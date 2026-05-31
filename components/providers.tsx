'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/theme-provider';
import { ToastProvider } from './ui/toast';
import { TutorialProvider } from './tutorial/tutorial-provider';
import { TutorialOverlay } from './tutorial/tutorial-overlay';
import { SplashScreen } from './intro/splash-screen';
import { CoupleStateProvider } from '@/lib/hooks/couple-state-context';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 min — read-heavy feature pages (timeline, gratitude, queue…)
            // stop refetching on every focus/mount. Mutations still invalidate
            // immediately via queryClient.invalidateQueries, so freshness is
            // preserved where it matters.
            staleTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
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
              {children}
            </TutorialProvider>
          </ToastProvider>
        </ThemeProvider>
      </CoupleStateProvider>
    </QueryClientProvider>
  );
}
