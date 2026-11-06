import React from 'react';
import {Lockup} from '../components/Lockup';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {keys, prog, tween} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade, slide} from './moves';

/**
 * POP LOCKUP — an accent seed appears at center and coils (anticipation),
 * the mark pops out of it with overshoot and clearing blur, glows once,
 * then slides to its lockup slot while the wordmark letters slide out from
 * behind it. Textbook 20:50:30. Default splash gesture for compact marks.
 */
const W = {
  seed: [0.0, 0.16] as const,
  pop: [0.14, 0.42] as const,
  shift: [0.46, 0.72] as const,
  letters: 0.58,
  tag: [0.8, 1] as const,
};

const markers = (tl: Timeline) => ({
  seedIn: Math.round(at(tl.reveal, W.seed[0])),
  popPeak: Math.round(at(tl.reveal, W.pop[0] + (W.pop[1] - W.pop[0]) * 0.6)),
  shiftStart: Math.round(at(tl.reveal, W.shift[0])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const PopLockup: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const R = len(tl.reveal);
  const s0 = at(tl.reveal, W.seed[0]);
  const sDur = R * (W.seed[1] - W.seed[0]);
  const p0 = at(tl.reveal, W.pop[0]);
  const pDur = R * (W.pop[1] - W.pop[0]);
  const land = p0 + pDur * 0.6;

  // Seed: grows, then coils smaller right before the pop (anticipation).
  const seedR = keys(frame, [s0, s0 + sDur * 0.6, p0 + 2], [0, L.markSize * 0.09, L.markSize * 0.055], [tok.enter, [0.4, 0, 1, 1]]);
  const seedOp = frame < p0 ? prog(frame, s0, sDur * 0.3) : 1 - prog(frame, p0, pDur * 0.25);

  // Mark pop
  const over = Math.max(tok.overshoot, 1.04);
  const scale = keys(frame, [p0, land, p0 + pDur], [0.3, over, 1], [tok.enter, tok.settle]);
  const popDone = frame >= p0 + pDur;
  const shift = slide(frame, at(tl.reveal, W.shift[0]), R * (W.shift[1] - W.shift[0]), L.markToCenter, tok.narrative);
  const shiftDone = frame >= at(tl.reveal, W.shift[1]);
  const mark =
    popDone && shiftDone
      ? undefined
      : {
          opacity: frame < p0 ? 0 : prog(frame, p0, pDur * 0.3),
          scale: popDone ? 1 : scale,
          blur: popDone ? 0 : 10 * (1 - prog(frame, p0, pDur * 0.6)),
          ...shift,
        };

  // Glow bloom (secondary action, personality-gated): peaks at landing.
  const glow = tok.secondary > 0 ? keys(frame, [p0, land, land + fps * 0.5], [0, 0.35 * tok.secondary, 0]) : 0;

  const l0 = at(tl.reveal, W.letters);
  const style = L.orientation === 'stacked' ? 'rise' : 'slide';
  const letterStyler = (i: number, n: number) => cascade(frame, i, n, l0, fps, tok, style, L.fontSize);

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  const seedX = L.markX + L.markToCenter.dx;
  const seedY = L.markY + L.markToCenter.dy;

  return (
    <Stage
      brand={brand}
      tl={tl}
      outro={props.outro}
      transparent={props.transparent}
      grain={props.grain}
      light={glow}
      back={
        seedOp > 0 && frame < p0 + pDur * 0.3 ? (
          <div
            style={{
              position: 'absolute',
              left: seedX - seedR,
              top: seedY - seedR,
              width: seedR * 2,
              height: seedR * 2,
              borderRadius: '50%',
              background: brand.colors.accent,
              opacity: seedOp,
            }}
          />
        ) : null
      }
    >
      <Lockup brand={brand} layout={L} mark={mark} letterStyler={letterStyler} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('PopLockup', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'PopLockup',
  title: 'Seed coil → mark pops with overshoot → slides to lockup, letters slide out',
  seconds: 5,
  fits: ['friendly', 'playful', 'energetic', 'trustworthy'],
  component: PopLockup,
  markers,
  timeline: {holdShare: 0.28},
};
