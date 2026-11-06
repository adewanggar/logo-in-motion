#!/usr/bin/env python3
"""Generate a bumper SFX kit procedurally — no downloads, no licenses to track.

    python scripts/sfx_synth.py kit --out template/public/audio/sfx --ts template/src/sfxKit.ts
    python scripts/sfx_synth.py one whoosh --duration 0.9 --seed 4 --out my-whoosh.wav

Every sound is synthesized from noise and oscillators with a fixed seed, so
the kit is byte-identical on every run, is your own work (no third-party
license), and its PEAK POSITION is known exactly — the generated sfxKit.ts
carries each file's peakLag in frames, ready for src/sound.ts.

Vocabulary (cinematic, not game-like):
  whoosh / whoosh-b   air movement for travelling parts, camera moves
  whoosh-long         long sweep for spins and big moves (peaks late)
  riser               noise + rising tone, peaks at the very END (lands on the hit)
  impact / impact-soft  low thump + transient: a landing
  boom                heavy hit with sub tail: slams
  pop / pop-b         short pitched pop: small parts / icons appearing
  tick                tiny click: letters, segments
  shimmer             high partials sparkle: afterglow on the finished lockup
  swell               soft chord pad that blooms and fades: premium reveals
  stroke              dry brushy noise: draw-on
"""
import argparse
import json
import math
import struct
import wave
from pathlib import Path

import numpy as np

SR = 48000


# ---------------------------------------------------------------- primitives
def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def noise(n, rng):
    return rng.uniform(-1, 1, n)


def onepole_lp(x, cutoff):
    """Time-varying one-pole lowpass; cutoff: scalar or per-sample array (Hz)."""
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def bandpass(x, center, width=0.6):
    lo = onepole_lp(x, center * (1 + width))
    return lo - onepole_lp(lo, center * (1 - width * 0.6))


def env_ad(n, attack, decay_tau, peak_at=None):
    t = np.arange(n) / SR
    pa = attack if peak_at is None else peak_at
    up = np.clip(t / max(pa, 1e-4), 0, 1) ** 2
    down = np.exp(-np.clip(t - pa, 0, None) / decay_tau)
    return up * down


def bell(n, peak_frac, sharp=2.0):
    x = np.linspace(0, 1, n)
    left = np.clip(x / peak_frac, 0, 1)
    right = np.clip((1 - x) / (1 - peak_frac), 0, 1)
    return np.where(x <= peak_frac, left ** sharp, right ** (sharp * 0.8))


def sine_sweep(t, f0, f1, curve=1.0):
    k = (t / t[-1]) ** curve
    f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def fade_edges(x, ms=4):
    n = int(SR * ms / 1000)
    if n and len(x) > 2 * n:
        r = np.linspace(0, 1, n)
        x[:n] *= r
        x[-n:] *= r[::-1]
    return x


