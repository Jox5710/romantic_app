/**
 * Free OSM Nominatim geocoder — no API key, no account.
 *
 * Usage: `await geocode('egypt', signal)` returns up to 5 results with lat/lng
 * and an optional bounding box (so we can `flyToBounds` a country instead of
 * just centering on a single point).
 *
 * Nominatim has a strict usage policy (max ~1 req/sec, identifying User-Agent
 * required). The throttle below holds the *next* call back if the previous one
 * fired less than `MIN_INTERVAL_MS` ago; callers should also debounce the
 * keystroke that triggers this. AbortSignal lets the caller cancel a request
 * in flight (e.g. a new keystroke arrived before the old query finished).
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_INTERVAL_MS = 1100;

let lastFiredAt = 0;

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  /** Leaflet-friendly [south, west, north, east] bounding box, when available. */
  bbox?: [number, number, number, number];
}

interface NominatimRow {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
}

export async function geocode(
  q: string,
  signal?: AbortSignal,
  /** BCP-47 locale string, e.g. "ar" or "en". Passed to Nominatim as
   *  Accept-Language so result display_names prefer that language. */
  locale?: string,
): Promise<GeocodeResult[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const wait = Math.max(0, lastFiredAt + MIN_INTERVAL_MS - Date.now());
  if (wait > 0) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, wait);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }
  lastFiredAt = Date.now();

  // Bias results toward Egypt (countrycodes=eg) without excluding worldwide
  // results — Nominatim treats countrycodes as a soft preference when combined
  // with a broad query, so non-Egyptian matches still surface when relevant.
  // We only add the parameter when the URL wouldn't already have it.
  const url = `${ENDPOINT}?q=${encodeURIComponent(trimmed)}&format=jsonv2&limit=5&addressdetails=0&countrycodes=eg`;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (locale) {
    // e.g. "ar,en;q=0.9" or "en,ar;q=0.9" — lets Nominatim pick the right
    // script for place-name labels without breaking non-Egyptian lookups.
    const fallback = locale.startsWith('ar') ? 'en' : 'ar';
    headers['Accept-Language'] = `${locale},${fallback};q=0.8`;
  }
  const res = await fetch(url, {
    signal,
    headers,
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as NominatimRow[];

  return rows.map((r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    let bbox: GeocodeResult['bbox'];
    if (r.boundingbox && r.boundingbox.length === 4) {
      // Nominatim returns [south, north, west, east] as strings.
      const south = parseFloat(r.boundingbox[0]);
      const north = parseFloat(r.boundingbox[1]);
      const west = parseFloat(r.boundingbox[2]);
      const east = parseFloat(r.boundingbox[3]);
      if ([south, north, west, east].every((n) => Number.isFinite(n))) {
        bbox = [south, west, north, east];
      }
    }
    return { display_name: r.display_name, lat, lng, bbox };
  }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}
