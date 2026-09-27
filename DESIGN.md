# Design Direction : BudgetKu (Apple Design & Liquid Glass)

Reading this as: Personal Finance Management & Cash Flow Tracker Web Application for professionals, freelancers, and households, in an Apple Human Interface & iOS 26 Liquid Glass visual language style, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2

## 1. Identity & Character
- **Product**: BudgetKu (Aplikasi Manajemen Uang & Pelacak Arus Kas Mandiri)
- **Voice & Tone**: Jelas, terpercaya, tenang, presisi finansial, tanpa jargon buatan.
- **Visual Philosophy**: Mengadopsi prinsip WWDC *Designing Fluid Interfaces* dan Apple iOS 26 *Liquid Glass Design System*. Antarmuka berfungsi seperti kaca optik cair yang membiaskan cahaya latar belakang secara dinamis, responsif terhadap sentuhan fisik, dan memiliki bobot kedalaman visual (depth hierarchy).

## 2. Color Palette & Vibrancy (WCAG AA Compliant)
Mengikuti palet sistem Apple dengan rasio kontras ketat (>= 4.5:1 untuk teks normal, >= 3:1 untuk teks besar dan grafik):

- **Light Mode**:
  - Background Canvas: `#f5f5f7` (Apple System Canvas Gray)
  - Glass Surface: `rgba(255, 255, 255, 0.72)` dengan `backdrop-filter: blur(20px) saturate(180%)`
  - Solid Card Surface: `#ffffff` dengan border `rgba(0, 0, 0, 0.06)` dan specular highlight `inset 0 1px 0 rgba(255, 255, 255, 0.8)`
  - Text Primary: `#1d1d1f`
  - Text Secondary / Muted: `#6e6e73`
  - Accent Primary: `#0071e3` (Apple System Blue)
  - Success / Tabungan: `#34c759` (Apple System Green)
  - Warning / Perhatian: `#ff9500` (Apple System Orange)
  - Danger / Overbudget: `#ff3b30` (Apple System Red)

- **Dark Mode** (`[data-theme="dark"]`):
  - Background Canvas: `#000000` / `#121214`
  - Glass Surface: `rgba(28, 28, 30, 0.75)` dengan `backdrop-filter: blur(25px) saturate(190%)`
  - Solid Card Surface: `#1c1c1e` dengan border `rgba(255, 255, 255, 0.08)` dan specular highlight `inset 0 1px 0 rgba(255, 255, 255, 0.12)`
  - Text Primary: `#f5f5f7`
  - Text Secondary / Muted: `#86868b`
  - Accent Primary: `#2997ff`
  - Success / Tabungan: `#30d158`
  - Warning / Perhatian: `#ff9f0a`
  - Danger / Overbudget: `#ff453a`

## 3. Typography & Optical Hierarchy
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif`
- **Optical Tracking**:
  - Headings / Display: Tight letter-spacing (`-0.022em` sampai `-0.015em`), line-height rapat (`1.1` - `1.25`)
  - Subheadings & Body: Normal tracking (`-0.005em` sampai `0em`), line-height lega (`1.5`)
  - Currency & Numbers: `font-variant-numeric: tabular-nums` untuk perataan angka finansial sempurna.
- **Copywriting**: Tidak ada karakter em dash (dilarang R-02). Menggunakan tanda titik dua `:`, tanda hubung pendek `-`, koma `,`, atau kurung `()`.

## 4. Liquid Glass Materials & Depth Layering
- **Navigation Bar Chrome**: Translucent floating liquid glass dengan specular edge `border-bottom: 1px solid rgba(255, 255, 255, 0.4)` di light mode dan `rgba(255, 255, 255, 0.12)` di dark mode.
- **Floating Allocation Summary Bar**: Floating pill/sheet bar di bagian bawah layar dengan blur dinamis dan border tipis berkilau.
- **Summary Cards (Hero)**: Tiga kartu utama dengan gradasi kedalaman lembut (Apple Blue, Apple Green, dan Apple Orange) dipadukan dengan icon box berefek translucent glass.
- **Glass Buttons & Controls**:
  - Active compression: `transform: scale(0.97)` saat ditekan (`:active`) dengan transisi `100ms ease-out` untuk feedback instan tanpa lag.
  - Border radius terstruktur: 9999px (capsule pill) untuk badges, pills, dan floating status; 16px - 20px untuk cards; 12px untuk form inputs.
- **Dose Cap**: Glassmorphism dibatasi pada komponen struktural melayang (Navbar, Floating Bottom Bar, Modal/Dialog scrim, dan Toast Alert). Tabel data dan form utama tetap menggunakan latar solid yang bersih demi kontras dan keterbacaan tinggi.

## 5. Physical Springs & Fluid Motion
- Damping ratio `1.0` (critically damped) untuk transisi UI standar (tab switch, dropdown, collapse drawer).
- Damping ratio `0.8` (sedikit sentuhan elastis) khusus untuk interaksi momentum (drag/drop upload, pull sheet, modal entrance).
- Mendukung `@media (prefers-reduced-motion: reduce)` dengan transisi cross-fade lembut tanpa gerakan translasi.

## 6. Liveliness Levers
- **Focal Point**: Kartu ringkasan finansial utama (Total Anggaran & Sisa Budget) sebagai jangkar visual pertama saat halaman dimuat.
- **Whitespace**: Spasi bernapas 24px - 32px antar blok, memberikan kesan mewah khas perangkat Apple.
- **Identity Motif**: Badge pil status dinamis (Hemat, Waspada, Overbudget) dengan warna sistem Apple dan tipografi tabular.
