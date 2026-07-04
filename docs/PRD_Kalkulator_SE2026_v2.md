# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Proyek:** Kalkulator Usaha & Asisten Lapangan Sensus Ekonomi 2026 (SE-2026)
**Platform:** Progressive Web App (PWA) / Mobile Web
**Versi Dokumen:** 2.0.0 (Hasil Audit & Revisi)
**Model Bisnis:** SaaS Lifetime — Rp25.000 sekali bayar

---

## 1. Ringkasan Eksekutif

Aplikasi web ini adalah **kalkulator bantu offline** untuk Petugas Sensus Ekonomi 2026. Fungsi utamanya: mendigitalkan proses kalkulasi keuangan usaha & rumah tangga responden sesuai field resmi kuesioner BPS, lalu hasil akhirnya **disalin manual (Quick Copy)** ke aplikasi pelaporan resmi BPS.

Aplikasi ini **bukan** sistem pelaporan resmi, **bukan** pengganti aplikasi BPS, dan **tidak** menyimpan data sebagai kewajiban pelaporan. Data yang tersimpan di server semata-mata untuk:
1. Backup anti-kehilangan data (device rusak/hilang/reset)
2. Restore saat pindah device
3. Validasi status lisensi lifetime

---

## 2. Perubahan Kunci dari Draft Awal (Ringkasan Audit)

| Area | Draft Awal | Revisi Final | Alasan |
|---|---|---|---|
| Form usaha | Wizard generik 1 skema untuk semua jenis usaha | **Tetap 1 skema**, ikuti field resmi BPS apa adanya | Form resmi BPS sendiri sudah generik lintas sektor (field "Biaya Produksi" mencakup pupuk, pakan, bahan baku sekaligus) |
| Kalkulasi musiman/siklus | Sempat diusulkan jadi kolom data baru | **Panel kalkulator bantu UI-only**, hasil isi ke field resmi, tidak ada skema data baru | Quick Copy harus tetap sinkron dengan field resmi BPS, bukan field tambahan yang tidak ada padanannya |
| Sync data | Auto-sync tiap step (draft mentah) | Sync 1x saat responden **selesai** dikalkulasi | Fungsi utama cuma kalkulator, bukan sistem pelaporan real-time — sync draft mentah tidak perlu |
| Auth | Supabase Auth standar | Auth + **device-lock 1:1** dengan mekanisme pindah device bebas | Produk SaaS berbayar butuh proteksi revenue, device-lock mencegah 1 akun dipakai bergantian |
| Lisensi | Tidak dibahas di draft awal | **Lifetime**, validasi 1x saat bayar, tidak perlu re-cek berkala | Beda karakter dari subscription — tidak ada grace period karena tidak ada expiry |
| Pembayaran | Tidak ada di draft awal | Midtrans Snap, **VA/QRIS/e-wallet saja** (tanpa kartu kredit) | Hindari resiko chargeback, lebih familiar untuk user awam |
| Alert keluar form | 1 alert generik | Alert selalu muncul (karena tidak ada auto-save per-field), teks spesifik 2 tombol | Auto-save cuma trigger di tombol Next/Hitung |

---

## 3. Target Pengguna

1. **Petugas Sensus (Enumerator):** pengguna utama, wawancara + kalkulasi + copy hasil ke app BPS resmi.
2. ~~Kortim/Pengawas (fitur pemantauan)~~ — **DIHAPUS dari scope**, tidak dibutuhkan sesuai keputusan pemilik produk.

---

## 4. Arsitektur & Tech Stack

* **Frontend:** React.js (Vite) + Tailwind CSS
* **State Management:** Zustand
* **Local Storage:** Dexie.js (IndexedDB) — penyimpanan utama, offline-first sepenuhnya
* **Backend:** Supabase (PostgreSQL, Auth) — fungsi terbatas: Auth, device-lock, validasi lisensi, backup hasil final
* **Payment Gateway:** Midtrans Snap (one-time payment)

**Catatan arsitektur:** Supabase **tidak** dipakai untuk sync draft/real-time monitoring. Perannya diperkecil khusus untuk 3 hal: autentikasi, validasi lisensi lifetime, dan backup data final per responden.

---

## 5. Alur Logika Sistem

### 5.1 Autentikasi, Device-Lock & Lisensi

