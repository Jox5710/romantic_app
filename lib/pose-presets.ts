/**
 * 10 default romantic poses for the AI Pose Studio + the expert prompt template
 * that turns a chosen pose into a high-quality Gemini image-generation prompt.
 *
 * `prompt` is the precise English pose description fed to the model; `en`/`ar`
 * are the user-facing labels. Custom poses reuse `buildPosePrompt` with the
 * couple's own text.
 */

export interface PosePreset {
  key: string;
  en: string;
  ar: string;
  /** Precise pose description interpolated into the prompt template. */
  prompt: string;
  emoji: string;
}

export const POSE_PRESETS: PosePreset[] = [
  { key: 'forehead-kiss', en: 'Forehead kiss', ar: 'قبلة على الجبين', emoji: '😘', prompt: 'one partner tenderly kissing the other on the forehead, eyes gently closed' },
  { key: 'back-hug', en: 'Back hug', ar: 'حضن من الخلف', emoji: '🤗', prompt: 'one partner hugging the other from behind, both smiling warmly' },
  { key: 'slow-dance', en: 'Slow dance', ar: 'رقصة هادئة', emoji: '💃', prompt: 'the couple slow-dancing close together, hands clasped, foreheads almost touching' },
  { key: 'hand-in-hand', en: 'Walking hand in hand', ar: 'يدًا بيد', emoji: '🚶', prompt: 'the couple walking hand in hand, seen from behind, golden-hour light ahead' },
  { key: 'umbrella', en: 'Under one umbrella', ar: 'تحت مظلة واحدة', emoji: '☔', prompt: 'the couple cheek to cheek sharing a single umbrella in soft rain' },
  { key: 'piggyback', en: 'Piggyback laugh', ar: 'على الظهر بضحكة', emoji: '😄', prompt: 'one partner giving the other a piggyback ride, both laughing joyfully' },
  { key: 'reading', en: 'Reading together', ar: 'نقرأ معًا', emoji: '📖', prompt: 'the couple cozied up on a couch reading a book together under a warm lamp' },
  { key: 'sunset', en: 'Sunset embrace', ar: 'عناق عند الغروب', emoji: '🌅', prompt: 'the couple embracing in silhouette against a vivid sunset sky' },
  { key: 'almost-kiss', en: 'Almost kiss', ar: 'قبلة وشيكة', emoji: '💞', prompt: 'the couple nose to nose in an intimate almost-kiss, soft focus' },
  { key: 'cooking', en: 'Cooking together', ar: 'نطبخ معًا', emoji: '🍳', prompt: 'the couple cooking together in a sunlit kitchen, one laughing at the other' },
];

/**
 * Expert prompt template — preserves identity/likeness, sets a tasteful
 * cinematic style, and asks for a single high-resolution SFW output.
 */
export function buildPosePrompt(poseDescription: string): string {
  return [
    'Combine the two provided photographs into a single, photorealistic romantic',
    'portrait of the SAME two people. Preserve each person\'s facial identity, skin',
    'tone, hairstyle and approximate age faithfully — do not beautify, slim, or alter',
    'their features, and do not swap their genders or ethnicity.',
    `Pose them as: ${poseDescription}.`,
    'Use soft, warm, cinematic lighting, a shallow depth of field, and an elegant,',
    'tasteful composition suitable for a couple\'s keepsake. Ensure natural anatomy,',
    'correct number of fingers, matched lighting and perspective between both',
    'subjects, and coherent shadows. Keep it wholesome and strictly SFW (fully',
    'clothed). Output a single high-resolution image and no text.',
  ].join(' ');
}
