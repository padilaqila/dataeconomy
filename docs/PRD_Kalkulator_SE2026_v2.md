# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Proyek:** Kalkulator Usaha & Asisten Lapangan Sensus Ekonomi 2026 (SE-2026)
**Platform:** Progressive Web App (PWA) / Mobile Web
**Versi Dokumen:** 3.0.0 (Revisi Konsep Baru - 6 Modul)
**Model Bisnis:** SaaS Lifetime — Rp20.000 (Promo dari Rp35.000) sekali bayar

---

## 1. Ringkasan Eksekutif

Aplikasi web ini adalah **kalkulator bantu offline** untuk Petugas Sensus Ekonomi 2026. Fokus utama aplikasi ini adalah menjadi asisten pencatatan yang cerdas untuk memecahkan kendala utama di lapangan: 
1. **Konversi Satuan Waktu:** Responden seringkali hanya mengetahui pemasukan/pengeluaran dalam harian atau mingguan, sementara sensus membutuhkan data bulanan/tahunan.
2. **Konversi Kuantitas vs Nilai Uang (Sektor Agrikultur/Produksi):** Responden seringkali hanya ingat nilai uang total yang dikeluarkan (tanpa ingat kuantitas pupuk/bibit), atau sebaliknya (ingat kuantitas tapi lupa total biaya).

Aplikasi menjembatani ini dengan kalkulasi otomatis. Data akhir akan dirangkum dalam bentuk **Laporan Status Keuangan** yang dapat disalin (Quick Copy) secara manual ke aplikasi pelaporan resmi BPS.

Aplikasi ini **bukan** sistem pelaporan resmi BPS. Data yang tersimpan di server (Supabase) semata-mata untuk:
1. Backup anti-kehilangan data.
2. Restore saat pindah device.
3. Validasi status lisensi lifetime.

---

## 2. Enam (6) Modul Utama Kalkulator

Sistem tidak lagi menggunakan satu form generik. Petugas dapat memilih modul spesifik sesuai karakteristik responden. Data modul disimpan secara dinamis dalam bentuk format JSON pada kolom `sektor_data`.

### 2.1 Keuangan Rumah Tangga
- **Fokus:** Pengeluaran harian, mingguan, dan bulanan untuk kebutuhan hidup (makan dan non-makan).
- **Input:** Beras, lauk-pauk, tagihan listrik, air, pendidikan, dll.

### 2.2 Pertanian
- **Fokus:** Hasil panen musiman, biaya operasional tanah, bibit, pupuk, pestisida.
- **Masalah Terpecahkan:** Jika responden tidak tahu detail satuan kg bibit tapi tahu harga total, atau sebaliknya.

### 2.3 Usaha Perdagangan & Jasa
- **Fokus:** Omset harian/mingguan, biaya kulakan barang dagangan (HPP), operasional toko (listrik, karyawan).

### 2.4 Peternakan
- **Fokus:** Biaya pakan harian/mingguan, vaksin/obat, hasil penjualan ternak/susu/telur (siklus bulanan/musiman).

### 2.5 Perikanan
- **Fokus:** Biaya pakan ikan/benur, BBM perahu (untuk tangkap), biaya perawatan tambak (untuk budidaya), hasil tangkapan/panen.

### 2.6 Industri Pengolahan
- **Fokus:** Pembelian bahan baku harian, upah buruh, ongkos produksi (gas/listrik industri), dan nilai jual produk jadi.

---

## 3. Logika Konversi Otomatis

Aplikasi menyediakan dua jenis konversi krusial yang menghemat waktu petugas:

### 3.1 Konversi Waktu (Timeframe Conversion)
- **Input Fleksibel:** Pada setiap input (contoh: biaya bensin atau omset toko), petugas bisa memilih dropdown frekuensi: **Harian, Mingguan, atau Bulanan**.
- **Kalkulasi:**
  - Harian → dikali 30 (untuk bulanan) / dikali 365 (untuk tahunan).
  - Mingguan → dikali 4 (untuk bulanan) / dikali 52 (untuk tahunan).
  - Bulanan → dikali 12 (untuk tahunan).
- **Output:** Semua angka akan diseragamkan dalam laporan akhir menjadi **Bulanan dan Tahunan secara berdampingan**.

