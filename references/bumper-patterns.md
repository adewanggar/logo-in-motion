# Katalog Pola Bumper

Delapan pola siap pakai ada di `template/src/bumpers/`. Setiap pola: satu ide utama,
marker bernama (untuk SFX & QA), dan kembali ke identitas sebelum hold. Angka frame di
bawah untuk durasi default @30 fps; semua jendela ditulis sebagai **fraksi dari rentang
reveal** sehingga otomatis menyesuaikan saat `seconds` diubah.

Struktur waktu bersama (`lib/timeline.ts`):

```
[ lead | antisipasi | aksi | settle | HOLD ≥1 dtk | exit? ]
         \____ reveal, 20 : 50 : 30 ____/
```

---

## 1. InkDraw — goresan digambar, wordmark disapu
**Untuk**: mark berbasis garis, monogram, tanda tangan, C-mark. **Personality**: premium, trustworthy, calm, friendly.
**Bentuk**: 10 : 70 : 20 (menggambar = aksi).

| Jendela (fraksi reveal) | Isi |
|---|---|
| 0.04–0.56 | part `drawable` digambar berurutan (overlap 25%), kurva `narrative` |
| 0.46 + stagger | part isi (fill) pop setelah pena lewat |
| 0.50–0.84 | wordmark: mask wipe arah baca + drift 0.12 em yang mengendap |
| 0.76–1.00 | tagline fade + naik |
| sepanjang reveal | kamera push 0.965 → 1, berhenti tepat saat reveal selesai |

Marker: `drawStart, drawEnd, accentLand, wordStart, tagIn, holdStart, end`.
Suara: goresan halus (pena/kuas kering) sepanjang draw, tick kecil saat aksen mendarat, whoosh lembut untuk wipe.
**Jebakan**: cap bulat membuat ujung goresan mendahului pena setengah lebar stroke — wajar
untuk satu goresan, tapi untuk garis yang berpotongan sendiri pakai resep *split draw-on* (bawah).
Titik awal stroke yang terlihat sebagai noda di frame pertama gambar → pindahkan titik awal ke tempat tersembunyi.

## 2. Assemble — bagian terbang melengkung, huruf naik
**Untuk**: mark multi-bagian. **Personality**: friendly, playful, energetic, trustworthy.
**Bentuk**: 20 : 50 : 30.

| Jendela | Isi |
|---|---|
| 0.00–0.55 | part datang dari arah luar (vektor pusat-logo → pusat-part) sejauh ±2× lebar mark, lengkung tegak lurus, rotasi −18° → 0 **searah untuk semua part** (mark radial berputar masuk seperti kincir), blur gerak, urut `order` |
| 0.50 | huruf naik (0.55 em) + rotasi 4° → 0, cascade dibatasi 0,7 dtk |
| 0.80–1.00 | tagline |

Marker: `firstPart, lastPartLand, lettersStart, tagIn, holdStart, end`.
Suara: whoosh pendek per part (dua sampel bergantian, volume menurun), klik/tap fisik saat mendarat, shimmer di akhir.
**Jebakan**: part yang pusatnya di tengah logo datang dari bawah (arah default). Bila >6 part,
kelompokkan per role agar tidak terbaca sebagai badai.

## 3. PopLockup — benih → pop → geser → huruf keluar
**Untuk**: mark kompak; gestur splash default. **Personality**: friendly, playful, energetic, trustworthy.
**Bentuk**: 20 : 50 : 30 secara harfiah.

| Jendela | Isi |
|---|---|
| 0.00–0.16 | benih aksen muncul di tengah lalu **mengerut** (antisipasi) |
| 0.14–0.42 | mark pop dari 0.3 → overshoot (≥1.04) → 1, blur 10 → 0; glow sekunder memuncak saat mendarat |
| 0.46–0.72 | mark bergeser dari tengah frame ke slot lockup (`markToCenter`) |
| 0.58 | huruf slide dari arah mark (horizontal) atau naik (stacked) |
| 0.80–1.00 | tagline |

Marker: `seedIn, popPeak, shiftStart, lettersStart, tagIn, holdStart, end`.
Suara: riser pendek → impact lembut di `popPeak` → whoosh di `lettersStart` → shimmer di `holdStart`.
**Jebakan**: huruf yang mulai sebelum mark cukup jauh bergeser akan bertumpuk — jaga huruf ≥ 0.1 reveal setelah `shiftStart`.

## 4. Collapse — cincin selebar layar runtuh menjadi stempel
**Untuk**: outro / end card setelah video ramai, brand yang ingin "mengunci". **Personality**: energetic, trustworthy, friendly.

| Jendela | Isi |
|---|---|
| 0.00–0.34 | cincin aksen 6× → 1× (kurva narrative) |
| sekitar 0.34 | rem: +6% dengan amplop sin (berhenti mendadak dengan inersia) |
| 0.27–0.40 | serah terima: cincin memudar, mark masuk **sudah di ukuran akhir** |
| 0.34 | shockwave (tumbuh out-cubic, memudar linear) + cahaya |
| 0.48–0.70 | geser ke slot; huruf mulai 0.60 |

