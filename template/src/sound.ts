import type {Cue} from './components/SoundTrack';
import type {Markers} from './bumpers/common';

/**
 * Sound design per bumper, pinned to markers (never bare frame numbers).
 * The bumper vocabulary is cinematic, not game-like:
 *   riser (build) → whoosh (travel) → impact (landing) → shimmer (afterglow)
 *
 * Files live in public/audio/sfx/ and must be listed with source + license
 * in public/audio/CREDITS.md. Leave a bumper's list empty to render silent.
 * Sound is enabled per render with --props='{"sfx":true}'.
 *
 * peakLag = frames from file start to the sound's energy peak, measured with
 *   python scripts/audio_peak.py public/audio/sfx/<file> --fps 30
 */
export const BGM: {src: string; volume: number} | undefined = undefined;
// export const BGM = {src: 'audio/bgm/sting.mp3', volume: 0.5};

export const cuesFor = (bumperId: string, m: Markers): Cue[] => {
  switch (bumperId) {
    // Example — uncomment after placing the files and measuring peakLag:
    // case 'PopLockup':
    //   return [
    //     {at: m.popPeak - 14, src: 'audio/sfx/riser-short.mp3', volume: 0.35, durationInFrames: 16, note: 'seed coils before pop'},
    //     {at: m.popPeak, src: 'audio/sfx/impact-soft.mp3', volume: 0.6, peakLag: 2, note: 'mark lands (overshoot peak)'},
    //     {at: m.lettersStart, src: 'audio/sfx/whoosh-short.mp3', volume: 0.3, peakLag: 6, note: 'letters slide out'},
    //     {at: m.holdStart, src: 'audio/sfx/shimmer.mp3', volume: 0.25, note: 'lockup complete, afterglow'},
    //   ];
    default:
      void m;
      return [];
  }
};
