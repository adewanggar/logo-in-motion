#!/usr/bin/env python3
"""Geometry QA: compare a rendered vector against the source raster.

    # 1) render the vector at the source's size (from the bumper project):
    npx remotion still src/index.ts LogoCheck out/fit/check.png --props='{"width":1024,"height":1024}'
    # 2) compare:
    python scripts/iou_overlay.py source.png template/out/fit/check.png --out fit/03_overlay.png --report fit/metrics.json

The render must have the same framing as the source (the SVG viewBox must
equal the source's canvas, or crop both to the foreground with --crop).
Outputs an overlay (source in grey, vector edge in cyan, source-only pixels
in magenta, vector-only in yellow) and IoU / pixel deltas. IoU is a
diagnostic, not a gate: a smooth vector beats a jagged one with higher IoU.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def mask_of(img: Image.Image) -> np.ndarray:
    rgba = np.asarray(img.convert("RGBA")).astype(np.int16)
    if (rgba[..., 3] < 250).any():
        return rgba[..., 3] > 127
    rgb = rgba[..., :3]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    return np.abs(rgb - bg).sum(axis=-1) > 60


def crop_to_fg(m: np.ndarray, pad: int = 4) -> np.ndarray:
    ys, xs = np.nonzero(m)
    y0, y1 = max(0, ys.min() - pad), min(m.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(m.shape[1], xs.max() + pad + 1)
    return m[y0:y1, x0:x1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("render")
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", default=None)
    ap.add_argument("--crop", action="store_true", help="crop both to foreground bbox before comparing")
    a = ap.parse_args()

    src_img = Image.open(a.source)
    ren_img = Image.open(a.render)
    ms, mr = mask_of(src_img), mask_of(ren_img)
    if a.crop:
        ms, mr = crop_to_fg(ms), crop_to_fg(mr)
    if mr.shape != ms.shape:
        mr = np.asarray(Image.fromarray(mr.astype(np.uint8) * 255).resize((ms.shape[1], ms.shape[0]), Image.LANCZOS)) > 127

    inter = np.logical_and(ms, mr).sum()
    union = np.logical_or(ms, mr).sum()
    src_only = np.logical_and(ms, ~mr).sum()
    ren_only = np.logical_and(mr, ~ms).sum()
    iou = float(inter / union) if union else 0.0

    h, w = ms.shape
    base = np.full((h, w, 3), 255, np.uint8)
    base[ms] = (170, 170, 170)
    base[np.logical_and(ms, ~mr)] = (230, 40, 200)
    base[np.logical_and(mr, ~ms)] = (250, 200, 20)
    edge = np.asarray(Image.fromarray(mr.astype(np.uint8) * 255).filter(ImageFilter.FIND_EDGES)) > 0
    base[edge] = (0, 200, 230)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(base).save(a.out)

    report = {
        "iou": round(iou, 4),
        "src_only_px": int(src_only),
        "render_only_px": int(ren_only),
        "src_px": int(ms.sum()),
        "render_px": int(mr.sum()),
        "overlay": a.out,
        "legend": "grey=source, cyan=vector edge, magenta=source-only, yellow=vector-only",
    }
    if a.report:
        Path(a.report).write_text(json.dumps(report, indent=2), encoding="utf8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
