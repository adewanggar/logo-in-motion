# Logo in Motion

**A Claude skill for making logo bumpers as video with Remotion: logo reveals, intros, stings, outros and end cards.**

It takes a logo file (PNG/JPG/SVG) and produces MP4, ProRes or transparent WebM in 16:9, 9:16 and 1:1:

1. **Motion-ready vector.** The logo is rebuilt as the simplest smooth geometry that still matches the source. Each part of the logo becomes an "actor" with its own id.
2. **Choreography.** Motion comes from the brand's personality and the 12 principles of animation, not from taste.
3. **Deterministic rendering.** Every frame is a pure function of the frame number, so any frame re-renders identically.
4. **Evidence-based QA.** The skill renders frames at every named moment, builds a labelled contact sheet, and checks the *Final Frame Contract*: the last frame must match the static lockup pixel for pixel.
5. **Sound effects included.** A procedural generator makes a cinematic SFX kit (whoosh, riser, impact, boom, pop, shimmer…) with no third-party licenses. Every pattern comes with a sound plan pinned to its key moments. Recorded sounds can also be pulled from Freesound.

## Built-in patterns

The GIFs below are silent previews of the sample logos that ship with the template. The MP4 renders carry sound.

| | |
|---|---|
| ![InkDraw](docs/gifs/InkDraw.gif)<br>**`InkDraw`**: strokes are drawn on, the wordmark is wiped in. *Monograms, line marks, premium or calm brands.* | ![Assemble](docs/gifs/Assemble.gif)<br>**`Assemble`**: parts fly in on arcs, letters rise in a cascade. *Multi-part marks, friendly or playful brands.* |
| ![PopLockup](docs/gifs/PopLockup.gif)<br>**`PopLockup`**: seed → pop with overshoot → slide into the lockup. *Compact icons, default splash.* | ![Collapse](docs/gifs/Collapse.gif)<br>**`Collapse`**: a frame-filling ring collapses into a stamp. *Outros and end cards.* |
| ![Sheen](docs/gifs/Sheen.gif)<br>**`Sheen`**: blur resolves to sharp, then one light sweep. *Premium brands.* | ![Slam](docs/gifs/Slam.gif)<br>**`Slam`**: hovers in front of the lens, then slams down. *Sports, gaming, media.* |
| ![Converge](docs/gifs/Converge.gif)<br>**`Converge`**: particles gather into the logo. *Tech, data, AI.* | ![IconMorph](docs/gifs/IconMorph.gif)<br>**`IconMorph`**: a ring of brand icons spins in and morphs smoothly into the logo's parts. *Radial marks (petals, blades), creative brands.* |

Every pattern comes in `16x9`, `9x16` and `1x1`. Render options: `outro` (`hold | fade | lift | iris`), `seconds`, `showTagline`, `transparent`, `grain`, `sfx`, `bgm`.

## Sound effects

```bash
# 1. Generate the kit: procedural, deterministic, no third-party license (already included in the template)
python scripts/sfx_synth.py kit --out template/public/audio/sfx --ts template/src/sfxKit.ts

# 2. Render with sound: each pattern's cues live in template/src/sound.ts
npx remotion render src/index.ts IconMorph-16x9 out/IconMorph-16x9.mp4 --props='{"sfx":true}'

# Optional: recorded sounds from Freesound (free API key: https://freesound.org/apiv2/apply)
export FREESOUND_API_KEY=...
python scripts/sfx_freesound.py search "paper slide" --max-duration 1
python scripts/sfx_freesound.py get 12345 --out-dir my-bumper/public/audio/sfx
```

| Sound | Use |
|---|---|
| `whoosh`, `whoosh-b`, `whoosh-long` | travelling parts, spins, camera moves |
| `riser` | build-up that peaks exactly on the landing |
| `impact`, `impact-soft`, `boom` | the logo landing; `boom` for slams |
| `pop`, `pop-b`, `tick` | small parts, icons, letters |
| `shimmer`, `swell` | afterglow on the finished lockup; soft bloom for premium brands |
| `stroke` | draw-on |

The peak of every cue lands on its marker. The generated table records each file's peak offset, and the encoder's audio delay is compensated. Runs of repeated sounds alternate between two samples and step down in volume, so they never sound like a machine gun.

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
  src/bumpers/*.tsx      8 patterns + a shared move vocabulary
  src/lib/morph.ts       any-shape-to-any-shape morphing (resample, match, lerp)
  src/logo/icons.ts      source icons for IconMorph
  src/lib/               personality tokens, 20:50:30 timeline, pure animation helpers
  scripts/qa.mjs         QA frame renders + Final Frame Contract
  src/sound.ts           sound plan per pattern (cues pinned to markers)
  public/audio/sfx/      generated SFX kit (WAV) + sfx-kit.json
scripts/                 analyze_logo · svg_to_parts · iou_overlay · contact_sheet · audio_peak ·
                         sfx_synth (generate SFX) · sfx_freesound (source recorded SFX)
docs/gifs/               README previews
```

The skill's instructions and references are written in Bahasa Indonesia. Code and code comments are in English.

## License

The code and documents in this repository are under the [MIT](LICENSE) license.

Remotion has [its own license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). It is free for individuals and small teams; companies above a certain size need a company license. Any audio you add keeps its own license. Record each file in `template/public/audio/CREDITS.md`.

---

## Bahasa Indonesia

Skill Claude untuk membuat bumper logo (intro, outro, sting, end card) sebagai video dengan Remotion. Skill ini mencakup vektorisasi logo yang siap dianimasikan, koreografi berdasarkan personality brand, generator sound effect, 8 pola siap pakai dalam 3 rasio (termasuk IconMorph: ikon brand yang berubah menjadi bagian logo), QA berbasis frame, dan desain suara opsional. Instalasi dan pemakaian ada di bagian atas. Instruksi skill (`SKILL.md` dan `references/`) ditulis dalam Bahasa Indonesia.