**Login:**
- Online + belum login → login via Supabase (Email/No. HP)
- Offline + sesi ada → langsung Dashboard (token lokal)
- Offline + belum login → akses ditolak, wajib online untuk login pertama kali

**Device-Lock:**
- Tiap device generate `device_id` (fingerprint browser+OS+UUID) saat install pertama
- Login di `device_id` berbeda dari yang tercatat di server → dialog konfirmasi:
  > "Akun ini aktif di device lain. Pindahkan ke device ini? Sesi di device lama akan logout otomatis."
- Konfirmasi → `current_device_id` di server diupdate, token device lama di-invalidate
- **Tidak ada batas jumlah pindah device** — user bisa pindah kapan saja selama lifetime aktif
- Proses pindah device **wajib online** (tidak ada mekanisme OTP offline, karena target user selalu ada sinyal di kota)

**Validasi Lisensi (Lifetime):**
- Validasi 1x saat pembayaran sukses (via webhook Midtrans, lihat Section 8)
- Status `is_lifetime_paid = true` bersifat **permanen**, tidak perlu re-cek berkala ke server
- Cek status ini cukup 1x saat login/buka app pertama kali (kalau online), lalu cache lokal seterusnya

### 5.2 Manajemen Blok Sensus & Responden
1. Dashboard → petugas buat/pilih "Blok Sensus"
2. Masuk Blok → list "No Urut KK" dari IndexedDB lokal + status sync (🔴 Pending / 🟢 Synced — pakai ikon berbeda, bukan cuma warna, untuk aksesibilitas buta warna)
3. Tekan `+ Tambah Responden` → generate `session_id` baru (UUID) → mulai Form Wizard

### 5.3 Form Wizard — Logika Penyimpanan
- **Tidak ada auto-save per-field/real-time.** Data tersimpan ke IndexedDB **hanya** saat tombol "Lanjut (Next)" atau "Hitung" ditekan.
- Tiap kali Next ditekan → tampilkan toast singkat **"Tersimpan"** (reuse pola toast hijau yang sudah ada di Quick Copy) — memberi sinyal jelas kapan data aman.
- **Alert Konfirmasi Keluar:** selalu muncul saat user menekan Back/keluar di tengah pengisian step (karena tanpa auto-save per-field, sistem tidak bisa tahu berapa banyak input yang belum tersimpan). Teks:
  > "Data di halaman ini belum disimpan. Tekan 'Lanjut' dulu sebelum keluar, atau data yang baru diisi akan hilang."
  Tombol: **"Lanjut Isi"** (batal keluar) / **"Keluar Tanpa Simpan"** (terima resiko hilang)
- **Resiko yang diterima:** kalau HP mati mendadak (baterai habis/crash, bukan aksi keluar disengaja) di tengah step yang belum di-Next, data step itu hilang. Ini resiko yang disepakati sebagai wajar (bukan bug), karena fungsi utama aplikasi cuma kalkulator bantu, bukan sistem pelaporan wajib.

---

## 6. Rincian Formulir (6 Langkah Wizard)

Field mengikuti form resmi kuesioner BPS apa adanya — **tidak dipecah jadi template berbeda per jenis usaha** (form resmi BPS sendiri generik lintas sektor).

### Langkah 1: Identitas & Anggota Keluarga
- No Bangunan, No Urut KK, Nomor KK (16 digit), Nama Kepala Keluarga, Alamat, Jumlah Penghuni
- Tabel dinamis Pendapatan Keluarga: No, Nama, Pekerjaan, Gaji, Ijarah, Rekening, Status Tinggal (+Tambah Anggota)

### Langkah 2: Profil & Pengeluaran Usaha
- Identitas Usaha: Jenis Usaha, Jenis Barang, Tahun Mulai, NIB, Alamat Usaha
- Pengeluaran Usaha (semua field NumPad, satuan **/bulan**):
  - Total Upah (Pengeluaran Usaha)
  - Biaya Produksi
  - Biaya Pembelian Barang Terjual
  - Operasional (Listrik, BBM, Air, Gas, Sewa lahan, transport)
  - Non-Operasional (Perawatan, dll)
- **Panel Bantu Hitung (collapsible, opsional, UI-only — lihat Section 7)**
- Rumus: `Total Pengeluaran Usaha (Bulan) = SUM(semua field di atas)`

