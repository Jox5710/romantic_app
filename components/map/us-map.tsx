'use client';

// Leaflet stylesheet MUST be a static top-level import — Next.js App Router
// only extracts CSS that's imported statically (dynamic CSS imports evaluate
// to an empty module). Since us-map.tsx is only mounted on /map, this CSS
// already ships only with that route.
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlaces, useAddPlace, useUpdatePlace, useDeletePlace } from '@/lib/queries/places';
import { nativeGetPosition } from '@/lib/native';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/components/theme/theme-provider';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import {
  X, Trash2, Search, Plus, Minus, Globe, Landmark, LocateFixed, Filter, MapPin,
} from 'lucide-react';
import type { PlaceKind } from '@/lib/supabase/types';
import type { Map as LeafletMap, Marker, TileLayer } from 'leaflet';
import { geocode, type GeocodeResult } from '@/lib/geocode';
import { EGYPT_PLACES, type EgyptPlace } from '@/lib/egypt-locations';
import { useLocale } from 'next-intl';

type Theme = 'dusk' | 'day' | 'night';

// Tile source per theme. Day uses Voyager (warm light) — no filter applied;
// dusk + night use Dark Matter and the .leaflet-tile-pane filter in
// globals.css recolors the gray lines toward Forever gold.
const TILE_BY_THEME: Record<Theme, { url: string; attribution: string; subdomains: string }> = {
  dusk: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  },
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  },
  day: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  },
};

const ALL_KINDS: PlaceKind[] = ['visited', 'dream', 'first_date', 'anniversary', 'home'];
const EGYPT_CENTER: [number, number] = [26.8, 30.8];
const EGYPT_ZOOM = 6;
const WORLD_CENTER: [number, number] = [30, 20];
const WORLD_ZOOM = 2;

interface PendingPin { lat: number; lng: number }
interface PlaceRow {
  id: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
  name: string;
  note?: string | null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function UsMap() {
  const t = useTranslations('map');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();
  const { theme } = useTheme();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const { coupleId } = useCoupleState();
  const { data: places } = usePlaces(coupleId);
  const add = useAddPlace();
  const update = useUpdatePlace();
  const del = useDeletePlace();

  // Pending-pin form (existing right-click flow).
  const [pending, setPending] = useState<PendingPin | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PlaceKind>('visited');
  const [note, setNote] = useState('');
  const [visitedAt, setVisitedAt] = useState('');
  const [locating, setLocating] = useState(false);

  // Race-gate: markers effect waits until Leaflet has finished loading.
  const [mapReady, setMapReady] = useState(false);

  // Hover viewer card.
  const [hovered, setHovered] = useState<PlaceRow | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Side-rail controlled overlays.
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleKinds, setVisibleKinds] = useState<Set<PlaceKind>>(new Set(ALL_KINDS));

