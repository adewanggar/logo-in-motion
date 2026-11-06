import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Lockup} from '../components/Lockup';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {damped, keys, prog} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {UNIVERSAL} from '../lib/tokens';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';
import {cascade, shockwave} from './moves';

/**
 * SLAM — the mark hovers huge and out of focus in front of the lens (coil),
 * then SLAMS onto the stage on an ease-IN curve (ease-out reads as "placed",
 * ease-in reads as "hit"). Impact frame: shockwave + one damped shake +
 * 2-frame flash, all on the same frame. Letters slam in right after.
 * One impact per bumper. Personalities: energetic (sports, gaming, media).
 */
const W = {
  hover: [0.0, 0.3] as const,
  slam: [0.3, 0.4] as const,
  letters: 0.46,
  tag: [0.8, 1] as const,
};

const markers = (tl: Timeline) => ({
  hoverIn: Math.round(at(tl.reveal, W.hover[0])),
  impact: Math.round(at(tl.reveal, W.slam[1])),
  lettersStart: Math.round(at(tl.reveal, W.letters)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const Slam: React.FC<BumperProps> = (props) => {
  const {frame, fps, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const R = len(tl.reveal);
  const h0 = at(tl.reveal, W.hover[0]);
  const s0 = at(tl.reveal, W.slam[0]);
  const impact = Math.round(at(tl.reveal, W.slam[1]));

  let mark: {opacity: number; scale: number; blur: number} | undefined;
  if (frame < s0) {
    // Hover in front of the lens: big, soft, half transparent, slowly coiling.
    mark = {opacity: 0.35 * prog(frame, h0, fps * 0.2), scale: 2.5 + 0.12 * prog(frame, h0, s0 - h0, tok.narrative), blur: 14};
  } else if (frame < impact) {
    const k = prog(frame, s0, impact - s0, UNIVERSAL.inQuad);
    mark = {opacity: 0.35 + 0.65 * k, scale: 2.62 - 1.655 * k, blur: 14 * (1 - k)};
  } else if (frame < impact + fps) {
    mark = {opacity: 1, scale: 0.965 + 0.035 * prog(frame, impact, fps * 0.25, tok.settle) + 0.02 * damped(frame - impact, 0.1, 0.22), blur: 0};
  }

  // Impact kit — same frame: shockwave, shake, flash, light.
  const wave = shockwave(frame, impact, Math.round(fps * 0.55));
  const shakeAmp = L.H * 0.012 * Math.exp(-0.45 * Math.max(0, frame - impact));
  const shake = frame >= impact && frame < impact + 10 ? {x: shakeAmp * 0.4 * Math.sin(frame * 2.1), y: shakeAmp * Math.sin(frame * 3.3)} : undefined;
  const flash = frame >= impact && frame < impact + 3 ? [0.4, 0.2, 0.08][frame - impact] : 0;
  const light = keys(frame, [impact - 1, impact + 1, impact + fps * 0.7], [0, 0.7, 0]);

  const l0 = at(tl.reveal, W.letters);
  const letterStyler = (i: number, n: number) => cascade(frame, i, n, l0, fps, tok, 'slam', L.fontSize, 0.45);

  const t0 = at(tl.reveal, W.tag[0]);
  const tDur = R * (W.tag[1] - W.tag[0]);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter)};

  const cx = L.markX;
  const cy = L.markY;
  return (
    <Stage
      brand={brand}
      tl={tl}
      outro={props.outro}
      transparent={props.transparent}
      grain={props.grain}
      light={light}
      shake={shake}
      back={
        wave ? (
          <svg width={L.W} height={L.H} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={cx} cy={cy} r={L.markSize * (0.5 + 3.2 * wave.grow)} fill="none" stroke={brand.colors.accent} strokeWidth={L.markSize * 0.06 * wave.fade + 1} opacity={wave.fade} />
          </svg>
        ) : null
      }
      front={flash > 0 && !props.transparent ? <AbsoluteFill style={{background: '#fff', opacity: flash}} /> : null}
    >
      <Lockup brand={brand} layout={L} mark={mark} letterStyler={letterStyler} tag={tag} showTagline={props.showTagline} />
      <SoundTrack cues={cuesFor('Slam', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'Slam',
  title: 'Lens hover → ease-in slam → impact kit, letters slam after',
  seconds: 4,
  fits: ['energetic', 'playful'],
  component: Slam,
  markers,
  timeline: {holdShare: 0.3, leadSec: 0.1},
};
