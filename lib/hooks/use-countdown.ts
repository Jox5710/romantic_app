'use client';

import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export function useCountdown(targetDate: string | null): CountdownResult {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, totalSeconds: 0 };
  }

  const target = new Date(targetDate);
  const totalSeconds = differenceInSeconds(target, now);
  const isPast = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);

  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  return { days, hours, minutes, seconds, isPast, totalSeconds };
}
