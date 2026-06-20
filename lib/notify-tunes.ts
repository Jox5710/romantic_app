/**
 * Per-notification-type vibration patterns + Android channel config.
 *
 * One distinct "tune" (vibration cadence on web/native + a sound on the native
 * Android channel) per notification type, so partners can feel WHICH event
 * arrived without looking. Keyed by the `NotifType` strings in
 * `lib/server-notify.ts` (also used as the OS `tag` and the Android channel id).
 *
 * NOTE: a plain copy of `VIBRATION_PATTERNS` is duplicated inline in
 * `public/sw.js` because a service worker is served as a static file and cannot
 * import this module. Keep the two in sync.
 */

export const DEFAULT_VIBRATION: number[] = [120, 60, 120];

// navigator.vibrate / Notification.vibrate format: [on, off, on, ...] in ms.
export const VIBRATION_PATTERNS: Record<string, number[]> = {
  heartbeat: [80, 40, 80, 40, 160],
  vibe: [40, 30, 40, 30, 40],
  whisper: [30],
  gratitude: [120, 60, 120],
  bucket: [200],
  prompt: [60, 40, 60],
  mirror: [50, 50, 50, 50, 50],
  promise: [150, 80, 150],
  mission: [80, 40, 80, 40, 80, 40, 200],
  memory: [100, 50, 100],
  dinner: [70, 40, 70, 40, 70],
  canvas: [40, 40, 120],
};

export function vibrationFor(tag?: string): number[] {
  return (tag && VIBRATION_PATTERNS[tag]) || DEFAULT_VIBRATION;
}

/**
 * Android notification channel definitions. On Android 8+ the sound + vibration
 * are fixed PER CHANNEL at creation time and cannot be overridden per message —
 * so every notification type gets its own channel (id === the NotifType). The
 * `sound` is a raw resource name in `mobile/android/app/src/main/res/raw/`
 * (no extension). Several types share a tone but each keeps its own vibration.
 *
 * Android channel vibration uses [delayMs, vibrateMs, ...] — leading delay 0.
 */
export interface AndroidChannel {
  id: string;
  name: string;
  description: string;
  sound: string; // raw resource name (no extension)
  importance: number; // 5 = HIGH (heads-up), 4 = DEFAULT
  vibration: number[];
}

export const ANDROID_CHANNELS: AndroidChannel[] = [
  { id: 'heartbeat', name: 'Heartbeats', description: 'A heartbeat from your love', sound: 'heart', importance: 5, vibration: [0, 80, 40, 80, 40, 160] },
  { id: 'whisper', name: 'Whispers', description: 'A quiet whisper', sound: 'soft', importance: 5, vibration: [0, 30] },
  { id: 'vibe', name: 'Vibes', description: 'Shared moods', sound: 'soft', importance: 4, vibration: [0, 40, 30, 40, 30, 40] },
  { id: 'gratitude', name: 'Gratitude', description: 'Moments of thanks', sound: 'chime', importance: 4, vibration: [0, 120, 60, 120] },
  { id: 'bucket', name: 'Shared dreams', description: 'New bucket-list dreams', sound: 'chime', importance: 4, vibration: [0, 200] },
  { id: 'prompt', name: 'Daily prompts', description: 'Answered prompts', sound: 'chime', importance: 4, vibration: [0, 60, 40, 60] },
  { id: 'mirror', name: 'Mirror', description: 'Revealed mirror answers', sound: 'chime', importance: 4, vibration: [0, 50, 50, 50, 50, 50] },
  { id: 'promise', name: 'Promises', description: 'Kept promises', sound: 'ding', importance: 4, vibration: [0, 150, 80, 150] },
  { id: 'mission', name: 'Missions', description: 'Completed missions', sound: 'ding', importance: 4, vibration: [0, 80, 40, 80, 40, 80, 40, 200] },
  { id: 'memory', name: 'Memories', description: 'New memories', sound: 'chime', importance: 4, vibration: [0, 100, 50, 100] },
  { id: 'dinner', name: 'Dinner', description: 'Dinner matches', sound: 'ding', importance: 4, vibration: [0, 70, 40, 70, 40, 70] },
  { id: 'canvas', name: 'Shared board', description: 'Drawings on your board', sound: 'soft', importance: 4, vibration: [0, 40, 40, 120] },
];