### Langkah 3: Pendapatan & Aset Usaha
- Nilai Penjualan & Jasa: input **/bulan** DAN **/tahun** (2 field terpisah, sesuai form resmi)
  - Field /tahun **auto-hitung** dari /bulan × 12 secara real-time
  - Field /tahun **bisa diedit manual** (override) — kalau diubah manual lalu /bulan diubah lagi setelahnya, /tahun ikut ter-recalculate ulang menimpa nilai manual (tanpa flag/badge kompleks). Tambahkan 1 baris teks kecil di bawah field: *"Nilai ini otomatis mengikuti /bulan × 12. Anda bisa mengubahnya jika berbeda."*
- Pendapatan Lainnya: sama, /bulan & /tahun
- Total Nilai Penjualan (A+B) /tahun
- Aset Usaha: Nilai Aset Tanah & Bangunan, Nilai Aset Selain Tanah, Total Aset

### Langkah 4: Pengeluaran Makan Keluarga (D.1)
- Beras, Sayuran, Lauk Pauk, Minyak Goreng, Air Minum, Lainnya
- Dropdown Periode: **Hari / Minggu / Bulan / Musiman / Tahun**
  - Default: Bulan (0 tap tambahan untuk mayoritas kasus dagang/kuliner)
  - Konversi ke bulanan: Harian×30, Mingguan×4, Bulanan (langsung), Musiman÷Lama Siklus, Tahunan÷12
  - Kalau pilih **Musiman** → muncul dropdown tambahan "Lama Siklus": 3/4/6/12 Bulan / Lainnya (custom input kalau pilih Lainnya)
- Total Pengeluaran Makan (Bulan) real-time

### Langkah 5: Pengeluaran Non-Makan & Tahunan (D.2, D.3)
- a. Tagihan Rumah Tangga: Listrik (+ID Meteran, Daya KWH), Internet/Wifi, Air PAM, LPG/Gas, Pulsa & Paket Data, Lainnya → Total/Bulan
- b. Tagihan Transportasi: Bensin, Ongkos Angkutan, Lainnya → Total/Bulan
- c. Kebutuhan Harian: Alat Mandi, Alat Cuci Baju, Cuci Piring, Lainnya → Total/Bulan
- d. Pendidikan: SPP, Uang Jajan, Lainnya → Total/Bulan
- e. Kesehatan: Obat-obatan, Biaya Berobat, Alat Kontrasepsi, Lainnya → Total/Bulan
- f. Jasa: Potong Rambut, Jahit/Permak, Lainnya → Total/Bulan
- Pengeluaran Tahunan: Beli Baju, Seragam, Pajak STNK, Pajak SPPT, Service Kendaraan, Perbaikan Rumah, Buku Sekolah, Hajatan, Iuran Hari Besar, Lainnya → Total/Tahun
- Rumus: `Total Non-Makan Bulanan = SUM(a-f per bulan) + (Total Tahunan ÷ 12)`

### Langkah 6: Aset & Kondisi Hunian
- Luas Bangunan Tempat Tinggal, Luas Tanah Ditempati, Luas Bangunan Usaha, Tanah Selain Ditempati (unit, M2, Rp)
- Nilai Aset Tanah & Bangunan
- Jumlah & Nilai Motor, Mobil (unit, Rp), Emas (gram, Rp)
- Riwayat Penyakit, Disabilitas Keluarga
- Tombol **"Simpan & Selesai"** → trigger sync ke server (lihat Section 9)

---

## 7. Panel Kalkulator Bantu (Fitur Baru — UI Only, Bukan Skema Data)

Ditujukan untuk usaha dengan pola musiman (pertanian, perikanan tambak, dll) yang kesulitan input langsung ke field bulanan.

**Lokasi:** collapsible panel di atas field "Biaya Produksi" (Step 2) dan "Nilai Penjualan" (Step 3).

**Field panel:**
| Field | Tipe | Catatan |
|---|---|---|
| Periode | Dropdown: Hari/Minggu/Bulan/Musiman/Tahun | Default kosong, user pilih |
| Lama Siklus | Dropdown: 3/4/6/12 Bulan/Lainnya | Muncul hanya jika Periode = Musiman |
| Lama Siklus (custom) | Input angka | Muncul hanya jika pilih "Lainnya" |
| Nilai | Input Rupiah | Nilai mentah sesuai periode dipilih |

