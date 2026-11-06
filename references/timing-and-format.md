# Timing, Format, dan Ekspor

## 1. Anatomi waktu

| Fase | Default | Aturan |
|---|---|---|
| Lead | 0.05–0.3 dtk | ketukan kosong/redup agar mata tiba sebelum logo |
| Reveal | sisa durasi | 20 : 50 : 30 (antisipasi : aksi : settle) |
| **Hold** | max(1 dtk, 26–30% total) | lockup diam sempurna; kamera juga diam |
| Exit | 0.4 dtk bila `outro ≠ hold` | lebih cepat dari masuk; `fade`, `lift`, `iris` |

`makeTimeline()` melempar error bila durasi terlalu pendek untuk reveal ≥ 0.5 dtk — itu disengaja.

Durasi minimum praktis: **3 dtk** (sting tanpa tagline), 4 dtk (dengan tagline).

## 2. Rasio & layout

| Komposisi | Ukuran | Lockup `auto` |
|---|---|---|
| `*-16x9` | 1920×1080 | horizontal: mark kiri, wordmark kanan |
| `*-9x16` | 1080×1920 | stacked: mark di atas wordmark |
| `*-1x1` | 1080×1080 | horizontal (otomatis diperkecil agar ≤ 80% lebar) |

`brand.lockup` bisa dipaksa: `horizontal | stacked | mark-only | wordmark-only`.
Safe area: lockup + tagline berada di ≤ 80% lebar dan dekat tengah vertikal, aman dari UI
platform (caption & tombol di Reels/TikTok/Shorts menutup ~20% bawah dan ~12% kanan pada 9:16).

## 3. Render

```bash
# MP4 H.264 (default Remotion: crf 18, yuv420p)
npx remotion render src/index.ts PopLockup-16x9 out/PopLockup-16x9.mp4

# durasi lain / exit lain
npx remotion render src/index.ts PopLockup-16x9 out/pop-3s.mp4 --props='{"seconds":3,"showTagline":false}'
npx remotion render src/index.ts PopLockup-16x9 out/pop-fade.mp4 --props='{"outro":"fade"}'

# transparan — ProRes 4444 (editor video: Premiere, Resolve, Final Cut)
npx remotion render src/index.ts PopLockup-16x9 out/pop-alpha.mov --codec=prores --prores-profile=4444 \
  --pixel-format=yuva444p10le --image-format=png --props='{"transparent":true}'

# transparan — WebM VP9 (web)
npx remotion render src/index.ts PopLockup-16x9 out/pop-alpha.webm --codec=vp9 --pixel-format=yuva420p \
  --image-format=png --props='{"transparent":true}'

# GIF ringan untuk pratinjau (bukan deliverable utama)
npx remotion render src/index.ts PopLockup-1x1 out/pop.gif --codec=gif --every-nth-frame=2 --scale=0.5

# poster / thumbnail
npx remotion still src/index.ts LogoStill-16x9 out/poster.png
```

Mode transparan otomatis mematikan latar, grain, dan flash layar penuh. Periksa satu frame
transparan di atas latar terang **dan** gelap — logo berwarna terang bisa hilang di latar terang.

## 4. Platform

| Pemakaian | Rasio | Durasi | Catatan |
|---|---|---|---|
| Intro YouTube | 16:9 | 3–5 dtk | penonton melewatkan intro panjang |
| Outro / end screen YouTube | 16:9 | 5–20 dtk | sisakan ruang end-screen; pakai `outro: hold` lalu perpanjang hold di editor |
| Reels / TikTok / Shorts | 9:16 | 2–4 dtk | logo di tengah atas, jauh dari UI bawah |
| Iklan (pre-roll, bumper ads) | 16:9 + 1:1 + 9:16 | 2–6 dtk | brand terbaca di 2 dtk pertama |
| Presentasi / event | 16:9 | 5–8 dtk | boleh lebih sinematik |
| Splash aplikasi | 9:16 | 1.5–2.5 dtk | ekspor juga Lottie/HTML bila diminta (di luar skill ini) |

## 5. Templat `bumper_spec.md`

```markdown
# Bumper — <Brand>

## Brief
- Pemakaian: … | Rasio: … | Durasi: … | Audio: … | Transparan: …
- 3 kata brand: … → preset `…` (alasan: …)
- Pola: `…` (alasan: struktur logo …, personality …)

## Part inventory
| id | role | order | drawable | catatan |

## Vektor
- Level kompleksitas: … (alasan)
- Iterasi: | NN | perubahan | IoU | src_only | render_only | halus | putusan |
- Trade-off yang diterima: …

## Timeline (30 fps, total … f)
| Fase | Frame | Isi |
| lead | 0–… | |
| … | | |
| hold | …–… | lockup diam |

## Marker
| marker | frame | dipakai untuk |

## Suara
| marker | file | volume | peakLag | sumber & lisensi |

## QA
- Contract: 16x9 PASS · 9x16 PASS · 1x1 PASS
- Contact sheet: out/qa/…/contact_sheet.png — temuan & perbaikan: …
- Belum diverifikasi: …
```
