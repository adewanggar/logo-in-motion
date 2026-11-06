import React from 'react';
import {Html5Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';

/**
 * Declarative sound table. Sound is a timeline asset: every cue is pinned to
 * a named marker of the bumper (impact, landing, sheen…) — never to a bare
 * frame number — so cues follow when the timeline changes.
 *
 *   from = targetPeakFrame − sourcePeakLagFrames − outputOffsetFrames
 *
 * - sourcePeakLag: frames from file start to its energy peak
 *   (measure with scripts/audio_peak.py).
 * - outputOffset: constant lag the encode chain adds to the whole audio track
 *   (AAC priming ≈ 1.3f @30fps at 48kHz). Measure once per render pipeline.
 */
export type Cue = {
  /** Marker frame where the sound's PEAK should land. */
  at: number;
  /** File inside public/, e.g. 'audio/sfx/impact.mp3'. */
  src: string;
  volume: number;
  /** Frames from file start to its peak (scripts/audio_peak.py). */
  peakLag?: number;
  /** Trim the sample to this many frames (do NOT add offsets to this). */
  durationInFrames?: number;
  /** What happens on screen at this cue — required, keeps the table auditable. */
  note: string;
};

/** Measured per render pipeline (Remotion version + codec + sample rate + container). */
export const OUTPUT_AUDIO_OFFSET_F = 1.28;

/** Ideal start frame (may be negative when a long build-up must peak early in the bumper). */
export const cueStart = (c: Cue) => Math.round(c.at - (c.peakLag ?? 0) - OUTPUT_AUDIO_OFFSET_F);
export const cueFrom = (c: Cue) => Math.max(0, cueStart(c));

export const SoundTrack: React.FC<{
  cues: Cue[];
  bgm?: {src: string; volume: number; fadeInF?: number; fadeOutF?: number};
  enableSfx: boolean;
  enableBgm: boolean;
}> = ({cues, bgm, enableSfx, enableBgm}) => {
  const {durationInFrames} = useVideoConfig();
  return (
    <>
      {enableBgm && bgm ? (
        <Html5Audio
          src={staticFile(bgm.src)}
          volume={(f) =>
            bgm.volume *
            interpolate(
              f,
              [0, bgm.fadeInF ?? 6, durationInFrames - (bgm.fadeOutF ?? 18), durationInFrames],
              [0, 1, 1, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
        />
      ) : null}
      {enableSfx
        ? cues.map((c, i) => {
            // A cue that would start before frame 0 is trimmed at its head instead of
            // shifted late, so its PEAK still lands on the marker.
            const head = Math.max(0, -cueStart(c));
            return (
              <Sequence key={`${c.src}-${i}`} from={cueFrom(c)} durationInFrames={c.durationInFrames} layout="none">
                <Html5Audio src={staticFile(c.src)} volume={c.volume} trimBefore={head || undefined} />
              </Sequence>
            );
          })
        : null}
    </>
  );
};
