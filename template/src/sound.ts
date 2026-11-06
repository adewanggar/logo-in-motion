import type {Cue} from './components/SoundTrack';
import type {Markers} from './bumpers/common';
import {KIT, type KitSound} from './sfxKit';

/**
 * Sound design per bumper, pinned to MARKERS (never bare frame numbers), so
 * cues follow automatically when the timeline changes.
 *
 * Default sounds come from the procedural kit (scripts/sfx_synth.py →
 * public/audio/sfx/*.wav + src/sfxKit.ts): generated, no third-party license,
 * peakLag known exactly. To use recorded sounds instead, fetch them with
 * scripts/sfx_freesound.py (or use the client's files), measure peakLag with
 * scripts/audio_peak.py and pass {src, peakLag} to `cue` below.
 *
 * Vocabulary: riser (build) → whoosh (travel) → impact (landing) → shimmer (afterglow).
 * One loudest hit per bumper. Render with sound: --props='{"sfx":true}'.
 */
export const BGM: {src: string; volume: number} | undefined = undefined;
// export const BGM = {src: 'audio/bgm/sting.mp3', volume: 0.5};

type Source = KitSound | {src: string; peakLag: number};

const cue = (sound: Source, at: number, volume: number, note: string, durationInFrames?: number): Cue => {
  const s = typeof sound === 'string' ? KIT[sound] : sound;
  return {at, src: s.src, peakLag: s.peakLag, volume, note, durationInFrames};
};

/** Per-part cues: two samples alternating + volume stepping down, so a run never sounds like a machine gun. */
const run = (frames: number[], a: KitSound, b: KitSound, v0: number, v1: number, note: string): Cue[] =>
  frames.map((f, i) =>
    cue(i % 2 ? b : a, f, v0 + (v1 - v0) * (frames.length > 1 ? i / (frames.length - 1) : 0), `${note} ${i + 1}`),
  );

const seq = (m: Markers, prefix: string) =>
  Object.entries(m)
    .filter(([k]) => k.startsWith(prefix))
    .sort((x, y) => Number(x[0].slice(prefix.length)) - Number(y[0].slice(prefix.length)))
    .map(([, f]) => f);

export const cuesFor = (bumperId: string, m: Markers): Cue[] => {
  switch (bumperId) {
    case 'InkDraw':
      return [
        cue('stroke', m.drawStart + 26, 0.35, 'pen draws the mark', m.drawEnd - m.drawStart + 26),
        cue('pop', m.accentLand, 0.4, 'accent part lands'),
        cue('whoosh-b', m.wordStart + 8, 0.25, 'wordmark wipe'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    case 'Assemble':
      return [
        ...run(seq(m, '_land'), 'whoosh', 'whoosh-b', 0.32, 0.2, 'part lands'),
        cue('impact-soft', m.lastPartLand, 0.55, 'mark complete'),
        cue('tick', m.lettersStart, 0.25, 'letters start'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    case 'PopLockup':
      return [
        cue('riser', m.popPeak, 0.35, 'seed coils before the pop'),
        cue('impact-soft', m.popPeak, 0.65, 'mark pops (overshoot peak)'),
        cue('whoosh', m.lettersStart + 4, 0.28, 'letters slide out'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    case 'Collapse':
      return [
        cue('riser', m.land, 0.4, 'ring collapses'),
        cue('impact', m.land, 0.75, 'ring lands on the mark'),
        cue('whoosh-b', m.shiftStart + 6, 0.25, 'mark slides to lockup'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    case 'Sheen':
      return [
        cue('swell', m.wordStart + 10, 0.35, 'mark resolves, wordmark unveils'),
        cue('shimmer', m.sheenMid, 0.3, 'light sweep crosses the lockup'),
      ];
    case 'Slam':
      return [
        cue('riser', m.impact, 0.4, 'mark hovers in front of the lens'),
        cue('boom', m.impact, 0.85, 'SLAM'),
        cue('whoosh-b', m.lettersStart + 3, 0.3, 'letters slam in'),
        cue('shimmer', m.holdStart, 0.2, 'lockup complete'),
      ];
    case 'Converge':
      return [
        cue('whoosh-long', m.streamMid + 12, 0.35, 'particles stream in'),
        cue('impact-soft', m.condensed, 0.55, 'mark condenses'),
        cue('whoosh-b', m.lettersStart + 6, 0.25, 'letters blur in'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    case 'IconMorph':
      return [
        ...run(seq(m, '_pop'), 'pop', 'pop-b', 0.38, 0.24, 'icon pops in'),
        cue('whoosh-long', m.land - 4, 0.38, 'ring spins while icons morph'),
        cue('impact-soft', m.land, 0.6, 'petals land'),
        cue('whoosh-b', m.lettersStart + 4, 0.25, 'letters rise'),
        cue('shimmer', m.holdStart, 0.22, 'lockup complete'),
      ];
    default:
      return [];
  }
};
