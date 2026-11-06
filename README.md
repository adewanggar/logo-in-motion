# Logo in Motion

**A Claude skill for making logo bumpers as video with Remotion: logo reveals, intros, stings, outros and end cards.**

It takes a logo file (PNG/JPG/SVG) and produces MP4, ProRes or transparent WebM in 16:9, 9:16 and 1:1:

1. **Motion-ready vector.** The logo is rebuilt as the simplest smooth geometry that still matches the source. Each part of the logo becomes an "actor" with its own id.
2. **Choreography.** Motion comes from the brand's personality and the 12 principles of animation, not from taste.
3. **Deterministic rendering.** Every frame is a pure function of the frame number, so any frame re-renders identically.
4. **Evidence-based QA.** The skill renders frames at every named moment, builds a labelled contact sheet, and checks the *Final Frame Contract*: the last frame must match the static lockup pixel for pixel.
5. **Optional sound design.** SFX cues are pinned to named moments in the bumper and compensated for sample peak lag and encoder offset.

## Built-in patterns

| Pattern | Idea | Good for |
|---|---|---|
| `InkDraw` | strokes are drawn on, the wordmark is wiped in | monograms, line marks, premium or calm brands |
| `Assemble` | parts fly in on arcs, letters rise in a cascade | multi-part marks, friendly or playful brands |
| `PopLockup` | seed → pop with overshoot → slide into the lockup | compact icons, default splash |
| `Collapse` | a frame-filling ring collapses into a stamp | outros and end cards |
| `Sheen` | blur resolves to sharp, then one light sweep | premium brands |
| `Slam` | hovers in front of the lens, then slams down | sports, gaming, media |
| `Converge` | particles gather into the logo | tech, data, AI |

Every pattern comes in `16x9`, `9x16` and `1x1`. Render options: `outro` (`hold | fade | lift | iris`), `seconds`, `showTagline`, `transparent`, `grain`, `sfx`, `bgm`.

## Installation

Requires **Node.js 18+** and **Python 3.9+** with `pillow` and `numpy`.

```bash
# Claude Code: personal skill
git clone https://github.com/adewanggar/logo-in-motion ~/.claude/skills/logo-in-motion
pip install pillow numpy
```

You can also copy this folder to `.claude/skills/logo-in-motion` inside a project. For Claude.ai, zip the folder and upload it under Settings → Skills.

## Usage

Ask Claude, for example:

- "Animate this logo into a 5-second YouTube intro" (attach `logo.png`)
- "Make a logo bumper for our fintech brand, 16:9 and 9:16, transparent background"
- "Make an energetic logo outro with an impact hit and sound effects"

Claude will:

1. read the logo,
2. write a brief (`bumper_spec.md`),
3. prepare the vector,
4. pick a pattern,
5. render and run QA,
6. hand back the videos with contact sheets.

### Running the template by hand

```bash
cp -r template my-bumper && cd my-bumper
npm install
python ../scripts/svg_to_parts.py ../logo.svg --out src/logo/parts.ts --copy-to public/logo.svg
# edit src/brand.ts (name, tagline, colors, font, personality)
npm run dev                                    # Remotion Studio
node scripts/qa.mjs all --aspect 16x9          # QA: marker frames + Final Frame Contract
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9.mp4
```

## Structure

```
SKILL.md                 workflow and core rules (read by Claude)
references/              logo-prep · personality · motion-principles · bumper-patterns ·
                         timing-and-format · sound-design · qa-checklist
template/                Remotion project (React + TypeScript)
  src/brand.ts           single source for colors, font, personality
  src/logo/parts.ts      the logo as a list of actors (generated from the SVG)
  src/bumpers/*.tsx      7 patterns + a shared move vocabulary
  src/lib/               personality tokens, 20:50:30 timeline, pure animation helpers
  scripts/qa.mjs         QA frame renders + Final Frame Contract
scripts/                 analyze_logo · svg_to_parts · iou_overlay · contact_sheet · audio_peak
```

The skill's instructions and references are written in Bahasa Indonesia. Code and code comments are in English.

## License

The code and documents in this repository are under the [MIT](LICENSE) license.

Remotion has [its own license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). It is free for individuals and small teams; companies above a certain size need a company license. Any audio you add keeps its own license. Record each file in `template/public/audio/CREDITS.md`.

---

## Bahasa Indonesia

Skill Claude untuk membuat bumper logo (intro, outro, sting, end card) sebagai video dengan Remotion. Skill ini mencakup vektorisasi logo yang siap dianimasikan, koreografi berdasarkan personality brand, 7 pola siap pakai dalam 3 rasio, QA berbasis frame, dan desain suara opsional. Instalasi dan pemakaian ada di bagian atas. Instruksi skill (`SKILL.md` dan `references/`) ditulis dalam Bahasa Indonesia.
