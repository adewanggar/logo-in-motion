import React from 'react';
import {Lockup} from '../components/Lockup';
import {partOffset, sortedParts} from '../components/LogoMark';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {LOGO} from '../logo/parts';
import {keys, prog, tween} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade} from './moves';

/**
 * ASSEMBLE — parts fly in on arcs from outside the mark and click into place
 * following the drag hierarchy (container → primary → secondary → accent),
 * then the wordmark letters rise in a capped cascade.
 * Shape 20:50:30. Best for multi-part marks. Personalities: friendly,
 * playful, energetic.
 */
const W = {
  parts: [0.0, 0.55] as const,
  letters: 0.5,
  tag: [0.8, 1] as const,
};

const markers = (tl: Timeline) => ({
  firstPart: Math.round(at(tl.reveal, 0.12)),
  lastPartLand: Math.round(at(tl.reveal, W.parts[1])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const Assemble: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const parts = sortedParts();
  const R = len(tl.reveal);
  const [, , vbW, vbH] = LOGO.viewBox;
  const reach = Math.max(vbW, vbH) * 0.55;

  // Parts share the parts window; later parts start later (drag hierarchy) and travel less.
  const pWin = R * (W.parts[1] - W.parts[0]);
  const n = parts.length;
  const pDur = Math.max(Math.round(fps * tok.partSec), Math.round(pWin * 0.55));
  const stagger = n > 1 ? (pWin - pDur) / (n - 1) : 0;

  const partStyler = (part: (typeof parts)[number]) => {
    const i = parts.indexOf(part);
    const s = at(tl.reveal, W.parts[0]) + i * stagger;
    if (frame >= s + pDur + 2) return {};
    if (frame < s) return {opacity: 0};
    const {dx, dy} = partOffset(part);
    const mag = Math.hypot(dx, dy);
    // Outward direction; centered parts come from below.
    const ux = mag > 1 ? dx / mag : 0;
    const uy = mag > 1 ? dy / mag : 1;
    const dist = reach * (1 - 0.25 * (i / Math.max(1, n - 1)));
    const p = keys(frame, [s, s + pDur * 0.7, s + pDur], [0, tok.overshoot > 1 ? 1.03 : 1, 1], [tok.enter, tok.settle]);
    const travel = 1 - p;
    // Arc: perpendicular bow peaking mid-flight (arcs, not straight lines).
    const bow = Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * dist * 0.22;
    return {
      opacity: prog(frame, s, pDur * 0.3),
      tx: ux * dist * travel + -uy * bow * travel,
      ty: uy * dist * travel + ux * bow * travel,
      rotate: (i % 2 ? -1 : 1) * 14 * travel,
      blur: tok.blur * 0.5 * Math.max(0, travel - 0.2),
    };
  };

  const l0 = at(tl.reveal, W.letters);
  const letterStyler = (i: number, nn: number) => cascade(frame, i, nn, l0, fps, tok, 'rise', L.fontSize);

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  return (
    <Stage brand={brand} tl={tl} outro={props.outro} transparent={props.transparent} grain={props.grain}>
      <Lockup brand={brand} layout={L} partStyler={partStyler} letterStyler={letterStyler} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('Assemble', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'Assemble',
  title: 'Parts fly in on arcs, letters rise in a cascade',
  seconds: 5,
  fits: ['friendly', 'playful', 'energetic', 'trustworthy'],
  component: Assemble,
  markers,
  timeline: {holdShare: 0.28},
};
