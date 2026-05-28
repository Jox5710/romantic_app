'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { Hero } from '@/components/hero/hero';
import { ModuleGrid } from '@/components/layout/module-grid';
import { AnniversaryBanner } from '@/components/hero/anniversary-banner';
import { useAnniversaryMilestones } from '@/lib/hooks/use-anniversary';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface CoupleData {
  name_a: string | null;
  name_b: string | null;
  name_a_ar: string | null;
  name_b_ar: string | null;
  wedding_date: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const { coupleId } = useCoupleState();
  const [couple, setCouple] = useState<CoupleData | null>(null);

  useTutorial('home', [
    { id: 'home-hero', titleKey: 'home.step1.title', descKey: 'home.step1.desc' },
    { id: 'home-module-grid', titleKey: 'home.step2.title', descKey: 'home.step2.desc' },
    { id: 'home-heartbeat-card', titleKey: 'home.step3.title', descKey: 'home.step3.desc' },
  ]);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    supabase
      .from('couples')
      .select('name_a,name_b,name_a_ar,name_b_ar,wedding_date,created_at')
      .eq('id', coupleId)
      .single()
      .then(({ data }) => setCouple(data as CoupleData | null));
  }, [coupleId]);

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
