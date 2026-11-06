# Logo Prep — dari piksel ke vektor siap gerak

Tujuan fase ini bukan "vektor yang paling mirip piksel", melainkan **vektor paling
sederhana yang halus, setia secara struktural, dan bisa dianimasikan**. Logo yang
tersusun dari 3 bagian semantik bisa dikoreografikan; logo dari 400 titik hasil
trace tidak bisa — dan juga tidak layak disebut vektor profesional.

## 1. Membaca sumber

```bash
python scripts/analyze_logo.py logo.png --out work/analysis.json
```

Catat di `bumper_spec.md`:

- ukuran, mode warna, alpha / latar solid
- warna foreground (gabungkan warna antialias yang berdekatan)
- komponen terhubung → calon aktor; huruf yang saling menempel perlu dipisah manual
- ruang negatif yang penting (counter huruf, celah, "bentuk di dalam bentuk")

Bila ada SVG asli dari brand, **pakai itu** — audit dan rapikan strukturnya saja.

## 2. Tangga kompleksitas

Pakai anak tangga terendah yang lolos QA:

| # | Level | Contoh |
|---|---|---|
| 1 | Primitif | `circle`, `ellipse`, `rect` (rx), `line`, busur sederhana |
| 2 | Komposit primitif | beberapa primitif + mask/clip |
| 3 | Sedikit kurva analitik | 2–8 segmen kubik untuk swoosh, daun, gelombang, perisai, C-mark |
| 4 | Outline halus | lebih banyak knot hanya di perubahan bentuk nyata; kontinuitas tangen (G1) |
| 5 | Trace yang dihaluskan | hanya untuk siluet yang benar-benar tak beraturan; hasil trace = alat ukur, bukan karya final |

- Bila versi yang lebih rumit hanya memperbaiki antialias, **pertahankan yang lebih sederhana**.
- Bila versi sederhana salah pusat, titik ujung, profil lebar, ekstrem, atau ruang negatif → naik satu anak tangga.
- Wordmark: gunakan font asli bila tersedia (teks hidup di template). Bila bentuk huruf custom,
  vektorkan per huruf dengan id `letter-<n>`.
- Pita lebar-variabel yang tertutup / berpotongan sendiri (∞, tanda tangan, monogram):
  bangun **garis tengah** (Catmull-Rom melalui titik kunci, mulai di titik tersembunyi),
  ukur lebar sepanjang normal, lalu offset kedua tepi dan snap ke tepi sumber. Garis tengah
  itu sekaligus menjadi jalur draw-on pada fase animasi.

### Pola yang sering muncul

- **Mark simetris rotasi** (kincir, bunga, roda, kelopak): jangan menggambar setiap bagian
  terpisah. Fit **satu unit** (mis. satu jajaran genjang: pusat, titik sudut, dua vektor sisi),
  lalu putar N kali (360°/N). Optimalkan parameternya terhadap IoU dengan pencarian koordinat
  sederhana. Hasilnya sedikit parameter, simetri sempurna, dan setiap unit otomatis menjadi aktor.
- **Celah putih tipis di antara bagian yang bersinggungan**: uji dua hipotesis. (a) Celah itu
  ruang kosong, sehingga union biasa sudah cukup. (b) Celah itu area **tumpang tindih** yang
  dikosongkan (gaya even-odd). Untuk (b), potong irisan dengan tetangga dari setiap part sebagai
  subpath `fill-rule="evenodd"`. Overlay iterasi pertama langsung menunjukkan mana yang benar:
  bila semua residual kuning (vektor berlebih) tepat di celah, hipotesisnya (b).
- **Wordmark multi-warna** (mis. "Hiveo" gelap + "Buzz" oranye): tetap teks hidup; warnai per
  segmen lewat `brand.nameParts`, jangan dijadikan path.
- **Sumber terlalu kecil** (< ~300 px tinggi): bentuk huruf dan sudut tidak bisa diverifikasi.
  Minta file lebih besar / SVG / nama font, atau lanjutkan dan ungkapkan keterbatasannya.

## 3. Gerbang kehalusan (wajib, mengalahkan IoU)

Vektor **gagal** bila tepi yang seharusnya halus:

