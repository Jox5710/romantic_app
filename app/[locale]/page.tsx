'use client';

import { RouteGuard } from '@/components/route-guard';
import { Hero } from '@/components/hero/hero';
import { ModuleGrid } from '@/components/layout/module-grid';
import { AnniversaryBanner } from '@/components/hero/anniversary-banner';
import { useAnniversaryMilestones } from '@/lib/hooks/use-anniversary';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { useCouple } from '@/lib/queries/use-couple';

export default function DashboardPage() {
  const { coupleId } = useCoupleState();
  const { data: couple } = useCouple(coupleId ?? null);

  // Gate the tutorial on couple data being loaded, so it starts only once the
  // Hero + module grid (and their data-tutorial-id targets) are actually on screen.
  useTutorial(
    'home',
    [
      { id: 'home-hero', titleKey: 'home.step1.title', descKey: 'home.step1.desc' },
      { id: 'home-module-grid', titleKey: 'home.step2.title', descKey: 'home.step2.desc' },
      { id: 'home-heartbeat-card', titleKey: 'home.step3.title', descKey: 'home.step3.desc' },
    ],
    !!couple,
  );

  const milestone = useAnniversaryMilestones(
    couple?.created_at ?? null,
    couple?.wedding_date ?? null,
  );

  return (
    <RouteGuard>
      {milestone && <AnniversaryBanner label={milestone.label} />}
      <div data-tutorial-id="home-hero">
        <Hero
          nameA={couple?.name_a ?? null}
          nameB={couple?.name_b ?? null}
          nameAAr={couple?.name_a_ar ?? null}
          nameBAr={couple?.name_b_ar ?? null}
          weddingDate={couple?.wedding_date ?? null}
        />
      </div>
      <div data-tutorial-id="home-module-grid">
        <ModuleGrid />
      </div>
    </RouteGuard>
  );
}
