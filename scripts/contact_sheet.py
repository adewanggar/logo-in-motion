#!/usr/bin/env python3
"""Tile QA frames into one labelled contact sheet (motion strip).

    python scripts/contact_sheet.py template/out/qa/PopLockup-16x9 [--cols 5] [--width 384] [--out sheet.png]

Reads frames.json written by `node scripts/qa.mjs frames` (falls back to all
f*.png in the folder). Each tile is labelled with frame number + marker name,
so the sheet can be inspected by eye or by a vision model.
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int):
    for name in ("arial.ttf", "DejaVuSans.ttf", "Helvetica.ttc", "segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--cols", type=int, default=5)
    ap.add_argument("--width", type=int, default=384, help="tile width in px")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    folder = Path(a.folder)
    meta = folder / "frames.json"
    items = []
    if meta.exists():
        data = json.loads(meta.read_text(encoding="utf8"))
        base = folder.parents[2] if len(folder.parents) > 2 else folder
        for row in data["frames"]:
            p = Path(row["file"])
            if not p.is_absolute():
                p = base / p
            if not p.exists():
                p = folder / Path(row["file"]).name
            items.append((p, f'f{row["frame"]}  {row["label"]}'))
    else:
        for p in sorted(folder.glob("f*.png")):
            items.append((p, p.stem))
    if not items:
        raise SystemExit(f"no frames in {folder}")

    first = Image.open(items[0][0])
    tw = a.width
    th = round(first.height * tw / first.width)
    label_h = 26
    cols = min(a.cols, len(items))
    rows = math.ceil(len(items) / cols)
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * 6, rows * (th + label_h) + (rows + 1) * 6), (24, 24, 28))
    draw = ImageDraw.Draw(sheet)
    font = load_font(15)
    for i, (p, label) in enumerate(items):
        im = Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS)
        x = 6 + (i % cols) * (tw + 6)
        y = 6 + (i // cols) * (th + label_h + 6)
        sheet.paste(im, (x, y + label_h))
        draw.text((x + 4, y + 4), label, fill=(235, 235, 235), font=font)
    out = Path(a.out) if a.out else folder / "contact_sheet.png"
    sheet.save(out)
    print(f"wrote {out}  ({len(items)} frames)")


if __name__ == "__main__":
    main()
