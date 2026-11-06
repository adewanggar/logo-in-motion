import type {LetterState} from '../components/Lockup';
import {damped, ease, keys, prog, squashXY} from '../lib/anim';
import {UNIVERSAL, type MotionTokens} from '../lib/tokens';

/**
 * Reusable move vocabulary. Every move returns IDENTITY once its window has
 * passed, which is what keeps the Final Frame Contract true for any bumper
 * that composes them.
 */

/** Scale-pop with anticipation-free overshoot and (personality-gated) squash on landing. */
export const pop = (frame: number, start: number, dur: number, tok: MotionTokens, from = 0.4) => {
  if (frame < start) return {opacity: 0, scale: from};
  if (frame >= start + dur + 30) return {};
  const land = start + dur * 0.6;
  const scale =
    tok.overshoot > 1.001
      ? keys(frame, [start, land, start + dur], [from, tok.overshoot, 1], [tok.enter, tok.settle])
      : keys(frame, [start, start + dur], [from, 1], [tok.enter]);
  const opacity = prog(frame, start, dur * 0.35);
  const [sx, sy] = tok.squash > 0 ? squashXY(tok.squash * 0.6 * damped(frame - land, 0.07, 0.18)) : [1, 1];
  return {opacity, scale, sx, sy};
};

/**
 * Letter cascade: total cascade capped (default 0.7 s); with many letters the
 * per-letter stagger shrinks — the total never stretches.
 */
export const cascade = (
  frame: number,
  i: number,
  n: number,
  start: number,
  fps: number,
  tok: MotionTokens,
  style: 'rise' | 'slide' | 'blur' | 'slam',
  fontSize: number,
  capSec = 0.7,
): LetterState => {
  const dur = Math.round(fps * Math.min(0.42, Math.max(0.22, tok.partSec * 0.6)));
  const window = Math.max(0, fps * capSec - dur);
  const stagger = n > 1 ? Math.min(dur * tok.staggerRatio * 1.4, window / (n - 1)) : 0;
  const s = start + i * stagger;
  if (frame >= s + dur + 30) return {};
  if (frame < s) return {opacity: 0};
  const p = prog(frame, s, dur, tok.enter);
  const op = prog(frame, s, dur * 0.5);
  switch (style) {
    case 'rise':
      return {opacity: op, ty: fontSize * 0.55 * (1 - p), rotate: 4 * (1 - p)};
    case 'slide':
      return {opacity: op, tx: -fontSize * 0.45 * (1 - p)};
    case 'blur':
      return {opacity: op, tx: fontSize * 0.25 * (1 - p), blur: 10 * (1 - prog(frame, s, dur, UNIVERSAL.outExpo))};
    case 'slam': {
      const d = Math.max(4, Math.round(dur * 0.45));
      const k = prog(frame, s, d, UNIVERSAL.inQuad);
      const rec = frame >= s + d ? 0.06 * damped(frame - (s + d), 0.1, 0.25) : 0;
      return {opacity: Math.min(1, k * 3), scale: 1.9 - 0.9 * k + rec, blur: 8 * (1 - k)};
    }
  }
};

/** Move a group from frame center to its lockup slot (mark makes room for the wordmark). */
export const slide = (
  frame: number,
  start: number,
  dur: number,
  offset: {dx: number; dy: number},
  curve: readonly [number, number, number, number],
) => {
  const p = prog(frame, start, dur, curve);
  return {tx: offset.dx * (1 - p), ty: offset.dy * (1 - p)};
};

/** Expanding shockwave ring: grow with out-cubic, fade on LINEAR time (decoupled). */
export const shockwave = (frame: number, start: number, dur: number) => {
  if (frame < start || frame > start + dur) return null;
  const grow = ease([0.33, 1, 0.68, 1])((frame - start) / dur);
  const fade = 1 - (frame - start) / dur;
  return {grow, fade};
};
