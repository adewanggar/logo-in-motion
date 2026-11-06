# Desain Suara untuk Bumper

Bumper yang bagus tetap bekerja tanpa suara — tetapi dengan suara yang tepat, ia terasa
dua kali lebih mahal. Suara dikerjakan **setelah gambar dikunci**.

## 1. Kosakata

| Momen gambar | Jenis suara | Kata kunci pencarian | Seleksi |
|---|---|---|---|
| Penantian / antisipasi | riser pendek, swell | `short cinematic riser`, `reverse swell` | puncak tepat di frame pendaratan |
| Bagian terbang / kamera bergerak | whoosh | `short soft whoosh`, `swish` | serangan cepat, ekor pendek |
| Logo mendarat | impact | `short cinematic impact`, `deep hit`, `soft thud` | berat tanpa menutupi musik |
| Goresan / draw-on | foley | `brush stroke`, `pen on paper` | panjang dipotong sesuai durasi draw |
| Lockup selesai | shimmer / sparkle | `subtle shimmer`, `chime glint` | tipis, ekor alami |
| Sting brand utuh | logo sting | `logo sting`, `brand reveal` | atau gunakan musik yang diberikan user |

**Hindari bunyi game** (bloop, pluck sintetis, nada "level up") kecuali brand memang game.
Pertanyaan pemilah: apakah ini bunyi benda nyata (kertas, logam, kaca, udara), atau
bunyi notifikasi aplikasi? Yang pertama dipakai.

Pola umum satu bumper: **riser → impact → shimmer** (+ whoosh untuk wordmark). Untuk
pola premium cukup swell + shimmer, tanpa impact.

## 2. Cue dipaku ke marker

`src/sound.ts` memetakan marker → cue. Jangan menulis nomor frame mentah:

```ts
case 'PopLockup':
  return [
    {at: m.popPeak - 14, src: 'audio/sfx/riser-short.mp3', volume: 0.35, durationInFrames: 16, note: 'benih mengerut sebelum pop'},
    {at: m.popPeak,      src: 'audio/sfx/impact-soft.mp3', volume: 0.6, peakLag: 2, note: 'mark mendarat'},
    {at: m.lettersStart, src: 'audio/sfx/whoosh-short.mp3', volume: 0.3, peakLag: 6, note: 'huruf keluar'},
    {at: m.holdStart,    src: 'audio/sfx/shimmer.mp3',     volume: 0.25, note: 'lockup selesai'},
  ];
```

Render dengan suara: `--props='{"sfx":true}'` (dan `"bgm":true` bila `BGM` diisi).

## 3. Dua offset yang harus dikompensasi

```
Sequence.from = frameTargetPuncak − peakLag(file) − OUTPUT_AUDIO_OFFSET_F
```

- **peakLag** — jarak dari awal file ke puncak energinya. Banyak SFX punya napas/serangan
  sebelum puncak; meratakan di awal file berarti terlambat.
  ```bash
  python <skill>/scripts/audio_peak.py public/audio/sfx/impact-soft.mp3 --fps 30 --project .
  ```
  Ambil `peakLag_frames`. Untuk sampel multi-hit, baca `envelope_50ms` dan pilih ketukan semantik.
- **Offset output** — encoder AAC menambahkan sampel "priming" di depan trek audio
  (≈ 1–1.3 frame @30fps pada 48 kHz). Nilai default `OUTPUT_AUDIO_OFFSET_F = 1.28`
  di `SoundTrack.tsx`. Nilai ini bergantung pada versi Remotion + codec + sample rate +
  container; ukur ulang bila salah satunya berubah: render, ekstrak audio
  (`npx remotion ffmpeg -i out/x.mp4 -vn out/x.wav`), lalu cross-correlate 2–3 SFX tajam
  terhadap file aslinya. Residual ≤ 0.5 f = lulus.
- `durationInFrames` (pemotongan sampel) **tidak** ikut digeser.
- Cue di 2 frame pertama tidak bisa dikompensasi penuh — jangan taruh hit di sana.

## 4. Mixing

- `volume` adalah pengali, bukan target loudness. Sampel dengan puncak < −12 dBFS → ganti sampel
  yang lebih bersih daripada memompa volume.
- Satu hit terkeras per bumper. Whoosh & shimmer 0.2–0.35, impact 0.5–0.7 (titik awal, sesuaikan dengan telinga).
- Musik (BGM / sting): fade in 6 f, fade out 18 f (sudah di `SoundTrack`). Bila SFX dan musik
  sama-sama punya hit, satukan di frame yang sama atau buang salah satu.
- Kirim dua versi bila ada musik: dengan musik dan tanpa musik (SFX saja) — dari timeline yang sama.

## 5. Sumber & lisensi

- Simpan file di `public/audio/sfx/` dan `public/audio/bgm/`; render tidak pernah mengambil audio dari internet.
- Catat setiap file di `public/audio/CREDITS.md`: nama file, URL sumber, pembuat, lisensi
  (CC0 / CC BY / royalty-free berlisensi), tanggal unduh, dan teks atribusi bila diwajibkan.
- Utamakan CC0. CC BY boleh bila user setuju mencantumkan atribusi. Jangan pakai audio
  dengan lisensi non-komersial untuk bumper komersial.
- Jangan klaim "sudah didengar" — yang bisa kamu verifikasi adalah metadata, durasi, puncak,
  dan selubung energi. Minta user mendengarkan versi final.

## 6. Setelah gambar berubah

Setiap perubahan durasi, jendela, atau marker ⇒ cek ulang semua cue. Karena cue dipaku
ke marker, sebagian besar ikut bergeser otomatis; yang perlu dicek manual adalah offset
relatif (`m.popPeak - 14`) dan panjang potongan sampel.
