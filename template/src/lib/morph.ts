import {getLength, getPointAtLength, getSubpaths} from '@remotion/paths';

/**
 * Shape morphing between two closed outlines with different structure
 * (an icon → a logo part). Both shapes are resampled to N points by arc
 * length, given the same winding, and the start point of the source is
 * rotated (cyclic shift) to the one that minimizes total travel. The morph
 * is then a per-point lerp — smooth, deterministic, any shape to any shape.
 *
 * Polygon targets keep their exact corners: points are distributed per edge,
 * so the last morph frame already has crisp vertices.
 */
export type Pt = {x: number; y: number};

const area = (pts: Pt[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
};

/** Outer contour only: the first subpath of `d`. */
export const outerContour = (d: string) => getSubpaths(d)[0];

const polygonVertices = (d: string): Pt[] | null => {
  if (/[CcSsQqTtAaHhVv]/.test(d)) return null;
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  if (nums.length < 6 || nums.length % 2) return null;
  const pts: Pt[] = [];
  for (let i = 0; i < nums.length; i += 2) pts.push({x: nums[i], y: nums[i + 1]});
  const f = pts[0];
  const l = pts[pts.length - 1];
  if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-6) pts.pop();
  return pts;
};

/** Resample a closed outline to n points evenly spaced along its length. */
export const resample = (d: string, n: number): Pt[] => {
  const poly = polygonVertices(d);
  if (poly) {
    // Per-edge distribution: every vertex is a sample → exact corners.
    const edges = poly.map((p, i) => {
      const q = poly[(i + 1) % poly.length];
      return {p, q, len: Math.hypot(q.x - p.x, q.y - p.y)};
    });
    const total = edges.reduce((s, e) => s + e.len, 0);
    const counts = edges.map((e) => Math.max(1, Math.round((e.len / total) * n)));
    let diff = n - counts.reduce((s, c) => s + c, 0);
    for (let i = 0; diff !== 0; i = (i + 1) % counts.length) {
      if (diff > 0) {
        counts[i]++;
        diff--;
      } else if (counts[i] > 1) {
        counts[i]--;
        diff++;
      }
    }
    const out: Pt[] = [];
    edges.forEach((e, i) => {
      for (let k = 0; k < counts[i]; k++) {
        const t = k / counts[i];
        out.push({x: e.p.x + (e.q.x - e.p.x) * t, y: e.p.y + (e.q.y - e.p.y) * t});
      }
    });
    return out;
  }
  const L = getLength(d);
  return Array.from({length: n}, (_, i) => getPointAtLength(d, (L * i) / n));
};

export const centroid = (pts: Pt[]): Pt => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});

/**
 * Index order that makes `src` correspond point-for-point with `dst`: same
 * winding, best start index. Shapes are compared around their own centroids,
 * so only shape (not position) drives the match. Apply the order to any
 * rigidly transformed copy of `src` (rotation/scale keep the correspondence).
 */
export const matchOrder = (src: Pt[], dst: Pt[]): number[] => {
  const n = src.length;
  const idx = Array.from({length: n}, (_, i) => i);
  const base = Math.sign(area(src)) !== Math.sign(area(dst)) ? [...idx].reverse() : idx;
  const cs = centroid(src);
  const cd = centroid(dst);
  let best = 0;
  let bestCost = Infinity;
  for (let shift = 0; shift < n; shift++) {
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const a = src[base[(i + shift) % n]];
      const b = dst[i];
      cost += (a.x - cs.x - (b.x - cd.x)) ** 2 + (a.y - cs.y - (b.y - cd.y)) ** 2;
      if (cost >= bestCost) break;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = shift;
    }
  }
  return Array.from({length: n}, (_, i) => base[(i + best) % n]);
};

export const reorder = (pts: Pt[], order: number[]) => order.map((i) => pts[i]);

export const toPath = (pts: Pt[]) =>
  'M' + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L') + ' Z';

export const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => ({x: p.x + (b[i].x - p.x) * t, y: p.y + (b[i].y - p.y) * t}));

/** Place a 100×100 icon: scale, rotate (deg) and move its center to (cx, cy). */
export const placeIcon = (pts: Pt[], cx: number, cy: number, size: number, rotDeg = 0): Pt[] => {
  const k = size / 100;
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return pts.map((p) => {
    const x = (p.x - 50) * k;
    const y = (p.y - 50) * k;
    return {x: cx + x * c - y * s, y: cy + x * s + y * c};
  });
};
