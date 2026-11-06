---
name: logo-in-motion
description: "Membuat bumper logo (logo reveal / logo intro / logo sting / ident / end card / outro logo) berupa video MP4 atau video transparan dengan Remotion. Alurnya: membaca logo (PNG/JPG/SVG) → vektor bersih yang siap dianimasikan (setiap bagian logo punya id) → koreografi berbasis 12 prinsip animasi dan personality brand → render deterministik dalam 16:9, 9:16, dan 1:1 → QA berbasis frame (Final Frame Contract, contact sheet) → desain suara opsional. Gunakan setiap kali user ingin menganimasikan logo menjadi video, membuat intro/outro channel, bumper iklan, logo animation untuk YouTube/Reels/TikTok, splash video brand, atau mengubah logo statis menjadi motion, meskipun user tidak menyebut kata 'bumper' atau 'Remotion'."
---

# Logo in Motion — Bumper Logo dengan Remotion

Bumper logo adalah film pendek 3–8 detik dengan satu tugas: **membuat penonton
mengingat brand**. Skill ini menyatukan tiga disiplin:

1. **Vektor** — logo dibangun ulang sebagai geometri paling sederhana yang tetap halus
   dan setia pada sumber. Geometri minimal = geometri yang bisa dianimasikan.
2. **Motion** — koreografi diturunkan dari personality brand dan 12 prinsip animasi,
   bukan dari selera atau efek yang sedang tren.
3. **Film** — dirender frame demi frame di Remotion: deterministik, bisa diperiksa per
   frame, keluar sebagai MP4 / ProRes / WebM transparan dalam semua rasio.

Satu aturan mengikat semuanya, yaitu **Final Frame Contract**: frame terakhir bumper
**identik piksel demi piksel** dengan lockup statis yang sudah diverifikasi. Animasi
harus mendarat tepat di logo, tidak "kira-kira di sana".

## Isi skill

```
SKILL.md                     ← file ini: alur kerja & aturan inti
references/
  logo-prep.md               ← raster → SVG siap gerak (tangga kompleksitas, gerbang kehalusan, kontrak part)
  personality.md             ← kata brand → token easing/timing + pemilihan pola
  motion-principles.md       ← 12 prinsip animasi khusus bumper logo (dalam frame)
  bumper-patterns.md         ← katalog 8 pola siap pakai + resep tambahan + cara menulis pola baru
  timing-and-format.md       ← struktur waktu, durasi, rasio, safe area, codec, ekspor alpha
  sound-design.md            ← kosakata SFX, cue berbasis marker, kompensasi offset, lisensi
  qa-checklist.md            ← QA berbasis bukti + aturan estetika bernomor
template/                    ← proyek Remotion siap render (salin per proyek)
scripts/                     ← analyze_logo, svg_to_parts, iou_overlay, contact_sheet, audio_peak
```

## Deliverables

Untuk setiap bumper, serahkan:

- `logo.svg` — vektor final siap gerak (satu elemen per aktor, id stabil)
- `bumper_spec.md` — brief, personality, pola, tabel timeline (frame), marker, daftar SFX, keputusan & trade-off
- `out/<Pola>-16x9.mp4` (+ `-9x16`, `-1x1` bila diminta) — H.264, 30 fps
- versi transparan bila diminta (`.mov` ProRes 4444 atau `.webm` VP9)
- versi dengan dan tanpa audio bila ada musik/SFX
- `out/qa/<comp>/contact_sheet.png` + log Final Frame Contract `PASS`
- `poster.png` — frame hold (untuk thumbnail / end card statis)

---

## Fase 0 — Intake (tanyakan seperlunya)

Kumpulkan; tanyakan hanya yang tidak bisa disimpulkan dengan aman:

| Input | Default bila tidak disebut |
|---|---|
| File logo (SVG lebih baik; PNG/JPG oke, minimal ±300 px tinggi) | wajib ada; bila kecil, minta versi besar mark terpisah |
| Font brand (file / nama) | tanpa file: pakai font sistem terdekat dan ungkapkan sebagai deviasi |
| Nama brand + tagline | ambil dari logo; tagline kosong |
| Kata brand / industri | simpulkan dari bentuk logo (lihat `personality.md`) |
| Pemakaian: intro channel, outro, iklan, splash | intro 5 detik |
| Rasio | 16:9; tawarkan 9:16 & 1:1 |
| Durasi | 5 detik (pola Slam 4 dtk, Sheen 6 dtk) |
| Audio | tanpa audio; tawarkan SFX |
| Latar transparan | tidak |

