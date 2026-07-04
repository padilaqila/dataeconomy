# Implementation Plan: Kalkulator SE-2026

Dokumen ini berisi rencana implementasi (roadmap) langkah demi langkah untuk membangun aplikasi Kalkulator Usaha & Asisten Lapangan Sensus Ekonomi 2026 sesuai dengan PRD (`PRD_Kalkulator_SE2026_v2.md`), aturan desain RawBlock (`DESIGN.md`), dan panduan agen (`AGENTS.md`).

Rencana ini dibagi menjadi bagian-bagian kecil (task-based) agar dapat dikerjakan secara bertahap dan iteratif.

## Task Aktif
Task Sebelumnya : Task 9.1 - 9.3 (Integrasi Pembayaran) - SELESAI
Task Sekarang : Verifikasi Akhir (UI/UX, Flow)
Task Berikutnya : -

## Fase 1: Inisialisasi Proyek & Setup Dasar
Fase ini berfokus pada penyiapan kerangka awal proyek.
- [x] **Task 1.1:** Inisialisasi proyek React menggunakan Vite (`npm create vite@latest`).
- [x] **Task 1.2:** Instalasi dan konfigurasi Tailwind CSS.
- [x] **Task 1.3:** Konfigurasi font (Archivo Black, Work Sans, Space Mono) melalui Google Fonts di `index.html`.
- [x] **Task 1.4:** Setup variabel CSS global di `index.css` sesuai desain RawBlock (warna murni, border tebal, hilangkan shadow dan border-radius).
- [x] **Task 1.5:** Instalasi dependencies utama: `react-router-dom`, `zustand` (State), `dexie` (Local DB), `@supabase/supabase-js` (Backend), `lucide-react` (Icons).
- [x] **Task 1.6:** Setup dasar React Router dan struktur folder (`src/pages`, `src/components`, `src/stores`, `src/db`, `src/lib`).

## Fase 2: Pembangunan Reusable Components (RawBlock System)
Sesuai aturan, semua UI harus dibangun menggunakan komponen modular yang ketat mengikuti *brutalism design*.
- [x] **Task 2.1:** Buat komponen `Button` (Primary, Secondary, Ghost, Destructive) dengan properti hover/active inversi warna dan touch-target 44x44px.
- [x] **Task 2.2:** Buat komponen `Input`, `Select` (Dropdown), dan `Textarea` (border 3px default, 5px focus, helper text).
- [x] **Task 2.3:** Buat komponen `Card` (border 3px atau 5px, tanpa shadow).
- [x] **Task 2.4:** Buat komponen `Checkbox` dan `Radio` (satu-satunya elemen yang boleh bundar).
- [x] **Task 2.5:** Buat komponen `Chip` (Status dan Filter) serta `Toast` untuk notifikasi (contoh: hijau "Tersimpan").
- [x] **Task 2.6:** Buat layout utama aplikasi (Navbar simpel/Header, dan Container utama).

## Fase 3: Setup Database Lokal & Manajemen State
Aplikasi ini *offline-first*, sehingga penyimpanan utama menggunakan Dexie.js.
- [x] **Task 3.1:** Setup `src/db/db.js` dengan Dexie.js dan buat skema tabel: `blocks`, `respondents`, `family_members`, `business_details`, `family_expenses`, `assets_conditions`.
- [x] **Task 3.2:** Buat fungsi CRUD dasar untuk masing-masing tabel lokal tersebut.
- [x] **Task 3.3:** Buat Zustand store (`src/stores/formStore.js`) untuk menyimpan state draft sementara dari Form Wizard sebelum di-save (saat klik Next/Hitung).

## Fase 4: Integrasi Supabase & Autentikasi
Fokus pada Supabase hanya untuk Auth, Device-Lock, Lisensi, dan Backup Final.
- [x] **Task 4.1:** Setup koneksi client Supabase (`src/lib/supabase.js`).
- [x] **Task 4.2:** Implementasi halaman Login (Email/No. HP).
- [x] **Task 4.3:** Buat logika generate `device_id` (menggunakan UUID) saat instalasi/akses pertama.
- [x] **Task 4.4:** Implementasi flow Device-Lock: cek `current_device_id` di database Supabase saat login, tampilkan dialog konfirmasi jika beda, dan update ID jika disetujui.
- [x] **Task 4.5:** Proteksi rute (Protected Route): cek status Auth dan status `is_lifetime_paid`.

