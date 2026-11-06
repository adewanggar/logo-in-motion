#!/usr/bin/env python3
"""Convert a motion-ready SVG into the Remotion parts file.

    python scripts/svg_to_parts.py logo.svg --out template/src/logo/parts.ts [--copy-to template/public/logo.svg]

Motion-ready SVG contract (see references/logo-prep.md):
  * one element per actor, each with a stable id (#mark, #dot, #letter-a …)
  * optional data-role = primary | secondary | accent | container
  * optional data-order = cascade order (0 first); default = document order
  * strokes meant to be drawn on: stroke set, fill="none"
  * no structural selectors; group transforms are allowed (they are baked
    into each child's transform attribute)

Elements without an id inside a <g id="x"> become x-1, x-2 … Elements with
no id anywhere get part-N and a warning (name them — ids are the API).
"""
import argparse
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SHAPES = {"path", "circle", "ellipse", "rect", "polygon", "polyline", "line", "text"}
ROLES = {"primary", "secondary", "accent", "container"}
NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")


def local(tag: str) -> str:
    return tag.split("}", 1)[-1]


def camel(name: str) -> str:
    name = local(name)
    if name.startswith("xlink:"):
        name = name[6:]
    parts = name.split("-")
    return parts[0] + "".join(p.title() for p in parts[1:])


