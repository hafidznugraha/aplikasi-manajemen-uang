<div align="center">

# 💰 BudgetKu — Aplikasi Manajemen Keuangan

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**BudgetKu** adalah platform web manajemen keuangan pribadi (*personal finance management*) modern, intuitif, dan aman yang dirancang untuk membantu pengguna mengontrol arus kas, menyusun anggaran bulanan berbasis metode 50/30/20, melacak transaksi harian beserta bukti struk, serta menganalisis performa keuangan secara *real-time*.

</div>

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi / Tech Stack](#-teknologi--tech-stack)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi](#-panduan-instalasi)
- [Konfigurasi Supabase](#-konfigurasi-supabase-sangat-penting)
- [Cara Menjalankan Aplikasi](#-cara-menjalankan-aplikasi)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Pengembang](#-pengembang)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Keamanan Multi-User (Supabase Auth)
- **Registrasi 2 Langkah dengan Verifikasi Email OTP**: Kode OTP dikirimkan langsung ke kotak masuk (*inbox*) email asli pengguna menggunakan Supabase Auth Mailer resmi.
- **Enkripsi Kata Sandi Database (Bcrypt)**: Seluruh kata sandi di-hash secara aman menggunakan algoritma Bcrypt (`$2y$12$...`) sebelum disimpan ke tabel database PostgreSQL Supabase.
- **Proteksi Halaman (Route Guard)**: Membatasi akses menu utama hanya untuk sesi pengguna yang valid dan mencegah akses tanpa autentikasi.
- **Lupa & Atur Ulang Kata Sandi**: Alur pemulihan kata sandi melalui tautan aman (*magic link*) dengan deteksi token kedaluwarsa (*expired token handler*) otomatis.
- **Profil Pengguna**: Melihat ringkasan akun terverifikasi dan memperbarui kata sandi langsung dari dalam aplikasi.

### 📊 Dashboard Finansial Interaktif
- **Ringkasan Arus Kas**: Kartu saldo total, pemasukan bulanan, pengeluaran riil, dan sisa anggaran yang diperbarui secara *real-time*.
- **Grafik Analisis Visual**: Integrasi grafik interaktif (Chart.js) untuk melihat proporsi pengeluaran per kategori.
- **Isolasi Data Pengguna**: Setiap data transaksi, anggaran, dan kategori terisolasi penuh berdasarkan `user_id` masing-masing akun.

### 🎯 Perencanaan Anggaran Bulanan (Budget Setup)
- **Metode 50/30/20**: Pengelompokan pengeluaran otomatis ke dalam Kebutuhan (*Needs* 50%), Keinginan (*Wants* 30%), dan Tabungan/Investasi (*Savings* 20%).
- **Kategori & Sub-Kategori Dinamis**: Fleksibilitas menambah, mengedit, atau menghapus pos anggaran sesuai kebutuhan personal.
- **Indikator Kesehatan Anggaran**: Notifikasi visual jika pengeluaran pada pos tertentu mendekati atau melampaui batas (*overbudget*).

### 📝 Pencatatan Transaksi Harian (Tracker)
- **Pencatatan Cepat**: Input pemasukan dan pengeluaran harian lengkap dengan tanggal, kategori pos, dan deskripsi.
- **Unggah Struk / Bukti Pembayaran**: Integrasi penyimpanan foto struk ke Supabase Storage Bucket (`receipts`).
- **Realokasi Anggaran Otomatis**: Fitur penyesuaian otomatis antarpos anggaran saat terjadi defisit pada kategori tertentu.

### 🎨 Antarmuka Modern & Bebas Gangguan
- **Custom Modal Dialog**: Menggantikan seluruh popup bawaan browser (`alert()`, `confirm()`) dengan modal kustom modern Bootstrap 5.
- **Tata Letak Presisi**: Desain antarmuka bebas *ghost scrollbar* yang terkunci rapi di tengah layar desktop maupun responsif di ponsel.

---

## 🛠 Teknologi / Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Backend Framework** | [Laravel 12](https://laravel.com) | REST API, Routing, Mailer, Controller, & Scoping |
| **Bahasa Pemrograman** | [PHP 8.2+](https://php.net) | Core backend runtime |
| **Database & Auth** | [Supabase](https://supabase.com) (PostgreSQL) | Auth GoTrue, Database Relasional, & Storage Bucket |
| **Frontend Styling** | [Bootstrap 5.3](https://getbootstrap.com) | Responsive Layout, Components, & Flexbox |
| **Icon Pack** | [Bootstrap Icons](https://icons.getbootstrap.com) | Iconography |
| **Frontend Logic** | Vanilla JavaScript (ES6 Modules) | Client-side controller, Supabase JS SDK v2 |
| **Data Visualizer** | [Chart.js](https://www.chartjs.org/) | Diagram & Grafik Analisis Finansial |
| **Build Tool & Bundler** | [Vite 7](https://vitejs.dev/) | Hot Module Replacement (HMR) & Asset Compilation |

---

## 📋 Prasyarat Sistem

Pastikan perangkat Anda telah terpasang dependensi berikut:

- **PHP** $\ge$ 8.2 (dengan ekstensi: `pdo_pgsql`, `pgsql`, `curl`, `mbstring`, `openssl`, `fileinfo`)
- **Composer** $\ge$ 2.0
- **Node.js** $\ge$ 18.x & **NPM**
- **Git**
- **Akun Supabase** (Gratis di [supabase.com](https://supabase.com))

---

## 🚀 Panduan Instalasi

Ikuti langkah-langkah berikut untuk memasang dan menjalankan BudgetKu di lingkungan lokal (*local development*):

### 1. Clone Repositori
```bash
git clone https://github.com/hafidznugraha/aplikasi-manajemen-uang.git
cd aplikasi-manajemen-uang
```

### 2. Pasang Dependensi Backend (Composer)
```bash
composer install
```

### 3. Pasang Dependensi Frontend (NPM)
```bash
npm install
```

### 4. Salin & Konfigurasi File Environment
Salin file template `.env.example` menjadi `.env`:

**Windows (PowerShell / CMD):**
```powershell
copy .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

### 5. Generate Application Key
```bash
php artisan key:generate
```

---

## ⚙️ Konfigurasi Supabase (Sangat Penting)

Untuk menghubungkan aplikasi dengan layanan Supabase Database, Auth, dan Storage, lakukan langkah-langkah berikut:

### 1. Dapatkan Kredensial Proyek Supabase
Buka **Supabase Dashboard** $\rightarrow$ Pilih Proyek Anda $\rightarrow$ **Project Settings** $\rightarrow$ **API**:
- `Project URL` (contoh: `https://xyzprojectref.supabase.co`)
- `Project API Keys` $\rightarrow$ `anon` / `public` key

### 2. Isi Variabel di File `.env`
Buka file `.env` dan lengkapi bagian konfigurasi database dan Supabase:

```env
# Koneksi Database Supabase PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_SSLMODE=require

# Kredensial Supabase API & Auth
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=receipts

# Frontend Vite Supabase Keys
VITE_SUPABASE_URL="${SUPABASE_URL}"
VITE_SUPABASE_ANON_KEY="${SUPABASE_KEY}"
```

### 3. Pengaturan Supabase Authentication & Redirect URLs
Di **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**:
- **Site URL**: `http://127.0.0.1:8000`
- **Redirect URLs**: Tambahkan pola redirect berikut:
  - `http://127.0.0.1:8000/**`
  - `http://localhost:8000/**`
  - `http://127.0.0.1:8000/reset-password.html`
  - `http://127.0.0.1:8000/reset-password`

### 4. Pengaturan Template Email (Email Templates)
Di **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **Email Templates**:
- **Confirm signup / Magic Link**: Pastikan menggunakan placeholder `{{ .Token }}` untuk kode OTP atau `{{ .ConfirmationURL }}` untuk tautan konfirmasi.
- **Reset Password**: Pastikan menggunakan placeholder `{{ .ConfirmationURL }}` untuk tautan atur ulang kata sandi.

### 5. Buat Storage Bucket untuk Struk Bukti Transaksi
Di **Supabase Dashboard** $\rightarrow$ **Storage** $\rightarrow$ Buat Bucket baru bernama **`receipts`** dengan status *Public Bucket* agar foto struk dapat diakses oleh aplikasi.

---

## 💻 Cara Menjalankan Aplikasi

Anda dapat menjalankan backend Laravel dan asset builder Vite secara bersamaan menggunakan salah satu cara di bawah ini:

### Opsi 1: Menjalankan Sekaligus (Direkomendasikan)
Gunakan perintah skrip bawaan:
```bash
composer run dev
```
*Perintah di atas akan menjalankan `php artisan serve`, `queue:listen`, dan `npm run dev` secara otomatis via Concurrently.*

### Opsi 2: Menjalankan Secara Terpisah
Buka 2 tab terminal terpisah:

**Terminal 1 (Laravel Server):**
```bash
php artisan serve
```

**Terminal 2 (Vite Asset Server):**
```bash
npm run dev
```

Buka peramban (*browser*) Anda dan akses:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## ☁️ Panduan Deployment ke Vercel (Serverless)

Aplikasi BudgetKu telah dikonfigurasi agar siap di-*deploy* ke **Vercel** menggunakan runtime `vercel-php`:

### 1. File Konfigurasi Vercel
- **[`vercel.json`](file:///d:/aplikasi-manajemen-uang/vercel.json)**: Mengatur rewrite routing semua trafik ke entrypoint `api/index.php` dan static build untuk folder `public/`.
- **[`api/index.php`](file:///d:/aplikasi-manajemen-uang/api/index.php)**: Entrypoint serverless yang secara dinamis menyiapkan folder writable `/tmp` untuk view cache Laravel sebelum memanggil `public/index.php`.

### 2. Pengaturan Environment Variables di Vercel Dashboard
Di **Vercel Dashboard** $\rightarrow$ **Project Settings** $\rightarrow$ **Environment Variables**, tambahkan:

| Key | Value / Keterangan |
|---|---|
| `APP_NAME` | `BudgetKu` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | *(Salin dari file `.env` lokal atau jalankan `php artisan key:generate --show`)* |
| `APP_URL` | `https://your-project.vercel.app` |
| `LOG_CHANNEL` | `stderr` *(Wajib di serverless)* |
| `SESSION_DRIVER` | `cookie` atau `database` *(HINDARI `file`)* |
| `CACHE_STORE` | `database` atau `array` *(HINDARI `file`)* |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres.YOUR_PROJECT_REF` |
| `DB_PASSWORD` | `YOUR_DATABASE_PASSWORD` |
| `DB_SSLMODE` | `require` |
| `SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_KEY` | `YOUR_SUPABASE_ANON_KEY` |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `YOUR_SUPABASE_ANON_KEY` |

### 3. Tambahkan Redirect URL di Supabase
Di **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**:
Tambahkan domain Vercel Anda ke daftar Redirect URLs:
- `https://your-project.vercel.app/**`
- `https://your-project.vercel.app/reset-password.html`
- `https://your-project.vercel.app/reset-password`

---

## 📁 Struktur Direktori Proyek

```plaintext
aplikasi-manajemen-uang/
├── app/
│   ├── Http/Controllers/
│   │   ├── ApiController.php         # REST API controller & Supabase scoping
│   │   ├── DashboardController.php   # Dashboard, Budget, & Arsip views
│   │   └── TrackerController.php     # Daily tracker view
│   ├── Mail/
│   │   └── OtpVerificationMail.php   # Mailable OTP verification
│   └── Models/
│       ├── User.php                  # Model User dengan auto-Bcrypt hashing
│       ├── Budget.php                # Model Anggaran Bulanan
│       ├── Category.php              # Model Kategori Anggaran
│       ├── Subcategory.php           # Model Sub-kategori Anggaran
│       └── Transaction.php           # Model Transaksi Keuangan
├── public/
│   ├── css/
│   │   └── style.css                 # Custom BudgetKu design system
│   └── js/
│       ├── modal-alert.js            # Custom modal notification engine
│       ├── supabase.js               # Supabase JS SDK client connection
│       ├── auth.js                   # Route Guard & session manager
│       ├── login.js                  # Login handler
│       ├── register.js               # 2-step OTP registration handler
│       ├── forgot-password.js        # Password recovery email sender
│       ├── reset-password.js         # Secure password update & hash validator
│       ├── profile.js                # Profile manager & password updater
│       ├── dashboard.js              # Dashboard logic & Chart.js renderer
│       ├── budget.js                 # Monthly 50/30/20 budget setup
│       ├── tracker.js                # Daily transaction tracker & receipt upload
│       └── arsip.js                  # Historical archives & monthly filters
├── resources/
│   └── views/
│       ├── index.blade.php           # Halaman Dashboard Finansial
│       ├── budget.blade.php          # Halaman Setup Anggaran
│       ├── tracker.blade.php         # Halaman Tracker Transaksi Harian
│       ├── arsip.blade.php           # Halaman Arsip Keuangan
│       ├── profile.blade.php         # Halaman Profil Pengguna
│       ├── login.blade.php           # Halaman Masuk Akun
│       ├── register.blade.php        # Halaman Pendaftaran & Verifikasi OTP
│       ├── forgot-password.blade.php # Halaman Permintaan Reset Password
│       ├── reset-password.blade.php  # Halaman Buat Password Baru
│       └── emails/
│           └── otp-verification.blade.php # Template Email HTML OTP
├── routes/
│   └── web.php                       # Web routes & REST API endpoints
├── .env.example                      # Template variabel lingkungan & Supabase
├── composer.json                     # PHP package dependencies
└── package.json                      # Node.js package dependencies
```

---

## 👨‍💻 Pengembang

Proyek **BudgetKu** ini dirancang dan dikembangkan dengan dedikasi oleh:

**Hafidz Nugraha**  
GitHub: [@hafidznugraha](https://github.com/hafidznugraha)

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](LICENSE). Silakan gunakan dan kembangkan untuk kebutuhan Anda.
