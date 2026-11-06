import React from 'react';
import {Lockup} from '../components/Lockup';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {keys, prog, tween} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade, shockwave, slide} from './moves';

/**
 * COLLAPSE — a frame-filling accent ring collapses onto the mark with a
 * braking overshoot, hands over to the mark on landing (crossfade while the
 * ring is already at final size), releases one shockwave, then the lockup
 * resolves: mark slides to its slot, letters slide in, tagline last.
 * Energy goes from "whole screen" to "one stamp". End cards, outros.
 */
const W = {
  collapse: [0.0, 0.34] as const,
  handover: [0.27, 0.4] as const,
  shift: [0.48, 0.7] as const,
  letters: 0.6,
  tag: [0.82, 1] as const,
};

const markers = (tl: Timeline) => ({
  collapseStart: Math.round(at(tl.reveal, W.collapse[0])),
  land: Math.round(at(tl.reveal, W.collapse[1])),
  shiftStart: Math.round(at(tl.reveal, W.shift[0])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const Collapse: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const R = len(tl.reveal);
  const c0 = at(tl.reveal, W.collapse[0]);
  const c1 = at(tl.reveal, W.collapse[1]);
  const h0 = at(tl.reveal, W.handover[0]);
  const h1 = at(tl.reveal, W.handover[1]);

  // Ring collapse: 6× → 1× on the narrative curve, then a +6% brake bump (sin envelope).
  const base = tween(frame, c0, c1 - c0, 6, 1, tok.narrative);
  const brake = frame > c1 - 3 && frame < c1 + fps * 0.3 ? 0.06 * Math.sin(Math.PI * ((frame - (c1 - 3)) / (fps * 0.3 + 3))) : 0;
  const ringScale = base + brake;
  const ringOp = frame < c0 ? 0 : Math.min(prog(frame, c0, fps * 0.15), 1 - prog(frame, h0, h1 - h0));
  const ringR = L.markSize * 0.56;
  const cx = L.markX + L.markToCenter.dx;
  const cy = L.markY + L.markToCenter.dy;

  // Mark takes over at the brake, already at final size.
  const handDone = frame >= h1;
  const shift = slide(frame, at(tl.reveal, W.shift[0]), R * (W.shift[1] - W.shift[0]), L.markToCenter, tok.narrative);
  const shiftDone = frame >= at(tl.reveal, W.shift[1]);
  const mark =
    handDone && shiftDone
      ? undefined
      : {opacity: prog(frame, h0, h1 - h0), scale: handDone ? 1 : ringScale, ...shift};

  const wave = shockwave(frame, c1, Math.round(fps * 0.6));
  const light = keys(frame, [c1 - 2, c1 + 2, c1 + fps * 0.6], [0, 0.5, 0]);

  const l0 = at(tl.reveal, W.letters);
  const style = L.orientation === 'stacked' ? 'rise' : 'slide';
  const letterStyler = (i: number, n: number) => cascade(frame, i, n, l0, fps, tok, style, L.fontSize);

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  const strokeW = Math.max(3, L.markSize * 0.05);
  return (
    <Stage
      brand={brand}
      tl={tl}
      outro={props.outro}
      transparent={props.transparent}
      grain={props.grain}
      light={light}
      back={
        <svg width={L.W} height={L.H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {ringOp > 0 ? (
            <circle cx={cx} cy={cy} r={ringR * ringScale} fill="none" stroke={brand.colors.accent} strokeWidth={strokeW * Math.sqrt(ringScale)} opacity={ringOp} />
          ) : null}
          {wave ? (
            <circle cx={cx} cy={cy} r={ringR * (1 + 2.6 * wave.grow)} fill="none" stroke={brand.colors.ink} strokeWidth={strokeW * 0.6 * wave.fade + 0.5} opacity={0.5 * wave.fade} />
          ) : null}
        </svg>
      }
    >
      <Lockup brand={brand} layout={L} mark={mark} letterStyler={letterStyler} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('Collapse', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'Collapse',
  title: 'Frame-filling ring collapses into the mark, shockwave, lockup resolves',
  seconds: 5,
  fits: ['energetic', 'trustworthy', 'friendly'],
  component: Collapse,
  markers,
  timeline: {holdShare: 0.28, leadSec: 0.1},
};
