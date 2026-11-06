# Personality → Parameter Gerak

Easing dan durasi **diturunkan**, tidak dipilih berdasarkan selera. Hasil turunan dicatat
di `bumper_spec.md` dan diterapkan lewat `brand.personality` → `src/lib/tokens.ts`.

## 1. Letakkan brand di dua sumbu

- **Energi**: rendah (tenang, premium, institusional) ↔ tinggi (olahraga, game, startup, media)
- **Nada**: serius (keuangan, kesehatan, enterprise) ↔ jenaka (konsumen, anak, sosial)

Bukti dari logo sendiri: bentuk geometris tajam → gerak presisi; kurva organik → gerak
mengalir; bentuk bulat & warna cerah → gerak lembut/memantul. Kata brand dari user
**mengalahkan** inferensi visual.

| Prinsip | Energi rendah | Energi tinggi |
|---|---|---|
| Squash & stretch | 0–10% | 20–40% |
| Antisipasi | 2–3 f | 5–9 f |
| Durasi part | 12–24 f | 3–8 f |
| Eksagerasi | 0–15% | 25–50% |
| Follow-through | settle panjang & lembut | pantulan cepat |

| Prinsip | Serius | Jenaka |
|---|---|---|
| Lintasan | hampir lurus | melengkung, memantul |
| Aksi sekunder | minim (fade, bayangan) | boleh (kilau, riak) — tetap satu |
| Deformasi | ganti dengan scale biasa | boleh |

## 2. Preset (sudah ada di `tokens.ts`)

| Preset | Untuk | Enter | Overshoot | Squash | Part | Catatan |
|---|---|---|---|---|---|---|
| `playful` | aplikasi konsumen, anak, sosial | `0.34,1.56,0.64,1` | 1.08 | 0.18 | 0.45 s | antisipasi pendek, aksi sekunder boleh 1 yang ekspresif |
| `premium` | mewah, fashion, hospitality | `0.4,0,0.6,1` | 1.015 | 0 | 0.9 s | fade & mask > perpindahan; tanpa bounce |
| `trustworthy` | fintech, B2B, kesehatan | `0,0,0.2,1` | 1.0 | 0 | 0.6 s | mendarat tepat; satu keluarga easing |
| `energetic` | olahraga, game, media | `0.16,1,0.3,1` | 1.12 | 0.25 | 0.32 s | coil kuat, impact frame, blur gerak |
| `calm` | wellness, edukasi | `0.42,0,0.58,1` | 1.0 | 0.04 | 0.85 s | simetris, amplitudo kecil, opacity > translasi |
| `friendly` | UMKM, komunitas, jasa | `0.25,0.46,0.45,0.94` | 1.04 | 0.08 | 0.55 s | tengah di semua sumbu |

Universal: `outExpo 0.16,1,0.3,1` · `natural 0.4,0,0.2,1` · `inQuad` (untuk *slam*: percepat MENUJU benturan) · `exit 0.4,0,1,1`.

Ubah token di satu tempat; jangan menulis kurva khusus di dalam pola kecuali pola itu
memang butuh (dan beri komentar alasannya).

## 3. Matriks pemilihan pola

| Struktur logo ↓ / Personality → | premium / calm | trustworthy | friendly | playful | energetic |
|---|---|---|---|---|---|
| Mark berbasis garis / monogram / tanda tangan | **InkDraw** | InkDraw | InkDraw | Assemble | Collapse |
| Mark kompak (ikon, badge, app icon) | Sheen | **PopLockup** | PopLockup | PopLockup | **Slam** |
| Mark multi-bagian (titik + swoosh + bentuk) | Sheen | Assemble | **Assemble** | **Assemble** | Converge |
| Wordmark saja | Sheen (mask wipe) | InkDraw (wipe) | Assemble (cascade) | Assemble | Slam (huruf) |
| Mark radial (kelopak/bilah/segmen) + brand kreatif | Sheen | Assemble | **IconMorph** | **IconMorph** | IconMorph |
| Brand tech / data / AI / jaringan | Converge (lambat) | **Converge** | Converge | — | Converge |
| Outro / end card setelah video ramai | Sheen | **Collapse** | Collapse | PopLockup | Collapse |

Tebal = pilihan pertama. Bila ragu antara dua, pilih yang **lebih tenang** — bumper
diputar berulang kali; yang berlebihan cepat melelahkan.

## 4. Uji kewarasan

- Gambarkan bumper yang jadi dalam 3 kata. Cocok dengan 3 kata brand?
- Bila logo pesaing memakai gerak yang sama persis, apakah terasa sama? Bila ya, dorong
  satu prinsip lebih jauh ke arah personality (lintasan yang meniru bentuk logo, warna
  aksen, arah sapuan sesuai arah baca logo).
- Putar tanpa suara dan tanpa konteks: masih terasa brand *ini*?
- Ditonton ke-10 kalinya: masih menyenangkan, atau mengganggu? Bila mengganggu, bagi dua amplitudonya.