def normalize(x, peak_db=-1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * (10 ** (peak_db / 20))


# ---------------------------------------------------------------- recipes
def whoosh(dur=0.6, seed=1, peak=0.55, f_lo=300, f_hi=2600):
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    b = bell(n, peak, 1.8)
    sweep = f_lo + (f_hi - f_lo) * b
    x = bandpass(noise(n, rng), sweep, 0.7) * b
    air = onepole_lp(noise(n, rng), 6000) * b ** 3 * 0.15
    return fade_edges(x + air)


def whoosh_long(dur=1.4, seed=11):
    return whoosh(dur, seed, peak=0.72, f_lo=180, f_hi=1800)


def riser(dur=1.2, seed=2):
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    n = len(t)
    amp = (t / dur) ** 2.4
    tone = sine_sweep(t, 180, 1400, 2.0) * 0.35 + sine_sweep(t, 360, 2800, 2.0) * 0.12
    hiss = bandpass(noise(n, rng), 500 + 5000 * (t / dur) ** 2, 0.8) * 0.9
    x = (tone + hiss) * amp
    x[-int(SR * 0.004):] *= np.linspace(1, 0, int(SR * 0.004))  # cut right at the hit
    return x


def impact(dur=0.9, seed=3, f0=70, f1=42, body=1.0, noise_amt=0.6, tau=0.22):
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    n = len(t)
    thump = sine_sweep(t, f0, f1, 0.5) * env_ad(n, 0.004, tau) * body
    click = onepole_lp(noise(n, rng), 3500) * env_ad(n, 0.0008, 0.012) * 1.4
    tail = onepole_lp(noise(n, rng), 900) * env_ad(n, 0.006, tau * 0.8) * noise_amt
    return fade_edges(np.tanh(1.6 * (thump + click + tail)))


def impact_soft():
    return impact(0.7, seed=31, f0=110, f1=70, body=0.8, noise_amt=0.35, tau=0.14)


def boom():
    rng = np.random.default_rng(5)
    x = impact(1.6, seed=5, f0=60, f1=32, body=1.2, noise_amt=0.9, tau=0.45)
    n = len(x)
    crack = bandpass(noise(n, rng), 2500, 0.9) * env_ad(n, 0.001, 0.05) * 0.8
    return np.tanh(x + crack)


def pop(seed=6, f0=950, f1=320):
    t = t_axis(0.14)
    n = len(t)
    body = sine_sweep(t, f0, f1, 0.4) * env_ad(n, 0.002, 0.035)
    rng = np.random.default_rng(seed)
    snap = onepole_lp(noise(n, rng), 5000) * env_ad(n, 0.0005, 0.004) * 0.5
    return fade_edges(body + snap, 2)


def tick(seed=7):
    t = t_axis(0.05)
    n = len(t)
    rng = np.random.default_rng(seed)
    x = bandpass(noise(n, rng), 3200, 0.5) * env_ad(n, 0.0004, 0.006)
    x += np.sin(2 * np.pi * 1800 * t) * env_ad(n, 0.0004, 0.004) * 0.4
    return fade_edges(x, 1)


def shimmer(dur=1.6, seed=8):
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    n = len(t)
    x = np.zeros(n)
    for _ in range(14):
        f = rng.uniform(2200, 7800)
        on = rng.uniform(0.0, 0.35)
        tau = rng.uniform(0.25, 0.7)
        e = np.where(t >= on, np.exp(-(t - on) / tau) * np.clip((t - on) / 0.01, 0, 1), 0)
        trem = 0.75 + 0.25 * np.sin(2 * np.pi * rng.uniform(5, 11) * t + rng.uniform(0, 6))
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * e * trem * rng.uniform(0.4, 1)
    air = bandpass(noise(n, rng), 7000, 0.5) * env_ad(n, 0.05, 0.5) * 0.25
    return fade_edges(x + air)


def swell(dur=2.0, seed=9):
    t = t_axis(dur)
    n = len(t)
    rng = np.random.default_rng(seed)
    chord = [220.0, 277.18, 329.63, 440.0, 554.37]  # A major add9-ish, soft
    x = sum(np.sin(2 * np.pi * f * (1 + 0.002 * np.sin(2 * np.pi * 0.3 * t)) * t + rng.uniform(0, 6)) / (i + 1.5)
            for i, f in enumerate(chord))
    amp = bell(n, 0.55, 1.6)
    return fade_edges(onepole_lp(x, 2500) * amp)


def stroke(dur=1.4, seed=10):
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    grain = bandpass(noise(n, rng), 1800, 0.9)
    flutter = 0.7 + 0.3 * np.abs(np.sin(np.linspace(0, 23, n)))
    amp = np.clip(np.linspace(0, 1, n) * 6, 0, 1) * np.clip((1 - np.linspace(0, 1, n)) * 5, 0, 1)
    return fade_edges(grain * flutter * amp)


KIT = {
    "whoosh": lambda: whoosh(0.6, 1),
    "whoosh-b": lambda: whoosh(0.55, 21, peak=0.5, f_lo=380, f_hi=3200),
    "whoosh-long": whoosh_long,
    "riser": riser,
    "impact": lambda: impact(),
    "impact-soft": impact_soft,
    "boom": boom,
    "pop": lambda: pop(6, 950, 320),
    "pop-b": lambda: pop(16, 1150, 420),
    "tick": tick,
    "shimmer": shimmer,
    "swell": swell,
    "stroke": stroke,
}


# ---------------------------------------------------------------- io + analysis
def write_wav(path: Path, x: np.ndarray):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def measure(x: np.ndarray, fps: float):
    win = int(SR * 0.01)
    k = len(x) // win
    rms = np.sqrt((x[: k * win].reshape(k, win) ** 2).mean(axis=1))
    peak_s = (int(rms.argmax()) + 0.5) * win / SR
    return {
        "duration_s": round(len(x) / SR, 3),
        "duration_frames": round(len(x) / SR * fps, 2),
        "peak_s": round(peak_s, 3),
        "peakLag_frames": round(peak_s * fps, 2),
        "sample_peak_dbfs": round(20 * math.log10(max(np.abs(x).max(), 1e-9)), 2),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    k = sub.add_parser("kit", help="generate the whole kit")
    k.add_argument("--out", required=True)
    k.add_argument("--ts", help="write a TypeScript table of files + peakLag (e.g. template/src/sfxKit.ts)")
    k.add_argument("--fps", type=float, default=30)
    o = sub.add_parser("one", help="generate a single sound")
    o.add_argument("kind", choices=["whoosh", "riser", "impact", "shimmer", "swell", "stroke"])
    o.add_argument("--duration", type=float, default=None)
    o.add_argument("--seed", type=int, default=1)
    o.add_argument("--out", required=True)
    o.add_argument("--fps", type=float, default=30)
    a = ap.parse_args()

    if a.cmd == "one":
        fn = {"whoosh": whoosh, "riser": riser, "impact": impact, "shimmer": shimmer, "swell": swell, "stroke": stroke}[a.kind]
        kwargs = {"seed": a.seed}
        if a.duration:
            kwargs["dur"] = a.duration
        x = normalize(fn(**kwargs))
        write_wav(Path(a.out), x)
        print(json.dumps({"file": a.out, **measure(x, a.fps)}, indent=2))
        return

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, fn in KIT.items():
        x = normalize(fn())
        write_wav(out / f"{name}.wav", x)
        manifest[name] = {"file": f"{name}.wav", **measure(x, a.fps)}
        print(f"  {name:12s} {manifest[name]['duration_s']:5.2f}s  peak @ {manifest[name]['peakLag_frames']:6.2f}f")
    (out / "sfx-kit.json").write_text(
        json.dumps({"generator": "scripts/sfx_synth.py", "sample_rate": SR, "license": "generated, no third-party material", "sounds": manifest}, indent=2),
        encoding="utf8",
    )
    if a.ts:
        rel = out.as_posix().split("public/", 1)[-1]
        lines = [
            "// GENERATED by scripts/sfx_synth.py kit — procedural sounds, no third-party license.",
            "// peakLag = frames from file start to the energy peak (@%g fps)." % a.fps,
            "export const KIT = {",
        ]
        for name, m in manifest.items():
            lines.append(f"  '{name}': {{src: '{rel}/{m['file']}', peakLag: {m['peakLag_frames']}, frames: {m['duration_frames']}}},")
        lines += ["} as const;", "", "export type KitSound = keyof typeof KIT;", ""]
        Path(a.ts).write_text("\n".join(lines), encoding="utf8")
        print(f"wrote {a.ts}")


if __name__ == "__main__":
    main()