**Output:** hasil kalkulasi konversi otomatis mengisi field resmi (`Biaya Produksi /bulan`, `Nilai Penjualan /bulan` dan `/tahun`) — **tidak** disimpan sebagai kolom database terpisah. Setelah terisi, field resmi tetap bisa diedit manual seperti biasa.

**Prinsip desain:** mayoritas user (dagang/kuliner/jasa) tidak akan menyentuh panel ini — mereka isi langsung ke field resmi seperti biasa tanpa friksi tambahan.

---

## 8. Panel Rekapitulasi & Quick Copy

Setelah Step 6 selesai, sistem tampilkan **Panel Rekapitulasi**.

**Kalkulasi Akhir:**
- `Laba Bersih Usaha (Bulan)` = Pendapatan Usaha Bulan − Total Pengeluaran Usaha Bulan
- `Total Pengeluaran Keluarga (Bulan)` = Pengeluaran Makan Bulan + Non-Makan Bulanan + (Tahunan ÷ 12)
- `Surplus/Defisit Keuangan` = Laba Bersih Usaha (Bulan) − Total Pengeluaran Keluarga (Bulan)

**Quick Copy:**
- Tiap baris indikator kunci punya tombol ikon Copy (min. 44x44px touch-target)
- Ambil nilai angka mentah tanpa titik/koma (`15000000`, bukan `Rp 15.000.000`)
- `navigator.clipboard.writeText(value)`
- Toast hijau "Tersalin!"

---

## 9. Skema Database (Supabase PostgreSQL)

**Tidak ada perubahan skema tabel data usaha dari desain awal** — panel kalkulator bantu di Section 7 tidak menambah kolom baru.

* **`users`** (baru): `id`, `email`, `current_device_id`, `is_lifetime_paid` (boolean), `last_device_change_at`
* **`blocks`**: `id`, `user_id`, `nama_blok`, `created_at`
* **`respondents`**: `id`, `block_id`, `no_bangunan`, `no_urut_kk`, `nomor_kk`, `nama_kpl_keluarga`, `alamat`, `sync_status`, `updated_at`
* **`family_members`**: `id`, `respondent_id`, `nama`, `pekerjaan`, `gaji`, `ijarah`, `status_tinggal`
* **`business_details`**: `respondent_id`, `jenis_usaha`, `nib`, `pendapatan_total_bulan`, `pendapatan_total_tahun`, `pengeluaran_usaha_bulan`, `total_aset_usaha`
* **`family_expenses`**: `respondent_id`, `rincian_makan` (jsonb), `rincian_non_makan` (jsonb), `rincian_tahunan` (jsonb), `total_makan_bulan`, `total_non_makan_bulan`, `total_beban_keluarga_bulan`
* **`assets_conditions`**: `respondent_id`, `luas_bangunan`, `jml_motor`, `val_motor_rp`, `disabilitas`

---

## 10. Logika Sinkronisasi (Revisi Total dari Draft Awal)

**Prinsip:** sync minimal, cuma data final, bukan draft mentah.

1. **Trigger sync:** hanya saat tombol "Simpan & Selesai" ditekan di Step 6 (bukan tiap Next/step seperti draft awal)
2. **Payload:** hasil rekap final per responden (belasan angka agregat), bukan draft mentah tiap step — ukuran kecil, resiko timeout rendah meski sinyal 4G lapangan lemah
3. **Draft belum selesai** (belum tekan "Simpan & Selesai") **tidak pernah tersync** — kalau device rusak sebelum titik ini, draft hilang. Ini resiko yang sudah disepakati sebagai wajar.
4. **Gagal sync** (offline/timeout): status tetap 🔴 pending, auto-retry saat event `online` terdeteksi, tanpa perlu logika batching khusus (payload kecil, frekuensi sync jarang — 1x per responden selesai, bukan real-time)
5. **Sukses sync:** flag `sync_status` jadi `synced`, ikon Dashboard 🔴→🟢
6. **Restore ke device baru:** login sukses → tarik ulang semua data `user_id` dari Supabase, isi ulang ke IndexedDB lokal

**Conflict resolution:** karena 1 akun = 1 petugas tetap (bukan multi-user share akun), resiko konflik edit bersamaan rendah. Cukup pakai `updated_at` sebagai pengaman minimal untuk kasus login ulang di device lain dengan draft lama.

---

## 11. Alur Pembayaran (Midtrans Snap) — Section Baru

**Model:** One-time payment, Rp25.000, lifetime (bukan subscription/recurring).

