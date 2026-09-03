import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'

// Konversi menit ke format "Xj Ym"
function fmtMenit(mnt) {
  if (!mnt || mnt === '-' || mnt === '0') return '-'
  const jam = Math.floor(mnt / 60)
  const menit = mnt % 60
  if (jam > 0) return `${jam}j ${menit}m`
  return `${menit}m`
}

// Parse nilai durasi seperti "6j 44m", "38m", "-", angka, atau desimal
function parseDurasi(val) {
  if (!val || val === '-') return 0
  const s = String(val).trim()
  if (s.match(/^\d+$/)) return parseInt(s)
  let menit = 0
  const j = s.match(/(\d+)j/)
  const m = s.match(/(\d+)m/)
  if (j) menit += parseInt(j[1]) * 60
  if (m) menit += parseInt(m[1])
  return menit
}

// Hitung durasi antar 2 jam
function hitungDurasi(jamAwal, jamAkhir) {
  if (!jamAwal || !jamAkhir) return null
  const [h1, m1] = jamAwal.split(':').map(Number)
  const [h2, m2] = jamAkhir.split(':').map(Number)
  if (isNaN(h1) || isNaN(h2)) return null
  let selisih = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (selisih < 0) selisih += 24 * 60
  return selisih
}

export default function RekapPage() {
  const { absensi, daftarArea, loading } = useApp()
  const [bulan, setBulan] = useState('Semua')
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [cariNama, setCariNama] = useState('')

  const daftarAreaOptions = useMemo(() => {
    const areas = new Set()
    absensi.forEach((d) => { if (d.Area) areas.add(d.Area) })
    if (daftarArea) daftarArea.forEach((a) => { if (a['Nama Area']) areas.add(a['Nama Area']) })
    return ['Semua Area', ...areas]
  }, [absensi, daftarArea])

  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  // Group data per karyawan
  const data = useMemo(() => {
    const filtered = absensi.filter((d) => {
      if (!d.Tanggal) return false
      const tgl = new Date(d.Tanggal)
      if (bulan !== 'Semua' && tgl.getMonth() + 1 !== parseInt(bulan)) return false
      if (tgl.getFullYear() !== tahun) return false
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return false
      if (cariNama && !(d.Nama || '').toLowerCase().includes(cariNama.toLowerCase())) return false
      return true
    })

    const perKaryawan = {}
    filtered.forEach((d) => {
      const nama = (d.Nama || '').trim()
      if (!nama) return
      if (!perKaryawan[nama]) {
        perKaryawan[nama] = { nama, nik: d.NIK, jabatan: d.Jabatan, area: d.Area, rows: [], totalTelat: 0, totalEarly: 0, totalKerja: 0, totalLembur: 0, totalHadir: 0, totalTelatCount: 0 }
      }
      const k = perKaryawan[nama]
      const late = parseDurasi(d['Telat (Menit)'])
      const early = parseDurasi(d['Pulang Cepat (Menit)'])
      const kerja = hitungDurasi(d['Jam Masuk'], d['Jam Pulang'])
      const lembur = hitungDurasi(d['Jam Mulai Lembur'], d['Jam Selesai Lembur'])

      k.totalTelat += late
      k.totalEarly += early
      if (kerja) k.totalKerja += kerja
      if (lembur) k.totalLembur += lembur
      if (d['Status Kehadiran'] === 'Hadir' || d['Status Kehadiran'] === 'Telat') k.totalHadir++
      if (late > 0) k.totalTelatCount++

      k.rows.push({
        tanggal: d.Tanggal.slice(0, 10),
        shift: d.Shift || '-',
        jadwalMasuk: d['Jadwal Masuk'] || '-',
        jadwalPulang: d['Jadwal Pulang'] || '-',
        jamMasuk: d['Jam Masuk'] || '-',
        jamPulang: d['Jam Pulang'] || '-',
        telat: fmtMenit(late),
        early: fmtMenit(early),
        kerja: kerja !== null ? fmtMenit(kerja) : '-',
        lembur: lembur !== null ? fmtMenit(lembur) : '-',
        status: d['Status Kehadiran'] || '-',
      })
    })

    return {
      list: Object.values(perKaryawan).sort((a, b) => a.nama.localeCompare(b.nama)),
    }
  }, [absensi, bulan, tahun, areaFilter, cariNama])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    data.list.forEach((k) => {
      const rows = k.rows.map((r) => ({
        Tanggal: r.tanggal, Shift: r.shift, 'Jadwal Masuk': r.jadwalMasuk, 'Jadwal Pulang': r.jadwalPulang,
        'Check In': r.jamMasuk, 'Check Out': r.jamPulang, 'Telat': r.telat, 'Pulang Cepat': r.early,
        'Jam Kerja': r.kerja, 'Lembur': r.lembur, 'Status': r.status,
      }))
      rows.push({
        Tanggal: `TOTAL FOR EMPLOYEE : ${k.nik} - ${k.nama}`,
        'Telat': fmtMenit(k.totalTelat), 'Pulang Cepat': fmtMenit(k.totalEarly),
        'Jam Kerja': fmtMenit(k.totalKerja), 'Lembur': fmtMenit(k.totalLembur),
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, k.nama.slice(0, 30))
    })
    const nama = bulan !== 'Semua' ? `${namaBulan[parseInt(bulan)]}_${tahun}` : `Semua_${tahun}`
    XLSX.writeFile(wb, `rekap_absensi_${nama}.xlsx`)
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Rekap Absensi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Format rekap per karyawan (gaya Talenta)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Cari nama..." value={cariNama}
            onChange={(e) => setCariNama(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-28" />
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarAreaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={bulan} onChange={(e) => setBulan(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option value="Semua">Semua Bulan</option>
            {namaBulan.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
          <input type="number" value={tahun} onChange={(e) => setTahun(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
        </div>
      </header>

      <div className="space-y-6">
        {data.list.map((k) => (
          <div key={k.nama} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-gray-800 dark:text-white">{k.nama}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{k.nik} · {k.jabatan} · {k.area}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-600">Hadir: {k.totalHadir}</span>
                <span className="text-red-600">Telat: {k.totalTelatCount}</span>
                <span className="text-gray-600 dark:text-gray-300">Jam Kerja: {fmtMenit(k.totalKerja)}</span>
                <span className="text-purple-600">Lembur: {fmtMenit(k.totalLembur)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Shift</th>
                    <th className="p-2">Jadwal In</th>
                    <th className="p-2">Jadwal Out</th>
                    <th className="p-2">Check In</th>
                    <th className="p-2">Check Out</th>
                    <th className="p-2">Telat</th>
                    <th className="p-2">Early Out</th>
                    <th className="p-2">Jam Kerja</th>
                    <th className="p-2">Lembur</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {k.rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="p-2">{r.tanggal}</td>
                      <td className="p-2">{r.shift}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{r.jadwalMasuk}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{r.jadwalPulang}</td>
                      <td className="p-2 font-medium text-gray-800 dark:text-white">{r.jamMasuk}</td>
                      <td className="p-2 font-medium text-gray-800 dark:text-white">{r.jamPulang}</td>
                      <td className="p-2 text-red-600">{r.telat}</td>
                      <td className="p-2 text-orange-600">{r.early}</td>
                      <td className="p-2 text-gray-800 dark:text-white">{r.kerja}</td>
                      <td className="p-2 text-purple-600">{r.lembur}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.status === 'Hadir' ? 'bg-green-100 text-green-700 dark:bg-green-900/20' :
                          r.status === 'Telat' ? 'bg-red-100 text-red-700 dark:bg-red-900/20' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 font-semibold">
                    <td className="p-2 text-gray-600 dark:text-gray-300" colSpan={6}>TOTAL FOR EMPLOYEE : {k.nik} - {k.nama}</td>
                    <td className="p-2 text-red-600">{fmtMenit(k.totalTelat)}</td>
                    <td className="p-2 text-orange-600">{fmtMenit(k.totalEarly)}</td>
                    <td className="p-2 text-gray-800 dark:text-white">{fmtMenit(k.totalKerja)}</td>
                    <td className="p-2 text-purple-600">{fmtMenit(k.totalLembur)}</td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        {data.list.length === 0 && (
          <p className="text-center text-gray-400 py-10">Tidak ada data untuk filter ini</p>
        )}
      </div>
    </>
  )
}
