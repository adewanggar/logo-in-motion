# 12 Prinsip Animasi untuk Bumper Logo

Disarikan dari 12 prinsip animasi klasik (Johnston & Thomas, *The Illusion of Life*),
diterjemahkan untuk satu pekerjaan: menghidupkan logo dalam bumper. Angka dalam frame
@30 fps. Minimal setiap bumper **sadar menerapkan**: Staging, Slow In/Out, Timing,
Follow-through, Appeal.

## 1. Squash & Stretch
Deformasi = berat dan hidup. **Dibatasi personality** (`tok.squash`). Jaga volume:
`scaleX` naik ⇒ `scaleY` turun (`squashXY()` di `lib/anim.ts`). Titik yang mendarat:
`sy 0.85 / sx 1.18` lalu pulih dalam ~30% durasi pantul.
*Gagal*: squash pada brand fintech/mewah.

## 2. Antisipasi
Siapkan mata sebelum aksi: 20–30% durasi aksi. Bentuk: benih yang mengecil sebelum pop
(PopLockup), mark yang melayang di depan lensa sebelum menghantam (Slam), ketukan kosong
sebelum goresan pertama (InkDraw), lingkaran yang mengerut sebelum jatuh (Collapse).
*Gagal*: elemen tiba-tiba "mulai" — terbaca glitch.

## 3. Staging
Satu fokus pada satu waktu: **mark → wordmark → tagline**. Periksa di contact sheet: ke
mana mata pergi pada f20? f60? Elemen pendukung bergerak lebih kecil dan lebih redup.
*Gagal*: semua bergerak bersamaan dengan amplitudo sama.

## 4. Pose to Pose
Bumper logo adalah pose-to-pose: tersembunyi → antisipasi → puncak → overshoot → final.
Pose final tidak bisa ditawar (Final Frame Contract). Setiap keyframe punya nama pose;
`keys(frame, [f0,f1,f2], [v0,v1,v2], [curve01, curve12])` menuliskan pose secara eksplisit.

## 5. Follow-through & Overlapping Action
Prinsip dengan dampak terbesar. **Hierarki seret**: container → primary → secondary →
accent, offset 2–4 f per level. Stagger huruf = 10–20% durasi satu huruf; total cascade
≤ 0,7 dtk (≤ 21 f) — huruf banyak ⇒ perkecil stagger, jangan perpanjang total
(`cascade()` sudah menghitungnya). Overshoot tipis lalu settle.
*Gagal*: semua berhenti di frame yang sama (robotik); overshoot berlebihan (melayang).

## 6. Slow In / Slow Out
Easing wajib; linear terlihat mekanis. Pengecualian satu-satunya: rotasi kontinu.
< 5 f: ease-out saja. 5–12 f: ease-out/custom. > 12 f: ease-in-out tersedia.
Pukulan (*slam*) adalah kebalikan: **ease-in** menuju benturan — ease-out terbaca
"diletakkan", ease-in terbaca "dihantam".

## 7. Arcs
Bagian yang terbang menempuh lengkung, bukan diagonal lurus (Assemble memberi
`bow` tegak lurus yang memuncak di tengah lintasan). Lintasan terbaik menggemakan
kurva logo itu sendiri.

## 8. Secondary Action
Mendukung tanpa bersaing: glow saat mark mendarat, shockwave, satu sheen. Datang
**setelah** beat utama, amplitudo lebih kecil, dibatasi `tok.secondary`. Satu per bumper.
*Gagal*: confetti pada logo B2B; efek sekunder saat aksi utama masih berlangsung.

## 9. Timing
| Konteks | Rentang | Catatan |
|---|---|---|
| Sting super-pendek | 2–3 dtk | satu gestur + hold 1 dtk; tanpa tagline |
| Bumper standar | 4–6 dtk | pola lengkap + tagline |
| Intro sinematik | 6–10 dtk | lead lebih panjang, kamera pelan, hold 1,5–2 dtk |
| End card / outro | 5–8 dtk | ruang untuk CTA/URL di bawah lockup |

Bagian besar bergerak lebih lambat; jarak pendek = durasi pendek; masuk cepat, keluar lebih cepat.

## 10. Exaggeration
Dorong yang **penting** (pendaratan mark), bukan semuanya. Budget: halus = dari scale
0.95; dramatis = dari 0.6 + blur; jenaka = overshoot `0.34,1.56,0.64,1`; elegan ≤ 2%.

## 11. Solid Drawing
Transform tidak boleh merusak geometri terverifikasi: scale seragam kecuali squash
disengaja; part tidak terlepas dari grupnya; garis dasar huruf tidak bergeser saat cascade;
**tidak ada yang terpotong tepi frame di tengah gerakan** (cek frame tengah di contact sheet).

## 12. Appeal
Uji total: mau menontonnya dua kali? Gerak yang terasa "brand memakai gerak", bukan
"gerak memakai logo". Lebih sedikit gerak yang dipilih dengan baik > banyak efek.

## Matriks interaksi singkat
- Timing menentukan panjang follow-through (berhenti cepat ⇒ settle lebih panjang).
- Arcs mengatur jalur follow-through (settle berayun, bukan bergeser).
- Rasio antisipasi tidak tergantung durasi (20–30% aksi).
- Squash muncul lagi saat mendarat.
- Staging memutuskan bagian mana yang mendapat eksagerasi; appeal menilai keseluruhan.
