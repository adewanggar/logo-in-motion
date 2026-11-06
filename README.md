# Logo in Motion

**Skill Claude untuk membuat bumper logo — logo reveal, intro, sting, outro, end card — sebagai video, dengan Remotion.**

Dari file logo (PNG/JPG/SVG) ke MP4 / ProRes / WebM transparan dalam 16:9, 9:16, dan 1:1:

1. **Vektor siap gerak** — logo dibangun ulang sebagai geometri paling sederhana yang halus; setiap bagian logo menjadi "aktor" dengan id.
2. **Koreografi** — gerak diturunkan dari personality brand dan 12 prinsip animasi, bukan dari selera.
3. **Render deterministik** — setiap frame adalah fungsi murni dari nomor frame; bisa dirender ulang identik.
4. **QA berbasis bukti** — frame di setiap marker, contact sheet berlabel, dan *Final Frame Contract* (frame terakhir harus identik piksel dengan lockup statis).
5. **Suara opsional** — cue SFX dipaku ke marker, dengan kompensasi puncak sampel dan offset encoder.

> English: a Claude skill that turns a logo into a production-ready animated logo bumper with Remotion — vector prep, personality-driven choreography, 7 ready patterns, multi-aspect rendering, frame-based QA and optional sound design.

## Pola bawaan

| Pola | Ide | Cocok untuk |
|---|---|---|
| `InkDraw` | goresan logo digambar, wordmark disapu | monogram, line mark, brand premium/tenang |
| `Assemble` | bagian logo terbang melengkung, huruf naik | logo multi-bagian, brand ramah/jenaka |
| `PopLockup` | benih → pop dengan overshoot → geser ke lockup | ikon kompak, splash default |
| `Collapse` | cincin selebar layar runtuh menjadi stempel | outro / end card |
| `Sheen` | blur menjadi tajam + satu sapuan cahaya | brand premium |
| `Slam` | melayang di depan lensa lalu menghantam | olahraga, game, media |
| `Converge` | partikel berkumpul menjadi logo | tech, data, AI |

Setiap pola tersedia dalam `16x9`, `9x16`, `1x1`, dengan opsi `outro` (`hold | fade | lift | iris`), `seconds`, `showTagline`, `transparent`, `sfx`, `bgm`.

## Instalasi

Butuh **Node.js 18+** dan **Python 3.9+** dengan `pillow` + `numpy`.

```bash
# Claude Code — skill personal
git clone https://github.com/adewanggar/logo-in-motion ~/.claude/skills/logo-in-motion
pip install pillow numpy
```

Atau salin folder ini ke `.claude/skills/logo-in-motion` di dalam proyekmu. Untuk Claude.ai,
zip folder ini lalu unggah lewat pengaturan Skills.

## Pemakaian

Cukup minta Claude, misalnya:

- "Animasikan logo ini jadi intro YouTube 5 detik" (lampirkan `logo.png`)
- "Buat bumper logo untuk brand fintech kami, 16:9 dan 9:16, latar transparan"
- "Bikin outro logo yang energik dengan efek hantaman dan sound effect"

Claude akan membaca logo, menulis brief (`bumper_spec.md`), menyiapkan vektor, memilih pola,
merender, menjalankan QA, lalu menyerahkan video + contact sheet.

### Menjalankan template secara manual

```bash
cp -r template my-bumper && cd my-bumper
npm install
python ../scripts/svg_to_parts.py ../logo.svg --out src/logo/parts.ts --copy-to public/logo.svg
# edit src/brand.ts (nama, tagline, warna, font, personality)
npm run dev                                    # Remotion Studio
node scripts/qa.mjs all --aspect 16x9          # QA: marker frames + Final Frame Contract
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9.mp4
```

## Struktur

```
SKILL.md                 alur kerja & aturan inti (dibaca Claude)
references/              logo-prep · personality · motion-principles · bumper-patterns ·
                         timing-and-format · sound-design · qa-checklist
template/                proyek Remotion (React + TypeScript)
  src/brand.ts           satu-satunya sumber warna, font, personality
  src/logo/parts.ts      logo sebagai daftar aktor (di-generate dari SVG)
  src/bumpers/*.tsx      7 pola + kosakata move bersama
  src/lib/               token personality, timeline 20:50:30, helper animasi murni
  scripts/qa.mjs         render frame QA + Final Frame Contract
scripts/                 analyze_logo · svg_to_parts · iou_overlay · contact_sheet · audio_peak
```

## Lisensi

Kode dan dokumen di repositori ini: [MIT](LICENSE).

Remotion memiliki [lisensinya sendiri](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md):
gratis untuk individu dan tim kecil; perusahaan di atas ambang tertentu memerlukan lisensi
perusahaan. Audio yang kamu tambahkan mengikuti lisensi masing-masing — catat di
`template/public/audio/CREDITS.md`.
