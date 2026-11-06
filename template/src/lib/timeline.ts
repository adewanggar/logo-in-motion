/**
 * Bumper timeline grammar.
 *
 *   [ lead | anticipation | action | settle | HOLD | exit ]
 *          \____ reveal span, 20 : 50 : 30 ____/
 *
 * - lead: a short empty/dim beat so the eye arrives before the logo does.
 * - reveal span is split anticipation : action : follow-through = 20:50:30.
 * - HOLD is non-negotiable: the finished lockup stays perfectly still for at
 *   least 1 second. This is the moment the audience memorizes the brand.
 * - exit is optional and always faster than the entrance.
 */
export type Outro = 'hold' | 'fade' | 'lift' | 'iris';

export type Timeline = {
  total: number;
  fps: number;
  lead: [number, number];
  antic: [number, number];
  action: [number, number];
  settle: [number, number];
  /** Everything from reveal start to the frame the lockup is final. */
  reveal: [number, number];
  hold: [number, number];
  exit: [number, number];
};

export type TimelineOptions = {
  outro: Outro;
  /** Minimum still hold, seconds. Never below 1. */
  minHoldSec?: number;
  /** Hold as a share of total if that is longer than minHoldSec. */
  holdShare?: number;
  /** Lead beat, seconds. */
  leadSec?: number;
  /** anticipation : action : settle. Must sum to 1. */
  ratio?: [number, number, number];
};

export const makeTimeline = (total: number, fps: number, o: TimelineOptions): Timeline => {
  const exitF = o.outro === 'hold' ? 0 : Math.round(fps * 0.4);
  const holdF = Math.max(
    Math.round(fps * Math.max(1, o.minHoldSec ?? 1)),
    Math.round(total * (o.holdShare ?? 0.28)),
  );
  const leadF = Math.round(fps * (o.leadSec ?? 0.15));
  const revealF = total - exitF - holdF - leadF;
  if (revealF < fps * 0.5) {
    throw new Error(
      `Bumper too short: ${total}f leaves ${revealF}f for the reveal. Use ≥ ${Math.ceil(
        (exitF + holdF + leadF + fps) / fps,
      )}s.`,
    );
  }
  const [ra, rb] = o.ratio ?? [0.2, 0.5, 0.3];
  const a0 = leadF;
  const a1 = a0 + Math.round(revealF * ra);
  const b1 = a1 + Math.round(revealF * rb);
  const c1 = leadF + revealF;
  return {
    total,
    fps,
    lead: [0, leadF],
    antic: [a0, a1],
    action: [a1, b1],
    settle: [b1, c1],
    reveal: [a0, c1],
    hold: [c1, c1 + holdF],
    exit: [c1 + holdF, total],
  };
};

/** Position inside a span: frame at fraction f of [s, e]. */
export const at = (span: [number, number], f: number): number => span[0] + (span[1] - span[0]) * f;
export const len = (span: [number, number]): number => span[1] - span[0];

/**
 * Stagger with shrinking stagger, not stretching total: n items must all start
 * within `window` frames, each lasting `itemDur`. Returns start frames.
 * `accel` < 1 makes later items come faster (physical "deal" feel).
 */
export const staggerStarts = (n: number, start: number, window: number, accel = 1): number[] => {
  if (n <= 1) return [start];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(start + window * Math.pow(t, accel));
  }
  return out;
};
