#!/usr/bin/env python3
"""Read a raster logo before vectorizing it.

    python scripts/analyze_logo.py source.png [--out analysis.json] [--colors 6]

Reports: size, alpha, background guess, dominant foreground colors, tight
bounding box, and connected components (each one is a candidate ACTOR for the
animation: mark pieces, dots, letters). Use it to write the part inventory in
bumper_spec.md — it is a measurement aid, not a vectorizer.
"""
import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def foreground_mask(img: Image.Image):
    rgba = np.asarray(img.convert("RGBA")).astype(np.int16)
    alpha = rgba[..., 3]
    has_alpha = bool((alpha < 250).any())
    if has_alpha:
        return alpha > 127, "transparent", None
    rgb = rgba[..., :3]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.abs(rgb - bg).sum(axis=-1)
    return dist > 60, "solid", [int(v) for v in bg]


def components(mask: np.ndarray, max_side: int = 600):
    h, w = mask.shape
    k = max(1, int(np.ceil(max(h, w) / max_side)))
    small = mask[::k, ::k]
    sh, sw = small.shape
    seen = np.zeros_like(small, dtype=bool)
    comps = []
    for y in range(sh):
        for x in range(sw):
            if small[y, x] and not seen[y, x]:
                q = deque([(y, x)])
                seen[y, x] = True
                ys, xs = [], []
                while q:
                    cy, cx = q.popleft()
                    ys.append(cy)
                    xs.append(cx)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            q.append((ny, nx))
                area = len(ys) * k * k
                if area < mask.sum() * 0.0015:
                    continue
                comps.append({
                    "bbox": [min(xs) * k, min(ys) * k, (max(xs) + 1) * k, (max(ys) + 1) * k],
                    "center": [round(float(np.mean(xs)) * k, 1), round(float(np.mean(ys)) * k, 1)],
                    "area_px": int(area),
                })
    comps.sort(key=lambda c: (c["bbox"][0], c["bbox"][1]))
    return comps


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--out", default=None)
    ap.add_argument("--colors", type=int, default=6)
    a = ap.parse_args()

    img = Image.open(a.source)
    mask, bg_kind, bg_rgb = foreground_mask(img)
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        raise SystemExit("no foreground found")
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]

    rgb = np.asarray(img.convert("RGB"))[mask]
    sample = Image.fromarray(rgb.reshape(-1, 1, 3)[:: max(1, len(rgb) // 40000)])
    pal = sample.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT)
    counts = sorted(pal.getcolors(), reverse=True)
    palette = pal.getpalette()
    colors = []
    total = sum(c for c, _ in counts)
    for c, idx in counts:
        r, g, b = palette[idx * 3: idx * 3 + 3]
        share = c / total
        if share >= 0.02:
            colors.append({"hex": f"#{r:02X}{g:02X}{b:02X}", "share": round(share, 3)})

    comps = components(mask)
    report = {
        "file": str(a.source),
        "size": list(img.size),
        "mode": img.mode,
        "background": bg_kind,
        "background_rgb": bg_rgb,
        "foreground_bbox": bbox,
        "foreground_share": round(float(mask.mean()), 4),
        "colors": colors,
        "components": comps,
        "hints": [
            f"{len(comps)} connected component(s) — each is a candidate actor (id it in the SVG).",
            "Antialiasing creates near-duplicate colors; merge colors closer than ~12 in each channel.",
            "Letters that touch may merge into one component — split them along the animation seam.",
        ],
    }
    text = json.dumps(report, indent=2)
    if a.out:
        Path(a.out).write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
