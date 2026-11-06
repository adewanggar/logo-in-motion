import React from 'react';
import {Lockup} from '../components/Lockup';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {ease, prog, tween} from '../lib/anim';
import {seeded} from '../lib/rand';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade} from './moves';

/**
 * CONVERGE — seeded particles stream in from off-frame on curved paths,
 * arriving faster and faster (accelerating stagger), and the mark condenses
 * out of their arrival (opacity + clearing blur tracks how many have
 * landed). Particles die on arrival, so the hold is clean. Wordmark letters
 * blur-slide in. Tech, data, AI, network brands. Fully deterministic.
 */
const W = {
  stream: [0.0, 0.5] as const,
  condense: [0.22, 0.56] as const,
  letters: 0.55,
  tag: [0.8, 1] as const,
};
const COUNT = 160;

const markers = (tl: Timeline) => ({
  streamStart: Math.round(at(tl.reveal, W.stream[0])),
  streamMid: Math.round(at(tl.reveal, (W.stream[0] + W.stream[1]) * 0.55)),
  condensed: Math.round(at(tl.reveal, W.condense[1])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const Converge: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const R = len(tl.reveal);
  const st0 = at(tl.reveal, W.stream[0]);
  const stLen = R * (W.stream[1] - W.stream[0]);
  const travel = Math.round(fps * 0.75);

  const cx = L.markX;
  const cy = L.markY;
  const rnd = seeded(7);
  const far = Math.hypot(L.W, L.H) * 0.6;
  const parts = Array.from({length: COUNT}, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const ta = rnd() * Math.PI * 2;
    const tr = Math.sqrt(rnd()) * L.markSize * 0.42;
    const t = i / (COUNT - 1);
    const start = st0 + (stLen - travel) * Math.pow(t, 0.6); // accelerating arrivals
    return {
      sx: cx + Math.cos(a) * far,
      sy: cy + Math.sin(a) * far,
      tx: cx + Math.cos(ta) * tr,
      ty: cy + Math.sin(ta) * tr,
      curl: (rnd() - 0.5) * 0.9,
      size: (3 + rnd() * 5) * (Math.min(L.W, L.H) / 1080),
      accent: rnd() < 0.3,
      start,
    };
  });

  const c0 = at(tl.reveal, W.condense[0]);
  const cDur = R * (W.condense[1] - W.condense[0]);
  const cp = prog(frame, c0, cDur, tok.enter);
  const mark = frame >= c0 + cDur ? undefined : {opacity: prog(frame, c0, cDur * 0.7), blur: 16 * (1 - cp), scale: 1.06 - 0.06 * cp};

  const l0 = at(tl.reveal, W.letters);
  const letterStyler = (i: number, n: number) => cascade(frame, i, n, l0, fps, tok, 'blur', L.fontSize);

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter), ty: tween(frame, t0, tDur, L.tagSize * 0.6, 0, tok.enter)};

  const curve = ease(tok.narrative);
  const dots = parts.map((p, i) => {
    if (frame < p.start || frame > p.start + travel) return null;
    const u = (frame - p.start) / travel;
    const e = curve(u);
    const mx = p.sx + (p.tx - p.sx) * e;
    const my = p.sy + (p.ty - p.sy) * e;
    // perpendicular curl, zero at both ends
    const nx = -(p.ty - p.sy);
    const ny = p.tx - p.sx;
    const bow = Math.sin(Math.PI * e) * p.curl * 0.35;
    const x = mx + nx * bow;
    const y = my + ny * bow;
    const op = Math.min(1, u * 4) * (1 - Math.max(0, (u - 0.8) / 0.2));
    return <circle key={i} cx={x} cy={y} r={p.size * (1 - 0.45 * e)} fill={p.accent ? brand.colors.accent : brand.colors.ink} opacity={op} />;
  });

  return (
    <Stage
      brand={brand}
      tl={tl}
      outro={props.outro}
      transparent={props.transparent}
      grain={props.grain}
      back={
        <svg width={L.W} height={L.H} style={{position: 'absolute', left: 0, top: 0}}>
          {dots}
        </svg>
      }
    >
      <Lockup brand={brand} layout={L} mark={mark} letterStyler={letterStyler} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('Converge', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'Converge',
  title: 'Seeded particles stream in, the mark condenses from their arrival',
  seconds: 5,
  fits: ['energetic', 'trustworthy', 'friendly', 'calm'],
  component: Converge,
  markers,
  timeline: {holdShare: 0.28, leadSec: 0.05},
};
