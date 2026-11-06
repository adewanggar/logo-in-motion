import React from 'react';
import {useVideoConfig} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import type {Brand} from '../brand';
import {LOGO} from '../logo/parts';
import {LogoMark, type PartStyler} from './LogoMark';

export type LockupLayout = {
  orientation: 'horizontal' | 'stacked' | 'mark-only' | 'wordmark-only';
  W: number;
  H: number;
  /** Mark render height (px) and final center. */
  markSize: number;
  markW: number;
  markX: number;
  markY: number;
  /** Wordmark final box. */
  fontSize: number;
  wordX: number; // left edge
  wordY: number; // vertical center
  wordW: number;
  wordH: number;
  letters: {char: string; x: number; w: number}[];
  /** Tagline final center + size. */
  tagSize: number;
  tagX: number;
  tagY: number;
  /** Offset that moves the mark from its lockup slot to the frame center. */
  markToCenter: {dx: number; dy: number};
  /** Offset that moves the wordmark block from its slot to the frame center. */
  wordToCenter: {dx: number; dy: number};
};

const caseOf = (brand: Brand, s: string) =>
  brand.font.transform === 'uppercase'
    ? s.toUpperCase()
    : brand.font.transform === 'lowercase'
      ? s.toLowerCase()
      : s;

/**
 * Computes the FINAL lockup geometry for the current frame size. Every bumper
 * animates toward these exact numbers, so the last frame is the static lockup
 * by construction. Text sizes respect readability floors: tagline ≥ 2.8% of
 * frame height, wordmark ≥ 5% of frame height.
 */
export const useLockupLayout = (brand: Brand): LockupLayout => {
  const {width: W, height: H} = useVideoConfig();
  const unit = Math.min(W, H);
  const [, , vbW, vbH] = LOGO.viewBox;
  const aspect = vbW / vbH;
  const orientation =
    brand.lockup === 'auto' ? (H > W * 1.1 ? 'stacked' : 'horizontal') : brand.lockup;

  const name = caseOf(brand, brand.name);
  const measure = (text: string, fontSize: number) =>
    measureText({
      text,
      fontFamily: brand.font.family,
      fontSize,
      fontWeight: brand.font.weight,
      letterSpacing: `${brand.font.tracking}em`,
    });

  let markSize = unit * (orientation === 'mark-only' ? 0.34 : orientation === 'stacked' ? 0.3 : 0.24);
  let fontSize = orientation === 'stacked' ? markSize * 0.42 : orientation === 'wordmark-only' ? unit * 0.16 : markSize * 0.56;
  fontSize = Math.max(fontSize, H * 0.05);
  let gap = markSize * 0.26;

  let wordW = orientation === 'mark-only' ? 0 : measure(name, fontSize).width;
  let markW = orientation === 'wordmark-only' ? 0 : markSize * aspect;

  // Fit to 80% of the frame width.
  const totalW =
    orientation === 'horizontal' ? markW + gap + wordW : Math.max(markW, wordW);
  const maxW = W * 0.8;
  if (totalW > maxW) {
    const k = maxW / totalW;
    markSize *= k;
    markW *= k;
    fontSize *= k;
    gap *= k;
    wordW = orientation === 'mark-only' ? 0 : measure(name, fontSize).width;
  }
  const wordH = orientation === 'mark-only' ? 0 : fontSize * 1.1;

  const hasTag = brand.tagline.trim().length > 0;
  const tagSize = Math.max(fontSize * 0.34, H * 0.028);
  const tagGap = hasTag ? Math.max(markSize, wordH) * 0.24 : 0;
  const tagBlock = hasTag ? tagGap + tagSize * 1.2 : 0;

  let markX = W / 2;
  let markY = H / 2;
  let wordX = W / 2 - wordW / 2;
  let wordY = H / 2;
  let blockH = 0;

  if (orientation === 'horizontal') {
    blockH = Math.max(markSize, wordH);
    const left = (W - (markW + gap + wordW)) / 2;
    const cy = H / 2 - tagBlock / 2;
    markX = left + markW / 2;
    markY = cy;
    wordX = left + markW + gap;
    wordY = cy;
  } else if (orientation === 'stacked') {
    const stackGap = markSize * 0.22;
    blockH = markSize + stackGap + wordH;
    const top = H / 2 - (blockH + tagBlock) / 2;
    markX = W / 2;
    markY = top + markSize / 2;
    wordX = W / 2 - wordW / 2;
    wordY = top + markSize + stackGap + wordH / 2;
  } else if (orientation === 'mark-only') {
    blockH = markSize;
    markY = H / 2 - tagBlock / 2;
  } else {
    blockH = wordH;
    wordY = H / 2 - tagBlock / 2;
  }

  // Per-letter x positions (prefix widths keep kerning/tracking honest).
  const letters: LockupLayout['letters'] = [];
  if (orientation !== 'mark-only') {
    const chars = Array.from(name);
    let prev = 0;
    for (let i = 0; i < chars.length; i++) {
      const upto = measure(chars.slice(0, i + 1).join(''), fontSize).width;
      letters.push({char: chars[i], x: prev, w: upto - prev});
      prev = upto;
    }
  }

  const blockBottom =
    orientation === 'stacked' ? wordY + wordH / 2 : (orientation === 'wordmark-only' ? wordY : markY) + blockH / 2;
  const tagY = blockBottom + tagGap + tagSize * 0.6;

  return {
    orientation,
    W,
    H,
    markSize,
    markW,
    markX,
    markY,
    fontSize,
    wordX,
    wordY,
    wordW,
    wordH,
    letters,
    tagSize,
    tagX: W / 2,
    tagY,
    markToCenter: {dx: W / 2 - markX, dy: H / 2 - markY},
    wordToCenter: {dx: W / 2 - (wordX + wordW / 2), dy: H / 2 - wordY},
  };
};

