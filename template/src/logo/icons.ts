/**
 * Source shapes for the IconMorph pattern: each icon morphs into one logo part.
 *
 * Rules for an icon path:
 * - ONE closed contour, no holes (a hole cannot morph into a solid part).
 *   Suggest inner details through the silhouette, not cut-outs.
 * - Drawn in a 100×100 box, centered around (50, 50), upright.
 * - Pick icons that say something about the brand (agency: play = video,
 *   sparkle = ideas, chat = social, bulb = concept, pencil = design, heart = engagement).
 *
 * Icons are assigned to parts in part `order`, cycling if there are more parts.
 */
export type Icon = {name: string; d: string};

export const ICONS: Icon[] = [
  {name: 'play', d: 'M32 16 Q22 11 22 22 L22 78 Q22 89 32 84 L82 57 Q92 50 82 43 Z'},
  {name: 'sparkle', d: 'M50 4 C54 33 67 46 96 50 C67 54 54 67 50 96 C46 67 33 54 4 50 C33 46 46 33 50 4 Z'},
  {
    name: 'chat',
    d: 'M20 14 H80 Q92 14 92 26 V60 Q92 72 80 72 H46 L24 90 L28 72 H20 Q8 72 8 60 V26 Q8 14 20 14 Z',
  },
  {
    name: 'bulb',
    d: 'M50 6 C73 6 88 22 88 42 C88 57 79 66 68 74 L68 85 Q68 94 59 94 H41 Q32 94 32 85 L32 74 C21 66 12 57 12 42 C12 22 27 6 50 6 Z',
  },
  {name: 'pencil', d: 'M10 90 L18 62 L64 16 Q72 8 80 16 L84 20 Q92 28 84 36 L38 82 Z'},
  {
    name: 'heart',
    d: 'M50 88 C20 66 6 50 6 32 C6 17 18 8 31 8 C40 8 46 13 50 21 C54 13 60 8 69 8 C82 8 94 17 94 32 C94 50 80 66 50 88 Z',
  },
];
