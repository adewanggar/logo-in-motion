import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Brand} from '../brand';
import {prog} from '../lib/anim';
import type {Outro, Timeline} from '../lib/timeline';
import {UNIVERSAL} from '../lib/tokens';

/**
 * The bumper stage: background, optional grain, camera wrapper and the exit.
 * Camera (push-in / drift) lives here so it affects the lockup as one rigid
 * layer — individual parts never fake a camera move.
 */
export const Stage: React.FC<{
  brand: Brand;
  tl: Timeline;
  outro: Outro;
  transparent?: boolean;
  /** Background brightness lift 0..1 (e.g. bloom on impact). */
  light?: number;
  /** Camera scale for the content layer (1 = none). */
  camScale?: number;
  camX?: number;
  camY?: number;
  /** Camera shake offset in px (use sparingly: one impact per bumper). */
  shake?: {x: number; y: number};
  grain?: boolean;
  children: React.ReactNode;
  /** Layer drawn behind content but inside the camera (rings, particles). */
  back?: React.ReactNode;
  /** Layer drawn above content, outside the camera (flashes, vignettes). */
  front?: React.ReactNode;
}> = ({brand, tl, outro, transparent, light = 0, camScale = 1, camX = 0, camY = 0, shake, grain = true, children, back, front}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const e = prog(frame, tl.exit[0], tl.exit[1] - tl.exit[0], UNIVERSAL.exit);

  let exitOpacity = 1;
  let exitTransform = '';
  let exitClip: string | undefined;
  if (outro === 'fade') exitOpacity = 1 - e;
  if (outro === 'lift') {
    exitOpacity = 1 - e;
    exitTransform = `translateY(${-H * 0.04 * e}px) scale(${1 - 0.06 * e})`;
  }
  if (outro === 'iris') {
    const r = Math.hypot(W, H) * 0.6 * (1 - e);
    exitClip = `circle(${r}px at 50% 50%)`;
  }

  const sx = shake?.x ?? 0;
  const sy = shake?.y ?? 0;

  return (
    <AbsoluteFill style={{backgroundColor: transparent ? 'transparent' : brand.colors.bgDeep}}>
      <AbsoluteFill style={{clipPath: exitClip, opacity: outro === 'iris' ? 1 : exitOpacity}}>
        {!transparent ? (
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 75% 70% at 50% 48%, ${brand.colors.bg} 0%, ${brand.colors.bgDeep} 100%)`,
            }}
          />
        ) : null}
        {!transparent && light > 0 ? (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 50%, ${brand.colors.accent}55 0%, transparent 55%)`,
              opacity: Math.min(1, light),
            }}
          />
        ) : null}
        <AbsoluteFill
          style={{
            transform: `translate(${camX + sx}px, ${camY + sy}px) scale(${camScale}) ${exitTransform}`,
            transformOrigin: '50% 50%',
          }}
        >
          {back}
          {children}
        </AbsoluteFill>
        {!transparent && grain ? <Grain frame={frame} /> : null}
        {front}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Subtle film grain. feTurbulence is deterministic for a given seed; we step
 * the seed every 2 frames so the grain lives without flickering at 30fps.
 */
const Grain: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.09, pointerEvents: 'none'}}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(frame / 2)} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);
