import type {PersonalityKey} from './lib/tokens';

/**
 * Single source of truth for the brand. Every bumper reads colors, type and
 * personality from here — never hardcode a hex value inside a bumper.
 *
 * Phase 1 of the workflow fills this file from the brief (bumper_spec.md).
 */
export type Brand = {
  /** Wordmark text. Rendered as live type, one span per letter. */
  name: string;
  /** Optional line under the lockup. Empty string = no tagline. */
  tagline: string;
  colors: {
    /** Stage background. */
    bg: string;
    /** Secondary stage tone for the vignette/gradient. */
    bgDeep: string;
    /** Main ink: wordmark + default logo color. */
    ink: string;
    /** One accent color, used sparingly (dot, sheen, impact ring). */
    accent: string;
    /** Tagline / secondary text. */
    muted: string;
  };
  font: {
    /** CSS font-family name. If `file` is set it is loaded under this name. */
    family: string;
    /** Optional local font in public/fonts, e.g. 'fonts/Brand-Bold.woff2'. */
    file?: string;
    weight: number;
    /** Letter spacing of the wordmark, in em. */
    tracking: number;
    /** Wordmark case transform. */
    transform: 'none' | 'uppercase' | 'lowercase';
  };
  /** Motion voice — maps to easing/timing tokens in lib/tokens.ts. */
  personality: PersonalityKey;
  /**
   * Lockup orientation. 'auto' = horizontal on landscape/square frames,
   * stacked on portrait frames.
   */
  lockup: 'auto' | 'horizontal' | 'stacked' | 'mark-only' | 'wordmark-only';
};

export const BRAND: Brand = {
  name: 'Orbita',
  tagline: 'Motion with intent.',
  colors: {
    bg: '#0E1015',
    bgDeep: '#05060A',
    ink: '#F4F1EA',
    accent: '#FF6A2B',
    muted: '#9298A3',
  },
  font: {
    family: 'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    weight: 700,
    tracking: 0.02,
    transform: 'none',
  },
  personality: 'trustworthy',
  lockup: 'auto',
};