- bertangga piksel / punya deretan segmen 1 px horizontal-vertikal,
- bergelombang kecil (handle berbalik arah, segmen mini bergantian),
- punya patahan tangen yang terlihat pada zoom 200–400%.

Smoothing yang menurunkan IoU sedikit **diterima** bila penanda struktural (pusat, ujung,
ekstrem, siluet, ruang negatif) tetap cocok — catat trade-off-nya. Simpan minimal satu
crop zoom sebagai bukti kehalusan.

## 4. Kontrak part (struktur untuk gerak)

SVG adalah daftar pemain, bukan gambar:

```svg
<svg viewBox="0 0 200 200">
  <path   id="orbit" data-role="primary" data-order="0" d="…" fill="none" stroke="#F4F1EA" stroke-width="22" stroke-linecap="round"/>
  <circle id="dot"   data-role="accent"  data-order="1" cx="166" cy="100" r="15" fill="#FF6A2B"/>
</svg>
```

| Aturan | Alasan |
|---|---|
| Satu elemen (atau `<g>`) per aktor, `id` semantik (`mark`, `dot`, `swoosh`, `letter-a`) | animasi menarget id, bukan urutan file |
| `data-role`: `container` / `primary` / `secondary` / `accent` | menentukan hierarki seret & siapa boleh memantul |
| `data-order`: urutan cascade | urutan baca = urutan masuk |
| Potong path di sambungan animasi | bagian yang bergerak terpisah harus elemen terpisah |
| Stroke yang akan digambar: `stroke` + `fill="none"`, arah path = arah gambar | template memberi `pathLength=1` dan dash otomatis |
| Titik awal stroke di tempat yang aman (tertutup titik/huruf lain) bila memungkinkan | cap stroke awal tidak terlihat sebagai noda |
| Transform grup boleh, akan di-bake ke anak | transform animasi dipasang di `<g>` pembungkus |
| `viewBox` pas dengan logo + napas kecil | layout lockup menghitung dari `viewBox` |
| Hindari filter/efek SVG berat di logo | blur & glow dilakukan oleh bumper, bukan oleh aset |

Konversi:

```bash
python scripts/svg_to_parts.py logo.svg --out template/src/logo/parts.ts --copy-to template/public/logo.svg
```

Script mencetak setiap part (`id(role, draw)`) dan peringatan (id hilang, role default).
Perbaiki peringatan di SVG, bukan di `parts.ts`.

## 5. QA geometri (loop dengan budget)

```bash
# di proyek Remotion: render vektor di ukuran kanvas sumber
npx remotion still src/index.ts LogoCheck out/fit/check.png --props='{"width":1024,"height":1024}'
# bandingkan
python <skill>/scripts/iou_overlay.py logo.png out/fit/check.png --out fit/03_overlay.png --report fit/03.json
```

Overlay: abu = sumber, cyan = tepi vektor, magenta = hanya di sumber, kuning = hanya di vektor.
`viewBox` harus sama dengan kanvas sumber agar framing cocok; bila tidak, pakai `--crop`.

Per iterasi (satu perubahan geometri + render + inspeksi), catat:
`NN | perubahan | IoU | src_only | render_only | kehalusan ✓/✗ | putusan visual`.

- **Budget 10 iterasi.** Berhenti lebih awal saat lolos.
- Bila budget habis, pilih kandidat terbaik dengan urutan: kehalusan lolos → tidak ada
  ketidakcocokan struktural → IoU/selisih piksel → kompleksitas terendah. Ungkapkan sisa
  masalahnya; bila tidak layak, label sebagai *preview*.
- Simpan semua overlay `fit/NN_*.png` agar pekerjaan bisa dilanjutkan.

## 6. Kesalahan umum

- Mengejar IoU 0.99 dengan ratusan titik → animasi morph / draw-on mustahil, tepi bergetar.
- Satu compound path untuk seluruh mark → tidak ada yang bisa di-stagger.
- Wordmark sebagai satu `<text>` → huruf tidak bisa cascade.
- Warna diambil dari piksel antialias → warna kusam; ambil dari pusat area padat.
- Lupa ruang negatif → logo "terasa" berbeda walau IoU tinggi.