Marker: `collapseStart, land, shiftStart, lettersStart, tagIn, holdStart, end`.
Suara: riser/whoosh panjang selama runtuh → impact berat di `land` → whoosh tipis → shimmer.
**Jebakan**: serah terima harus selesai sebelum pendaratan; berubah warna setelah mendarat terbaca "belum siap".
Pertumbuhan dan pemudaran shockwave harus dipisah (sama-sama out-cubic ⇒ langsung hilang).

## 5. Sheen — blur menjadi tajam, wipe, satu sapuan cahaya
**Untuk**: brand premium/tenang. **Personality**: premium, calm, trustworthy.

| Jendela | Isi |
|---|---|
| 0.00–0.42 | mark keluar dari blur 14 → 0, scale 0.97 → 1 |
| 0.30–0.68 | wordmark mask wipe + drift kecil |
| 0.62–0.94 | **light-up sweep**: lockup redup (veil warna latar, dipotong ke bentuk) dan satu pita terang melintas, meninggalkan lockup pada kecerahan penuh |
| 0.74–1.00 | tagline |
| sepanjang reveal | kamera push 0.955 → 1 |

Marker: `markIn, wordStart, sheenStart, sheenMid, tagIn, holdStart, end`.
Suara: pad/swell lembut, shimmer tipis di `sheenMid`. Tanpa impact.
**Jebakan**: sheen putih di atas tinta terang **tidak terlihat** — itu sebabnya pola ini memakai
veil redup + pita terang. Cahaya selalu dipotong ke bentuk huruf/mark, tidak pernah persegi di atas latar.
Satu sapuan saja.

## 6. Slam — melayang di depan lensa, menghantam
**Untuk**: olahraga, game, media. **Personality**: energetic, playful.

| Jendela | Isi |
|---|---|
| 0.00–0.30 | mark raksasa (2.5×), blur, 35% opacity, coil pelan |
| 0.30–0.40 | **ease-in quad** 2.62 → 0.965 (menghantam) |
| `impact` | di frame yang sama: shockwave, satu shake teredam, flash 3 frame (0.4/0.2/0.08), cahaya |
| 0.46 | huruf ikut menghantam (cascade 0.45 dtk) |

Marker: `hoverIn, impact, lettersStart, tagIn, holdStart, end`.
Suara: **wajib** — hit/boom di `impact` tepat di frame (tanpa suara, kit benturan terbaca kejang), tick tipis per huruf.
**Jebakan**: satu sumber getar per bumper. Flash > 4 frame terbaca kedip latar.
Pertimbangkan pengguna fotosensitif: jangan ulangi flash.

## 7. Converge — partikel berkumpul menjadi mark
**Untuk**: tech, data, AI, jaringan. **Personality**: energetic, trustworthy, friendly, calm (lebih lambat).

| Jendela | Isi |
|---|---|
| 0.00–0.50 | 160 partikel ber-seed datang dari luar frame, lengkung, kedatangan **makin cepat** |
| 0.22–0.56 | mark mengembun: opacity + blur 16 → 0 mengikuti kedatangan |
| 0.55 | huruf blur-slide |

Marker: `streamStart, streamMid, condensed, lettersStart, tagIn, holdStart, end`.
Suara: tekstur granular/whoosh berbutir yang makin rapat → impact lembut di `condensed`.
**Jebakan**: partikel harus mati saat tiba (hold harus bersih). Ukuran partikel diskalakan dengan resolusi.

## 8. IconMorph — ikon brand berputar dan berubah menjadi bagian logo
**Untuk**: mark yang tersusun dari beberapa bagian serupa mengelilingi pusat (kelopak, bilah,
segmen) — cerita "apa yang kami kerjakan menjadi siapa kami". **Personality**: playful, friendly, energetic.
Contoh nyata: HiveoBuzz (agency kreatif) — play, sparkle, chat, lampu, pensil, hati → 6 kelopak.

| Jendela | Isi |
|---|---|
| 0.00–0.24 | ikon (`src/logo/icons.ts`) pop satu per satu di cincin yang lebih lebar (1.35× radius), **tegak**, mark diperbesar 1.7× agar ikon terbaca |
| 0.24–0.34 | antisipasi: cincin berputar mundur +12° |
| 0.34–0.64 | cincin berputar 120° pulang (kurva narrative) sambil zoom 1.7 → 1 |
| 0.37–0.64 | **morph** setiap ikon → bagiannya; ikon dijaga tegak di layar sampai morph mengambil alih orientasi |
| 0.64–0.72 | overshoot −4° → 0; serah terima ke part asli |
| 0.70–0.86 | mark bergeser ke slot lockup; huruf mulai 0.80 |

Marker: `iconsIn, windup, morphStart, land, shiftStart, lettersStart, tagIn, holdStart, end`.
Suara: pop kecil per ikon (dua sampel bergantian, volume menurun) → whoosh panjang selama putaran → impact lembut di `land` → shimmer.

