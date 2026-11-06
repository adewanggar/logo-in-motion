import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Lockup} from '../components/Lockup';
import {SoundTrack} from '../components/SoundTrack';
import {Stage} from '../components/Stage';
import {prog, tween} from '../lib/anim';
import {at, len, type Timeline} from '../lib/timeline';
import {cuesFor} from '../sound';
import {useBumper, type BumperDef, type BumperProps} from './common';

/**
 * SHEEN — premium reveal without deformation: the mark resolves out of a
 * soft blur, the wordmark is unveiled by a mask wipe, then ONE specular
 * sheen crosses the whole lockup, clipped exactly to the letter/mark shapes
 * (never a rectangle of light over the background). Slow camera push that
 * ends with the reveal. Personalities: premium, calm, trustworthy.
 */
const W = {
  mark: [0.0, 0.42] as const,
  word: [0.3, 0.68] as const,
  sheen: [0.62, 0.94] as const,
  tag: [0.74, 1] as const,
};

const markers = (tl: Timeline) => ({
  markIn: Math.round(at(tl.reveal, W.mark[0])),
  wordStart: Math.round(at(tl.reveal, W.word[0])),
  sheenStart: Math.round(at(tl.reveal, W.sheen[0])),
  sheenMid: Math.round(at(tl.reveal, (W.sheen[0] + W.sheen[1]) / 2)),
  tagIn: Math.round(at(tl.reveal, W.tag[0])),
  holdStart: tl.hold[0],
  end: tl.total - 1,
});

const Sheen: React.FC<BumperProps> = (props) => {
  const {frame, brand, tok, tl, L} = useBumper(props, DEF.timeline);
  const R = len(tl.reveal);
  const span = (w: readonly [number, number]) => [at(tl.reveal, w[0]), R * (w[1] - w[0])] as const;

  const [m0, mDur] = span(W.mark);
  const mp = prog(frame, m0, mDur, tok.enter);
  const mark = frame >= m0 + mDur ? undefined : {opacity: prog(frame, m0, mDur * 0.6), blur: 14 * (1 - mp), scale: 0.97 + 0.03 * mp};

  const [w0, wDur] = span(W.word);
  const wp = prog(frame, w0, wDur, tok.enter);
  const word = frame >= w0 + wDur ? undefined : {clip: [0, 100 * (1 - wp), 0, 0] as [number, number, number, number], tx: -L.fontSize * 0.08 * (1 - wp)};

  const [t0, tDur] = span(W.tag);
  const tag = frame >= t0 + tDur ? undefined : {opacity: prog(frame, t0, tDur, tok.enter)};

  // Light-up sweep. A white sheen is invisible on light ink, so the lockup
  // starts DIMMED (a bg-colored veil, clipped to the shapes) and one bright
  // band crosses it, leaving the lockup at full brightness behind it. When
  // the band has passed, both layers are gone → final frame = static logo.
  const [s0, sDur] = span(W.sheen);
  const sp = prog(frame, s0, sDur, [0.45, 0, 0.55, 1]);
  const sweeping = frame < s0 + sDur;
  const sheenOn = frame >= s0 && sweeping;
  const bandPos = -20 + 140 * sp;
  const band = `linear-gradient(105deg, transparent ${bandPos - 7}%, black ${bandPos}%, transparent ${bandPos + 7}%)`;
  const unlit = `linear-gradient(105deg, transparent ${bandPos}%, black ${bandPos + 8}%)`;
  const veil = brand.colors.bgDeep;

  const cam = tween(frame, tl.reveal[0], R, 0.955, 1, tok.narrative);

  return (
    <Stage brand={brand} tl={tl} outro={props.outro} transparent={props.transparent} grain={props.grain} camScale={frame >= tl.reveal[1] ? 1 : cam}>
      <Lockup brand={brand} layout={L} mark={mark} word={word} tag={tag} showTagline={props.showTagline} />
      {sweeping ? (
        <AbsoluteFill style={{WebkitMaskImage: unlit, maskImage: unlit, opacity: 0.42}}>
          <Lockup
            brand={brand}
            layout={L}
            mark={mark}
            word={word}
            partStyler={() => ({fill: veil, stroke: veil})}
            letterStyler={() => ({color: veil})}
            showTagline={false}
          />
        </AbsoluteFill>
      ) : null}
      {sheenOn ? (
        <AbsoluteFill style={{WebkitMaskImage: band, maskImage: band, opacity: 0.9}}>
          <Lockup
            brand={brand}
            layout={L}
            word={word}
            partStyler={() => ({fill: '#ffffff', stroke: '#ffffff'})}
            letterStyler={() => ({color: '#ffffff'})}
            showTagline={false}
          />
        </AbsoluteFill>
      ) : null}
      <SoundTrack cues={cuesFor('Sheen', markers(tl))} enableSfx={props.sfx} enableBgm={props.bgm} />
    </Stage>
  );
};

export const DEF: BumperDef = {
  id: 'Sheen',
  title: 'Blur-resolve + mask wipe + one shape-clipped specular sheen',
  seconds: 6,
  fits: ['premium', 'calm', 'trustworthy'],
  component: Sheen,
  markers,
  timeline: {holdShare: 0.26, leadSec: 0.3},
};