**Metode aktif:** VA/Transfer Bank (utama), QRIS, e-wallet. **Kartu kredit dinonaktifkan** dari Snap Preference Dashboard — menghindari resiko chargeback/refund yang butuh logika pencabutan akses tambahan, dan lebih sesuai untuk target user (petugas sensus, bukan tech-savvy).

**Alur:**
1. User tap "Beli Lifetime Rp25.000" → request ke backend
2. Backend generate `order_id` unik → panggil Midtrans Snap API (`transaction_details: {order_id, gross_amount: 25000}`) → dapat `snap_token`
3. Frontend buka Snap popup/WebView dengan token tsb
4. User pilih metode bayar → dapat instruksi (nomor VA/kode QR) + **countdown expiry jelas di layar** (VA default 24 jam, dapat dikustom di dashboard; QRIS defaultnya jauh lebih pendek — perlu dicek langsung di Midtrans Dashboard sebelum go-live)
5. Status transaksi: `pending` (menunggu bayar) → UI tampilkan state "Menunggu Pembayaran" + tombol "Cek Status" manual
6. **Midtrans kirim webhook notification** ke endpoint backend saat status berubah
7. **Backend WAJIB verifikasi `signature_key`** (hash dari `order_id+status_code+gross_amount+ServerKey`) sebelum memproses notifikasi apa pun — mencegah pemalsuan webhook yang bisa unlock lifetime tanpa bayar
8. Status tervalidasi `settlement`/`capture` → update `is_lifetime_paid = true`, `current_device_id` = device saat itu
9. Status `expire` → tombol "Buat Ulang Pembayaran" (generate order_id + token baru)
10. Refund/chargeback: **tidak perlu ditangani** — metode VA/QRIS/e-wallet yang dipakai tidak punya mekanisme pembatalan sepihak seperti kartu kredit

---

## 12. Halaman Aplikasi (Lengkap)

| # | Halaman | Fungsi Utama |
|---|---|---|
| 1 | Splash/Auth Gate | Cek local storage + koneksi, routing awal |
| 2 | Login | Email/No HP via Supabase Auth, termasuk dialog pindah device |
| 3 | Beli Lifetime | Trigger Midtrans Snap, tampil kalau `is_lifetime_paid = false` |
| 4 | Status Pembayaran | State pending/sukses/expired + tombol cek ulang/generate ulang |
| 5 | Dashboard (List Blok) | Buat/pilih Blok Sensus, progress sync |
| 6 | Detail Blok (List Responden) | List KK + status 🔴/🟢 (ikon, bukan cuma warna) |
| 7-12 | Form Wizard Step 1-6 | Sesuai Section 6 di atas |
| 13 | Panel Rekapitulasi | Hasil kalkulasi + Quick Copy |
| 14 | Riwayat Sinkronisasi | List pending, tombol sync manual |
| 15 | Pengaturan | Logout, versi app, storage usage |

---

## 13. Persyaratan UI/UX

1. **Touch-target minimal 44x44px** — diterapkan konsisten ke SEMUA elemen interaktif termasuk ikon kecil (tombol Copy, tombol X hapus baris tabel dinamis) yang mudah terlewat saat desain.
2. **High-Contrast** (Hitam/Putih/Oranye) untuk keterbacaan luar ruangan.
3. **Status sync tidak boleh mengandalkan warna saja** — tambahkan ikon berbeda (✓ untuk synced, ⏱ untuk pending) untuk aksesibilitas user buta warna merah-hijau.
4. **Alert Konfirmasi Keluar** — selalu muncul (lihat Section 5.3), teks spesifik dengan 2 tombol jelas, bukan Ya/Tidak generik.
5. **Toast "Tersimpan"** setiap tombol Next/Hitung ditekan — memberi sinyal jelas kapan data aman tersimpan.

---

## 14. Hal yang Perlu Diverifikasi Sebelum Go-Live

- [ ] Cek default expiry time QRIS di Midtrans Dashboard (belum diverifikasi di dokumen ini, VA sudah terkonfirmasi 24 jam)
- [ ] Uji signature verification webhook di environment sandbox sebelum production
- [ ] Pastikan Payment Notification URL sudah dikonfigurasi di Midtrans Dashboard (Settings > Configuration)
- [ ] Uji alur pindah device end-to-end (invalidate token device lama benar-benar berfungsi)
