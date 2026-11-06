import React, {useMemo} from 'react';
import {Lockup} from '../components/Lockup';
import {sortedParts} from '../components/LogoMark';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {ICONS} from '../logo/icons';
import {keys, prog, tween} from '../lib/anim';
import {centroid, lerpPts, matchOrder, outerContour, placeIcon, reorder, resample, toPath, type Pt} from '../lib/morph';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade, slide} from './moves';

/**
 * ICON MORPH — "what we do becomes who we are". A ring of brand-relevant
 * icons (src/logo/icons.ts) pops in, upright, around the mark's center.
 * The ring winds back (anticipation), then spins into place while every
 * icon morphs smoothly into its logo part. On landing the exact parts take
 * over (crossfade hides the hand-over), the mark slides to its lockup slot
 * and the wordmark rises.
 *
 * Best for marks made of several similar parts arranged around a center
 * (petals, blades, segments). Parts must be <path>s; icons must be single
 * closed contours. Personalities: playful, friendly, energetic.
 */
const N = 160; // samples per outline
const SPIN = 120; // degrees the ring travels while morphing
const W = {
  icons: [0.0, 0.24] as const,
  windup: [0.24, 0.34] as const,
  spin: [0.34, 0.64] as const,
  morph: [0.37, 0.64] as const,
  settle: [0.64, 0.72] as const,
  handover: [0.66, 0.72] as const,
  shift: [0.7, 0.86] as const,
  letters: 0.8,
  tag: [0.88, 1] as const,
};

const markers = (tl: Timeline) => ({
  iconsIn: Math.round(at(tl.reveal, W.icons[0])),
  windup: Math.round(at(tl.reveal, W.windup[0])),
  morphStart: Math.round(at(tl.reveal, W.morph[0])),
  land: Math.round(at(tl.reveal, W.spin[1])),
  shiftStart: Math.round(at(tl.reveal, W.shift[0])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

type Actor = {id: string; fill: string; target: Pt[]; icon: Pt[]; start: Pt; size: number};

const useActors = () =>
  useMemo(() => {
    // Only FILLED path parts can morph; strokes and primitives simply fade in at the hand-over.
    const parts = sortedParts().filter((p) => p.tag === 'path' && p.attrs.fill !== undefined && p.attrs.fill !== 'none');
    const targets = parts.map((p) => resample(outerContour(String(p.attrs.d)), N));
    const cents = targets.map(centroid);
    const C = cents.length ? centroid(cents) : {x: 0, y: 0}; // ring center = mean of part centers
    const actors: Actor[] = parts.map((p, i) => {
      const T = targets[i];
      const xs = T.map((q) => q.x);
      const ys = T.map((q) => q.y);
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.9;
      // Icons start on a wider ring so the spin also contracts inward.
      const start = {x: C.x + (cents[i].x - C.x) * 1.35, y: C.y + (cents[i].y - C.y) * 1.35};
      const raw = resample(ICONS[i % ICONS.length].d, N);
      // Match point order at the START pose (upright on screen = −SPIN in ring frame).
      const order = matchOrder(placeIcon(raw, start.x, start.y, size, -SPIN), T);
      return {id: p.id, fill: String(p.attrs.fill ?? '#000'), target: T, icon: reorder(raw, order), start, size};
    });
    return {actors, C, morphIds: new Set(parts.map((p) => p.id))};
  }, []);

const IconMorph: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const {actors, C, morphIds} = useActors();
  const R = len(tl.reveal);
  const f = (x: number) => at(tl.reveal, x);

  // Ring angle: rest at +SPIN while icons arrive, wind back a little, spin home, tiny overshoot.
  const A = keys(
    frame,
    [f(W.windup[0]), f(W.windup[1]), f(W.spin[1]), f(W.settle[1])],
    [SPIN, SPIN + 12, -4, 0],
    [[0.45, 0, 0.55, 1], tok.narrative, [0.4, 0, 0.2, 1]],
  );
  const m = prog(frame, f(W.morph[0]), R * (W.morph[1] - W.morph[0]), tok.narrative);
  const hand = prog(frame, f(W.handover[0]), R * (W.handover[1] - W.handover[0]));
  const handDone = frame >= f(W.handover[1]);

  // Icons pop in one by one around the ring.
  const popDur = Math.max(8, Math.round(fps * tok.partSec));
  const popWin = R * (W.icons[1] - W.icons[0]) - popDur;
  const popScale = (i: number) => {
    const s = f(W.icons[0]) + (actors.length > 1 ? (popWin * i) / (actors.length - 1) : 0);
    const over = Math.max(1.06, tok.overshoot);
    return keys(frame, [s, s + popDur * 0.6, s + popDur], [0, over, 1], [tok.enter, tok.settle]);
  };

  const overlay = handDone ? null : (
    <g transform={`rotate(${A} ${C.x} ${C.y})`} opacity={1 - hand}>
      {actors.map((a, i) => {
        const sc = popScale(i);
        if (sc <= 0.001) return null;
        const iconPts = placeIcon(a.icon, a.start.x, a.start.y, a.size * sc, -A);
        const pts = m > 0 ? lerpPts(iconPts, a.target, m) : iconPts;
        return <path key={a.id} d={toPath(pts)} fill={a.fill} />;
      })}
    </g>
  );

  // Hand-over without a transparency dip: the exact parts switch on fully UNDER the
  // morph layer, then the opaque morph layer fades out on top (revealing notches/holes).
  const handStarted = frame >= f(W.handover[0]);
  const partStyler = (part: {id: string}) => {
    if (handDone) return {};
    return {opacity: morphIds.has(part.id) ? (handStarted ? 1 : 0) : prog(frame, f(W.handover[0]), R * 0.06)};
  };

  const shift = slide(frame, f(W.shift[0]), R * (W.shift[1] - W.shift[0]), L.markToCenter, tok.narrative);
  // Icons are shown big (staging: the icons ARE the story at first), the mark shrinks to size while spinning.
  const zoom = keys(frame, [f(W.spin[0]), f(W.spin[1])], [1.7, 1], [tok.narrative]);
  const mark = frame >= f(W.shift[1]) ? undefined : {...shift, scale: zoom};
  const light = tok.secondary > 0 ? keys(frame, [f(W.spin[1]) - 3, f(W.spin[1]) + 2, f(W.spin[1]) + fps * 0.6], [0, 0.22, 0]) : 0;

  const letterStyler = (i: number, n: number) => cascade(frame, i, n, f(W.letters), fps, tok, 'rise', L.fontSize);
  const t0 = f(W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  return (
    <Stage brand={brand} tl={tl} outro={props.outro} transparent={props.transparent} grain={props.grain} light={light}>
      <Lockup
        brand={brand}
        layout={L}
        mark={mark}
        partStyler={partStyler}
        markOverlay={overlay}
        letterStyler={letterStyler}
        tag={tag}
        showTagline={props.showTagline}
      />
      <SoundTrack cues={cuesFor('IconMorph', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'IconMorph',
  title: 'Ring of brand icons spins in and morphs into the logo parts',
  seconds: 6,
  fits: ['playful', 'friendly', 'energetic'],
  component: IconMorph,
  markers,
  timeline: {holdShare: 0.26, leadSec: 0.15},
};
