/**
 * A logo is a cast of actors, not a picture. Each part is one independently
 * animatable SVG element with a stable id. Bumpers address parts by id/role,
 * never by position in the file.
 *
 * `parts.ts` is generated from a clean, motion-ready SVG by
 * `scripts/svg_to_parts.py` — do not hand-edit geometry there; fix the SVG and
 * regenerate so the static logo and the animation share one source of truth.
 */
export type PartRole =
  /** Main shape of the mark — lands first, moves slowest. */
  | 'primary'
  /** Supporting shapes — arrive after the primary. */
  | 'secondary'
  /** Small accents (dot, spark, underline) — arrive last, may bounce. */
  | 'accent'
  /** Container / frame / badge background — usually revealed before content. */
  | 'container';

export type LogoPart = {
  id: string;
  role: PartRole;
  /** Draw order in the cascade (0 = first). */
  order: number;
  /** SVG tag: path | circle | ellipse | rect | polygon | polyline | line */
  tag: string;
  /** React-ready attributes (camelCase), e.g. {d, fill, strokeWidth}. */
  attrs: Record<string, string | number>;
  /** Text content for <text> parts. */
  text?: string;
  /** True when the part is a stroke that can be drawn on (has a stroke, no fill). */
  drawable: boolean;
  /** Part bbox center in viewBox units — used for arcs and fly-in vectors. */
  cx: number;
  cy: number;
};

export type LogoData = {
  /** viewBox as [minX, minY, width, height]. */
  viewBox: [number, number, number, number];
  /** Raw <defs> markup (gradients, masks) if the SVG had any. */
  defs: string;
  parts: LogoPart[];
};