def to_num(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


# ---------- bbox estimation (for fly-in direction / arcs) ----------
def arc_points(x1, y1, rx, ry, phi, fa, fs, x2, y2, n=24):
    if rx == 0 or ry == 0:
        return [(x2, y2)]
    p = math.radians(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p = math.cos(p) * dx + math.sin(p) * dy
    y1p = -math.sin(p) * dx + math.cos(p) * dy
    rx, ry = abs(rx), abs(ry)
    lam = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2)
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = math.sqrt(max(0, num / den)) if den else 0
    if fa == fs:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = math.cos(p) * cxp - math.sin(p) * cyp + (x1 + x2) / 2
    cy = math.sin(p) * cxp + math.cos(p) * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a

    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    pts = []
    for i in range(1, n + 1):
        t = t1 + dt * i / n
        x = cx + rx * math.cos(t) * math.cos(p) - ry * math.sin(t) * math.sin(p)
        y = cy + rx * math.cos(t) * math.sin(p) + ry * math.sin(t) * math.cos(p)
        pts.append((x, y))
    return pts


def path_points(d: str):
    tokens = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|" + NUM.pattern, d)
    pts, i = [], 0
    x = y = sx = sy = 0.0
    cmd = None
    while i < len(tokens):
        t = tokens[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t
            i += 1
            if cmd in "Zz":
                x, y = sx, sy
            continue

        def take(k):
            nonlocal i
            vals = [float(v) for v in tokens[i:i + k]]
            i += k
            return vals

        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            nx, ny = take(2)
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            sx, sy = x, y
            pts.append((x, y))
            cmd = "l" if rel else "L"
        elif c == "L" or c == "T":
            nx, ny = take(2)
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            pts.append((x, y))
        elif c == "H":
            (nx,) = take(1)
            x = x + nx if rel else nx
            pts.append((x, y))
        elif c == "V":
            (ny,) = take(1)
            y = y + ny if rel else ny
            pts.append((x, y))
        elif c in "CSQ":
            k = {"C": 6, "S": 4, "Q": 4}[c]
            v = take(k)
            for j in range(0, k, 2):
                px, py = (x + v[j], y + v[j + 1]) if rel else (v[j], v[j + 1])
                pts.append((px, py))
            x, y = pts[-1]
        elif c == "A":
            rx, ry, phi, fa, fs, nx, ny = take(7)
            ex, ey = (x + nx, y + ny) if rel else (nx, ny)
            pts.extend(arc_points(x, y, rx, ry, phi, int(fa), int(fs), ex, ey))
            x, y = ex, ey
        else:
            i += 1
    return pts


def bbox_center(tag, a):
    g = lambda k, d=0.0: float(a.get(k, d) or d)  # noqa: E731
    if tag == "circle":
        return g("cx"), g("cy")
    if tag == "ellipse":
        return g("cx"), g("cy")
    if tag == "rect":
        return g("x") + g("width") / 2, g("y") + g("height") / 2
    if tag == "line":
        return (g("x1") + g("x2")) / 2, (g("y1") + g("y2")) / 2
    if tag in ("polygon", "polyline"):
        nums = [float(v) for v in NUM.findall(a.get("points", ""))]
        xs, ys = nums[0::2], nums[1::2]
    elif tag == "path":
        pts = path_points(a.get("d", ""))
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    else:
        return g("x"), g("y")
    if not xs:
        return 0.0, 0.0
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def parse_style(s: str):
    out = {}
    for decl in s.split(";"):
        if ":" in decl:
            k, v = decl.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("svg")
    ap.add_argument("--out", required=True)
    ap.add_argument("--copy-to", default=None)
    a = ap.parse_args()

    tree = ET.parse(a.svg)
    root = tree.getroot()
    vb = root.get("viewBox")
    if vb:
        viewbox = [float(v) for v in NUM.findall(vb)]
    else:
        viewbox = [0, 0, float(NUM.findall(root.get("width", "100"))[0]), float(NUM.findall(root.get("height", "100"))[0])]

    defs = ""
    for el in root:
        if local(el.tag) == "defs":
            defs += "".join(ET.tostring(c, encoding="unicode") for c in el)
    defs = re.sub(r"\sxmlns(:\w+)?=\"[^\"]+\"", "", defs).replace("ns0:", "")

    parts, warnings = [], []
    inherited_keys = {"fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "fill-rule"}

    def walk(el, group_id, transforms, inherited, counter):
        tag = local(el.tag)
        if tag in ("defs", "title", "desc", "metadata", "style"):
            return
        attrs = dict(el.attrib)
        if "style" in attrs:
            attrs.update(parse_style(attrs.pop("style")))
        tr = transforms + ([attrs["transform"]] if "transform" in attrs else [])
        inh = {**inherited, **{k: v for k, v in attrs.items() if local(k) in inherited_keys}}
        if tag in ("g", "svg", "a"):
            gid = attrs.get("id", group_id)
            for c in el:
                walk(c, gid, tr, inh, counter)
            return
        if tag not in SHAPES:
            warnings.append(f"skipped unsupported <{tag}>")
            return
        pid = attrs.get("id")
        if not pid:
            counter[group_id or "part"] = counter.get(group_id or "part", 0) + 1
            pid = f"{group_id or 'part'}-{counter[group_id or 'part']}"
            if not group_id:
                warnings.append(f"<{tag}> without id -> named {pid}; give it a semantic id")
        merged = {**inh, **attrs}
        role = merged.get("data-role", "")
        order = merged.get("data-order")
        out = {}
        for k, v in merged.items():
            lk = local(k)
            if lk in ("id", "class", "data-role", "data-order", "transform") or lk.startswith("data-"):
                continue
            out[camel(lk)] = to_num(v)
        if tr:
            out["transform"] = " ".join(tr)
        fill = str(merged.get("fill", "black" if tag != "line" else "none")).lower()
        stroke = str(merged.get("stroke", "none")).lower()
        if "fill" not in out and tag not in ("line",):
            out["fill"] = "#000000"
        drawable = stroke != "none" and fill == "none" and tag != "text"
        cx, cy = bbox_center(tag, merged)
        part = {
            "id": pid,
            "role": role if role in ROLES else None,
            "order": int(order) if order is not None and str(order).isdigit() else None,
            "tag": tag,
            "attrs": out,
            "drawable": drawable,
            "cx": round(cx, 2),
            "cy": round(cy, 2),
        }
        if tag == "text":
            part["text"] = "".join(el.itertext())
        parts.append(part)

    walk(root, None, [], {}, {})
    if not parts:
        raise SystemExit("no drawable shapes found")

    for i, p in enumerate(parts):
        if p["order"] is None:
            p["order"] = i
        if p["role"] is None:
            p["role"] = "primary" if i == 0 else "secondary"
            warnings.append(f"#{p['id']}: no data-role, defaulted to {p['role']}")

    body = json.dumps({"viewBox": viewbox, "defs": defs, "parts": parts}, indent=2)
    ts = (
        f"// GENERATED by scripts/svg_to_parts.py from {Path(a.svg).name} — regenerate, don't hand-edit geometry.\n"
        "import type {LogoData} from './types';\n\n"
        f"export const LOGO: LogoData = {body};\n"
    )
    Path(a.out).write_text(ts, encoding="utf8")
    if a.copy_to:
        Path(a.copy_to).write_text(Path(a.svg).read_text(encoding="utf8"), encoding="utf8")
    print(f"wrote {a.out}: {len(parts)} part(s): " + ", ".join(f"{p['id']}({p['role']}{', draw' if p['drawable'] else ''})" for p in parts))
    for w in warnings:
        print("  warn:", w)


if __name__ == "__main__":
    main()
