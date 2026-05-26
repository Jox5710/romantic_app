'use client';

import { useMemo } from 'react';
import { differenceInDays, addDays, parseISO } from 'date-fns';

interface Milestone {
  label: string;
  date: Date;
  daysAway: number;
}

export function useAnniversaryMilestones(
  createdAt: string | null,
  weddingDate: string | null,
): Milestone | null {
  return useMemo(() => {
    if (!createdAt) return null;
    const start = parseISO(createdAt);
    const now = new Date();

    const checkpoints: Array<{ days: number; label: string }> = [
      { days: 30, label: '30 days together' },
      { days: 100, label: '100 days together' },
      { days: 180, label: '6 months together' },
      { days: 365, label: 'One year together' },
      { days: 730, label: 'Two years together' },
      { days: 1095, label: 'Three years together' },
    ];

    if (weddingDate) {
      const wedding = parseISO(weddingDate);
      const daysSince = differenceInDays(now, wedding);
      if (daysSince >= 0) {
        for (let y = 1; y <= 50; y++) {
          checkpoints.push({
            days: differenceInDays(
              new Date(wedding.getFullYear() + y, wedding.getMonth(), wedding.getDate()),
              start,
            ),
            label: `${y === 1 ? 'First' : `${y}th`} wedding anniversary`,
          });
        }
      }
    }

    for (const cp of checkpoints) {
      const milestoneDate = addDays(start, cp.days);
      const daysAway = differenceInDays(milestoneDate, now);
      if (Math.abs(daysAway) <= 1) {
        return { label: cp.label, date: milestoneDate, daysAway };
      }
    }

    return null;
  }, [createdAt, weddingDate]);
}