  // Search bar state.
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geoResults, setGeoResults] = useState<GeocodeResult[]>([]);
  const geoAbortRef = useRef<AbortController | null>(null);

  const placesList = (places ?? []) as PlaceRow[];

  // ─── 1. Map init (once) ────────────────────────────────────────────────────
  useEffect(() => {
    let cleanup = () => {};
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: WORLD_CENTER,
        zoom: WORLD_ZOOM,
        worldCopyJump: true,
        zoomControl: false, // we render our own + style them
      });

      const initial = TILE_BY_THEME[theme as Theme] ?? TILE_BY_THEME.dusk;
      const tile = L.tileLayer(initial.url, {
        attribution: initial.attribution,
        subdomains: initial.subdomains,
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tile;

      // Disable built-in partial double-click zoom; replace with a smooth
      // fly-to-max-zoom so double-clicking feels intentional and dramatic.
      map.doubleClickZoom.disable();
      map.on('dblclick', (e) => {
        map.flyTo(e.latlng, map.getMaxZoom(), { duration: 0.9 });
      });

      // Right-click / long-press drops a pending pin and zooms in.
      map.on('contextmenu', (e) => {
        setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
        if (prefersReducedMotion()) {
          map.setView([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 5));
        } else {
          map.flyTo([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 5), {
            duration: 0.9, easeLinearity: 0.25,
          });
        }
      });

      mapInstanceRef.current = map;
      setMapReady(true);
      cleanup = () => {
        map.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = [];
        setMapReady(false);
      };
    });
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 2. Swap tile layer on theme change ────────────────────────────────────
  // Don't tear down the whole map — just remove the old tile layer and add
  // the new one. Pin markers + camera state survive.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    import('leaflet').then((L) => {
      tileLayerRef.current?.remove();
      const cfg = TILE_BY_THEME[theme as Theme] ?? TILE_BY_THEME.dusk;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: 19,
      }).addTo(map);
    });
  }, [theme, mapReady]);

  // ─── 3. Markers ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map || !places) return;
    // Touch devices don't actually hover — Leaflet synthesizes mouseover on
    // first tap and mouseout on second, which makes our hover viewer feel
    // broken (opens then closes immediately). On touch we use click-to-toggle
    // instead and skip the hover bindings.
    const isHoverDevice = typeof window !== 'undefined'
      && window.matchMedia('(hover: hover)').matches;
    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      placesList
        .filter((p) => visibleKinds.has(p.kind))
        .forEach((p) => {
          // CSS-var-driven color so a theme swap retints without re-mount.
          const icon = L.divIcon({
            className: 'forever-pin',
            html: `<div style="--pin-color:var(--pin-${p.kind});position:relative;width:16px;height:16px;"><div class="halo"></div><div class="dot"></div></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const marker = L.marker([p.lat, p.lng], { icon, draggable: true }).addTo(map);

          // Drag-to-reposition: persist the new coordinates on drop.
          marker.on('dragend', () => {
            const ll = marker.getLatLng();
            update.mutate({ id: p.id, lat: ll.lat, lng: ll.lng });
          });

          if (isHoverDevice) {
            // Desktop: hover → open viewer card. Grace timer for cursor travel.
            marker.on('mouseover', () => {
              if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
              setHovered(p);
            });
            marker.on('mouseout', () => {
              if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
              hoverCloseTimer.current = setTimeout(() => setHovered(null), 180);
            });

            // Click → fly-in zoom to that pin.
            marker.on('click', () => {
              if (prefersReducedMotion()) {
                map.setView([p.lat, p.lng], 8);
              } else {
                map.flyTo([p.lat, p.lng], 8, { duration: 1.4, easeLinearity: 0.25 });
              }
            });
          } else {
            // Touch: a tap toggles the viewer card open / closed. No fly-in,
            // because the viewer card already covers the bottom area and a
            // fly-in would scroll the pin out of view behind the card.
            marker.on('click', () => {
              if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
              setHovered((curr) => (curr?.id === p.id ? null : p));
            });
          }

          markersRef.current.push(marker);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, mapReady, visibleKinds]);

  // ─── 4. Search — pin matches (instant) + Egypt places (instant) + geocode (debounced 600ms) ──
  const trimmedQuery = query.trim();
  const matchingPlaces = useMemo(() => {
    if (trimmedQuery.length < 1) return [];
    const q = trimmedQuery.toLowerCase();
    return placesList.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, places]);

  // Instant match against the bundled Egypt places list. Matches on either
  // English or Arabic name so Arabic-script input works naturally.
  const matchingEgypt = useMemo<EgyptPlace[]>(() => {
    if (trimmedQuery.length < 1) return [];
    const q = trimmedQuery.toLowerCase().trim();
    return EGYPT_PLACES.filter(
      (p) => p.en.toLowerCase().includes(q) || p.ar.includes(trimmedQuery),
    ).slice(0, 6);
  }, [trimmedQuery]);

  useEffect(() => {
    geoAbortRef.current?.abort();
    setGeoResults([]);
    if (trimmedQuery.length < 2) { setSearching(false); return; }

    const controller = new AbortController();
    geoAbortRef.current = controller;
    setSearching(true);

    const t = setTimeout(async () => {
      try {
        const res = await geocode(trimmedQuery, controller.signal, locale);
        if (!controller.signal.aborted) setGeoResults(res);
      } catch {
        // Aborted or network — silent (UI shows empty state).
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 600);

    return () => { clearTimeout(t); controller.abort(); };
  }, [trimmedQuery]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function fly(center: [number, number], zoom: number) {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (prefersReducedMotion()) map.setView(center, zoom);
    else map.flyTo(center, zoom, { duration: 1.4, easeLinearity: 0.25 });
  }

  function flyToPin(p: PlaceRow) {
    fly([p.lat, p.lng], 9);
    setSearchOpen(false);
    setQuery('');
  }

  async function flyToGeo(r: GeocodeResult) {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (r.bbox) {
      const [s, w, n, e] = r.bbox;
      if (prefersReducedMotion()) {
        map.fitBounds([[s, w], [n, e]]);
      } else {
        const L = await import('leaflet');
        map.flyToBounds(L.latLngBounds([s, w], [n, e]), { duration: 1.4, easeLinearity: 0.25 });
      }
    } else {
      fly([r.lat, r.lng], 6);
    }
    setSearchOpen(false);
    setQuery('');
  }

  async function locateMe() {
    if (locating) return;
    setLocating(true);
    try {
      // Uses the native @capacitor/geolocation plugin inside the APK (so "My
      // Location" actually works there), and the web Geolocation API in a browser.
      const pos = await nativeGetPosition();
      if (pos) fly([pos.lat, pos.lng], 15);
      else toast(t('geolocationDenied'), 'error');
    } catch {
      toast(t('geolocationUnavailable'), 'error');
    } finally {
      setLocating(false);
    }
  }

  async function savePin() {
    if (!coupleId || !pending || !name.trim()) return;
    const { lat, lng } = pending;
    await add.mutateAsync({
      couple_id: coupleId, name, lat, lng, kind,
      note: note || undefined,
      visited_at: visitedAt || undefined,
    });
    setPending(null); setName(''); setNote(''); setVisitedAt('');
    // Keep the camera ON the new pin (was zooming out to world view, zoom 3).
    const map = mapInstanceRef.current;
    fly([lat, lng], Math.max(map?.getZoom() ?? 10, 10));
  }

  async function deletePin(id: string) {
    await del.mutateAsync(id);
    setHovered(null);
  }

  function cancelHoverClose() {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
  }
  function scheduleHoverClose() {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setHovered(null), 180);
  }

  function toggleKind(k: PlaceKind) {
    setVisibleKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const kinds: PlaceKind[] = ALL_KINDS;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100dvh-9rem)] sm:h-[calc(100dvh-7rem)]">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden bg-surface2" />

      {/* Top-start: search bar */}
      {searchOpen && (
        <div className="absolute top-4 start-4 z-[1000] w-80 max-w-[calc(100%-7rem)]">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              autoFocus
              className="w-full bg-surface2/95 backdrop-blur-md border border-line rounded-xl ps-9 pe-9 py-2.5 text-sm text-ivory placeholder:text-muted focus:outline-none focus:border-gold shadow-popLg"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('close')}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-muted hover:text-ivory"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {trimmedQuery.length >= 1 && (
            <div className="mt-2 rounded-xl border border-line bg-surface/95 backdrop-blur-md shadow-popLg overflow-hidden max-h-[60vh] overflow-y-auto">

              {/* ── Your saved pins ── */}
              {matchingPlaces.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold bg-surface2/60">
                    {t('searchYourPlaces')}
                  </p>
                  {matchingPlaces.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => flyToPin(p)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-start text-sm text-ivory hover:bg-surface2/60 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: `var(--pin-${p.kind})` }}
                      />
                      <span className="truncate flex-1">{p.name}</span>
                      <span className="text-[10px] text-muted shrink-0">{t(`kinds.${p.kind}`)}</span>
                    </button>
                  ))}
                </>
              )}

              {/* ── Egypt landmarks (instant, client-side) ── */}
              {matchingEgypt.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold bg-surface2/60">
                    {t('searchEgypt')}
                  </p>
                  {matchingEgypt.map((p) => (
                    <button
                      key={`eg-${p.lat}-${p.lng}`}
                      type="button"
                      onClick={() => {
                        fly([p.lat, p.lng], 13);
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-start text-sm text-ivory hover:bg-surface2/60 transition-colors"
                    >
                      <MapPin size={12} className="text-gold/70 shrink-0" />
                      <span className="truncate flex-1">{locale === 'ar' ? p.ar : p.en}</span>
                      {locale !== 'ar' && (
                        <span className="text-[10px] text-muted shrink-0 font-arabic">{p.ar}</span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* ── Nominatim / worldwide geocoder ── */}
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold bg-surface2/60 flex items-center justify-between">
                <span>{t('searchLocations')}</span>
                {searching && <span className="text-muted normal-case tracking-normal">{t('searchSearching')}</span>}
              </p>
              {geoResults.length > 0 ? (
                geoResults.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    type="button"
                    onClick={() => flyToGeo(r)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-start text-sm text-ivory hover:bg-surface2/60 transition-colors"
                  >
                    <MapPin size={12} className="text-gold/70 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                  </button>
                ))
              ) : !searching && matchingPlaces.length === 0 && matchingEgypt.length === 0 && trimmedQuery.length >= 2 ? (
                <p className="px-3 py-3 text-xs text-muted text-center">{t('searchEmpty')}</p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Top-end: filter chips */}
      {filterOpen && (
        <div className="absolute top-4 end-20 z-[1000] flex flex-wrap gap-1.5 justify-end max-w-[calc(100%-9rem)]">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => toggleKind(k)}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors backdrop-blur-md',
                visibleKinds.has(k)
                  ? 'bg-gold text-bg'
                  : 'border border-line text-muted hover:text-ivory bg-surface/70',
              ].join(' ')}
              aria-pressed={visibleKinds.has(k)}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: `var(--pin-${k})` }}
              />
              {t(`kinds.${k}`)}
            </button>
          ))}
        </div>
      )}

      {/* Side rail (inline-end) */}
      <div className="absolute top-1/2 -translate-y-1/2 end-4 z-[1000] flex flex-col gap-1.5">
        <RailButton icon={<Search size={16} />} label={t('controls.search')} active={searchOpen} onClick={() => setSearchOpen((v) => !v)} />
        <RailButton icon={<Plus size={16} />}   label={t('controls.zoomIn')}  onClick={() => mapInstanceRef.current?.zoomIn()} />
        <RailButton icon={<Minus size={16} />}  label={t('controls.zoomOut')} onClick={() => mapInstanceRef.current?.zoomOut()} />
        <RailButton icon={<Landmark size={16} />} label={t('controls.egypt')} onClick={() => fly(EGYPT_CENTER, EGYPT_ZOOM)} />
        <RailButton icon={<Globe size={16} />}    label={t('controls.world')} onClick={() => fly(WORLD_CENTER, WORLD_ZOOM)} />
        <RailButton icon={<LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />} label={t('controls.myLocation')} active={locating} onClick={locateMe} />
        <RailButton icon={<Filter size={16} />} label={t('controls.filter')} active={filterOpen} onClick={() => setFilterOpen((v) => !v)} />
      </div>

      {/* Pending-pin form (bottom-start) */}
      {pending && (
        <div className="absolute bottom-4 start-3 end-3 z-[1000] w-auto sm:bottom-6 sm:start-6 sm:end-auto sm:w-80">
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
            <Field label={t('form.visitedAt')} type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
            <Field label={t('noteOptional')} value={note} onChange={(e) => setNote(e.target.value)} />
            <GoldButton onClick={savePin} loading={add.isPending} disabled={!name.trim()} className="w-full">{t('savePin')}</GoldButton>
          </Card>
        </div>
      )}

      {/* Hover viewer (bottom-end) */}
      {hovered && (
        <div
          className="absolute bottom-4 start-3 end-20 z-[1000] w-auto sm:bottom-6 sm:start-auto sm:end-20 sm:w-72"
          onMouseEnter={cancelHoverClose}
          onMouseLeave={scheduleHoverClose}
        >
          <Card variant="elevated" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <span
                  className="inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    color: `var(--pin-${hovered.kind})`,
                    background: `color-mix(in srgb, var(--pin-${hovered.kind}) 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, var(--pin-${hovered.kind}) 40%, transparent)`,
                  }}
                >
                  {t(`kinds.${hovered.kind}`)}
                </span>
                <p className="text-ivory font-medium truncate">{hovered.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setHovered(null)}
                aria-label={t('close')}
                className="text-muted hover:text-ivory active:text-ivory shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            {hovered.note && (
              <p className="text-xs text-ivoryDim leading-relaxed">{hovered.note}</p>
            )}
            <button
              type="button"
              onClick={() => deletePin(hovered.id)}
              disabled={del.isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-red-900/60 text-red-300 text-xs hover:bg-red-900/20 active:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} />
              {del.isPending ? t('deleting') : t('deletePin')}
            </button>
          </Card>
        </div>
      )}

      {/* Hint pills — stacked vertically so they don't overlap the search bar */}
      <div className="hidden sm:flex flex-col items-center gap-1.5 absolute top-4 start-1/2 -translate-x-1/2 z-[999] pointer-events-none">
        <p className="text-xs text-ivoryDim bg-bg/70 backdrop-blur-sm rounded-full px-3 py-1.5">
          {t('hint')}
        </p>
        <p className="text-[10px] text-muted/80 bg-bg/60 backdrop-blur-sm rounded-full px-3 py-1">
          {t('zoomHere')}
        </p>
      </div>

      {/* Decorative — keeps unused i18n key warnings quiet for tc */}
      <span className="sr-only">{tc('loading')}</span>
    </div>
  );
}

// ─── Side-rail button (44×44, glass tile) ────────────────────────────────────
function RailButton({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'w-11 h-11 rounded-xl backdrop-blur-md border transition-colors flex items-center justify-center shadow-pop',
        active
          ? 'bg-gold text-bg border-gold'
          : 'bg-surface/80 text-gold border-line hover:border-gold/40 hover:bg-surface2/80',
      ].join(' ')}
    >
      {icon}
    </button>
  );
}
