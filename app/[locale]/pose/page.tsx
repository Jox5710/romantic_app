'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { POSE_PRESETS } from '@/lib/pose-presets';
import { Sparkles, Upload, Download, X, ImagePlus, Check } from 'lucide-react';

const DAILY_LIMIT = 2;

// Read a File into a downscaled JPEG data URL — keeps the POST body small and
// strips EXIF orientation surprises before sending to the model.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
async function fileToDataUrl(file: File, max = 1024, quality = 0.85): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const obj = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = obj; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(obj);
}

interface PastCreation { id: string; pose_label: string; result_path: string; url?: string }

function PhotoSlot({
  label, value, onPick, onClear,
}: { label: string; value: string | null; onPick: (f: File) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1">
      <p className="text-xs text-ivoryDim uppercase tracking-wider mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-square rounded-2xl border border-dashed border-line bg-surface2 overflow-hidden flex items-center justify-center hover:border-gold/50 transition-colors"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted">
            <ImagePlus size={26} className="text-gold/70" />
            <span className="text-xs">{label}</span>
          </span>
        )}
      </button>
      {value && (
        <button type="button" onClick={onClear} className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted hover:text-ivory">
          <X size={12} /> {label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
      />
    </div>
  );
}

export default function PosePage() {
  const t = useTranslations('pose');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();
  const supabase = createClient();
  const { session, coupleId } = useCoupleState();

  const [photoA, setPhotoA] = useState<string | null>(null);
  const [photoB, setPhotoB] = useState<string | null>(null);
  const [activePose, setActivePose] = useState<{ label: string; description: string } | null>(null);
  const [customPose, setCustomPose] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; label: string } | null>(null);
  const [usedToday, setUsedToday] = useState(0);
  const [past, setPast] = useState<PastCreation[]>([]);

  const remaining = Math.max(0, DAILY_LIMIT - usedToday);

  const refreshQuota = useCallback(async () => {
    if (!coupleId) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('pose_quota').select('count').eq('couple_id', coupleId).eq('day', today).maybeSingle();
    setUsedToday(data?.count ?? 0);
  }, [coupleId, supabase]);

  const refreshPast = useCallback(async () => {
    if (!coupleId) return;
    const { data } = await supabase
      .from('pose_creations').select('id, pose_label, result_path')
      .eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(8);
    const rows = (data ?? []) as PastCreation[];
    const withUrls = await Promise.all(rows.map(async (r) => {
      const signed = await supabase.storage.from('couple-photos').createSignedUrl(r.result_path, 3600);
      return { ...r, url: signed.data?.signedUrl };
    }));
    setPast(withUrls);
  }, [coupleId, supabase]);

  useEffect(() => { refreshQuota(); refreshPast(); }, [refreshQuota, refreshPast]);

  async function pick(setter: (v: string | null) => void, file: File) {
    try { setter(await fileToDataUrl(file)); }
    catch { toast(tc('error'), 'error'); }
  }

  async function generate() {
    if (!photoA || !photoB) { toast(t('needPhotos'), 'error'); return; }
    if (!activePose) { toast(t('needPose'), 'error'); return; }
    if (remaining <= 0) { toast(t('quotaReached'), 'error'); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/pose/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poseLabel: activePose.label,
          poseDescription: activePose.description,
          imageA: photoA,
          imageB: photoB,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const map: Record<string, string> = {
          quotaExceeded: t('quotaReached'),
          badImages: t('needPhotos'),
          llmUnavailable: t('genFailed'),
          noCouple: tc('error'),
        };
        toast(map[json?.error as string] || t('genFailed'), 'error');
        return;
      }
      setResult({ url: json.url, label: activePose.label });
      await refreshQuota();
      await refreshPast();
    } catch {
      toast(t('genFailed'), 'error');
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = !!photoA && !!photoB && !!activePose && remaining > 0 && !generating;

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-gold" />
            <div>
              <h1 className="font-display-en text-2xl sm:text-3xl text-ivory">{t('title')}</h1>
              <p className="text-xs text-muted">{t('subtitle')}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full border border-line text-ivoryDim shrink-0">
            {t('remaining', { n: remaining })}
          </span>
        </div>

        {/* Photos */}
        <Card className="space-y-3">
          <p className="text-xs text-gold uppercase tracking-wider flex items-center gap-2"><Upload size={13} /> {t('uploadStep')}</p>
          <div className="flex gap-3">
            <PhotoSlot label={t('photoYou')} value={photoA} onPick={(f) => pick(setPhotoA, f)} onClear={() => setPhotoA(null)} />
            <PhotoSlot label={t('photoPartner')} value={photoB} onPick={(f) => pick(setPhotoB, f)} onClear={() => setPhotoB(null)} />
          </div>
        </Card>

        {/* Pose picker */}
        <Card className="space-y-4">
          <p className="text-xs text-gold uppercase tracking-wider">{t('poseStep')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POSE_PRESETS.map((p) => {
              const selected = activePose?.label === (locale === 'ar' ? p.ar : p.en);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivePose({ label: locale === 'ar' ? p.ar : p.en, description: p.prompt })}
                  className={['flex items-center gap-2 px-3 py-2.5 rounded-xl border text-start text-sm transition-colors', selected ? 'border-gold bg-gold/10 text-gold' : 'border-line text-ivoryDim hover:border-gold/40'].join(' ')}
                >
                  <span className="text-base leading-none">{p.emoji}</span>
                  <span className="truncate flex-1">{locale === 'ar' ? p.ar : p.en}</span>
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom pose */}
          <div className="space-y-2 pt-1">
            <Field
              label={t('customLabel')}
              value={customPose}
              placeholder={t('customPlaceholder')}
              onChange={(e) => setCustomPose(e.target.value)}
              onBlur={() => { if (customPose.trim()) setActivePose({ label: customPose.trim(), description: customPose.trim() }); }}
            />
            {customPose.trim() && (
              <button
                type="button"
                onClick={() => setActivePose({ label: customPose.trim(), description: customPose.trim() })}
                className={['text-xs px-3 py-1.5 rounded-full border transition-colors', activePose?.label === customPose.trim() ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted'].join(' ')}
              >
                {t('useCustom')}
              </button>
            )}
          </div>
        </Card>

        <GoldButton onClick={generate} loading={generating} disabled={!canGenerate} className="w-full">
          {t('generate')}
        </GoldButton>
        {remaining <= 0 && <p className="text-xs text-muted text-center">{t('comeBackTomorrow')}</p>}

        {/* Result */}
        {result && (
          <Card className="space-y-3">
            <p className="text-xs text-gold uppercase tracking-wider">{result.label}</p>
            <div className="rounded-2xl p-1.5 bg-gradient-to-br from-gold/40 via-gold/10 to-gold/40">
              <div className="rounded-xl overflow-hidden bg-surface2 border border-gold/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={result.label} className="w-full h-auto block" />
              </div>
            </div>
            <GoldButton
              variant="ghost"
              onClick={() => downloadUrl(result.url, `forever-${Date.now()}.png`)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={15} /> {t('download')}
            </GoldButton>
          </Card>
        )}

        {/* Past creations */}
        {past.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider">{t('gallery')}</p>
            <div className="grid grid-cols-3 gap-2">
              {past.map((p) => p.url && (
                <button key={p.id} type="button" onClick={() => setResult({ url: p.url!, label: p.pose_label })} className="aspect-square rounded-xl overflow-hidden border border-line hover:border-gold/40 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.pose_label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <span className="sr-only">{session?.user.id}</span>
      </div>

      {/* Loading overlay */}
      {generating && <PoseLoadingOverlay />}
    </RouteGuard>
  );
}

// A warm, branded full-screen overlay shown while Gemini works. Rotates poetic
// lines so the wait feels intentional rather than stuck.
function PoseLoadingOverlay() {
  const t = useTranslations('pose');
  const lines = [t('loading1'), t('loading2'), t('loading3'), t('loading4')];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % 4), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-6 bg-bg/90 backdrop-blur-md px-8 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <Sparkles size={22} className="text-gold absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="text-ivory text-lg font-display-en max-w-xs transition-opacity">{lines[i]}</p>
      <p className="text-xs text-muted">{t('loadingHint')}</p>
    </div>
  );
}
