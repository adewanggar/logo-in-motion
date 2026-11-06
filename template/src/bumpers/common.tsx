import {useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, type Brand} from '../brand';
import {useLockupLayout} from '../components/Lockup';
import {makeTimeline, type Outro, type Timeline} from '../lib/timeline';
import {PERSONALITY, type MotionTokens} from '../lib/tokens';

export type BumperProps = {
  /** How the bumper ends: 'hold' ends on the still lockup (default). */
  outro: Outro;
  showTagline: boolean;
  /** Render without background (for alpha export: ProRes 4444 / WebM VP9). */
  transparent: boolean;
  grain: boolean;
  sfx: boolean;
  bgm: boolean;
  /** Override length in seconds (default: the pattern's own). */
  seconds?: number;
  /** Filled by calculateMetadata: named moments, read by QA scripts. */
  _markers?: Markers;
};

export const DEFAULT_PROPS: BumperProps = {
  outro: 'hold',
  showTagline: true,
  transparent: false,
  grain: true,
  sfx: false,
  bgm: false,
};

/** Named moments of a bumper — sound cues and QA frames pin to these. */
export type Markers = Record<string, number>;

export type BumperDef = {
  id: string;
  /** Short description: pattern + personality fit. */
  title: string;
  /** Default length in seconds. */
  seconds: number;
  /** Which personalities this pattern suits (documentation + guard). */
  fits: string[];
  component: React.FC<BumperProps>;
  markers: (tl: Timeline) => Markers;
  /** Timeline options for this pattern (hold share, lead, ratio). */
  timeline?: {holdShare?: number; leadSec?: number; ratio?: [number, number, number]};
};

export const useBumper = (props: BumperProps, opts?: BumperDef['timeline']) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const brand: Brand = BRAND;
  const tok: MotionTokens = PERSONALITY[brand.personality];
  const tl = makeTimeline(durationInFrames, fps, {outro: props.outro, ...opts});
  const L = useLockupLayout(brand);
  const sec = (s: number) => Math.round(s * fps);
  return {frame, fps, brand, tok, tl, L, sec};
};
