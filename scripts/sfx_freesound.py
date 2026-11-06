#!/usr/bin/env python3
"""Source real recorded SFX from Freesound through its official API (v2).

    export FREESOUND_API_KEY=...        # free key: https://freesound.org/apiv2/apply
    python scripts/sfx_freesound.py search "short cinematic impact" --max-duration 2 --limit 8
    python scripts/sfx_freesound.py get 12345 67890 --out-dir my-bumper/public/audio/sfx

Use it when the bumper wants a recorded sound (real paper, metal, glass, a
specific foley) that the procedural kit (scripts/sfx_synth.py) cannot give.

Licensing policy:
  --license cc0 (default) accepts only Creative Commons 0.
  --license by  also accepts CC BY (attribution REQUIRED in the publication).
  Non-commercial and Sampling+ licenses are always rejected.
The license is re-checked on the sound's own record at download time; the
search listing is never treated as proof.

`get` downloads the high-quality MP3 PREVIEW (lossy, not the uploader's
original file), then writes/updates in the output directory:
  freesound-manifest.json   source, author, license, URL, sha256, measurements
  CREDITS.md                attribution lines (paste CC BY lines into the credits)
Standard library only; measuring peakLag needs scripts/audio_peak.py.
"""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://freesound.org/apiv2"
UA = "logo-in-motion-sfx/1.0"
LICENSES = {
    "http://creativecommons.org/publicdomain/zero/1.0/": "cc0",
    "https://creativecommons.org/publicdomain/zero/1.0/": "cc0",
}
FIELDS = "id,name,username,license,duration,previews,url,num_downloads,avg_rating,num_ratings,description,tags"


def key() -> str:
    k = os.environ.get("FREESOUND_API_KEY", "").strip()
    if not k:
        sys.exit("FREESOUND_API_KEY is not set. Get a free key at https://freesound.org/apiv2/apply "
                 "or use the procedural kit: python scripts/sfx_synth.py kit ...")
    return k


def call(path: str, params: dict) -> dict:
    params = {**params, "token": key()}
    req = Request(f"{API}{path}?{urlencode(params)}", headers={"User-Agent": UA})
    try:
        with urlopen(req, timeout=30) as r:
            return json.load(r)
    except HTTPError as e:
        sys.exit(f"Freesound API error {e.code}: {e.read()[:300]!r}")


def license_code(url: str) -> str:
    u = url.strip()
    if u in LICENSES:
        return LICENSES[u]
    if "/licenses/by/" in u:
        return "by"
    if "/licenses/by-nc" in u:
        return "by-nc"
    if "sampling" in u:
        return "sampling+"
    return "unknown"


def allowed(code: str, policy: str) -> bool:
    return code == "cc0" or (policy == "by" and code == "by")


def search(a):
    flt = []
    if a.license == "cc0":
        flt.append('license:"Creative Commons 0"')
    else:
        flt.append('(license:"Creative Commons 0" OR license:"Attribution")')
    if a.max_duration:
        flt.append(f"duration:[{a.min_duration} TO {a.max_duration}]")
    data = call("/search/text/", {
        "query": a.query,
        "filter": " ".join(flt),
        "fields": FIELDS,
        "page_size": min(a.limit, 50),
        "sort": "score",
    })
    rows = []
    for s in data.get("results", []):
        code = license_code(s["license"])
        if not allowed(code, a.license):
            continue
        rows.append({
            "id": s["id"],
            "name": s["name"],
            "author": s["username"],
            "license": code,
            "duration_s": round(s["duration"], 2),
            "downloads": s.get("num_downloads"),
            "rating": s.get("avg_rating"),
            "ratings": s.get("num_ratings"),
            "page": s["url"],
            "preview": s["previews"].get("preview-hq-mp3"),
            "tags": s.get("tags", [])[:8],
        })
    out = json.dumps({"query": a.query, "count": len(rows), "results": rows}, indent=2)
    if a.output:
        Path(a.output).write_text(out, encoding="utf8")
    print(out)


def get(a):
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    man_path = out / "freesound-manifest.json"
    manifest = json.loads(man_path.read_text(encoding="utf8")) if man_path.exists() else {"sounds": {}}
    failed = 0
    for sid in a.ids:
        sid = str(sid).removeprefix("fs:")
        s = call(f"/sounds/{sid}/", {"fields": FIELDS})
        code = license_code(s["license"])
        if not allowed(code, a.license):
            print(f"  skip {sid}: license {code} not allowed under --license {a.license}")
            failed += 1
            continue
        url = s["previews"]["preview-hq-mp3"]
        with urlopen(Request(url, headers={"User-Agent": UA}), timeout=60) as r:
            blob = r.read()
        if len(blob) < 1000 or blob[:3] not in (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
            print(f"  fail {sid}: response is not an MP3")
            failed += 1
            continue
        name = f"fs-{sid}.mp3"
        (out / name).write_bytes(blob)
        manifest["sounds"][name] = {
            "freesound_id": int(sid),
            "title": s["name"],
            "author": s["username"],
            "license": code,
            "license_url": s["license"],
            "page": s["url"],
            "file_kind": "Freesound HQ MP3 preview (lossy, not the original upload)",
            "duration_s": s["duration"],
            "sha256": hashlib.sha256(blob).hexdigest(),
            "downloaded": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "changes": [],
        }
        print(f"  ok   {name}  {s['name']!r} by {s['username']} ({code}, {s['duration']:.2f}s)")
    man_path.write_text(json.dumps(manifest, indent=2), encoding="utf8")
    lines = ["# Freesound credits", "", "| File | Title | Author | License | Source |", "|---|---|---|---|---|"]
    for f, m in sorted(manifest["sounds"].items()):
        lines.append(f"| {f} | {m['title']} | {m['author']} | {m['license'].upper()} | {m['page']} |")
    by = [m for m in manifest["sounds"].values() if m["license"] == "by"]
    if by:
        lines += ["", "## Attribution required (CC BY) — include in the published credits", ""]
        lines += [f"- \"{m['title']}\" by {m['author']} ({m['page']}), licensed under CC BY" for m in by]
    (out / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf8")
    print(f"wrote {man_path} and {out / 'CREDITS.md'}")
    print("next: measure each file's peakLag with scripts/audio_peak.py before pinning it in src/sound.ts")
    sys.exit(1 if failed else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--license", choices=["cc0", "by"], default="cc0")
    s.add_argument("--min-duration", type=float, default=0)
    s.add_argument("--max-duration", type=float)
    s.add_argument("--limit", type=int, default=8)
    s.add_argument("--output")
    g = sub.add_parser("get")
    g.add_argument("ids", nargs="+")
    g.add_argument("--out-dir", required=True)
    g.add_argument("--license", choices=["cc0", "by"], default="cc0")
    a = ap.parse_args()
    (search if a.cmd == "search" else get)(a)


if __name__ == "__main__":
    main()
