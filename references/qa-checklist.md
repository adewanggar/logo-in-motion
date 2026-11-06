# QA Checklist — bukti, bukan klaim

## 1. Alat

```bash
node scripts/qa.mjs frames   --comp PopLockup-16x9 [--frames markers|0,20,45] [--props '{...}'] [--scale 0.5]
node scripts/qa.mjs contract --comp PopLockup-16x9
node scripts/qa.mjs all      --aspect 16x9 --scale 0.5
python <skill>/scripts/contact_sheet.py out/qa/PopLockup-16x9
```

- `frames markers` merender frame 0, setiap marker, **±2 frame di sekitar setiap marker**
  (cacat serah terima bersembunyi di antara ketukan yang rata), dan frame terakhir.
- `contract` merender frame terakhir (tanpa grain, `outro: hold`) dan `LogoStill` dengan rasio
  sama, lalu membandingkan piksel. Harus `PASS (0 px differ)`.
- Contact sheet memberi label `f<frame> <marker>` pada setiap tile — periksa dengan mata
  (atau model vision).

## 2. Urutan QA

1. **Geometri** (Fase 2): overlay + IoU per iterasi, crop zoom untuk kehalusan.
2. **Contract** semua komposisi yang akan dikirim, di semua rasio.
3. **Contact sheet** per pola per rasio — jawab pertanyaan di §3.
4. **Video penuh** sekali dalam kecepatan normal (Remotion Studio atau file render).
5. **Audio** (bila ada): setiap cue tercatat di `sound.ts` dengan `note`; puncak jatuh di marker;
   versi dengan & tanpa musik.
6. **Review independen** untuk bumper penting: subagent dengan konteks bersih membaca
   `bumper_spec.md`, contact sheet, dan checklist ini, lalu melapor dengan nomor frame.

## 3. Pertanyaan contact sheet

- Frame 0: kosong/bersih? Tidak ada titik cap, ekor dash, atau sisa elemen?
- Antisipasi terbaca sebelum aksi?
- Bagian-bagian ber-cascade (bukan lockstep)? Ada yang mulai & berhenti di frame sama tanpa alasan?
- Overshoot dalam batas personality?
- Ada yang terpotong tepi frame di tengah gerakan?
- Urutan baca: mark → wordmark → tagline?
- Huruf tidak bertabrakan dengan mark saat mark bergeser?
- Efek sekunder (glow, shockwave, sheen) terlihat — dan hanya sekali?
- Hold: semua frame dari `holdStart` sampai `end` identik (kecuali grain)?

## 4. Aturan estetika bernomor

Laporkan sebagai `R1 ✓` atau `R1 ✗ (PopLockup-9x16 f62)`. Pelanggaran yang disengaja boleh,
asal ditulis alasannya di `bumper_spec.md`.

**Ritme (R)**
- **R1** Lockup final ditahan diam ≥ 1 dtk. Hold diberikan pada momen brand, bukan elemen lain.
- **R2** Tidak ada gerak linear selain rotasi kontinu. Kecepatan datang dari akselerasi, bukan dari "cepat rata".
- **R3** Versi pertama hampir selalu terlalu cepat; bila ragu, perlambat satu tingkat (bumper ≥ 4 dtk untuk lockup + tagline).
- **R4** Efek yang mengguncang seluruh layar (shake, flash, pulse kamera) maksimal satu kali per bumper.

**Kualitas visual (Q)**
- **Q1** Vektor lolos gerbang kehalusan; tidak ada tepi bergerigi saat logo besar (Slam, Collapse).
- **Q2** Kamera stabil: tidak ada getaran tak disengaja; shake hanya di frame impact dan teredam.
- **Q3** Cahaya (sheen, glow) dipotong ke bentuk, satu kali, untuk tokoh utama. Tidak ada kilau massal.
- **Q4** Satu tokoh utama di pembukaan: mark dulu, sendirian, dengan busur gerak lengkap.
- **Q5** Teks terbaca: wordmark ≥ 5% tinggi frame, tagline ≥ 2.8%, kontras cukup terhadap latar (cek juga mode transparan di latar terang).
- **Q6** Warna, font, dan bentuk dari brand — bumper tidak memakai "kulit" yang asing bagi brand. Warna aksen hanya satu.

**Suara (S)**
- **S1** Kosakata sinematik (riser/whoosh/impact/shimmer/foley nyata), bukan bunyi game.
- **S2** Setiap cue dipaku ke marker dan diberi catatan aksi di layar.
- **S3** Cue dicek ulang setiap kali timeline berubah.
- **S4** Kompensasi `peakLag` + offset output diterapkan; residual ≤ 0.5 f bila diukur.

**Proses (P)**
- **P1** Jangan serahkan tanpa memeriksa frame sendiri; lampirkan contact sheet & hasil contract.
- **P2** Referensi dari user dipecah menjadi daftar teknik; tiap teknik diputuskan pakai/tidak, bukan ditiru mentah.
- **P3** Umpan balik yang ambigu ("yang pertama dipercepat") — konfirmasi objeknya dulu.
- **P4** Satu teknik = satu kali tokoh utama per bumper. Hapus duplikasi.

## 5. Laporan akhir (format)

```
Pola: PopLockup · personality trustworthy · 5 dtk @30fps
Contract: 16x9 PASS · 9x16 PASS · 1x1 PASS
Contact sheet: out/qa/PopLockup-16x9/contact_sheet.png
Aturan: R1 ✓ R2 ✓ R3 ✓ R4 ✓ Q1 ✓ Q2 ✓ Q3 ✓ Q4 ✓ Q5 ✓ Q6 ✓ S– (tanpa audio) P1 ✓
Belum diverifikasi: …
```
