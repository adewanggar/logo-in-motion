#!/usr/bin/env python3
"""Measure a sound effect before pinning it to a bumper marker.

    python scripts/audio_peak.py public/audio/sfx/impact.mp3 [--fps 30] [--project template]

Decodes with Remotion's bundled ffmpeg (`npx remotion ffmpeg`, run inside the
Remotion project) or a system ffmpeg, then reports:
  duration, sample peak dBFS, overall RMS dBFS, and the energy peak position
  (10 ms RMS window) in seconds and FRAMES — that frame count is the cue's
  `peakLag` in src/sound.ts. These are not LUFS / true-peak values.

For multi-hit or swelling samples, look at the envelope printout and choose
the semantic hit yourself; the loudest window is not always the landing.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000


def decode(path: Path, project: Path) -> np.ndarray:
    args = ["-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"]
    if shutil.which("ffmpeg"):
        cmd = ["ffmpeg", *args]
        cwd = None
    else:
        npx = "npx.cmd" if sys.platform == "win32" else "npx"
        cmd = [npx, "remotion", "ffmpeg", *args]
        cwd = project
    out = subprocess.run(cmd, cwd=cwd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768.0


def db(v: float) -> float:
    return float(20 * np.log10(max(v, 1e-9)))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--project", default=".", help="Remotion project dir (for npx remotion ffmpeg)")
    a = ap.parse_args()

    path = Path(a.file).resolve()
    x = decode(path, Path(a.project).resolve())
    if x.size == 0:
        raise SystemExit("decoded no audio")
    win = int(SR * 0.01)
    n = x.size // win
    rms = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1))
    peak_i = int(rms.argmax())
    peak_s = (peak_i + 0.5) * win / SR
    env = rms / (rms.max() or 1)
    # coarse envelope every 50 ms for eyeballing
    step = 5
    sketch = "".join(" .:-=+*#%@"[min(9, int(v * 9.99))] for v in env[::step])
    report = {
        "file": str(path),
        "duration_s": round(x.size / SR, 3),
        "duration_frames": round(x.size / SR * a.fps, 1),
        "sample_peak_dbfs": round(db(float(np.abs(x).max())), 2),
        "rms_dbfs": round(db(float(np.sqrt((x ** 2).mean()))), 2),
        "energy_peak_s": round(peak_s, 3),
        "peakLag_frames": round(peak_s * a.fps, 2),
        "envelope_50ms": sketch,
    }
    if report["sample_peak_dbfs"] < -12:
        report["warning"] = "quiet sample (< -12 dBFS peak): prefer a louder take; volume is only a multiplier"
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
