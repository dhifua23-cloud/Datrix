# Datrix - Digital Attendance & Tracking Information System

Dashboard absensi karyawan real-time terintegrasi dengan Google Sheets.

## Fitur

- Ringkasan kehadiran harian (Hadir, Telat, Izin, Sakit)
- Daftar karyawan yang belum absen
- Pelanggaran (telat & pulang cepat)
- Grafik tren kehadiran 30 hari
- Filter berdasarkan Area & Nama
- Kalender absensi bulanan
- Riwayat absensi per karyawan
- Export Excel & PDF

## Persyaratan

- Node.js 18+
- Akun Google Cloud Platform (gratis)
- Spreadsheet Google Sheets dengan data absensi

## Cara Install

### 1. Clone / Download Project

```bash
cd hris-dashboard
npm install
```

### 2. Setup Google Sheets API

1. Buka https://console.cloud.google.com/
2. Buat project baru
3. Enable **Google Sheets API**
4. Buat **API Key** (Credentials > Create Credentials > API Key)
5. (Opsional) Restrict API Key ke domain Anda

### 3. Setup Spreadsheet

1. Buat spreadsheet dengan format berikut:
   - Tab `Master Absen` → kolom: Tanggal, NIK, Nama, Jabatan, Area, Shift, Jadwal Masuk, Jadwal Pulang, Jam Masuk, Jam Pulang, Telat (Menit), Pulang Cepat (Menit), Status Kehadiran
   - Tab `Master_Karyawan` → data master karyawan
2. Share spreadsheet → **Anyone with the link → Viewer**

### 4. Konfigurasi

Buat file `.env.local`:

```env
VITE_GOOGLE_API_KEY=api_key_anda_disini
```

Edit `src/config.js` jika Spreadsheet ID berbeda:

```js
export const SPREADSHEET_ID = 'id_spreadsheet_anda'
```

### 5. Jalankan

```bash
npm run dev
```

Buka http://localhost:5173

### 6. Build untuk Production

```bash
npm run build
```

Hasil build di folder `dist/`, siap di-deploy ke Vercel / Netlify.

## Deploy ke Vercel (Gratis)

1. Push project ke GitHub
2. Buka https://vercel.com
3. Import repository
4. Tambahkan Environment Variable: `VITE_GOOGLE_API_KEY`
5. Deploy

## Struktur Project

```
src/
├── branding.js          # Konfigurasi brand
├── config.js            # Konfigurasi API & Spreadsheet
├── services/
│   ├── sheetsApi.js     # Google Sheets API service
│   └── utils.js         # Utility functions
├── components/
│   ├── SummaryCards.jsx # Kartu ringkasan kehadiran
│   ├── BelumAbsen.jsx   # Daftar belum absen
│   ├── Pelanggaran.jsx  # Tabel pelanggaran
│   ├── GrafikKehadiran.jsx # Grafik tren
│   ├── FilterBar.jsx    # Filter area & nama
│   ├── RiwayatKaryawan.jsx # Modal riwayat
│   ├── KalenderAbsensi.jsx # Kalender
│   └── ExportButton.jsx # Export Excel/PDF
└── App.jsx              # Halaman utama
```
