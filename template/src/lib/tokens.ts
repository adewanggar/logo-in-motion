/**
 * Motion personality tokens. Brand words → one consistent motion voice.
 *
 * Timing is expressed as a SCALE on the bumper's own timeline (not absolute
 * ms), plus per-part durations in seconds that are converted to frames with
 * the composition fps. Easing values are cubic-bezier control points fed to
 * Remotion's Easing.bezier — the same numbers you would write in CSS.
 *
 * Rule: a bumper never invents its own curves. It reads them from here, so
 * the reveal, the idle loop and any variant all speak with one voice.
 */
export type Bezier = readonly [number, number, number, number];

export type PersonalityKey =
  | 'playful'
  | 'premium'
  | 'trustworthy'
  | 'energetic'
  | 'calm'
  | 'friendly';

export type MotionTokens = {
  /** Entrances: how parts arrive. */
  enter: Bezier;
  /** Settle: overshoot-and-return or soft landing. */
  settle: Bezier;
  /** Long deliberate moves: camera push, draw-on, collapse. */
  narrative: Bezier;
  /** Peak scale at the overshoot pose (1 = land exactly, no bounce). */
  overshoot: number;
  /** Allowed squash/stretch deformation (0 = plain scale only). */
  squash: number;
  /** Duration of one part's arrival, seconds. */
  partSec: number;
  /** Stagger between sibling parts as a fraction of partSec (0.1–0.2). */
  staggerRatio: number;
  /** Secondary action budget: 0 none, 1 one subtle, 2 one expressive. */
  secondary: 0 | 1 | 2;
  /** Max motion blur (px) on fast travel. 0 disables. */
  blur: number;
};

export const PERSONALITY: Record<PersonalityKey, MotionTokens> = {
  // consumer apps, kids, social — bounce allowed, short anticipation
  playful: {
    enter: [0.34, 1.56, 0.64, 1],
    settle: [0.22, 1, 0.36, 1],
    narrative: [0.45, 0, 0.2, 1],
    overshoot: 1.08,
    squash: 0.18,
    partSec: 0.45,
    staggerRatio: 0.15,
    secondary: 2,
    blur: 8,
  },
  // luxury, fashion, hospitality — slow, no deformation, mask/fade over travel
  premium: {
    enter: [0.4, 0, 0.6, 1],
    settle: [0.16, 1, 0.3, 1],
    narrative: [0.65, 0, 0.35, 1],
    overshoot: 1.015,
    squash: 0,
    partSec: 0.9,
    staggerRatio: 0.12,
    secondary: 1,
    blur: 6,
  },
  // fintech, enterprise, B2B, health — confident ease-out, land exactly
  trustworthy: {
    enter: [0, 0, 0.2, 1],
    settle: [0.4, 0, 0.2, 1],
    narrative: [0.34, 0, 0.14, 1],
    overshoot: 1.0,
    squash: 0,
    partSec: 0.6,
    staggerRatio: 0.15,
    secondary: 1,
    blur: 4,
  },
  // sports, gaming, media, startups — explosive out, strong coil, impact
  energetic: {
    enter: [0.16, 1, 0.3, 1],
    settle: [0.34, 1.56, 0.64, 1],
    narrative: [0.7, 0, 0.1, 1],
    overshoot: 1.12,
    squash: 0.25,
    partSec: 0.32,
    staggerRatio: 0.12,
    secondary: 2,
    blur: 14,
  },
  // wellness, education — symmetric, small amplitudes, opacity over travel
  calm: {
    enter: [0.42, 0, 0.58, 1],
    settle: [0.4, 0, 0.6, 1],
    narrative: [0.45, 0, 0.55, 1],
    overshoot: 1.0,
    squash: 0.04,
    partSec: 0.85,
    staggerRatio: 0.18,
    secondary: 1,
    blur: 3,
  },
  // small business, community, services — middle of every axis
  friendly: {
    enter: [0.25, 0.46, 0.45, 0.94],
    settle: [0.22, 1, 0.36, 1],
    narrative: [0.4, 0, 0.2, 1],
    overshoot: 1.04,
    squash: 0.08,
    partSec: 0.55,
    staggerRatio: 0.15,
    secondary: 1,
    blur: 6,
  },
};

/** Universal curves usable by any personality. */
export const UNIVERSAL = {
  outExpo: [0.16, 1, 0.3, 1] as Bezier,
  natural: [0.4, 0, 0.2, 1] as Bezier,
  inQuad: [0.55, 0.085, 0.68, 0.53] as Bezier, // "slam": accelerate INTO the hit
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  exit: [0.4, 0, 1, 1] as Bezier, // leave faster than you arrived
};