Jangan bertanya hal yang bisa diputuskan dari logo itu sendiri. Bila user berkata
"terserah kamu", putuskan, catat alasannya di `bumper_spec.md`, lalu lanjutkan.

## Fase 1 — Brief (sebelum menyentuh kode)

1. **Baca logo.** Untuk raster: `python scripts/analyze_logo.py logo.png` → ukuran,
   alpha, warna dominan, komponen terhubung. Setiap komponen adalah calon **aktor**.
2. **Inventaris part**: mark vs wordmark, huruf, titik, swoosh, kontainer, ruang negatif.
   Tetapkan role: `container → primary → secondary → accent` (hierarki seret / drag
   hierarchy: yang besar mendarat duluan, aksen terakhir).
3. **Personality**: 3 kata brand → preset di `references/personality.md` → token
   (easing, overshoot, squash, durasi part, stagger, budget aksi sekunder).
4. **Pilih pola** dari `references/bumper-patterns.md` berdasarkan struktur logo dan
   personality. Satu bumper = satu ide utama. Jangan menumpuk tiga efek "keren".
5. **Sketsa timeline dalam frame** (30 fps): lead → antisipasi → aksi → settle → **HOLD ≥ 1 dtk** → exit opsional.
6. Tulis semuanya di `bumper_spec.md` (templat di `references/timing-and-format.md`).
   Setiap parameter berikutnya harus bisa ditelusuri ke brief ini.

## Fase 2 — Vektor siap gerak

Ikuti `references/logo-prep.md`. Ringkasnya:

- **Tangga kompleksitas**: primitif → komposit primitif → sedikit kurva kubik → outline
  halus → (terakhir) hasil trace yang dihaluskan. Naik satu anak tangga hanya bila
  overlay membuktikan ada ketidakcocokan struktural.
- **Gerbang kehalusan (wajib)**: tepi yang seharusnya halus tidak boleh bergerigi,
  bergetar, atau penuh titik kecil — walau IoU tinggi. IoU adalah diagnostik, bukan gerbang.
- **Kontrak part**: satu elemen per aktor, `id` semantik, `data-role`, `data-order`;
  stroke yang akan "digambar" memakai `stroke` + `fill="none"`; potong path di
  sambungan animasi; jangan pakai selektor struktural.
- **QA geometri**: render vektor di ukuran sumber (komposisi `LogoCheck`) lalu
  `python scripts/iou_overlay.py`. Budget: **maks 10 iterasi**; berhenti lebih awal
  bila lolos. Catat IoU, piksel selisih, dan putusan visual per iterasi.
- Konversi ke Remotion: `python scripts/svg_to_parts.py logo.svg --out template/src/logo/parts.ts --copy-to template/public/logo.svg`.

Bila user memberi SVG yang sudah bersih, cukup audit kontrak part-nya dan rapikan
id/role — jangan menggambar ulang logo yang sudah benar.

## Fase 3 — Bangun bumper di Remotion

1. Salin `template/` **tanpa** `node_modules/` dan `out/` ke folder proyek (mis. `bumper-<brand>/`), lalu `npm install`.
2. Isi `src/brand.ts`: nama, `nameParts` bila wordmark multi-warna, tagline, warna (sampel dari
   area padat sumber, bukan tepi antialias), font (file font lokal di `public/fonts` agar metrik
   teks deterministik), personality, orientasi lockup. Latar mengikuti dunia brand (mis. artboard
   krem pada logo sumber), tidak otomatis gelap.
3. Generate `src/logo/parts.ts` dari SVG (Fase 2).
4. Pratinjau: `npm run dev` (Remotion Studio). Komposisi tersedia per rasio:
   `InkDraw | Assemble | PopLockup | Collapse | Sheen | Slam | Converge | IconMorph` × `16x9 | 9x16 | 1x1`,
   plus `LogoStill-<rasio>` (lockup statis referensi) dan `LogoCheck` (QA geometri).