### 3.2 Konversi Kuantitas vs. Nilai Uang (Harga Referensi Lokal)
- **Masalah:** Responden sering menjawab "Saya habis 2 juta buat pupuk" tanpa tahu berapa sak, atau "Saya habiskan 10 karung pakan" tanpa ingat berapa harganya.
- **Solusi - "Harga Referensi Lokal":** 
  - Di awal form (untuk sektor terkait), petugas mengisi form kecil "Harga Referensi" (misal: Harga Pupuk Urea = Rp50.000/sak, Harga Bibit Nila = Rp2.000/ekor).
  - Harga referensi ini dimasukkan secara manual **per responden/kuesioner** karena harga bisa berbeda-beda tiap responden/daerah.
  - Saat input rincian, jika petugas mengetik jumlah uang "Rp2.000.000", sistem membagi nilai tersebut dengan "Harga Referensi" untuk mendapatkan estimasi "40 sak".
  - Sebaliknya, jika petugas mengetik "40 sak", sistem mengalikan dengan "Harga Referensi" untuk mendapatkan estimasi "Rp2.000.000".

---

## 4. Laporan Status Keuangan & Quick Copy

Setelah mengisi modul, petugas diarahkan ke panel Laporan Akhir.
- Menampilkan total Pemasukan (Bulanan & Tahunan).
- Menampilkan total Pengeluaran (Bulanan & Tahunan).
- **Surplus/Defisit Keuangan** (Laba Bersih).
- **Tombol Quick Copy:** Semua angka akhir memiliki tombol "Copy" yang menyalin nilai numerik murni (misal: `15000000`, tanpa titik/koma) ke clipboard untuk di-paste langsung ke aplikasi BPS.

---

## 5. Arsitektur & Tech Stack

- **Desain UI (Brutalism):** Wajib menggunakan konsep brutalism murni. Tanpa *border-radius* (0px), tanpa *box-shadow*. Warna solid (Hitam, Putih, Biru, Hijau, Oranye). Komponen interaktif minimal berukuran 44x44px. 
- **Frontend:** React.js (Vite) + Tailwind CSS + Zustand (State Management).
- **Offline-First:** Menggunakan Dexie.js (IndexedDB). Seluruh proses input dan kalkulasi tidak membutuhkan koneksi internet. Data otomatis tersimpan saat menekan tombol "Lanjut" (bukan auto-save per-field).
- **Backend:** Supabase (PostgreSQL, Auth). Hanya digunakan untuk sinkronisasi hasil akhir ("Simpan & Selesai") dan backup login/lisensi. Tidak sinkronisasi draf mentah.

---

## 6. Alur Autentikasi & Lisensi

- Tiap akun dikunci ke perangkat (Device-Lock).
- Jika login di perangkat baru, sesi lama dibatalkan. Harus ada koneksi internet untuk pindah perangkat.
- **Midtrans Snap:** Pembayaran lisensi lifetime (Rp25.000) menggunakan Virtual Account (VA), QRIS, atau e-wallet (kartu kredit dinonaktifkan). Validasi melalui Webhook (verifikasi `signature_key`). Status lisensi (`is_lifetime_paid = true`) ditarik saat login dan di-cache selamanya.

---

## 7. Skema Penyimpanan Data (Dexie & Supabase)

Tabel utama dipertahankan sederhana, kerumitan 6 modul diatasi dengan JSONB:
1. `users` (Supabase saja): Auth dan status lisensi.
2. `blocks`: Manajemen Blok Sensus.
3. `respondents`: Identitas utama responden, `sync_status` (pending/synced).
4. `financial_records` (Menggantikan tabel-tabel spesifik sebelumnya):
   - `respondent_id`
   - `module_type` (Enum: 'RUMAH_TANGGA', 'PERTANIAN', 'PERDAGANGAN_JASA', dll)
   - `module_data` (JSONB) -> Menyimpan seluruh detail referensi harga, konversi waktu (harian/mingguan), dan kuantitas dari modul yang diisi.
   - `total_income_monthly`, `total_income_yearly`
   - `total_expense_monthly`, `total_expense_yearly`

---

## 8. Persyaratan UX Spesifik
- Alert keluar selalu muncul jika menekan tombol kembali sebelum menekan tombol "Lanjut" (karena tidak ada auto-save per-field).
- Toast "Tersimpan" berwarna hijau setiap menekan "Lanjut" atau "Hitung" untuk kepastian UX.
- Status sinkronisasi menggunakan ikon berbeda (bukan cuma warna) agar ramah penyandang buta warna (misal: ikon checklist untuk hijau, ikon jam pasir untuk merah).