## Fase 5: Dashboard & Manajemen Blok
Halaman utama setelah login sebelum masuk ke kuesioner.
- [x] **Task 5.1:** Buat Halaman Dashboard (List Blok). Fitur: Buat Blok Baru, tampilkan jumlah responden.
- [x] **Task 5.2:** Buat Halaman Detail Blok (List Responden). Fitur: Tambah responden baru, list responden dengan ikon indikator sync (🔴/🟢).

## Fase 6: Form Wizard Kuesioner (Core Feature)
Membangun 6 langkah kuesioner tanpa auto-save per-field.
- [x] **Task 6.1:** Implementasi *wrapper* Form Wizard (navigasi Next/Back, tombol Hitung).
- [x] **Task 6.2:** Buat logika Alert Konfirmasi Keluar saat pengguna mencoba menekan back sebelum klik Next (cegah data hilang).
- [x] **Task 6.3:** Implementasi Step 1: Identitas & Anggota Keluarga (termasuk logic tabel dinamis untuk tambah/hapus anggota).
- [x] **Task 6.4:** Implementasi Step 2: Profil & Pengeluaran Usaha. Sertakan **Panel Kalkulator Bantu (Musiman)** di atas field Biaya Produksi.
- [x] **Task 6.5:** Implementasi Step 3: Pendapatan & Aset Usaha (auto-hitung bulanan ke tahunan). Sertakan Panel Kalkulator Bantu di sini juga.
- [x] **Task 6.6:** Implementasi Step 4: Pengeluaran Makan (dengan dropdown konversi Harian/Mingguan/Musiman ke Bulanan).
- [x] **Task 6.7:** Implementasi Step 5: Pengeluaran Non-Makan & Tahunan.
- [x] **Task 6.8:** Implementasi Step 6: Aset & Kondisi Hunian, lengkap dengan tombol akhir "Simpan & Selesai".

## Fase 7: Panel Rekapitulasi & Quick Copy
Menampilkan hasil perhitungan dan menyediakannya untuk disalin.
- [x] **Task 7.1:** Buat Halaman/Panel Rekapitulasi untuk mengkalkulasi: Laba Bersih, Total Pengeluaran Keluarga, dan Surplus/Defisit.
- [x] **Task 7.2:** Implementasikan tombol Quick Copy di tiap baris angka mentah menggunakan `navigator.clipboard.writeText`, sertakan toast hijau "Tersalin!".

## Fase 8: Logika Sinkronisasi Final (Backup ke Server)
- [x] **Task 8.1:** Implementasi fungsi sync saat tombol "Simpan & Selesai" ditekan di Step 6.
- [x] **Task 8.2:** Buat Halaman Riwayat Sinkronisasi (untuk melihat item pending dan trigger sync manual jika online).
- [x] **Task 8.3:** Buat listener koneksi online/offline untuk auto-retry data pending.

## Fase 9: Integrasi Pembayaran (Midtrans Snap)
Persiapan UI/UX pembayaran.
- [x] **Task 9.1:** Buat Halaman "Beli Lifetime Rp25.000" (tampil jika `is_lifetime_paid` false).
- [x] **Task 9.2:** Mock API Call atau integrasi backend untuk memanggil Snap Token.
- [x] **Task 9.3:** Buat Halaman Status Pembayaran (Menunggu, Sukses, Expired).

## Verifikasi dan Pengujian
- **Review UI/UX:** Pastikan semua touch-target >= 44x44px dan border radius 0px.
- **Review Flow:** Tes keluar tanpa save, tes offline mode (Dexie), dan tes login beda device.

---
**Catatan:** Pembangunan dimulai dari Fase 1. Silakan review list ini. Jika disetujui, kita akan mulai mengeksekusi dari Task 1.1.
