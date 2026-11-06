import React from 'react';
import {Lockup} from '../components/Lockup';
import {sortedParts} from '../components/LogoMark';
import {Stage} from '../components/Stage';
import {prog, tween} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {SoundTrack} from '../components/SoundTrack';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {pop} from './moves';

/**
 * INK DRAW — stroke parts are drawn on in writing order, fill parts pop in
 * after the pen passes, the wordmark is wiped on in reading direction.
 * Shape 10:70:20 (drawing IS the action). Best for line marks, monograms,
 * signatures, circular C-marks. Personalities: premium, trustworthy, calm.
 */
const W = {
  draw: [0.04, 0.56] as const,
  fills: 0.46,
  word: [0.5, 0.84] as const,
  tag: [0.76, 1] as const,
};

const markers = (tl: Timeline) => ({
  drawStart: Math.round(at(tl.reveal, W.draw[0])),
  drawEnd: Math.round(at(tl.reveal, W.draw[1])),
  accentLand: Math.round(at(tl.reveal, W.fills + 0.08)),
  wordStart: Math.round(at(tl.reveal, W.word[0])),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const InkDraw: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const parts = sortedParts();
  const drawables = parts.filter((p) => p.drawable);
  const fills = parts.filter((p) => !p.drawable);
  const R = len(tl.reveal);

  // Draw windows: sequential with 25% overlap, in part order.
  const d0 = at(tl.reveal, W.draw[0]);
  const dLen = R * (W.draw[1] - W.draw[0]);
  const per = drawables.length ? dLen / (1 + 0.75 * (drawables.length - 1)) : 0;

  const partDur = Math.round(fps * tok.partSec);
  const fill0 = at(tl.reveal, W.fills);

  const partStyler = (part: (typeof parts)[number]) => {
    const di = drawables.indexOf(part);
    if (di >= 0) {
      const s = d0 + di * per * 0.75;
      if (frame >= s + per) return {};
      return {draw: prog(frame, s, per, tok.narrative)};
    }
    const fi = fills.indexOf(part);
    return pop(frame, fill0 + fi * partDur * tok.staggerRatio * 2, partDur, tok);
  };

  // Wordmark: mask wipe in reading direction + small drift that settles with the wipe.
  const w0 = at(tl.reveal, W.word[0]);
  const wDur = R * (W.word[1] - W.word[0]);
  const wp = prog(frame, w0, wDur, tok.enter);
  const word =
    frame >= w0 + wDur ? undefined : {clip: [0, 100 * (1 - wp), 0, 0] as [number, number, number, number], tx: -L.fontSize * 0.12 * (1 - wp)};

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  // Camera: slow push that finishes exactly when the reveal does — the hold is still.
  const cam = tween(frame, tl.reveal[0], R, 0.965, 1, tok.narrative);

  const m = markers(tl);
  return (
    <Stage brand={brand} tl={tl} outro={props.outro} transparent={props.transparent} grain={props.grain} camScale={frame >= tl.reveal[1] ? 1 : cam}>
      <Lockup brand={brand} layout={L} partStyler={partStyler} word={word} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('InkDraw', m)} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'InkDraw',
  title: 'Draw-on of stroke parts + mask-wiped wordmark',
  seconds: 5,
  fits: ['premium', 'trustworthy', 'calm', 'friendly'],
  component: InkDraw,
  markers,
  timeline: {holdShare: 0.28, leadSec: 0.2},
};
