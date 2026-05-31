'use client';

// Leaflet stylesheet MUST be a static top-level import — Next.js App Router
// only extracts CSS that's imported statically (dynamic CSS imports evaluate
// to an empty module). Since us-map.tsx is only mounted on /map, this CSS
// already ships only with that route.
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlaces, useAddPlace } from '@/lib/queries/places';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { PlaceKind } from '@/lib/supabase/types';
import type { Map as LeafletMap, Marker } from 'leaflet';

const PIN_COLORS: Record<PlaceKind, string> = {
  visited: '#c9a961',
  dream: '#9b8abf',
  first_date: '#e8c87a',
  anniversary: '#d4a060',
  home: '#b08040',
};

// CartoDB Dark Matter — free, no key, dark theme that fits the Forever palette.
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface PendingPin {
  lat: number;
  lng: number;
}

interface PlaceRow {
  id: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
  name: string;
}

export function UsMap() {
  const t = useTranslations('map');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const { coupleId } = useCoupleState();
  const { data: places } = usePlaces(coupleId);
  const add = useAddPlace();

  const [pending, setPending] = useState<PendingPin | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PlaceKind>('visited');
  const [note, setNote] = useState('');

  // Init the map once. Leaflet ships from npm so it works offline / on intranets.
  useEffect(() => {
    let cleanup = () => {};
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [30, 20],
        zoom: 2,
        worldCopyJump: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Right-click (desktop) and long-press (mobile, via contextmenu) drops a
      // pending pin where the user clicked.
      map.on('contextmenu', (e) => {
        setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstanceRef.current = map;
      cleanup = () => {
        map.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      };
    });

    return () => cleanup();
  }, []);

  // Sync markers whenever the places list changes. Wipe the previous set so
  // an edit/delete doesn't leave ghost pins on the canvas.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !places) return;
    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      (places as PlaceRow[]).forEach((p) => {
        const icon = L.divIcon({
          className: 'forever-pin',
          html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${PIN_COLORS[p.kind]};border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4);"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(p.name);
        markersRef.current.push(marker);
      });
    });
  }, [places]);

  async function savePin() {
    if (!coupleId || !pending || !name.trim()) return;
    await add.mutateAsync({ couple_id: coupleId, name, lat: pending.lat, lng: pending.lng, kind, note: note || undefined });
    setPending(null); setName(''); setNote('');
  }

  const kinds: PlaceKind[] = ['visited', 'dream', 'first_date', 'anniversary', 'home'];

  return (
    <div className="relative w-full h-[calc(100vh-7rem)]">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden bg-surface2" />

      {pending && (
        <div className="absolute bottom-6 start-6 z-[1000] w-80">
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

      <p className="absolute top-4 start-4 z-[1000] text-xs text-ivoryDim bg-bg/70 backdrop-blur-sm rounded-full px-3 py-1.5">
        {t('hint')}
      </p>
    </div>
  );
}
