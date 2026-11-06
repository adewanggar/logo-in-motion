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

## 2. Sumber suara

### 2a. Generate (default) — `scripts/sfx_synth.py`

```bash
python scripts/sfx_synth.py kit --out <proyek>/public/audio/sfx --ts <proyek>/src/sfxKit.ts
python scripts/sfx_synth.py one whoosh --duration 0.9 --seed 4 --out <proyek>/public/audio/sfx/whoosh-brand.wav
```

Semua suara disintesis dari noise + osilator dengan seed tetap. Hasilnya identik di setiap
mesin, karya sendiri (tanpa lisensi pihak ketiga), dan **posisi puncaknya diketahui pasti**.
`sfxKit.ts` berisi `src`, `peakLag`, dan `frames` setiap file, jadi `sound.ts` langsung bisa
memakainya.

| Kit | Resep | Puncak |
|---|---|---|
| `whoosh`, `whoosh-b` | noise band-pass dengan frekuensi tengah yang naik-turun mengikuti amplop bell | ±55% durasi |
| `whoosh-long` | sweep lebih rendah dan panjang (1.4 dtk) | ±72% |
| `riser` | sweep sinus 180→1400 Hz + hiss yang makin terang, amplitudo eksponensial, dipotong tepat di akhir | **di akhir** (jatuh tepat di hit) |
| `impact`, `impact-soft` | thump sinus dengan pitch turun + klik transien + ekor noise low-pass | < 1 f |
| `boom` | impact lebih berat + sub panjang + crack | < 1 f |
| `pop`, `pop-b` | sinus dengan pitch turun cepat (950→320 Hz) + snap | < 1 f |
| `tick` | klik band-pass 3.2 kHz | < 1 f |
| `shimmer` | 14 parsial sinus 2–8 kHz dengan onset acak dan tremolo | ±6 f |
| `swell` | akor lembut (A add9) yang mekar lalu memudar | ±55% |
| `stroke` | noise "kuas kering" bergetar untuk draw-on | tengah |

Rencana cue default setiap pola ada di `template/src/sound.ts`. Ubah volume, tukar suara,
atau ganti dengan `{src, peakLag}` dari file lain.

### 2b. Rekaman — `scripts/sfx_freesound.py` (API resmi Freesound)

Untuk foley nyata yang tidak bisa disintesis dengan meyakinkan (kertas, logam, kaca, kain):

```bash
export FREESOUND_API_KEY=...            # gratis: https://freesound.org/apiv2/apply
python scripts/sfx_freesound.py search "dry paper slide" --max-duration 1 --limit 8
python scripts/sfx_freesound.py get 12345 67890 --out-dir <proyek>/public/audio/sfx [--license by]
python scripts/audio_peak.py <proyek>/public/audio/sfx/fs-12345.mp3 --project <proyek>
```

- Cari dengan sumber suara dan materialnya, bukan kata abstrak (`dry paper slide`, bukan `click`).
- Pilih berdasarkan kecocokan lebih dulu, baru durasi, deskripsi rekaman, unduhan, dan rating
  (rating dari banyak orang lebih bermakna).
- Lisensi dicek ulang pada record suara saat diunduh; NC / Sampling+ / tidak dikenal ditolak.
- Yang diunduh adalah **preview MP3 HQ** (lossy), bukan file asli uploader. Catat apa adanya.
- `freesound-manifest.json` dan `CREDITS.md` ditulis otomatis; baris CC BY wajib masuk ke kredit publikasi.
- Bila tidak ada API key: berikan halaman suara ke user untuk diunduh manual, lalu catat field yang sama.

### 2c. File dari user
Selalu didahulukan. Ukur `peakLag` dengan `audio_peak.py` dan catat sumbernya di `public/audio/CREDITS.md`.

## 3. Cue dipaku ke marker

`src/sound.ts` memetakan marker → cue. Jangan menulis nomor frame mentah:

```ts
case 'PopLockup':
  return [
    cue('riser', m.popPeak, 0.35, 'benih mengerut sebelum pop'),      // puncak riser = popPeak
    cue('impact-soft', m.popPeak, 0.65, 'mark pop (puncak overshoot)'),
    cue('whoosh', m.lettersStart + 4, 0.28, 'huruf keluar'),
    cue('shimmer', m.holdStart, 0.22, 'lockup selesai'),
  ];
```

`cue(sound, at, volume, note)` mengambil `src` + `peakLag` dari kit; `at` adalah frame tempat
PUNCAK suara harus jatuh. Untuk rentetan part (Assemble `_land*`, IconMorph `_pop*`) gunakan
`run(...)`: dua sampel bergantian + volume menurun. Cue yang seharusnya mulai sebelum frame 0
dipotong kepalanya (`trimBefore`), tidak digeser, jadi puncaknya tetap tepat.

Render dengan suara: `--props='{"sfx":true}'` (dan `"bgm":true` bila `BGM` diisi).

## 4. Dua offset yang harus dikompensasi

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

## 5. Mixing

- `volume` adalah pengali, bukan target loudness. Sampel dengan puncak < −12 dBFS → ganti sampel
  yang lebih bersih daripada memompa volume.
- Satu hit terkeras per bumper. Whoosh & shimmer 0.2–0.35, impact 0.5–0.7 (titik awal, sesuaikan dengan telinga).
- Musik (BGM / sting): fade in 6 f, fade out 18 f (sudah di `SoundTrack`). Bila SFX dan musik
  sama-sama punya hit, satukan di frame yang sama atau buang salah satu.
- Kirim dua versi bila ada musik: dengan musik dan tanpa musik (SFX saja) — dari timeline yang sama.

## 6. Sumber & lisensi

- Simpan file di `public/audio/sfx/` dan `public/audio/bgm/`; render tidak pernah mengambil audio dari internet.
- Catat setiap file di `public/audio/CREDITS.md`: nama file, URL sumber, pembuat, lisensi
  (CC0 / CC BY / royalty-free berlisensi), tanggal unduh, dan teks atribusi bila diwajibkan.
- Utamakan CC0. CC BY boleh bila user setuju mencantumkan atribusi. Jangan pakai audio
  dengan lisensi non-komersial untuk bumper komersial.
- Jangan klaim "sudah didengar" — yang bisa kamu verifikasi adalah metadata, durasi, puncak,
  dan selubung energi. Minta user mendengarkan versi final.

## 7. Verifikasi setelah render

```bash
npx remotion ffmpeg -v error -y -i out/x.mp4 -vn -ac 1 -ar 48000 out/x.wav
```

Hitung RMS per frame (48000/30 sampel). Hit utama (impact/boom) harus muncul ≤ 1 f dari markernya,
dan sample peak < −1 dBFS. Contoh tes: PopLockup `popPeak` f37 → onset impact f36, energi
tertinggi f37, puncak −4.7 dBFS.

Offset output (`OUTPUT_AUDIO_OFFSET_F = 1.28`) hanya berlaku untuk audio AAC (MP4). Ekspor dengan
audio PCM (WAV, ProRes `.mov`) tidak punya delay encoder, sehingga semua cue terdengar ±1–2 f lebih
awal. Untuk deliverable PCM yang harus presisi, set offset ke 0 sebelum render. Hasil tes ekspor
WAV kedelapan pola: hit utama selalu 2 f sebelum marker, sesuai prediksi.

## 8. Setelah gambar berubah

Setiap perubahan durasi, jendela, atau marker ⇒ cek ulang semua cue. Karena cue dipaku
ke marker, sebagian besar ikut bergeser otomatis; yang perlu dicek manual adalah offset
relatif (`m.popPeak - 14`) dan panjang potongan sampel.
