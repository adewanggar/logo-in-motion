import React from 'react';
import {LOGO} from '../logo/parts';
import type {LogoData, LogoPart} from '../logo/types';

export type PartState = {
  opacity?: number;
  /** Transform in viewBox units, applied around the part's own bbox center. */
  tx?: number;
  ty?: number;
  scale?: number;
  sx?: number;
  sy?: number;
  rotate?: number;
  /** Draw-on progress 0..1 for drawable (stroked) parts. undefined = fully drawn. */
  draw?: number;
  blur?: number;
  /** Override paint (e.g. a flash to white on impact). */
  fill?: string;
  stroke?: string;
};

export type PartStyler = (part: LogoPart, index: number) => PartState;

const IDENTITY: PartStyler = () => ({});

/**
 * Renders the logo parts as inline SVG. `size` is the rendered height in px;
 * width follows the viewBox aspect. `styler` returns per-part state for the
 * current frame — at the final pose every styler MUST return identity
 * (Final Frame Contract: the last frame equals the static logo).
 */
export const LogoMark: React.FC<{
  size: number;
  styler?: PartStyler;
  logo?: LogoData;
  /** Recolor every part (mono versions, silhouettes for masks). */
  monochrome?: string;
  style?: React.CSSProperties;
  /** Extra SVG children drawn above the parts (in viewBox units). */
  overlay?: React.ReactNode;
  /** Extra SVG children drawn below the parts. */
  underlay?: React.ReactNode;
}> = ({size, styler = IDENTITY, logo = LOGO, monochrome, style, overlay, underlay}) => {
  const [minX, minY, w, h] = logo.viewBox;
  const width = (size * w) / h;
  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      width={width}
      height={size}
      style={{overflow: 'visible', display: 'block', ...style}}
    >
      {logo.defs ? <defs dangerouslySetInnerHTML={{__html: logo.defs}} /> : null}
      {underlay}
      {logo.parts.map((part, i) => {
        const s = styler(part, i);
        const sc = s.scale ?? 1;
        const sx = (s.sx ?? 1) * sc;
        const sy = (s.sy ?? 1) * sc;
        const transform =
          `translate(${s.tx ?? 0}px, ${s.ty ?? 0}px) ` +
          `rotate(${s.rotate ?? 0}deg) scale(${sx}, ${sy})`;
        const drawing = part.drawable && s.draw !== undefined;
        const attrs: Record<string, string | number> = {...part.attrs};
        if (monochrome) {
          if (attrs.fill && attrs.fill !== 'none') attrs.fill = monochrome;
          if (attrs.stroke && attrs.stroke !== 'none') attrs.stroke = monochrome;
        }
        if (s.fill && attrs.fill && attrs.fill !== 'none') attrs.fill = s.fill;
        if (s.stroke && attrs.stroke && attrs.stroke !== 'none') attrs.stroke = s.stroke;
        const hidden = drawing && (s.draw ?? 1) <= 0;
        // The animated transform lives on a wrapper <g>, so a part's own
        // transform attribute (baked group transforms) is never overridden.
        return (
          <g
            key={part.id}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform,
              opacity: hidden ? 0 : s.opacity ?? 1,
              filter: s.blur ? `blur(${s.blur}px)` : undefined,
            }}
          >
            {React.createElement(
              part.tag,
              {
                id: part.id,
                ...attrs,
                ...(drawing
                  ? {
                      pathLength: 1,
                      strokeDasharray: '1 1.2',
                      strokeDashoffset: 1 - Math.min(1, Math.max(0, s.draw ?? 1)),
                    }
                  : {}),
              },
              part.text,
            )}
          </g>
        );
      })}
      {overlay}
    </svg>
  );
};

/** Bounding info for fly-in vectors: part center relative to logo center, in viewBox units. */
export const partOffset = (part: LogoPart, logo: LogoData = LOGO) => {
  const [minX, minY, w, h] = logo.viewBox;
  return {dx: part.cx - (minX + w / 2), dy: part.cy - (minY + h / 2)};
};

export const sortedParts = (logo: LogoData = LOGO) =>
  [...logo.parts].sort((a, b) => a.order - b.order);
