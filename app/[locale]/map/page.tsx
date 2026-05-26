'use client';

'use client';

import dynamic from 'next/dynamic';
import { RouteGuard } from '@/components/route-guard';
import { useTranslations } from 'next-intl';
import { useTutorial } from '@/components/tutorial/use-tutorial';

const UsMap = dynamic(() => import('@/components/map/us-map').then((m) => ({ default: m.UsMap })), {
  ssr: false,
  loading: () => <div className="w-full h-[calc(100vh-5rem)] rounded-2xl shimmer" />,
});

export default function MapPage() {
  const t = useTranslations('map');

  useTutorial('map', [
    { id: 'map-title', titleKey: 'map.step1.title', descKey: 'map.step1.desc' },
    { id: 'map-canvas', titleKey: 'map.step2.title', descKey: 'map.step2.desc' },
    { id: 'map-title', titleKey: 'map.step3.title', descKey: 'map.step3.desc' },
  ]);

  return (
    <RouteGuard>
      <div className="px-4 py-4 space-y-4">
        <div data-tutorial-id="map-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div data-tutorial-id="map-canvas">
          <UsMap />
        </div>
      </div>
    </RouteGuard>
  );
}
