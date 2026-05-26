'use client';

import { RouteGuard } from '@/components/route-guard';
import { VibeSync } from '@/components/vibe/vibe-sync';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function VibePage() {
  useTutorial('vibe', [
    { id: 'vibe-sync', titleKey: 'vibe.step1.title', descKey: 'vibe.step1.desc' },
    { id: 'vibe-mood', titleKey: 'vibe.step2.title', descKey: 'vibe.step2.desc' },
    { id: 'vibe-partner', titleKey: 'vibe.step3.title', descKey: 'vibe.step3.desc' },
  ]);

  return (
    <RouteGuard>
      <div data-tutorial-id="vibe-sync">
        <VibeSync />
      </div>
    </RouteGuard>
  );
}
