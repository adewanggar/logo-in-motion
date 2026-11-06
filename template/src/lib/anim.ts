import {Easing, interpolate} from 'remotion';
import type {Bezier} from './tokens';

/**
 * Pure, frame-driven animation helpers. Every value is a function of the
 * frame number only — no state carried between frames, no Date.now(), no
 * Math.random(). That is what makes renders reproducible and lets any frame
 * be inspected in isolation.
 */

const easeCache = new Map<string, (t: number) => number>();
export const ease = (b: Bezier): ((t: number) => number) => {
  const key = b.join(',');
  let fn = easeCache.get(key);
  if (!fn) {
    fn = Easing.bezier(b[0], b[1], b[2], b[3]);
    easeCache.set(key, fn);
  }
  return fn;
};

/** 0→1 progress of a window [start, start+dur], eased, clamped. */
export const prog = (frame: number, start: number, dur: number, curve?: Bezier): number => {
  if (dur <= 0) return frame >= start ? 1 : 0;
  const t = Math.min(1, Math.max(0, (frame - start) / dur));
  return curve ? ease(curve)(t) : t;
};

/** Map an eased window onto a value range. Overshooting curves may exceed [from,to]. */
export const tween = (
  frame: number,
  start: number,
  dur: number,
  from: number,
  to: number,
  curve?: Bezier,
): number => from + (to - from) * prog(frame, start, dur, curve);

/** Piecewise keyframes: tween through several poses, each segment with its own curve. */
export const keys = (
  frame: number,
  frames: number[],
  values: number[],
  curves?: (Bezier | undefined)[],
): number => {
  if (frame <= frames[0]) return values[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (frame <= frames[i + 1]) {
      const c = curves?.[i];
      return interpolate(frame, [frames[i], frames[i + 1]], [values[i], values[i + 1]], {
        easing: c ? ease(c) : undefined,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }
  return values[values.length - 1];
};

/**
 * Closed-form damped oscillation for recoil / settle tails.
 * t in frames since impact; returns a signed factor decaying to 0.
 */
export const damped = (t: number, freq = 0.09, decay = 0.16): number =>
  t <= 0 ? 0 : Math.exp(-decay * t) * Math.sin(2 * Math.PI * freq * t);

/** Follow-through without state: sample the leader's curve a few frames late. */
export const lag = <T>(fn: (f: number) => T, frame: number, delay: number): T => fn(frame - delay);

/** Speed of a scalar trajectory at a frame (central difference), units/frame. */
export const speedAt = (fn: (f: number) => number, frame: number): number =>
  Math.abs(fn(frame + 0.5) - fn(frame - 0.5));

/** Volume-preserving squash: returns [sx, sy] for a deformation amount (−1..1). */
export const squashXY = (amount: number): [number, number] => {
  const sy = 1 - amount;
  return [1 / Math.max(0.2, sy), sy];
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
