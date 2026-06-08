'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useMemories } from '@/lib/queries/memories';
import { format } from 'date-fns';
import { useTutorial } from '@/components/tutorial/use-tutorial';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLDEN_ANGLE = 2.39996;
/** Max device-pixel-ratio used for the canvas bitmap. Cap at 2 for perf. */
const MAX_DPR = 2;
/** Pixels of hit-test radius in bitmap space */
const HIT_RADIUS = 20;
/** ms for the star birth fade-in animation */
const BIRTH_DURATION_MS = 1200;
/** How far the parallax field drifts (px in display space) */
const PARALLAX_RANGE = 18;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Memory {
  id: string;
  caption: string;
  occurred_at: string;
}

interface Star {
  /** Position in bitmap pixels */
  x: number;
  y: number;
  /** Base radius in bitmap pixels */
  baseRadius: number;
  memory: Memory;
  /** Offset so stars don't all twinkle in sync */
  phase: number;
  /** Birth timestamp (performance.now()) — used for fade-in */
  birthTime: number;
}

interface SelectedMemory {
  /** Position in CSS/display pixels — for card placement */
  dx: number;
  dy: number;
  memory: Memory;
}

// ─── Star layout ──────────────────────────────────────────────────────────────

function buildStars(memories: Memory[], cxBitmap: number, cyBitmap: number, dpr: number): Star[] {
  const now = performance.now();
  return memories.map((m, i) => {
    const r = (20 + i * 18) * dpr;
    const angle = i * GOLDEN_ANGLE;
    return {
      x: cxBitmap + r * Math.cos(angle),
      y: cyBitmap + r * Math.sin(angle),
      baseRadius: (i === 0 ? 5 : 3 + Math.sin(i * 1.37) * 1.5) * dpr,
      memory: m,
      phase: (i * 0.618 * Math.PI * 2) % (Math.PI * 2),
      birthTime: now + i * 80, // stagger fade-in
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConstellationPage() {
  const t = useTranslations('constellation');

  useTutorial('constellation', [
    { id: 'constellation-title',  titleKey: 'constellation.step1.title', descKey: 'constellation.step1.desc' },
    { id: 'constellation-canvas', titleKey: 'constellation.step2.title', descKey: 'constellation.step2.desc' },
    { id: 'constellation-title',  titleKey: 'constellation.step3.title', descKey: 'constellation.step3.desc' },
  ]);

  const { coupleId } = useCoupleState();
  const { data: memories } = useMemories(coupleId);

  // ── Canvas refs ──────────────────────────────────────────────────────────
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  // Stars live in a ref so the rAF loop can read them without dependency churn
  const starsRef = useRef<Star[]>([]);
  // Gold colors read once from CSS vars
  const colorsRef = useRef({ gold: '#c9a961', goldBright: '#e8c87a' });

  // ── Interaction state ────────────────────────────────────────────────────
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [selected,  setSelected]        = useState<SelectedMemory | null>(null);
  // Parallax offset in display pixels — updated by mousemove / devicemotion
  const parallaxRef = useRef({ x: 0, y: 0 });
  const parallaxTargetRef = useRef({ x: 0, y: 0 });

  // ── Reduced-motion detection (plain CSS API, no framer-motion) ───────────
  const reducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  // ── Resize: size canvas to container, respecting DPR ─────────────────────
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  // ── Main rAF draw loop ────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars = starsRef.current;
    const now   = performance.now();
    const { width: bw, height: bh } = canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    // ── Smooth parallax lerp ──────────────────────────────────────────────
    const pTarget = parallaxTargetRef.current;
    const pCurrent = parallaxRef.current;
    if (!reducedMotion.current) {
      pCurrent.x += (pTarget.x - pCurrent.x) * 0.04;
      pCurrent.y += (pTarget.y - pCurrent.y) * 0.04;
    }

    ctx.clearRect(0, 0, bw, bh);

    if (stars.length === 0) {
      rafRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    // ── Apply parallax transform to the whole field ───────────────────────
    ctx.save();
    ctx.translate(pCurrent.x * dpr, pCurrent.y * dpr);

    // ── Draw constellation lines (animated drawing-in) ────────────────────
    const LINE_DRAW_START = stars[0]?.birthTime ?? now;
    const lineProgress = reducedMotion.current
      ? 1
      : Math.min(1, (now - LINE_DRAW_START) / (BIRTH_DURATION_MS * 1.6));

    if (lineProgress > 0) {
      const totalSegments = stars.length - 1;
      ctx.strokeStyle = 'rgba(201,169,97,0.15)';
      ctx.lineWidth = 1;

      for (let i = 1; i < stars.length; i++) {
        const segStart = (i - 1) / totalSegments;
        const segEnd   = i / totalSegments;
        const segProgress = Math.max(0, Math.min(1, (lineProgress - segStart) / (segEnd - segStart)));
        if (segProgress <= 0) break;

        const prev = stars[i - 1];
        const curr = stars[i];
        const ex   = prev.x + (curr.x - prev.x) * segProgress;
        const ey   = prev.y + (curr.y - prev.y) * segProgress;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    // ── Draw stars ────────────────────────────────────────────────────────
    const { goldBright } = colorsRef.current;
    stars.forEach((s) => {
      // Birth fade-in
      const birthAge   = now - s.birthTime;
      const birthAlpha = reducedMotion.current
        ? 1
        : Math.max(0, Math.min(1, birthAge / BIRTH_DURATION_MS));
      if (birthAlpha <= 0) return;

      // Gentle twinkle/pulse (sin wave)
      const twinkle   = reducedMotion.current ? 0 : Math.sin(now * 0.001 + s.phase) * 0.3;
      const isHovered = s.memory.id === hoveredId;
      const radius    = s.baseRadius * (1 + twinkle * 0.15) * (isHovered ? 1.5 : 1);
      const glowMult  = isHovered ? 2.2 : 1;

      ctx.save();
      ctx.globalAlpha = birthAlpha;

      // Outer glow
      const glowR = radius * 3.5 * glowMult;
      const glow  = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
      glow.addColorStop(0, `rgba(201,169,97,${0.45 + twinkle * 0.2})`);
      glow.addColorStop(0.4, `rgba(201,169,97,${0.15 + twinkle * 0.1})`);
      glow.addColorStop(1, 'rgba(201,169,97,0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Star core
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = goldBright;
      ctx.fill();

      // Hover sparkle ring
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius * 2.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(232,200,122,0.35)';
        ctx.lineWidth = 1.2 * dpr;
        ctx.stroke();
      }

      ctx.restore();
    });

    ctx.restore(); // end parallax transform

    rafRef.current = requestAnimationFrame(drawLoop);
  }, [hoveredId]);

  // ── Rebuild stars whenever memories or canvas size changes ────────────────
  const rebuildStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !memories?.length) {
      starsRef.current = [];
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cx  = canvas.width / 2;
    const cy  = canvas.height / 2;
    starsRef.current = buildStars(memories as Memory[], cx, cy, dpr);
  }, [memories]);

  // ── Read CSS vars once after mount ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const style = getComputedStyle(document.documentElement);
    const gold       = style.getPropertyValue('--gold').trim()       || '#c9a961';
    const goldBright = style.getPropertyValue('--gold-bright').trim() || '#e8c87a';
    colorsRef.current = { gold, goldBright };
  }, []);

  // ── Setup: resize observer + rAF loop ────────────────────────────────────
  useEffect(() => {
    resize();
    rebuildStars();

    const ro = new ResizeObserver(() => {
      resize();
      rebuildStars();
    });
    if (containerRef.current) ro.observe(containerRef.current);

    rafRef.current = requestAnimationFrame(drawLoop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
    // drawLoop is stable; resize/rebuildStars have stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-seed stars when memories load/change ───────────────────────────────
  useEffect(() => {
    rebuildStars();
  }, [rebuildStars]);

  // ── Re-run loop when hovered star changes (so glow repaints) ─────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawLoop]);

  // ── Parallax: mouse ───────────────────────────────────────────────────────
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion.current) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const nx   = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 .. 0.5
    const ny   = (e.clientY - rect.top)  / rect.height - 0.5;
    parallaxTargetRef.current = { x: -nx * PARALLAX_RANGE, y: -ny * PARALLAX_RANGE };
  }
  function handleMouseLeave() {
    parallaxTargetRef.current = { x: 0, y: 0 };
  }

  // ── Hit-test helper ───────────────────────────────────────────────────────
  function hitTest(eClientX: number, eClientY: number): Star | undefined {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const rect   = canvas.getBoundingClientRect();
    const dpr    = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const bx     = (eClientX - rect.left)  * dpr;
    const by     = (eClientY - rect.top)   * dpr;
    const pBx    = bx - parallaxRef.current.x * dpr;
    const pBy    = by - parallaxRef.current.y * dpr;
    return starsRef.current.find((s) => Math.hypot(s.x - pBx, s.y - pBy) < HIT_RADIUS * dpr);
  }

  // ── Hover ─────────────────────────────────────────────────────────────────
  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const hit = hitTest(e.clientX, e.clientY);
    setHoveredId(hit?.memory.id ?? null);
    (e.currentTarget as HTMLCanvasElement).style.cursor = hit ? 'pointer' : 'crosshair';
  }
  function handleCanvasMouseLeave() {
    setHoveredId(null);
  }

  // ── Click / tap ───────────────────────────────────────────────────────────
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      setSelected(null);
      return;
    }
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    setSelected({
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      memory: hit.memory,
    });
  }

  // ── Reset view ────────────────────────────────────────────────────────────
  function handleReset() {
    parallaxTargetRef.current = { x: 0, y: 0 };
    setSelected(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <RouteGuard>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <div id="constellation-title" className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          </div>
          {memories && memories.length > 0 && (
            <p className="text-muted text-xs shrink-0">
              {t('memoriesCount', { count: memories.length })}
            </p>
          )}
        </div>

        {!memories?.length ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">✦</p>
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          /* ── Galaxy canvas ────────────────────────────────────────────── */
          <div
            id="constellation-canvas"
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden border border-line bg-surface h-[70vh] min-h-[440px] w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleClick}
            />

            {/* Hint label */}
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-muted text-xs pointer-events-none select-none">
              {t('hint')}
            </p>

            {/* Reset view affordance */}
            <button
              onClick={handleReset}
              className="absolute top-3 right-3 text-muted text-xs hover:text-gold transition-colors px-2 py-1 rounded-lg border border-line bg-surface/60 backdrop-blur-sm"
            >
              {t('reset')}
            </button>

            {/* Hover tooltip — caption peek */}
            {hoveredId && !selected && (() => {
              const star = starsRef.current.find((s) => s.memory.id === hoveredId);
              if (!star) return null;
              const canvas = canvasRef.current;
              if (!canvas) return null;
              const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
              const dx  = (star.x + parallaxRef.current.x * dpr) / dpr;
              const dy  = (star.y + parallaxRef.current.y * dpr) / dpr;
              return (
                <div
                  className="absolute pointer-events-none bg-surface/90 backdrop-blur-sm border border-line rounded-xl px-3 py-2 text-xs text-ivory max-w-[200px] shadow-pop transition-all duration-150"
                  style={{
                    left: Math.min(dx + 14, canvas.clientWidth - 210),
                    top:  Math.max(dy - 52, 4),
                  }}
                >
                  <p className="text-gold text-[10px] mb-0.5">
                    {format(new Date(star.memory.occurred_at), 'PP')}
                  </p>
                  <p className="line-clamp-2 leading-snug">{star.memory.caption}</p>
                </div>
              );
            })()}

            {/* Click/tap memory card */}
            {selected && (() => {
              const canvas = canvasRef.current;
              if (!canvas) return null;
              const cardW = 220;
              const cardH = 110;
              const left  = Math.min(
                Math.max(selected.dx + 16, 8),
                canvas.clientWidth - cardW - 8,
              );
              const top   = Math.max(
                Math.min(selected.dy - cardH / 2, canvas.clientHeight - cardH - 8),
                8,
              );
              return (
                <div
                  className="absolute bg-surface2 border border-line rounded-2xl px-4 py-3 shadow-pop text-ivory text-xs space-y-1.5 animate-[fadeIn_0.2s_ease]"
                  style={{ left, top, width: cardW }}
                >
                  <button
                    className="absolute top-2 right-2 text-muted hover:text-ivory transition-colors text-base leading-none"
                    onClick={() => setSelected(null)}
                    aria-label="close"
                  >
                    ×
                  </button>
                  <p className="text-gold font-medium text-[11px]">
                    {format(new Date(selected.memory.occurred_at), 'PPP')}
                  </p>
                  <p className="leading-relaxed line-clamp-3 text-ivory/90">
                    {selected.memory.caption}
                  </p>
                  <p className="text-muted text-[10px] pt-0.5">{t('viewMemory')} ✦</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
