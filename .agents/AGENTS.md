# Aturan Khusus (Project-Scoped Rules) untuk Proyek Kalkulator SE-2026

Aturan ini bersifat **KETAT** dan **WAJIB** diikuti oleh setiap AI yang bekerja dalam repository ini.

## 1. Aturan Ketat Desain UI & Reusability Komponen (RawBlock System)
- **Gunakan Komponen Global:** AI **wajib** menggunakan kelas-kelas CSS dan komponen yang sudah didefinisikan secara global (misalnya di `index.css`). Jangan pernah membuat kelas utilitas Tailwind acak untuk warna, font, atau border jika sudah ada aturan globalnya.
- **Buat Komponen Reusable:** Jika sebuah elemen UI baru dibutuhkan dan belum ada komponennya, **buatkan komponen React yang reusable** (letakkan di `src/components/`). Jangan pernah membuat elemen UI secara *hard-coded* di dalam halaman (page) yang hanya dipakai sekali jika berpotensi digunakan ulang.
- **Konsistensi Spacing & Margin:** AI harus mematuhi skala spacing yang ada di `DESIGN.md` (sp-1 hingga sp-8) untuk memastikan keselarasan jarak antar komponen.
- **Dilarang Mendesain Ulang:** Desain mengusung konsep *brutalism* murni. 
  - **Dilarang keras** menggunakan `border-radius` (selalu 0px / siku-siku).
  - **Dilarang keras** menggunakan efek bayangan (`box-shadow`).
  - **Dilarang keras** menggunakan palet warna selain yang sudah disepakati (Hitam, Putih, Biru, Hijau, Oranye, Merah, dan abu-abu standar untuk disabled state).
- **Aksesibilitas & UX:** Semua tombol atau elemen interaktif wajib memiliki area sentuh minimal 44x44px (`min-h-[44px] min-w-[44px]`).

## 2. Aturan Ketat Gaya Penulisan Kode (React, Vite, Tailwind)
- **Komponen Fungsional:** Selalu gunakan Functional Components dengan React Hooks.
- **Struktur File:**
  - Halaman penuh ditempatkan di `src/pages/`.
  - Komponen kecil dan reusable ditempatkan di `src/components/`.
  - Manajemen state (Zustand) ditempatkan di `src/stores/`.
  - Konfigurasi database lokal (Dexie.js) ditempatkan di `src/db/`.
- **Styling dengan Tailwind:** Gabungkan Tailwind classes secara bersih. Hindari inline-style (`style={{ ... }}`). Untuk elemen dengan styling panjang yang dipakai berulang, ekstraksi menjadi kelas komponen di `index.css` atau jadikan Reusable React Component.
- **Penamaan Variabel & Fungsi:** Gunakan `camelCase` untuk fungsi dan variabel. Gunakan `PascalCase` untuk nama komponen. Penamaan harus deskriptif (misal: `handleCalculateTotal`, bukan `calc`).

## 3. Ketelitian & Keselarasan dengan PRD
- **Jangan Menambahkan Fungsionalitas Sendiri:** AI **dilarang** menambahkan fitur atau kolom database baru yang tidak ada di `PRD_Kalkulator_SE2026_v2.md`.
- **Ketaatan Logika Aplikasi:**
  - Data hanya disimpan saat tombol "Lanjut/Next" atau "Hitung" ditekan (tidak ada *auto-save* per-field).
  - Sinkronisasi dengan Supabase hanya dilakukan satu kali di langkah terakhir ("Simpan & Selesai"), tidak pada setiap langkah draf.
  - Supabase hanya digunakan untuk otentikasi, lisensi, dan backup data akhir, sedangkan operasional sehari-hari sepenuhnya offline-first menggunakan Dexie.js (IndexedDB).
- **Review Sebelum Mengubah:** Sebelum memodifikasi skema database (Dexie/Supabase) atau alur form, AI wajib merujuk kembali kepada spesifikasi data resmi sensus di dalam PRD agar tidak terjadi deviasi dari format kuesioner BPS.