export type LetterState = {
  opacity?: number;
  tx?: number;
  ty?: number;
  scale?: number;
  rotate?: number;
  blur?: number;
  color?: string;
};

export type GroupState = {
  opacity?: number;
  tx?: number;
  ty?: number;
  scale?: number;
  rotate?: number;
  blur?: number;
  /** clip-path inset in % (top right bottom left), for mask wipes. */
  clip?: [number, number, number, number];
};

const groupStyle = (g: GroupState | undefined): React.CSSProperties => {
  if (!g) return {};
  return {
    opacity: g.opacity ?? 1,
    transform: `translate(${g.tx ?? 0}px, ${g.ty ?? 0}px) rotate(${g.rotate ?? 0}deg) scale(${g.scale ?? 1})`,
    filter: g.blur ? `blur(${g.blur}px)` : undefined,
    clipPath: g.clip ? `inset(${g.clip[0]}% ${g.clip[1]}% ${g.clip[2]}% ${g.clip[3]}%)` : undefined,
  };
};

/**
 * The lockup: mark + wordmark + tagline, absolutely placed at their final
 * slots. Bumpers animate it through group states (whole mark / whole word /
 * tagline) plus per-part and per-letter stylers. With no states passed it IS
 * the static logo — that is what the LogoStill composition renders.
 */
export const Lockup: React.FC<{
  brand: Brand;
  layout: LockupLayout;
  mark?: GroupState;
  word?: GroupState;
  tag?: GroupState;
  partStyler?: PartStyler;
  letterStyler?: (i: number, n: number) => LetterState;
  /** Extra SVG inside the mark's coordinate system (glints, rings). */
  markOverlay?: React.ReactNode;
  markUnderlay?: React.ReactNode;
  showTagline?: boolean;
}> = ({brand, layout: L, mark, word, tag, partStyler, letterStyler, markOverlay, markUnderlay, showTagline = true}) => {
  const n = L.letters.length;
  // Per-letter base color from brand.nameParts (multi-color wordmarks).
  const baseColor: string[] = [];
  if (brand.nameParts?.length) {
    for (const part of brand.nameParts) for (const _ of Array.from(part.text)) baseColor.push(part.color);
  }
  return (
    <>
      {L.orientation !== 'wordmark-only' ? (
        <div
          style={{
            position: 'absolute',
            left: L.markX - L.markW / 2,
            top: L.markY - L.markSize / 2,
            width: L.markW,
            height: L.markSize,
            transformOrigin: 'center',
            ...groupStyle(mark),
          }}
        >
          <LogoMark size={L.markSize} styler={partStyler} overlay={markOverlay} underlay={markUnderlay} />
        </div>
      ) : null}
      {L.orientation !== 'mark-only' ? (
        <div
          style={{
            position: 'absolute',
            left: L.wordX,
            top: L.wordY - L.wordH / 2,
            width: L.wordW,
            height: L.wordH,
            transformOrigin: 'left center',
            ...groupStyle(word),
          }}
        >
          {L.letters.map((l, i) => {
            const s = letterStyler ? letterStyler(i, n) : {};
            return (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: l.x,
                  top: 0,
                  lineHeight: `${L.wordH}px`,
                  fontFamily: brand.font.family,
                  fontWeight: brand.font.weight,
                  fontSize: L.fontSize,
                  letterSpacing: `${brand.font.tracking}em`,
                  color: s.color ?? baseColor[i] ?? brand.colors.ink,
                  whiteSpace: 'pre',
                  display: 'inline-block',
                  transformOrigin: '50% 80%',
                  opacity: s.opacity ?? 1,
                  transform: `translate(${s.tx ?? 0}px, ${s.ty ?? 0}px) rotate(${s.rotate ?? 0}deg) scale(${s.scale ?? 1})`,
                  filter: s.blur ? `blur(${s.blur}px)` : undefined,
                }}
              >
                {l.char}
              </span>
            );
          })}
        </div>
      ) : null}
      {showTagline && brand.tagline.trim() ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: L.W,
            top: L.tagY - L.tagSize * 0.6,
            height: L.tagSize * 1.2,
            textAlign: 'center',
            fontFamily: brand.font.family,
            fontWeight: 500,
            fontSize: L.tagSize,
            lineHeight: `${L.tagSize * 1.2}px`,
            letterSpacing: '0.08em',
            color: brand.colors.muted,
            ...groupStyle(tag),
          }}
        >
          {brand.tagline}
        </div>
      ) : null}
    </>
  );
};
