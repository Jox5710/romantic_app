'use client';

// Backwards-compatible re-export. The implementation now lives in a single
// shared context (one auth subscription for the whole app) — see
// couple-state-context.tsx. All existing import sites keep working unchanged.
export { useCoupleState } from './couple-state-context';
