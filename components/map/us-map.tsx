'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlaces, useAddPlace } from '@/lib/queries/places';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { MapPin, X } from 'lucide-react';
import type { PlaceKind } from '@/lib/supabase/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

const PIN_COLORS: Record<PlaceKind, string> = {
  visited: '#c9a961',
  dream: '#9b8abf',
  first_date: '#e8c87a',
  anniversary: '#d4a060',
  home: '#b08040',
};

interface PendingPin {
  lat: number;
  lng: number;
}

export function UsMap() {
  const t = useTranslations('map');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const { coupleId } = useCoupleState();
  const { data: places } = usePlaces(coupleId);
  const add = useAddPlace();

  const [pending, setPending] = useState<PendingPin | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PlaceKind>('visited');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!MAPBOX_TOKEN) return; // No token → don't init Mapbox (avoids a hard crash)
    let map: import('mapbox-gl').Map;

    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
      if (!mapRef.current || mapInstanceRef.current) return;

      map = new mapboxgl.default.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [20, 30],
        zoom: 2,
      });

      mapInstanceRef.current = map;

      map.on('contextmenu', (e) => {
        setPending({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      map.on('load', () => {
        if (!places) return;
        places.forEach((p: { id: string; lat: number; lng: number; kind: PlaceKind; name: string }) => {
          const el = document.createElement('div');
          el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${PIN_COLORS[p.kind]};border:2px solid #fff;cursor:pointer;`;
          new mapboxgl.default.Marker(el)
            .setLngLat([p.lng, p.lat])
            .setPopup(new mapboxgl.default.Popup().setText(p.name))
            .addTo(map);
        });
      });
    });

    return () => { if (map) map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !places) return;
    import('mapbox-gl').then((mapboxgl) => {
      places.forEach((p: { id: string; lat: number; lng: number; kind: PlaceKind; name: string }) => {
        const el = document.createElement('div');
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${PIN_COLORS[p.kind]};border:2px solid #fff;cursor:pointer;`;
        new mapboxgl.default.Marker(el)
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.default.Popup().setText(p.name))
          .addTo(mapInstanceRef.current as import('mapbox-gl').Map);
      });
    });
  }, [places]);

  async function savePin() {
    if (!coupleId || !pending || !name.trim()) return;
    await add.mutateAsync({ couple_id: coupleId, name, lat: pending.lat, lng: pending.lng, kind, note: note || undefined });
    setPending(null); setName(''); setNote('');
  }

  const kinds: PlaceKind[] = ['visited', 'dream', 'first_date', 'anniversary', 'home'];

  // No Mapbox token configured → show a graceful placeholder instead of crashing.
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[calc(100vh-7rem)] rounded-2xl border border-line bg-surface/60 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPin size={40} className="text-gold/50" />
        <p className="text-ivoryDim text-sm max-w-xs">{t('noToken')}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-7rem)]">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />

      {pending && (
        <div className="absolute bottom-6 start-6 z-10 w-80">
          <Card variant="elevated" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gold uppercase tracking-wider">{t('newPin')}</p>
              <button type="button" onClick={() => setPending(null)} className="text-muted hover:text-ivory active:text-ivory"><X size={14} /></button>
            </div>
            <Field label={t('form.name')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="flex flex-wrap gap-1.5">
              {kinds.map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)}
                  className={['px-2 py-1 rounded-full border text-xs transition-all', kind === k ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted'].join(' ')}>
                  {t(`kinds.${k}`)}
                </button>
              ))}
            </div>
            <Field label={t('noteOptional')} value={note} onChange={(e) => setNote(e.target.value)} />
            <GoldButton onClick={savePin} loading={add.isPending} disabled={!name.trim()} className="w-full">{t('savePin')}</GoldButton>
          </Card>
        </div>
      )}

      <p className="absolute top-4 start-4 z-10 text-xs text-ivoryDim bg-bg/70 backdrop-blur-sm rounded-full px-3 py-1.5">
        {t('hint')}
      </p>
    </div>
  );
}
