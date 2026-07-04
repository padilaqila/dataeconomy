# Kumpulan Template Email Supabase (Desain Brutalisme)

Semua template di bawah ini menggunakan gaya desain *Brutalisme* yang konsisten dengan tema Kalkulator Sensus SE-2026. Anda dapat langsung men-copy dan paste kode HTML di bawah ini ke dalam **Supabase Dashboard -> Authentication -> Email Templates** pada tab yang bersesuaian.

---

## 1. Confirm sign up
**Fungsi:** Meminta pengguna mengonfirmasi alamat email mereka setelah mendaftar (berisi *Link* karena UI saat ini mengharapkan klik *link* konfirmasi, bukan OTP).
**Subject Suggestion:** `Verifikasi Pendaftaran Anda - Kalkulator Sensus`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      KONFIRMASI PENDAFTARAN
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Selamat bergabung di <strong>Kalkulator Sensus SE-2026</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
      Langkah terakhir! Silakan klik tombol hitam di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akun.
    </p>
    
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: bold; font-family: 'Arial Black', Impact, sans-serif; text-transform: uppercase; border: 2px solid #000; margin-bottom: 30px;">
      VERIFIKASI EMAIL SAYA
    </a>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Jika tombol tidak berfungsi, Anda juga bisa menyalin link berikut ke browser Anda: <br><br> {{ .ConfirmationURL }}
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```

---

## 2. Invite user
**Fungsi:** Mengundang seseorang untuk membuat akun atau memberikan mereka akses ke sistem.
**Subject Suggestion:** `Anda Diundang: Akses Kalkulator Sensus SE-2026`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      UNDANGAN AKSES
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Anda telah diundang untuk menggunakan aplikasi pendataan <strong>Kalkulator Sensus SE-2026</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
      Silakan klik tombol di bawah ini untuk menerima undangan dan mengatur kata sandi untuk akun Anda.
    </p>
    
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: bold; font-family: 'Arial Black', Impact, sans-serif; text-transform: uppercase; border: 2px solid #000; margin-bottom: 30px;">
      TERIMA UNDANGAN
    </a>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Tautan undangan ini akan kedaluwarsa secara otomatis. Mohon segera selesaikan registrasi Anda.
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```

---

## 3. Magic link or OTP
**Fungsi:** Mengirim OTP untuk keperluan *Passwordless Login* atau Autentikasi 2 Faktor (berisi 6-digit OTP).
**Subject Suggestion:** `Kode OTP Login Anda`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      KODE AUTENTIKASI
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Gunakan 6-digit kode OTP di bawah ini untuk melanjutkan proses login ke <strong>Kalkulator Sensus</strong>:
    </p>
    
    <div style="background-color: #f9f9f9; border: 3px solid #000; padding: 20px; margin: 30px 0;">
      <h1 style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; margin: 0; color: #000;">
        {{ .Token }}
      </h1>
    </div>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Jangan pernah membagikan kode ini kepada siapa pun. Jika Anda tidak mencoba login, amankan akun Anda segera.
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```

---

## 4. Change email address
**Fungsi:** Meminta pengguna memverifikasi alamat email mereka yang baru setelah mereka melakukan perubahan profil di sistem.
**Subject Suggestion:** `Verifikasi Alamat Email Baru Anda`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      VERIFIKASI EMAIL BARU
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Kami menerima permintaan untuk mengubah alamat email profil Anda di <strong>Kalkulator Sensus</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
      Silakan klik tombol di bawah ini untuk memverifikasi bahwa ini adalah alamat email Anda yang baru dan sah.
    </p>
    
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: bold; font-family: 'Arial Black', Impact, sans-serif; text-transform: uppercase; border: 2px solid #000; margin-bottom: 30px;">
      KONFIRMASI PERUBAHAN
    </a>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Jika Anda tidak meminta perubahan alamat email, mohon abaikan pesan ini. Email lama Anda tidak akan diganti tanpa konfirmasi.
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```

---

## 5. Reset password
**Fungsi:** Mengirim OTP kepada pengguna yang lupa kata sandi. (Template ini sama persis dengan yang kita bahas sebelumnya).
**Subject Suggestion:** `🔑 Kode OTP Reset Password Anda`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      RESET PASSWORD
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Kami menerima permintaan untuk mengatur ulang kata sandi Anda di aplikasi <strong>Kalkulator Sensus</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Masukkan <strong>6-digit kode OTP</strong> di bawah ini ke dalam form aplikasi untuk membuat password baru:
    </p>
    
    <div style="background-color: #f9f9f9; border: 3px solid #000; padding: 20px; margin: 30px 0;">
      <h1 style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; margin: 0; color: #000;">
        {{ .Token }}
      </h1>
    </div>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Kode OTP ini bersifat rahasia dan hanya berlaku sesaat. Jika Anda tidak merasa melakukan permintaan ini, mohon abaikan email ini.
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```

---

## 6. Reauthentication
**Fungsi:** Meminta pengguna memasukkan OTP sebagai lapisan keamanan tambahan sebelum mereka melakukan operasi sensitif (misal: menghapus data perusahaan).
**Subject Suggestion:** `Verifikasi Keamanan Tambahan`

```html
<div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 40px 20px; color: #000;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 3px solid #000; padding: 30px; text-align: center;">
    
    <h2 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; text-transform: uppercase; margin-top: 0; border-bottom: 3px dashed #000; padding-bottom: 15px; margin-bottom: 25px;">
      VERIFIKASI KEAMANAN
    </h2>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Sistem mendeteksi aktivitas yang bersifat sensitif pada akun <strong>Kalkulator Sensus</strong> Anda.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
      Untuk memastikan bahwa ini benar-benar Anda, silakan masukkan <strong>6-digit kode keamanan</strong> berikut:
    </p>
    
    <div style="background-color: #fff3cd; border: 3px solid #000; padding: 20px; margin: 30px 0;">
      <h1 style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; margin: 0; color: #000;">
        {{ .Token }}
      </h1>
    </div>
    
    <p style="font-size: 13px; color: #555; margin-bottom: 30px; font-style: italic;">
      *Hati-hati: Segera ubah password Anda jika Anda tidak sedang mencoba mengakses menu pengaturan keamanan akun Anda.
    </p>
    
    <div style="border-top: 3px solid #000; padding-top: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
      KALKULATOR SENSUS SE-2026
    </div>

  </div>
</div>
```