**Cara kerja morph** (`src/lib/morph.ts`): kedua bentuk di-resample menjadi 160 titik sepanjang
keliling (target poligon memakai distribusi per-sisi agar sudutnya tetap tajam), arah putaran
(winding) disamakan, lalu titik awal ikon digeser secara siklis ke posisi yang meminimalkan
total perpindahan — dihitung pada **pose awal di layar**. Setelah itu morph = lerp per titik.

**Syarat & jebakan**:
- Part harus `<path>` **berisi** (fill); stroke/primitif hanya fade in saat serah terima.
- Ikon: satu kontur tertutup **tanpa lubang**, kotak 100×100, tegak. Detail disampaikan lewat siluet.
- Morph hanya kontur luar. Lubang/takik part asli muncul saat serah terima: part asli dinyalakan
  penuh **di bawah** lapisan morph, lalu lapisan morph memudar di atasnya — bila keduanya
  di-crossfade bersamaan, logo tampak pudar sesaat (ditemukan saat tes).
- Ikon terlalu kecil bila mark tidak di-zoom: tanpa zoom 1.7× ikon hanya ±50 px di 1080p.
- Pilih ikon yang relevan dengan brand; jumlah ikon dipakai bergiliran bila part lebih banyak.

---

## Resep tambahan (belum jadi komponen — tulis sebagai pola baru bila cocok)

**Letterpress** — huruf "dicap": tiap huruf scale 1.6 → 1 (origin bawah-tengah) + blur 6 → 0,
stagger 3 f, durasi 12 f; satu kilau aksen pendek di bawah huruf terakhir. Hold 1 dtk, lalu
naik + mengecil 12% + fade dalam 7 f. Cocok untuk brand editorial / kertas & tinta.

**Segment light (neon / LED)** — mark atau wordmark dipotong jadi 10–16 segmen tak tersambung,
menyala **acak** dengan jarak makin rapat (9 f → 3 f), segmen "kunci keterbacaan" ditahan sampai
akhir; jeda napas 10–14 f tanpa segmen baru; lalu 2–3 segmen kunci, dan semua menyala penuh
+ satu lonjakan cahaya. Hanya untuk kata yang dikenali penonton (nama produk). Segmen yang
belum menyala jangan dirender (bukan opacity 0).

**Morph dari primitif** — lingkaran/persegi menjadi mark. Pakai utilitas `lib/morph.ts` yang sama
(resample + matchOrder + lerp); struktur perintah path tidak perlu identik. Tahan primitif sedikit
lebih lama (25 : 50 : 25).

**Split draw-on (garis berpotongan sendiri)** — goresan lebar yang menyeberangi dirinya sendiri
memunculkan cabang lain terlalu dini. Potong *fill* menjadi beberapa bagian di antara lintasan
penyeberangan, satu mask per bagian dengan dash `1 1` dan **cap butt** (cap bulat membuat ujung
macet lalu meloncat di setiap serah terima), bagi easing global secara eksak (de Casteljau) agar
kecepatan pena kontinu, dan tutup jendela "menggambar di bawah tinta" dengan kilau ujung kecil
yang mengikuti garis tengah.

**Brand frame** — bingkai warna brand tumbuh **lebih dulu** (19 f), baru lockup jatuh ke dalamnya.
Bagus untuk bumper yang menempel di depan/belakang rekaman layar.

**Idle loop** (setelah bumper, untuk layar tunggu) — breathing 1 ↔ 1.02 dalam 3–4 dtk, atau
satu aksen berdenyut. Frame 100% harus sama dengan 0%.

---

## Menulis pola baru

1. Salin pola terdekat di `src/bumpers/`, ganti `id` dan objek `W` (jendela sebagai fraksi reveal).
2. Gunakan `useBumper(props, DEF.timeline)` → `{frame, fps, brand, tok, tl, L}`.
3. Animasikan lewat state grup (`mark`, `word`, `tag`), `partStyler`, dan `letterStyler`
   milik `<Lockup>`. Efek dunia (cincin, partikel, flash) masuk ke `back` / `front` milik `<Stage>`.
4. Setiap move **mengembalikan `{}` / `undefined` setelah jendelanya selesai**.
5. Ekspor `markers(tl)` — setiap momen yang layak diberi suara atau diperiksa.
6. Daftarkan `DEF` di `BUMPERS` dalam `src/Root.tsx`.
7. Jalankan `node scripts/qa.mjs all` → contract PASS di semua rasio + contact sheet diperiksa.

Morph bentuk apa pun ke bentuk apa pun: `src/lib/morph.ts` (`resample`, `matchOrder`, `reorder`,
`lerpPts`, `placeIcon`, `toPath`).

Kosakata move tersedia di `src/bumpers/moves.ts`: `pop`, `cascade` (`rise|slide|blur|slam`),
`slide`, `shockwave`; helper di `src/lib/anim.ts`: `prog`, `tween`, `keys`, `damped`, `lag`,
`speedAt`, `squashXY`.
