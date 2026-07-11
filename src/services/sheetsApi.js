import { SPREADSHEET_ID, API_KEY, RANGE_ABSEN, RANGE_KARYAWAN, RANGE_GAJI, RANGE_SHIFT, RANGE_AREA } from '../config'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

function parseRows(rows) {
  if (!rows || rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map((row) => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] || ''
    })
    return obj
  })
}

function parseGaji(rows) {
  if (!rows || rows.length === 0) return []
  return rows.map((row) => ({
    'Nama': (row[1] || '').trim().toLowerCase(),
    'Gaji Pokok': String(row[5] || '0').replace(/[^0-9]/g, ''),
    'Gaji Harian': String(row[6] || '0').replace(/[^0-9]/g, ''),
  }))
}

export async function fetchAbsensi() {
  if (!API_KEY) {
    throw new Error('API Key belum diatur. Buat file .env.local dengan VITE_GOOGLE_API_KEY=key_anda')
  }

  const [absenRes, karyawanRes, gajiRes, shiftRes, areaRes] = await Promise.all([
    fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE_ABSEN)}?key=${API_KEY}`),
    fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE_KARYAWAN)}?key=${API_KEY}`),
    fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE_GAJI)}?key=${API_KEY}`),
    fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE_SHIFT)}?key=${API_KEY}`),
    fetch(`${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE_AREA)}?key=${API_KEY}`),
  ])

  const [absenData, karyawanData, gajiData, shiftData, areaData] = await Promise.all([absenRes.json(), karyawanRes.json(), gajiRes.json(), shiftRes.json(), areaRes.json()])

  if (absenData.error) throw new Error(absenData.error.message)
  if (karyawanData.error) throw new Error(karyawanData.error.message)
  if (gajiData.error) throw new Error('Master_Gaji: ' + gajiData.error.message)

  const shiftMap = {}
  if (shiftData.values) {
    shiftData.values.forEach((row) => {
      const tgl = (row[0] || '').trim()
      const nama = (row[1] || '').trim().toLowerCase()
      const shift = (row[3] || '').trim()
      if (nama && tgl && shift && tgl !== 'Tanggal') shiftMap[`${nama}|${tgl}`] = shift
    })
  }

  return {
    absensi: parseRows(absenData.values),
    karyawan: parseRows(karyawanData.values),
    gaji: parseGaji(gajiData.values),
    shiftMap,
    daftarArea: areaData.values ? parseRows(areaData.values) : [],
  }
}