5. Sesuaikan pola terpilih, atau tulis pola baru mengikuti "Menulis pola baru" di
   `bumper-patterns.md`. Aturan implementasi:
   - **Semua nilai adalah fungsi murni dari frame.** Tanpa `Math.random()`, `Date.now()`,
     atau state antar-frame. Acak = `seeded(n)` dari `lib/rand.ts`.
   - **Easing dari token**, bukan diketik ulang. Linear hanya untuk rotasi kontinu.
   - **Setiap move kembali ke identitas** setelah jendelanya selesai (kembalikan `{}` /
     `undefined`), sehingga frame terakhir = `LogoStill`.
   - Kamera (push-in, shake) hanya di `Stage`, tidak dipalsukan per part.
   - Teks wordmark adalah teks hidup per huruf; posisinya dari `useLockupLayout`.

## Fase 4 — Suara (opsional, setelah gambar dikunci)

Baca `references/sound-design.md`. Kosakatanya sinematik: **riser → whoosh → impact →
shimmer**, bukan bunyi game. Setiap cue dipaku ke **marker** bumper (bukan nomor frame
mentah) di `src/sound.ts`, dengan `peakLag` hasil `scripts/audio_peak.py` dan offset
output pipeline. Setiap file dicatat sumber + lisensinya di `public/audio/CREDITS.md`.
Bila gambar berubah, semua cue dicek ulang.

## Fase 5 — QA berbasis bukti

Baca `references/qa-checklist.md`. Minimal:

```bash
cd <proyek>
node scripts/qa.mjs all --aspect 16x9 --scale 0.5        # frame di setiap marker (±2f) + Final Frame Contract
python <skill>/scripts/contact_sheet.py out/qa/PopLockup-16x9
```

- Final Frame Contract harus `PASS (0 px differ)` untuk setiap komposisi & rasio yang dikirim.
- Periksa contact sheet secara visual: urutan baca, cascade (bukan lockstep), overshoot
  sesuai personality, tidak ada yang terpotong frame, tidak ada artefak di frame 0.
- Ulangi untuk setiap rasio yang dikirim (`--aspect 9x16`, `--aspect 1x1`).
- Untuk bumper penting, minta **subagent dengan konteks bersih** memeriksa contact sheet +
  `bumper_spec.md` + checklist. Pembuat selalu bias terhadap karyanya sendiri.

## Fase 6 — Render & serah terima

```bash
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9.mp4
npx remotion render src/index.ts PopLockup-9x16 out/PopLockup-9x16.mp4
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9-sfx.mp4 --props='{"sfx":true}'
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9-alpha.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --props='{"transparent":true}'
npx remotion still  src/index.ts LogoStill-16x9 out/poster.png
```

Opsi per render lewat `--props`: `outro` (`hold|fade|lift|iris`), `seconds`,
`showTagline`, `transparent`, `grain`, `sfx`, `bgm`. Detail codec & platform di
`references/timing-and-format.md`.

Serahkan file, contact sheet, hasil contract, dan ringkasan `bumper_spec.md`
(pola, personality, durasi, marker, SFX + lisensi). Sebutkan dengan jujur apa yang
belum diverifikasi (mis. "audio belum didengar di speaker", "9:16 belum di-QA").

---

## Aturan inti (ringkas — detail & alasan di references)

1. **Hold ≥ 1 detik** pada lockup final, diam sempurna. Itu momen brand diingat.
2. **Satu ide utama per bumper.** Satu impact, satu sheen, satu shake — maksimal.
3. **Tidak ada yang mulai dan berhenti di frame yang sama** kecuali disengaja. Stagger 10–20% durasi part.
4. **20 : 50 : 30** — antisipasi : aksi : follow-through, kecuali pola punya alasan terdokumentasi.
5. **Keluar lebih cepat dari masuk.** Exit ≈ 0,4 dtk.
6. **Personality membatasi eksagerasi.** Brand fintech tidak squash; brand mainan boleh.
7. **Teks harus terbaca**: wordmark ≥ 5% tinggi frame, tagline ≥ 2,8% (dihitung pada piksel akhir).
8. **Final Frame Contract** untuk setiap komposisi yang dikirim.
9. **Deterministik**: frame mana pun bisa dirender ulang dan hasilnya identik.
10. **Jujur pada bukti**: jangan klaim "sudah dicek" tanpa contact sheet / log.

## Kapan membaca file mana

| Momen | Baca |
|---|---|
| Logo masih raster / SVG berantakan | `logo-prep.md` |
| Menentukan gaya gerak | `personality.md`, `motion-principles.md` |
| Memilih / menulis pola | `bumper-patterns.md` |
| Menentukan durasi, rasio, ekspor | `timing-and-format.md` |
| Menambah audio | `sound-design.md` |
| Sebelum menyerahkan | `qa-checklist.md` |
