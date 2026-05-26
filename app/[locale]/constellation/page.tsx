'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useMemories } from '@/lib/queries/memories';
import { format } from 'date-fns';
import { useTutorial } from '@/components/tutorial/use-tutorial';

const GOLDEN_ANGLE = 2.39996;

interface Memory {
  id: string;
  caption: string;
  occurred_at: string;
}

interface Star {
  x: number;
  y: number;
  memory: Memory;
}

function buildStars(memories: Memory[], cx: number, cy: number): Star[] {
  return memories.map((m, i) => {
    const r = 20 + i * 18;
    const angle = i * GOLDEN_ANGLE;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      memory: m,
    };
  });
}

export default function ConstellationPage() {
  const t = useTranslations('constellation');

  useTutorial('constellation', [
    { id: 'constellation-title', titleKey: 'constellation.step1.title', descKey: 'constellation.step1.desc' },
    { id: 'constellation-canvas', titleKey: 'constellation.step2.title', descKey: 'constellation.step2.desc' },
    { id: 'constellation-title', titleKey: 'constellation.step3.title', descKey: 'constellation.step3.desc' },
  ]);
  const { coupleId } = useCoupleState();
  const { data: memories } = useMemories(coupleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; memory: Memory } | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !memories?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const stars = buildStars(memories as Memory[], cx, cy);
    starsRef.current = stars;

    ctx.clearRect(0, 0, width, height);

    // Draw connecting lines
    ctx.strokeStyle = 'rgba(201,169,97,0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < stars.length; i++) {
      ctx.beginPath();
      ctx.moveTo(stars[i - 1].x, stars[i - 1].y);
      ctx.lineTo(stars[i].x, stars[i].y);
      ctx.stroke();
    }

    // Draw stars
    stars.forEach((s, i) => {
      const size = i === 0 ? 5 : 3 + Math.sin(i) * 1.5;
      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 3);
      gradient.addColorStop(0, 'rgba(201,169,97,0.8)');
      gradient.addColorStop(1, 'rgba(201,169,97,0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c87a';
      ctx.fill();
    });
  }, [memories]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = starsRef.current.find((s) => Math.hypot(s.x - mx, s.y - my) < 16);
    setTooltip(hit ? { x: mx, y: my, memory: hit.memory } : null);
  }

  return (
    <RouteGuard>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>

        {!memories?.length ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">✦</p>
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-line bg-surface">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              className="w-full"
              onClick={handleClick}
              style={{ cursor: 'crosshair' }}
            />
            {tooltip && (
              <div
                className="absolute pointer-events-none bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ivory max-w-[180px] shadow-pop"
                style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
              >
                <p className="text-gold text-xs">{format(new Date(tooltip.memory.occurred_at), 'PP')}</p>
                <p className="mt-0.5 line-clamp-2">{tooltip.memory.caption}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
